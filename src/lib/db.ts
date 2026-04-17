import { getNowInKoreaIso, getTodayInKorea } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { Customer, CustomerTag, SmallTalkNote, VisitFrequency, TagCategory, TagAccent } from '@/types/customer';
import type { ConsultationRecord, ConsultationType, BookingRequest, BookingChannel, BookingStatus, DailyChecklist } from '@/types/consultation';
import type { PortfolioPhoto } from '@/types/portfolio';
import type { Shop, Designer, BusinessHours, ShopExtendedSettings, CategoryPricingSettings, SurchargeSettings } from '@/types/shop';
import type { ShopPublicData } from '@/types/pre-consultation';

const PORTFOLIO_BUCKET = 'portfolio-images';
const DESIGNER_AVATAR_BUCKET = 'designer-profile-images';

interface PortfolioMutationResult {
  success: boolean;
  photo?: PortfolioPhoto;
  error?: string;
}

export interface ShopAccountMutationResult {
  success: boolean;
  shop?: Shop;
  owner?: Designer;
  error?: string;
}

export interface DesignerMutationResult {
  success: boolean;
  designer?: Designer;
  error?: string;
}

export interface DesignerDeleteResult {
  success: boolean;
  error?: string;
}

interface DbErrorSnapshot {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  name?: string;
  raw?: unknown;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toShop(row: Database['public']['Tables']['shops']['Row']): Shop {
  return {
    id: row.id,
    ownerId: row.owner_id ?? '',
    name: row.name,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    themeId: row.theme_id ?? '',
    businessHours: (row.business_hours as unknown as BusinessHours[]) ?? [],
    baseHandPrice: row.base_hand_price ?? 0,
    baseFootPrice: row.base_foot_price ?? 0,
    logoUrl: row.logo_url ?? undefined,
    onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    settings: (row.settings as unknown as ShopExtendedSettings) ?? undefined,
  };
}

function toDesigner(row: Database['public']['Tables']['designers']['Row'] & { pin?: string | null }): Designer {
  const profileImageValue = row.profile_image_url ?? undefined;
  return {
    id: row.id,
    shopId: row.shop_id,
    name: row.name,
    role: row.role as 'owner' | 'staff',
    profileImageUrl: profileImageValue
      ? (profileImageValue.startsWith('http')
          ? profileImageValue
          : supabase.storage.from(DESIGNER_AVATAR_BUCKET).getPublicUrl(profileImageValue).data.publicUrl)
      : undefined,
    phone: row.phone ?? undefined,
    isActive: row.is_active ?? false,
    createdAt: row.created_at ?? '',
    pin: row.pin ?? undefined,
  };
}

export function getPortfolioPublicUrl(path: string): string {
  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function getPortfolioFileExtension(mimeType: string): string {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  return 'jpg';
}

function getDesignerAvatarStoragePath(rawValue: string | null | undefined): string | null {
  if (!rawValue) return null;
  return rawValue.startsWith('http') ? null : rawValue;
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const [header, encoded] = dataUrl.split(',', 2);
  if (!header || !encoded) {
    throw new Error('Invalid image data');
  }

  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
  const decoded = atob(encoded);
  const bytes = new Uint8Array(decoded.length);

  for (let i = 0; i < decoded.length; i += 1) {
    bytes[i] = decoded.charCodeAt(i);
  }

  return {
    blob: new Blob([bytes], { type: mimeType }),
    mimeType,
  };
}

function toDbErrorSnapshot(error: unknown): DbErrorSnapshot {
  if (!error || typeof error !== 'object') {
    return { raw: error };
  }

  const candidate = error as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
    hint?: unknown;
    name?: unknown;
  };

  return {
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    details: typeof candidate.details === 'string' ? candidate.details : undefined,
    hint: typeof candidate.hint === 'string' ? candidate.hint : undefined,
    name: typeof candidate.name === 'string' ? candidate.name : undefined,
    raw: error,
  };
}

async function resolveReservationForeignKey(
  table: 'designers' | 'customers',
  id: string | undefined,
  shopId: string,
): Promise<string | null> {
  if (!id) {
    return null;
  }

  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .eq('shop_id', shopId)
    .maybeSingle();

  if (error) {
    console.error(`[db] resolveReservationForeignKey(${table}) error:`, {
      ...toDbErrorSnapshot(error),
      shopId,
      id,
    });
    return null;
  }

  return data?.id ?? null;
}

function toPortfolioPhoto(row: Database['public']['Tables']['portfolio_photos']['Row']): PortfolioPhoto {
  return {
    id: row.id,
    shopId: row.shop_id,
    customerId: row.customer_id,
    recordId: row.record_id ?? undefined,
    kind: row.kind as PortfolioPhoto['kind'],
    createdAt: row.created_at ?? '',
    takenAt: row.taken_at ?? undefined,
    imageDataUrl: row.image_path ? getPortfolioPublicUrl(row.image_path) : row.image_data_url ?? '',
    imagePath: row.image_path ?? undefined,
    note: row.note ?? undefined,
    tags: (row.tags as unknown as string[] | null) ?? undefined,
    colorLabels: (row.color_labels as unknown as string[] | null) ?? undefined,
    designType: row.design_type ?? undefined,
    serviceType: row.service_type ?? undefined,
    price: row.price ?? undefined,
    isPublic: row.is_public ?? true,
    styleCategory: (row.style_category as PortfolioPhoto['styleCategory']) ?? undefined,
    isFeatured: row.is_featured ?? false,
  };
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

export async function dbCreateShopAccount(
  ownerUserId: string,
  shopName: string,
  ownerName: string,
): Promise<ShopAccountMutationResult> {
  const existingShop = await fetchShopByOwnerId(ownerUserId);

  if (existingShop) {
    const existingOwner = await fetchDesignerById(ownerUserId);

    if (existingOwner && existingOwner.shopId === existingShop.id) {
      return {
        success: true,
        shop: existingShop,
        owner: existingOwner,
      };
    }
  }

  // Use SECURITY DEFINER RPC to bypass RLS chicken-and-egg problem
  const shopId = createId('shop');

  const { data: rpcResult, error: rpcError } = await supabase.rpc('create_shop_account', {
    p_shop_id: shopId,
    p_shop_name: shopName,
    p_owner_name: ownerName,
    p_user_id: ownerUserId,
  });

  if (rpcError) {
    console.error('[db] dbCreateShopAccount rpc error:', toDbErrorSnapshot(rpcError));
    return { success: false, error: rpcError.message };
  }

  const result = rpcResult as { success: boolean; error?: string; shop_id?: string; owner_id?: string; shop_name?: string; owner_name?: string };

  if (!result.success) {
    console.error('[db] dbCreateShopAccount rpc failed:', result.error);
    return { success: false, error: result.error ?? '샵 생성에 실패했습니다' };
  }

  const now = getNowInKoreaIso();

  return {
    success: true,
    shop: {
      id: shopId,
      ownerId: ownerUserId,
      name: shopName,
      phone: undefined,
      address: undefined,
      themeId: 'rose-pink',
      businessHours: [],
      baseHandPrice: 60000,
      baseFootPrice: 70000,
      logoUrl: undefined,
      onboardingCompletedAt: undefined,
      createdAt: now,
      updatedAt: now,
    },
    owner: {
      id: ownerUserId,
      shopId: shopId,
      name: ownerName,
      role: 'owner',
      profileImageUrl: undefined,
      phone: undefined,
      isActive: true,
      createdAt: now,
    },
  };
}

export async function fetchShopByOwnerId(ownerId: string): Promise<Shop | null> {
  const { data, error } = await supabase.from('shops').select('*').eq('owner_id', ownerId).maybeSingle();
  if (error) {
    console.error('[db] fetchShopByOwnerId error:', toDbErrorSnapshot(error));
    return null;
  }

  if (!data) {
    return null;
  }

  return toShop(data);
}

export async function fetchDesignerById(designerId: string, shopId?: string): Promise<Designer | null> {
  let query = supabase.from('designers').select('*').eq('id', designerId);
  if (shopId) query = query.eq('shop_id', shopId);
  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    console.error('[db] fetchDesignerById error:', toDbErrorSnapshot(error));
    return null;
  }

  return toDesigner(data);
}

export async function fetchShop(shopId?: string | null): Promise<Shop | null> {
  if (!shopId) {
    return null;
  }

  const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single();
  if (error || !data) {
    console.error('[db] fetchShop error:', toDbErrorSnapshot(error));
    return null;
  }
  return toShop(data);
}

export async function fetchDesigners(shopId?: string | null): Promise<Designer[]> {
  if (!shopId) {
    return [];
  }

  const { data, error } = await supabase.from('designers').select('*').eq('shop_id', shopId);
  if (error || !data) {
    console.error('[db] fetchDesigners error:', toDbErrorSnapshot(error));
    return [];
  }
  return data.map(toDesigner);
}

export async function dbCreateDesigner(
  shopId: string,
  payload: { name: string; phone?: string },
): Promise<DesignerMutationResult> {
  const trimmedName = payload.name.trim();
  if (!trimmedName) {
    return { success: false, error: '이름을 입력해 주세요.' };
  }

  const now = getNowInKoreaIso();
  const { data, error } = await supabase
    .from('designers')
    .insert({
      id: createId('designer'),
      shop_id: shopId,
      name: trimmedName,
      role: 'staff',
      profile_image_url: null,
      phone: payload.phone?.trim() ? payload.phone.trim() : null,
      is_active: true,
      created_at: now,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('[db] dbCreateDesigner error:', toDbErrorSnapshot(error));
    return { success: false, error: '선생님 추가에 실패했습니다.' };
  }

  return { success: true, designer: toDesigner(data) };
}

export async function dbUpdateDesigner(
  shopId: string,
  designerId: string,
  updates: { name?: string; phone?: string; isActive?: boolean },
): Promise<DesignerMutationResult> {
  const payload: Database['public']['Tables']['designers']['Update'] = {};

  if (typeof updates.name === 'string') {
    const trimmedName = updates.name.trim();
    if (!trimmedName) {
      return { success: false, error: '이름을 입력해 주세요.' };
    }
    payload.name = trimmedName;
  }

  if (typeof updates.phone === 'string') {
    payload.phone = updates.phone.trim() ? updates.phone.trim() : null;
  }

  if (typeof updates.isActive === 'boolean') {
    payload.is_active = updates.isActive;
  }

  const { data, error } = await supabase
    .from('designers')
    .update(payload)
    .eq('shop_id', shopId)
    .eq('id', designerId)
    .select('*')
    .single();

  if (error || !data) {
    console.error('[db] dbUpdateDesigner error:', toDbErrorSnapshot(error));
    return { success: false, error: '선생님 정보 수정에 실패했습니다.' };
  }

  return { success: true, designer: toDesigner(data) };
}

export async function dbDeleteDesigner(
  shopId: string,
  designerId: string,
): Promise<DesignerDeleteResult> {
  const { data: existing, error: existingError } = await supabase
    .from('designers')
    .select('role, profile_image_url')
    .eq('shop_id', shopId)
    .eq('id', designerId)
    .maybeSingle();

  if (existingError || !existing) {
    console.error('[db] dbDeleteDesigner lookup error:', toDbErrorSnapshot(existingError));
    return { success: false, error: '삭제할 선생님 정보를 찾을 수 없습니다.' };
  }

  if (existing.role === 'owner') {
    return { success: false, error: '원장 프로필은 삭제할 수 없습니다.' };
  }

  const [customerRefs, reservationRefs, recordRefs, noteRefs] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('shop_id', shopId).eq('assigned_designer_id', designerId),
    supabase.from('booking_requests').select('id', { count: 'exact', head: true }).eq('shop_id', shopId).eq('designer_id', designerId),
    supabase.from('consultation_records').select('id', { count: 'exact', head: true }).eq('shop_id', shopId).eq('designer_id', designerId),
    supabase.from('small_talk_notes').select('id', { count: 'exact', head: true }).eq('created_by_designer_id', designerId),
  ]);

  if (customerRefs.error || reservationRefs.error || recordRefs.error || noteRefs.error) {
    console.error('[db] dbDeleteDesigner reference check error:', {
      customerRefs: customerRefs.error,
      reservationRefs: reservationRefs.error,
      recordRefs: recordRefs.error,
      noteRefs: noteRefs.error,
    });
    return { success: false, error: '디자이너 삭제 가능 여부를 확인하지 못했습니다.' };
  }

  const referenceCount =
    (customerRefs.count ?? 0) +
    (reservationRefs.count ?? 0) +
    (recordRefs.count ?? 0) +
    (noteRefs.count ?? 0);

  if (referenceCount > 0) {
    return {
      success: false,
      error: '고객, 예약, 상담 이력에 연결된 디자이너는 먼저 담당을 변경한 뒤 삭제해 주세요.',
    };
  }

  const avatarPath = getDesignerAvatarStoragePath(existing.profile_image_url);
  if (avatarPath) {
    const { error: storageError } = await supabase.storage.from(DESIGNER_AVATAR_BUCKET).remove([avatarPath]);
    if (storageError) {
      console.error('[db] dbDeleteDesigner remove avatar error:', toDbErrorSnapshot(storageError));
    }
  }

  const { error } = await supabase
    .from('designers')
    .delete()
    .eq('shop_id', shopId)
    .eq('id', designerId);

  if (error) {
    console.error('[db] dbDeleteDesigner error:', toDbErrorSnapshot(error));
    return { success: false, error: '선생님 삭제에 실패했습니다.' };
  }

  return { success: true };
}

export async function dbUploadDesignerProfileImage(
  shopId: string,
  designerId: string,
  imageDataUrl: string,
): Promise<DesignerMutationResult> {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('designers')
      .select('*')
      .eq('shop_id', shopId)
      .eq('id', designerId)
      .single();

    if (existingError || !existing) {
      console.error('[db] dbUploadDesignerProfileImage fetch error:', toDbErrorSnapshot(existingError));
      return { success: false, error: '디자이너 정보를 찾을 수 없습니다.' };
    }

    const { blob, mimeType } = dataUrlToBlob(imageDataUrl);
    const extension = getPortfolioFileExtension(mimeType);
    const imagePath = `${shopId}/${designerId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(DESIGNER_AVATAR_BUCKET)
      .upload(imagePath, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[db] dbUploadDesignerProfileImage upload error:', toDbErrorSnapshot(uploadError));
      return { success: false, error: '프로필 이미지 업로드에 실패했습니다.' };
    }

    const { data, error } = await supabase
      .from('designers')
      .update({ profile_image_url: imagePath })
      .eq('shop_id', shopId)
      .eq('id', designerId)
      .select('*')
      .single();

    if (error || !data) {
      console.error('[db] dbUploadDesignerProfileImage update error:', toDbErrorSnapshot(error));
      await supabase.storage.from(DESIGNER_AVATAR_BUCKET).remove([imagePath]);
      return { success: false, error: '프로필 이미지 저장에 실패했습니다.' };
    }

    const oldPath = getDesignerAvatarStoragePath(existing.profile_image_url);
    if (oldPath && oldPath !== imagePath) {
      const { error: removeOldError } = await supabase.storage.from(DESIGNER_AVATAR_BUCKET).remove([oldPath]);
      if (removeOldError) {
        console.error('[db] dbUploadDesignerProfileImage remove old avatar error:', toDbErrorSnapshot(removeOldError));
      }
    }

    return { success: true, designer: toDesigner(data) };
  } catch (error) {
    console.error('[db] dbUploadDesignerProfileImage unexpected error:', toDbErrorSnapshot(error));
    return { success: false, error: '프로필 이미지 저장 중 오류가 발생했습니다.' };
  }
}

export async function dbDeleteDesignerProfileImage(
  shopId: string,
  designerId: string,
): Promise<DesignerMutationResult> {
  const { data: existing, error: existingError } = await supabase
    .from('designers')
    .select('*')
    .eq('shop_id', shopId)
    .eq('id', designerId)
    .single();

  if (existingError || !existing) {
    console.error('[db] dbDeleteDesignerProfileImage fetch error:', toDbErrorSnapshot(existingError));
    return { success: false, error: '디자이너 정보를 찾을 수 없습니다.' };
  }

  const oldPath = getDesignerAvatarStoragePath(existing.profile_image_url);
  if (oldPath) {
    const { error: storageError } = await supabase.storage.from(DESIGNER_AVATAR_BUCKET).remove([oldPath]);
    if (storageError) {
      console.error('[db] dbDeleteDesignerProfileImage remove error:', toDbErrorSnapshot(storageError));
      return { success: false, error: '프로필 이미지 삭제에 실패했습니다.' };
    }
  }

  const { data, error } = await supabase
    .from('designers')
    .update({ profile_image_url: null })
    .eq('shop_id', shopId)
    .eq('id', designerId)
    .select('*')
    .single();

  if (error || !data) {
    console.error('[db] dbDeleteDesignerProfileImage update error:', toDbErrorSnapshot(error));
    return { success: false, error: '프로필 이미지 삭제 상태를 저장하지 못했습니다.' };
  }

  return { success: true, designer: toDesigner(data) };
}

export async function dbUpdateDesignerPin(
  shopId: string,
  designerId: string,
  pin: string,
): Promise<void> {
  const { error } = await supabase
    .from('designers')
    .update({ pin })
    .eq('id', designerId)
    .eq('shop_id', shopId);
  if (error) {
    console.error('[db] dbUpdateDesignerPin error:', toDbErrorSnapshot(error));
  }
}

export async function fetchCustomers(shopId?: string | null): Promise<Customer[]> {
  if (!shopId) {
    return [];
  }

  const customersRes = await supabase.from('customers').select('*').eq('shop_id', shopId);

  if (customersRes.error) {
    console.error('[db] fetchCustomers customers error:', toDbErrorSnapshot(customersRes.error));
    return [];
  }

  const customerIds = (customersRes.data ?? []).map((row) => row.id);
  if (customerIds.length === 0) {
    return [];
  }

  const [tagsRes, notesRes] = await Promise.all([
    supabase.from('customer_tags').select('*').in('customer_id', customerIds),
    supabase.from('small_talk_notes').select('*').in('customer_id', customerIds),
  ]);

  if (tagsRes.error) {
    console.error('[db] fetchCustomers tags error:', toDbErrorSnapshot(tagsRes.error));
  }
  if (notesRes.error) {
    console.error('[db] fetchCustomers notes error:', toDbErrorSnapshot(notesRes.error));
  }

  const tagsByCustomer = new Map<string, CustomerTag[]>();
  for (const row of tagsRes.data ?? []) {
    const tag: CustomerTag = {
      id: row.id,
      customerId: row.customer_id,
      category: row.category as TagCategory,
      value: row.value,
      isCustom: row.is_custom ?? false,
      createdAt: row.created_at ?? '',
      pinned: row.pinned ?? undefined,
      accent: (row.accent as TagAccent | null) ?? undefined,
      sortOrder: row.sort_order ?? undefined,
    };
    const existing = tagsByCustomer.get(row.customer_id) ?? [];
    existing.push(tag);
    tagsByCustomer.set(row.customer_id, existing);
  }

  const notesByCustomer = new Map<string, SmallTalkNote[]>();
  for (const row of notesRes.data ?? []) {
    const note: SmallTalkNote = {
      id: row.id,
      customerId: row.customer_id,
      consultationRecordId: row.consultation_record_id ?? undefined,
      noteText: row.note_text,
      createdAt: row.created_at ?? '',
      createdByDesignerId: row.created_by_designer_id ?? '',
      createdByDesignerName: row.created_by_designer_name ?? '',
    };
    const existing = notesByCustomer.get(row.customer_id) ?? [];
    existing.push(note);
    notesByCustomer.set(row.customer_id, existing);
  }

  return (customersRes.data ?? []).map((row) => ({
    id: row.id,
    shopId: row.shop_id,
    name: row.name,
    phone: row.phone ?? '',
    assignedDesignerId: row.assigned_designer_id ?? undefined,
    assignedDesignerName: row.assigned_designer_name ?? undefined,
    firstVisitDate: row.first_visit_date ?? '',
    lastVisitDate: row.last_visit_date ?? '',
    visitCount: row.visit_count ?? 0,
    averageSpend: row.average_spend ?? 0,
    totalSpend: row.total_spend ?? 0,
    tags: tagsByCustomer.get(row.id) ?? [],
    smallTalkNotes: notesByCustomer.get(row.id) ?? [],
    preference: (row.preference as unknown as Customer['preference']) ?? undefined,
    treatmentHistory: (row.treatment_history as unknown as Customer['treatmentHistory']) ?? [],
    profileImageUrl: row.profile_image_url ?? undefined,
    isRegular: row.is_regular ?? undefined,
    regularSince: row.regular_since ?? undefined,
    visitFrequency: (row.visit_frequency as VisitFrequency | null) ?? undefined,
    membership: (row.membership as unknown as Customer['membership']) ?? undefined,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    preferredLanguage: (row.preferred_language as Customer['preferredLanguage']) ?? undefined,
    durationPreference: (row.duration_preference as Customer['durationPreference']) ?? undefined,
  }));
}

export async function fetchConsultationRecords(shopId?: string | null): Promise<ConsultationRecord[]> {
  if (!shopId) {
    return [];
  }

  const { data, error } = await supabase.from('consultation_records').select('*').eq('shop_id', shopId);
  if (error || !data) {
    console.error('[db] fetchConsultationRecords error:', toDbErrorSnapshot(error));
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    shopId: row.shop_id,
    designerId: row.designer_id,
    customerId: row.customer_id,
    consultation: row.consultation as unknown as ConsultationType,
    totalPrice: row.total_price ?? 0,
    estimatedMinutes: row.estimated_minutes ?? 0,
    finalPrice: row.final_price ?? 0,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    finalizedAt: row.finalized_at ?? undefined,
    pricingAdjustments: (row.pricing_adjustments as unknown as ConsultationRecord['pricingAdjustments']) ?? undefined,
    notes: row.notes ?? undefined,
    imageUrls: (row.image_urls as unknown as string[]) ?? [],
    checklist: (row.checklist as unknown as DailyChecklist) ?? undefined,
    language: (row.language as ConsultationRecord['language']) ?? undefined,
    paymentMethod: (row.payment_method as ConsultationRecord['paymentMethod']) ?? undefined,
    isQuickSale: row.is_quick_sale ?? false,
    shareCardId: (row as Record<string, unknown>).share_card_id as string | undefined,
  }));
}

export async function fetchBookingRequests(shopId?: string | null): Promise<BookingRequest[]> {
  if (!shopId) {
    return [];
  }

  const { data, error } = await supabase.from('booking_requests').select('*').eq('shop_id', shopId);
  if (error || !data) {
    console.error('[db] fetchBookingRequests error:', toDbErrorSnapshot(error));
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    shopId: row.shop_id,
    customerName: row.customer_name,
    phone: row.phone ?? '',
    reservationDate: row.reservation_date,
    reservationTime: row.reservation_time,
    channel: (row.channel as BookingChannel | null) ?? 'phone',
    requestNote: row.request_note ?? undefined,
    referenceImageUrls: (row.reference_image_urls as unknown as string[]) ?? [],
    status: (row.status as BookingStatus | null) ?? 'pending',
    createdAt: row.created_at ?? '',
    language: (row.language as BookingRequest['language']) ?? undefined,
    designerId: row.designer_id ?? undefined,
    serviceLabel: row.service_label ?? undefined,
    customerId: row.customer_id ?? undefined,
    preConsultationData: (row.pre_consultation_data as unknown as BookingRequest['preConsultationData']) ?? undefined,
    preConsultationCompletedAt: row.pre_consultation_completed_at ?? undefined,
    consultationLinkSentAt: row.consultation_link_sent_at ?? undefined,
    deposit: (row as Record<string, unknown>).deposit as number | undefined,
  }));
}

export async function fetchBookingRequestById(
  bookingId: string,
  shopId?: string | null,
): Promise<BookingRequest | null> {
  if (!shopId) {
    console.warn('[db] fetchBookingRequestById called without shopId — returning null for safety');
    return null;
  }
  const query = supabase.from('booking_requests').select('*').eq('id', bookingId).eq('shop_id', shopId);

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    console.error('[db] fetchBookingRequestById error:', {
      ...toDbErrorSnapshot(error),
      bookingId,
      shopId,
    });
    return null;
  }

  return {
    id: data.id,
    shopId: data.shop_id,
    customerName: data.customer_name,
    phone: data.phone ?? '',
    reservationDate: data.reservation_date,
    reservationTime: data.reservation_time,
    channel: (data.channel as BookingChannel | null) ?? 'phone',
    requestNote: data.request_note ?? undefined,
    referenceImageUrls: (data.reference_image_urls as unknown as string[]) ?? [],
    status: (data.status as BookingStatus | null) ?? 'pending',
    createdAt: data.created_at ?? '',
    language: (data.language as BookingRequest['language']) ?? undefined,
    designerId: data.designer_id ?? undefined,
    serviceLabel: data.service_label ?? undefined,
    customerId: data.customer_id ?? undefined,
    preConsultationData: (data.pre_consultation_data as unknown as BookingRequest['preConsultationData']) ?? undefined,
    preConsultationCompletedAt: data.pre_consultation_completed_at ?? undefined,
    consultationLinkSentAt: data.consultation_link_sent_at ?? undefined,
    deposit: (data as Record<string, unknown>).deposit as number | undefined,
  };
}

export async function fetchPortfolioPhotos(shopId?: string | null): Promise<PortfolioPhoto[]> {
  if (!shopId) {
    return [];
  }

  const { data, error } = await supabase
    .from('portfolio_photos')
    .select('*')
    .eq('shop_id', shopId)
    .order('taken_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[db] fetchPortfolioPhotos error:', toDbErrorSnapshot(error));
    return [];
  }

  return data.map(toPortfolioPhoto);
}

// ─── Customer Mutations ───────────────────────────────────────────────────────

export async function dbUpsertCustomer(customer: Customer): Promise<{ success: boolean }> {
  const { error } = await supabase.from('customers').upsert({
    id: customer.id,
    shop_id: customer.shopId,
    name: customer.name,
    phone: customer.phone,
    assigned_designer_id: customer.assignedDesignerId ?? null,
    assigned_designer_name: customer.assignedDesignerName ?? null,
    first_visit_date: customer.firstVisitDate,
    last_visit_date: customer.lastVisitDate,
    visit_count: customer.visitCount,
    average_spend: customer.averageSpend,
    total_spend: customer.totalSpend,
    preference: (customer.preference as unknown as import('@/types/database').Json) ?? null,
    treatment_history: (customer.treatmentHistory as unknown as import('@/types/database').Json) ?? null,
    profile_image_url: customer.profileImageUrl ?? null,
    is_regular: customer.isRegular ?? null,
    regular_since: customer.regularSince ?? null,
    visit_frequency: customer.visitFrequency ?? null,
    membership: (customer.membership as unknown as import('@/types/database').Json) ?? null,
    preferred_language: customer.preferredLanguage ?? null,
    duration_preference: customer.durationPreference ?? null,
    updated_at: getNowInKoreaIso(),
  });
  if (error) {
    console.error('[db] dbUpsertCustomer error:', toDbErrorSnapshot(error));
    return { success: false };
  }
  return { success: true };
}

export async function dbUpsertCustomerTags(customerId: string, tags: CustomerTag[], shopId?: string): Promise<void> {
  // Backup existing tags before delete so we can restore on insert failure
  let backupQuery = supabase
    .from('customer_tags')
    .select('*')
    .eq('customer_id', customerId);
  if (shopId) backupQuery = backupQuery.eq('shop_id', shopId);
  const { data: existingTags } = await backupQuery;

  let deleteQuery = supabase
    .from('customer_tags')
    .delete()
    .eq('customer_id', customerId);
  if (shopId) deleteQuery = deleteQuery.eq('shop_id', shopId);
  const { error: deleteError } = await deleteQuery;
  if (deleteError) {
    console.error('[db] dbUpsertCustomerTags delete error:', toDbErrorSnapshot(deleteError));
    return;
  }
  if (tags.length === 0) return;
  const rows = tags.map((tag) => ({
    id: tag.id,
    customer_id: tag.customerId,
    category: tag.category,
    value: tag.value,
    is_custom: tag.isCustom,
    created_at: tag.createdAt,
    pinned: tag.pinned ?? null,
    accent: tag.accent ?? null,
    sort_order: tag.sortOrder ?? null,
    ...(shopId ? { shop_id: shopId } : {}),
  }));
  const { error: insertError } = await supabase.from('customer_tags').insert(rows);
  if (insertError) {
    // N-7: delete 성공 + insert 실패 → 태그 전부 소실 위험. 1회 재시도
    console.error('[db] dbUpsertCustomerTags insert error (retrying):', toDbErrorSnapshot(insertError));
    const { error: retryError } = await supabase.from('customer_tags').insert(rows);
    if (retryError) {
      console.error('[db] dbUpsertCustomerTags retry failed — restoring backup for', customerId, toDbErrorSnapshot(retryError));
      // Restore backup to prevent total tag loss
      if (existingTags && existingTags.length > 0) {
        const { error: restoreErr } = await supabase.from('customer_tags').insert(existingTags);
        if (restoreErr) {
          console.error('[db] dbUpsertCustomerTags backup restore failed for', customerId, toDbErrorSnapshot(restoreErr));
        }
      }
    }
  }
}

export async function dbInsertSmallTalkNote(note: SmallTalkNote): Promise<void> {
  const { error } = await supabase.from('small_talk_notes').insert({
    id: note.id,
    customer_id: note.customerId,
    consultation_record_id: note.consultationRecordId ?? null,
    note_text: note.noteText,
    created_at: note.createdAt,
    created_by_designer_id: note.createdByDesignerId,
    created_by_designer_name: note.createdByDesignerName,
  });
  if (error) {
    console.error('[db] dbInsertSmallTalkNote error:', toDbErrorSnapshot(error));
  }
}

const ALLOWED_CUSTOMER_FIELDS = new Set([
  'name', 'phone', 'preference', 'profile_image_url', 'is_regular', 'regular_since',
  'visit_frequency', 'visit_count', 'total_spend', 'average_spend', 'first_visit_date',
  'last_visit_date', 'treatment_history', 'membership', 'assigned_designer_id',
  'assigned_designer_name', 'preferred_language', 'duration_preference',
]);

export async function dbUpdateCustomerField(customerId: string, field: string, value: unknown, shopId?: string): Promise<void> {
  if (!ALLOWED_CUSTOMER_FIELDS.has(field)) {
    console.error(`[db] dbUpdateCustomerField blocked — field "${field}" not in allowlist`);
    return;
  }
  let query = supabase
    .from('customers')
    .update({ [field]: value, updated_at: getNowInKoreaIso() })
    .eq('id', customerId);
  if (shopId) {
    query = query.eq('shop_id', shopId);
  }
  const { error } = await query;
  if (error) {
    console.error('[db] dbUpdateCustomerField error:', toDbErrorSnapshot(error));
  }
}

// ─── Shop Mutations ──────────────────────────────────────────────────────────

export async function dbUpsertShop(shop: Shop): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('shops').upsert({
    id: shop.id,
    owner_id: shop.ownerId,
    name: shop.name,
    phone: shop.phone ?? null,
    address: shop.address ?? null,
    theme_id: shop.themeId,
    business_hours: shop.businessHours as unknown as import('@/types/database').Json,
    base_hand_price: shop.baseHandPrice,
    base_foot_price: shop.baseFootPrice,
    logo_url: shop.logoUrl ?? null,
    onboarding_completed_at: shop.onboardingCompletedAt ?? null,
    settings: (shop.settings as unknown as import('@/types/database').Json) ?? null,
    updated_at: getNowInKoreaIso(),
  });
  if (error) {
    console.error('[db] dbUpsertShop error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function dbUpdateShopSettings(shopId: string, settings: ShopExtendedSettings): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('shops')
    .update({
      settings: settings as unknown as import('@/types/database').Json,
      updated_at: getNowInKoreaIso(),
    })
    .eq('id', shopId);
  if (error) {
    console.error('[db] dbUpdateShopSettings error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Record Mutations ─────────────────────────────────────────────────────────

export async function dbUpsertRecord(record: ConsultationRecord): Promise<{ success: boolean }> {
  const { error } = await supabase.from('consultation_records').upsert({
    id: record.id,
    shop_id: record.shopId,
    designer_id: record.designerId,
    customer_id: record.customerId,
    consultation: record.consultation as unknown as import('@/types/database').Json,
    total_price: record.totalPrice,
    estimated_minutes: record.estimatedMinutes,
    final_price: record.finalPrice,
    created_at: record.createdAt,
    updated_at: getNowInKoreaIso(),
    finalized_at: record.finalizedAt ?? null,
    pricing_adjustments: (record.pricingAdjustments as unknown as import('@/types/database').Json) ?? null,
    notes: record.notes ?? null,
    image_urls: (record.imageUrls as unknown as import('@/types/database').Json) ?? null,
    checklist: (record.checklist as unknown as import('@/types/database').Json) ?? null,
    language: record.language ?? null,
    payment_method: record.paymentMethod ?? null,
    is_quick_sale: record.isQuickSale ?? false,
    share_card_id: record.shareCardId ?? null,
  });
  if (error) {
    console.error('[db] dbUpsertRecord error:', toDbErrorSnapshot(error));
    return { success: false };
  }
  return { success: true };
}

export async function dbDeleteRecord(id: string, shopId?: string): Promise<void> {
  if (!shopId) {
    console.warn('[db] dbDeleteRecord called without shopId — skipping for safety');
    return;
  }
  const query = supabase.from('consultation_records').delete().eq('id', id).eq('shop_id', shopId);
  const { error } = await query;
  if (error) {
    console.error('[db] dbDeleteRecord error:', toDbErrorSnapshot(error));
  }
}

export async function dbCreateShareCard(
  recordId: string,
  shareCardId: string,
  shopId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('consultation_records')
    .update({ share_card_id: shareCardId } as Record<string, unknown>)
    .eq('id', recordId)
    .eq('shop_id', shopId);

  if (error) {
    console.error('[db] dbCreateShareCard error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchShareCardPublicData(shareCardId: string): Promise<import('@/types/share-card').ShareCardPublicData | null> {
  // Find the consultation record by share_card_id
  const { data: record, error: recErr } = await supabase
    .from('consultation_records')
    .select('id, shop_id, consultation, image_urls, share_card_id')
    .eq('share_card_id' as string, shareCardId)
    .single();

  if (recErr || !record) {
    console.error('[db] fetchShareCardPublicData record error:', toDbErrorSnapshot(recErr));
    return null;
  }

  if (!record.consultation) {
    console.error('[db] fetchShareCardPublicData: consultation is null for record', record.id);
    return null;
  }

  // Fetch shop data
  const { data: shop, error: shopErr } = await supabase
    .from('shops')
    .select('id, name, phone, address, logo_url, settings')
    .eq('id', record.shop_id)
    .single();

  if (shopErr || !shop) {
    console.error('[db] fetchShareCardPublicData shop error:', toDbErrorSnapshot(shopErr));
    return null;
  }

  // Fetch portfolio photos for this record
  const { data: photos } = await supabase
    .from('portfolio_photos')
    .select('image_data_url, image_path')
    .eq('record_id', record.id)
    .eq('shop_id', record.shop_id);

  const imageUrls: string[] = [];
  if (photos) {
    for (const p of photos) {
      if (p.image_path) {
        const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(p.image_path);
        imageUrls.push(urlData.publicUrl);
      } else if (p.image_data_url) {
        imageUrls.push(p.image_data_url);
      }
    }
  }

  // Also include record imageUrls if any
  const recordImageUrls = (record.image_urls as unknown as string[]) ?? [];
  const allImages = [...imageUrls, ...recordImageUrls];

  const consultation = record.consultation as unknown as import('@/types/consultation').ConsultationType;
  const settings = (shop.settings as unknown as import('@/types/shop').ShopExtendedSettings) ?? {};

  return {
    shopId: shop.id,
    shopName: shop.name,
    shopPhone: shop.phone ?? undefined,
    shopAddress: shop.address ?? undefined,
    shopLogoUrl: shop.logo_url ?? undefined,
    imageUrls: allImages,
    design: {
      designScope: consultation.designScope,
      expressions: consultation.expressions,
      hasParts: consultation.hasParts,
      bodyPart: consultation.bodyPart,
    },
    kakaoTalkUrl: settings.kakaoTalkUrl,
    naverReservationUrl: settings.naverReservationUrl,
    recordId: record.id,
  };
}

// ─── Reservation Mutations ────────────────────────────────────────────────────

export async function dbUpsertReservation(reservation: BookingRequest): Promise<void> {
  const [designerId, customerId] = await Promise.all([
    resolveReservationForeignKey('designers', reservation.designerId, reservation.shopId),
    resolveReservationForeignKey('customers', reservation.customerId, reservation.shopId),
  ]);

  if (reservation.designerId && !designerId) {
    console.warn('[db] dbUpsertReservation dropped invalid designer_id:', {
      reservationId: reservation.id,
      shopId: reservation.shopId,
      designerId: reservation.designerId,
    });
  }

  if (reservation.customerId && !customerId) {
    console.warn('[db] dbUpsertReservation dropped invalid customer_id:', {
      reservationId: reservation.id,
      shopId: reservation.shopId,
      customerId: reservation.customerId,
    });
  }

  const { error } = await supabase.from('booking_requests').upsert({
    id: reservation.id,
    shop_id: reservation.shopId,
    customer_name: reservation.customerName,
    phone: reservation.phone,
    reservation_date: reservation.reservationDate,
    reservation_time: reservation.reservationTime,
    channel: reservation.channel,
    request_note: reservation.requestNote ?? null,
    reference_image_urls: (reservation.referenceImageUrls as unknown as import('@/types/database').Json) ?? null,
    status: reservation.status,
    created_at: reservation.createdAt,
    language: reservation.language ?? null,
    designer_id: designerId,
    service_label: reservation.serviceLabel ?? null,
    customer_id: customerId,
    pre_consultation_data: (reservation.preConsultationData as unknown as import('@/types/database').Json) ?? null,
    pre_consultation_completed_at: reservation.preConsultationCompletedAt ?? null,
    consultation_link_sent_at: reservation.consultationLinkSentAt ?? null,
  });
  if (error) {
    console.error('[db] dbUpsertReservation error:', {
      ...toDbErrorSnapshot(error),
      reservationId: reservation.id,
      shopId: reservation.shopId,
    });
  }
}

export async function dbCompletePreconsultationBooking(
  bookingId: string,
  payload: ConsultationType,
  completedAt: string,
  customerId?: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('complete_preconsultation_for_booking', {
    target_booking_id: bookingId,
    payload: payload as unknown as import('@/types/database').Json,
    completed_at: completedAt,
    linked_customer_id: customerId ?? null,
  });

  if (error) {
    console.error('[db] dbCompletePreconsultationBooking error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function dbDeleteReservation(id: string, shopId?: string): Promise<void> {
  if (!shopId) {
    console.warn('[db] dbDeleteReservation called without shopId — skipping for safety');
    return;
  }
  const query = supabase.from('booking_requests').delete().eq('id', id).eq('shop_id', shopId);
  const { error } = await query;
  if (error) {
    console.error('[db] dbDeleteReservation error:', toDbErrorSnapshot(error));
  }
}

export async function dbInsertPortfolioPhoto(photo: PortfolioPhoto): Promise<PortfolioMutationResult> {
  try {
    let imagePath = photo.imagePath ?? null;

    if (!imagePath && photo.imageDataUrl.startsWith('data:')) {
      const { blob, mimeType } = dataUrlToBlob(photo.imageDataUrl);
      const extension = getPortfolioFileExtension(mimeType);
      imagePath = `${photo.shopId}/${photo.customerId}/${photo.id}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(PORTFOLIO_BUCKET)
        .upload(imagePath, blob, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error('[db] dbInsertPortfolioPhoto upload error:', toDbErrorSnapshot(uploadError));
        return { success: false, error: '이미지 업로드에 실패했습니다' };
      }
    }

    const { data, error } = await supabase
      .from('portfolio_photos')
      .upsert({
        id: photo.id,
        shop_id: photo.shopId,
        customer_id: photo.customerId,
        record_id: photo.recordId ?? null,
        kind: photo.kind,
        created_at: photo.createdAt,
        taken_at: photo.takenAt ?? null,
        image_data_url: imagePath ? null : photo.imageDataUrl,
        image_path: imagePath,
        note: photo.note ?? null,
        tags: (photo.tags as unknown as Database['public']['Tables']['portfolio_photos']['Insert']['tags']) ?? [],
        color_labels: (photo.colorLabels as unknown as Database['public']['Tables']['portfolio_photos']['Insert']['color_labels']) ?? [],
        design_type: photo.designType ?? null,
        service_type: photo.serviceType ?? null,
        price: photo.price ?? null,
        is_public: photo.isPublic ?? true,
        style_category: photo.styleCategory ?? null,
        is_featured: photo.isFeatured ?? false,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[db] dbInsertPortfolioPhoto upsert error:', toDbErrorSnapshot(error));

      return { success: false, error: '포트폴리오 저장에 실패했습니다' };
    }

    return {
      success: true,
      photo: toPortfolioPhoto(data),
    };
  } catch (error) {
    console.error('[db] dbInsertPortfolioPhoto unexpected error:', toDbErrorSnapshot(error));
    return { success: false, error: '포트폴리오 저장 중 오류가 발생했습니다' };
  }
}

/** 온보딩 배치 업로드: 사진 여러 장을 순차 업로드 */
export async function dbBatchInsertPortfolioPhotos(
  photos: PortfolioPhoto[],
  onProgress?: (completed: number, total: number) => void,
): Promise<{ success: boolean; uploaded: number; errors: number }> {
  let uploaded = 0;
  let errors = 0;
  for (let i = 0; i < photos.length; i++) {
    const result = await dbInsertPortfolioPhoto(photos[i]);
    if (result.success) uploaded++;
    else errors++;
    onProgress?.(i + 1, photos.length);
  }
  return { success: errors === 0, uploaded, errors };
}

export async function dbDeletePortfolioPhoto(photo: PortfolioPhoto): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('portfolio_photos').delete().eq('id', photo.id).eq('shop_id', photo.shopId);
  if (error) {
    console.error('[db] dbDeletePortfolioPhoto delete row error:', toDbErrorSnapshot(error));
    return { success: false, error: '포트폴리오 삭제에 실패했습니다' };
  }

  if (photo.imagePath) {
    const { error: storageError } = await supabase.storage.from(PORTFOLIO_BUCKET).remove([photo.imagePath]);
    if (storageError) {
      console.error('[db] dbDeletePortfolioPhoto remove file error:', toDbErrorSnapshot(storageError));
      return { success: false, error: '이미지 파일 삭제에 실패했습니다' };
    }
  }

  return { success: true };
}

export async function dbDeleteAllPortfolioPhotos(photos: PortfolioPhoto[]): Promise<{ success: boolean; error?: string }> {
  if (photos.length === 0) {
    return { success: true };
  }

  const ids = photos.map((photo) => photo.id);
  const { error } = await supabase.from('portfolio_photos').delete().eq('shop_id', photos[0].shopId).in('id', ids);
  if (error) {
    console.error('[db] dbDeleteAllPortfolioPhotos delete rows error:', toDbErrorSnapshot(error));
    return { success: false, error: '포트폴리오 초기화에 실패했습니다' };
  }

  const paths = photos
    .map((photo) => photo.imagePath)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(PORTFOLIO_BUCKET).remove(paths);
    if (storageError) {
      console.error('[db] dbDeleteAllPortfolioPhotos remove files error:', toDbErrorSnapshot(storageError));
      return { success: false, error: '이미지 파일 초기화에 실패했습니다' };
    }
  }

  return { success: true };
}

// ─── Portfolio Visibility ────────────────────────────────────────────────────

export async function dbUpdatePhotoFeatured(
  photoId: string,
  shopId: string,
  isFeatured: boolean,
  price?: number,
): Promise<{ success: boolean; error?: string }> {
  const updatePayload: Record<string, unknown> = { is_featured: isFeatured };
  if (isFeatured && price !== undefined) {
    updatePayload.price = price;
  } else if (!isFeatured) {
    updatePayload.price = null;
  }
  const { error } = await supabase
    .from('portfolio_photos')
    .update(updatePayload)
    .eq('id', photoId)
    .eq('shop_id', shopId);
  if (error) {
    console.error('[db] dbUpdatePhotoFeatured error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function dbTogglePhotoVisibility(
  photoId: string,
  shopId: string,
  isPublic: boolean,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('portfolio_photos')
    .update({ is_public: isPublic })
    .eq('id', photoId)
    .eq('shop_id', shopId);
  if (error) {
    console.error('[db] dbTogglePhotoVisibility error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ─── Membership Transactions ─────────────────────────────────────────────────

export async function dbInsertMembershipTransaction(
  transaction: {
    id: string;
    customerId: string;
    shopId: string;
    date: string;
    type: 'purchase' | 'use';
    sessionsDelta: number;
    recordId?: string;
    note?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('membership_transactions').insert({
    id: transaction.id,
    customer_id: transaction.customerId,
    shop_id: transaction.shopId,
    date: transaction.date,
    type: transaction.type,
    sessions_delta: transaction.sessionsDelta,
    record_id: transaction.recordId ?? null,
    note: transaction.note ?? null,
  });
  if (error) {
    console.error('[db] dbInsertMembershipTransaction error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function dbFetchMembershipTransactions(
  customerId: string,
  shopId: string,
): Promise<{ id: string; date: string; type: string; sessionsDelta: number; recordId?: string; note?: string }[]> {
  const { data, error } = await supabase
    .from('membership_transactions')
    .select('*')
    .eq('customer_id', customerId)
    .eq('shop_id', shopId)
    .order('date', { ascending: false });
  if (error || !data) {
    console.error('[db] dbFetchMembershipTransactions error:', toDbErrorSnapshot(error));
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    date: row.date,
    type: row.type,
    sessionsDelta: row.sessions_delta,
    recordId: row.record_id ?? undefined,
    note: row.note ?? undefined,
  }));
}

// ─── Pre-Consult ──────────────────────────────────────────────────────────────

export async function fetchShopPublicData(shopId: string): Promise<ShopPublicData | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('id, name, phone, address, logo_url, settings')
    .eq('id', shopId)
    .single();

  if (error || !data) {
    console.error('[db] fetchShopPublicData error:', toDbErrorSnapshot(error));
    return null;
  }

  const settings = (data.settings as unknown as ShopExtendedSettings) ?? {};

  const defaultCategoryPricing: CategoryPricingSettings = {
    simple: { price: 50000, time: 60 },
    french: { price: 55000, time: 70 },
    magnet: { price: 60000, time: 80 },
    art: { price: 70000, time: 90 },
  };

  const defaultSurcharges: SurchargeSettings = {
    selfRemoval: 5000,
    otherRemoval: 10000,
    gradation: 10000,
    french: 10000,
    magnet: 10000,
    pointArt: 20000,
    fullArt: 40000,
    parts1000included: 2,
    parts2000included: 2,
    parts3000included: 2,
    partsExcessPer: 1000,
    largeParts: 3000,
    repairPer: 5000,
    extension: 20000,
    overlay: 10000,
  };

  return {
    id: data.id,
    name: data.name,
    phone: data.phone ?? undefined,
    address: data.address ?? undefined,
    logoUrl: data.logo_url ?? undefined,
    categoryPricing: settings.categoryPricing
      ? { ...defaultCategoryPricing, ...settings.categoryPricing }
      : defaultCategoryPricing,
    surcharges: settings.surcharges
      ? { ...defaultSurcharges, ...settings.surcharges }
      : defaultSurcharges,
    customerNotice: settings.customerNotice ?? undefined,
    kakaoTalkUrl: settings.kakaoTalkUrl ?? undefined,
    naverReservationUrl: settings.naverReservationUrl ?? undefined,
  };
}

export async function fetchPublicPortfolioPhotos(shopId: string): Promise<PortfolioPhoto[]> {
  const { data, error } = await supabase
    .from('portfolio_photos')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_public', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[db] fetchPublicPortfolioPhotos error:', toDbErrorSnapshot(error));
    return [];
  }

  return data.map(toPortfolioPhoto);
}

export async function dbCreatePreConsultation(
  shopId: string,
  language: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const id = createId('pc');
  const now = getNowInKoreaIso();

  const { error } = await supabase.from('pre_consultations').insert({
    id,
    shop_id: shopId,
    language,
    status: 'in_progress',
    data: {},
    reference_image_paths: [],
    created_at: now,
  });

  if (error) {
    console.error('[db] dbCreatePreConsultation error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }

  return { success: true, id };
}

export async function dbUpdatePreConsultation(
  id: string,
  payload: Partial<{
    data: unknown;
    design_category: string;
    reference_image_paths: string[];
    customer_name: string;
    customer_phone: string;
  }>,
  shopId?: string,
): Promise<{ success: boolean; error?: string }> {
  const update: Database['public']['Tables']['pre_consultations']['Update'] = {};
  if (payload.data !== undefined) update.data = payload.data as Database['public']['Tables']['pre_consultations']['Update']['data'];
  if (payload.design_category !== undefined) update.design_category = payload.design_category;
  if (payload.reference_image_paths !== undefined) update.reference_image_paths = payload.reference_image_paths as unknown as Database['public']['Tables']['pre_consultations']['Update']['reference_image_paths'];
  if (payload.customer_name !== undefined) update.customer_name = payload.customer_name;
  if (payload.customer_phone !== undefined) update.customer_phone = payload.customer_phone;

  let query = supabase
    .from('pre_consultations')
    .update(update)
    .eq('id', id);

  if (shopId) query = query.eq('shop_id', shopId);

  const { error } = await query;

  if (error) {
    console.error('[db] dbUpdatePreConsultation error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function dbCompletePreConsultation(
  id: string,
  payload: {
    data: unknown;
    confirmed_price: number;
    estimated_minutes: number;
    customer_name: string;
    customer_phone: string;
    design_category: string;
    reference_image_paths: string[];
  },
  shopId: string,
  language: string,
): Promise<{ success: boolean; error?: string }> {
  const now = getNowInKoreaIso();

  const { error } = await supabase
    .from('pre_consultations')
    .update({
      data: payload.data as Database['public']['Tables']['pre_consultations']['Update']['data'],
      confirmed_price: payload.confirmed_price,
      estimated_minutes: payload.estimated_minutes,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      design_category: payload.design_category,
      reference_image_paths: payload.reference_image_paths as unknown as Database['public']['Tables']['pre_consultations']['Update']['reference_image_paths'],
      status: 'completed',
      completed_at: now,
    })
    .eq('id', id)
    .eq('shop_id', shopId);

  if (error) {
    console.error('[db] dbCompletePreConsultation error:', toDbErrorSnapshot(error));
    return { success: false, error: error.message };
  }

  // Bridge: INSERT into booking_requests so the owner receives a notification
  const bookingId = createId('bk');
  const { error: bookingError } = await supabase.from('booking_requests').insert({
    id: bookingId,
    shop_id: shopId,
    customer_name: payload.customer_name,
    phone: payload.customer_phone,
    reservation_date: getTodayInKorea(),
    reservation_time: '미정',
    channel: 'pre_consult',
    status: 'pending',
    language,
    service_label: payload.design_category,
    pre_consultation_completed_at: now,
    pre_consultation_data: {
      ...(payload.data as Record<string, unknown>),
      referenceImageUrls: payload.reference_image_paths ?? (payload.data as Record<string, unknown> | null)?.['referenceImageUrls'] ?? [],
    } as unknown as import('@/types/database').Json,
    reference_image_urls: (payload.reference_image_paths as unknown as import('@/types/database').Json) ?? null,
    created_at: now,
  });

  if (bookingError) {
    console.error('[db] dbCompletePreConsultation: booking_requests insert failed:', {
      ...toDbErrorSnapshot(bookingError),
      preConsultationId: id,
      shopId,
    });
    return { success: false, error: 'booking_insert_failed' };
  }

  return { success: true };
}

const PRE_CONSULT_REFS_BUCKET = 'pre-consult-refs';

export async function uploadPreConsultImage(
  shopId: string,
  file: File,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const uuid = createId('img');
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${shopId}/${uuid}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(PRE_CONSULT_REFS_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[db] uploadPreConsultImage upload error:', toDbErrorSnapshot(uploadError));
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from(PRE_CONSULT_REFS_BUCKET).getPublicUrl(path);

    return { success: true, url: data.publicUrl };
  } catch (err) {
    console.error('[db] uploadPreConsultImage unexpected error:', toDbErrorSnapshot(err));
    return { success: false, error: '이미지 업로드 중 오류가 발생했습니다.' };
  }
}
