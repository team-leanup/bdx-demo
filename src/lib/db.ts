import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { Customer, CustomerTag, SmallTalkNote, VisitFrequency, TagCategory, TagAccent } from '@/types/customer';
import type { ConsultationRecord, ConsultationType, BookingRequest, BookingChannel, BookingStatus, DailyChecklist } from '@/types/consultation';
import type { PortfolioPhoto } from '@/types/portfolio';
import type { Shop, Designer, BusinessHours, ShopExtendedSettings } from '@/types/shop';

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

function toDesigner(row: Database['public']['Tables']['designers']['Row']): Designer {
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
  };
}

function getPortfolioPublicUrl(path: string): string {
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
  };
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

export async function dbCreateShopAccount(
  ownerUserId: string,
  shopName: string,
  ownerName: string,
): Promise<ShopAccountMutationResult> {
  // Check for existing account first
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
    console.error('[db] dbCreateShopAccount rpc error:', rpcError);
    return { success: false, error: rpcError.message };
  }

  const result = rpcResult as { success: boolean; error?: string; shop_id?: string; owner_id?: string; shop_name?: string; owner_name?: string };

  if (!result.success) {
    console.error('[db] dbCreateShopAccount rpc failed:', result.error);
    return { success: false, error: result.error ?? '샵 생성에 실패했습니다' };
  }

  const now = new Date().toISOString();

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
    console.error('[db] fetchShopByOwnerId error:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return toShop(data);
}

export async function fetchDesignerById(designerId: string): Promise<Designer | null> {
  const { data, error } = await supabase.from('designers').select('*').eq('id', designerId).single();
  if (error || !data) {
    console.error('[db] fetchDesignerById error:', error);
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
    console.error('[db] fetchShop error:', error);
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
    console.error('[db] fetchDesigners error:', error);
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

  const now = new Date().toISOString();
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
    console.error('[db] dbCreateDesigner error:', error);
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
    console.error('[db] dbUpdateDesigner error:', error);
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
    console.error('[db] dbDeleteDesigner lookup error:', existingError);
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
      console.error('[db] dbDeleteDesigner remove avatar error:', storageError);
      return { success: false, error: '프로필 이미지 삭제에 실패했습니다.' };
    }
  }

  const { error } = await supabase
    .from('designers')
    .delete()
    .eq('shop_id', shopId)
    .eq('id', designerId);

  if (error) {
    console.error('[db] dbDeleteDesigner error:', error);
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
      console.error('[db] dbUploadDesignerProfileImage fetch error:', existingError);
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
      console.error('[db] dbUploadDesignerProfileImage upload error:', uploadError);
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
      console.error('[db] dbUploadDesignerProfileImage update error:', error);
      await supabase.storage.from(DESIGNER_AVATAR_BUCKET).remove([imagePath]);
      return { success: false, error: '프로필 이미지 저장에 실패했습니다.' };
    }

    const oldPath = getDesignerAvatarStoragePath(existing.profile_image_url);
    if (oldPath && oldPath !== imagePath) {
      const { error: removeOldError } = await supabase.storage.from(DESIGNER_AVATAR_BUCKET).remove([oldPath]);
      if (removeOldError) {
        console.error('[db] dbUploadDesignerProfileImage remove old avatar error:', removeOldError);
      }
    }

    return { success: true, designer: toDesigner(data) };
  } catch (error) {
    console.error('[db] dbUploadDesignerProfileImage unexpected error:', error);
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
    console.error('[db] dbDeleteDesignerProfileImage fetch error:', existingError);
    return { success: false, error: '디자이너 정보를 찾을 수 없습니다.' };
  }

  const oldPath = getDesignerAvatarStoragePath(existing.profile_image_url);
  if (oldPath) {
    const { error: storageError } = await supabase.storage.from(DESIGNER_AVATAR_BUCKET).remove([oldPath]);
    if (storageError) {
      console.error('[db] dbDeleteDesignerProfileImage remove error:', storageError);
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
    console.error('[db] dbDeleteDesignerProfileImage update error:', error);
    return { success: false, error: '프로필 이미지 삭제 상태를 저장하지 못했습니다.' };
  }

  return { success: true, designer: toDesigner(data) };
}

export async function fetchCustomers(shopId?: string | null): Promise<Customer[]> {
  if (!shopId) {
    return [];
  }

  const customersRes = await supabase.from('customers').select('*').eq('shop_id', shopId);

  if (customersRes.error) {
    console.error('[db] fetchCustomers customers error:', customersRes.error);
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
    console.error('[db] fetchCustomers tags error:', tagsRes.error);
  }
  if (notesRes.error) {
    console.error('[db] fetchCustomers notes error:', notesRes.error);
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
  }));
}

export async function fetchConsultationRecords(shopId?: string | null): Promise<ConsultationRecord[]> {
  if (!shopId) {
    return [];
  }

  const { data, error } = await supabase.from('consultation_records').select('*').eq('shop_id', shopId);
  if (error || !data) {
    console.error('[db] fetchConsultationRecords error:', error);
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
  }));
}

export async function fetchBookingRequests(shopId?: string | null): Promise<BookingRequest[]> {
  if (!shopId) {
    return [];
  }

  const { data, error } = await supabase.from('booking_requests').select('*').eq('shop_id', shopId);
  if (error || !data) {
    console.error('[db] fetchBookingRequests error:', error);
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
  }));
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
    console.error('[db] fetchPortfolioPhotos error:', error);
    return [];
  }

  return data.map(toPortfolioPhoto);
}

// ─── Customer Mutations ───────────────────────────────────────────────────────

export async function dbUpsertCustomer(customer: Customer): Promise<void> {
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
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('[db] dbUpsertCustomer error:', error);
  }
}

export async function dbUpsertCustomerTags(customerId: string, tags: CustomerTag[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('customer_tags')
    .delete()
    .eq('customer_id', customerId);
  if (deleteError) {
    console.error('[db] dbUpsertCustomerTags delete error:', deleteError);
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
  }));
  const { error: insertError } = await supabase.from('customer_tags').insert(rows);
  if (insertError) {
    console.error('[db] dbUpsertCustomerTags insert error:', insertError);
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
    console.error('[db] dbInsertSmallTalkNote error:', error);
  }
}

export async function dbUpdateCustomerField(customerId: string, field: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', customerId);
  if (error) {
    console.error('[db] dbUpdateCustomerField error:', error);
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
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('[db] dbUpsertShop error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function dbUpdateShopSettings(shopId: string, settings: ShopExtendedSettings): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('shops')
    .update({
      settings: settings as unknown as import('@/types/database').Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shopId);
  if (error) {
    console.error('[db] dbUpdateShopSettings error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Record Mutations ─────────────────────────────────────────────────────────

export async function dbUpsertRecord(record: ConsultationRecord): Promise<void> {
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
    updated_at: new Date().toISOString(),
    finalized_at: record.finalizedAt ?? null,
    pricing_adjustments: (record.pricingAdjustments as unknown as import('@/types/database').Json) ?? null,
    notes: record.notes ?? null,
    image_urls: (record.imageUrls as unknown as import('@/types/database').Json) ?? null,
    checklist: (record.checklist as unknown as import('@/types/database').Json) ?? null,
    language: record.language ?? null,
  });
  if (error) {
    console.error('[db] dbUpsertRecord error:', error);
  }
}

export async function dbDeleteRecord(id: string, shopId?: string): Promise<void> {
  let query = supabase.from('consultation_records').delete().eq('id', id);
  if (shopId) {
    query = query.eq('shop_id', shopId);
  }
  const { error } = await query;
  if (error) {
    console.error('[db] dbDeleteRecord error:', error);
  }
}

// ─── Reservation Mutations ────────────────────────────────────────────────────

export async function dbUpsertReservation(reservation: BookingRequest): Promise<void> {
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
    designer_id: reservation.designerId ?? null,
    service_label: reservation.serviceLabel ?? null,
    customer_id: reservation.customerId ?? null,
    pre_consultation_data: (reservation.preConsultationData as unknown as import('@/types/database').Json) ?? null,
    pre_consultation_completed_at: reservation.preConsultationCompletedAt ?? null,
  });
  if (error) {
    console.error('[db] dbUpsertReservation error:', error);
  }
}

export async function dbDeleteReservation(id: string, shopId?: string): Promise<void> {
  let query = supabase.from('booking_requests').delete().eq('id', id);
  if (shopId) {
    query = query.eq('shop_id', shopId);
  }
  const { error } = await query;
  if (error) {
    console.error('[db] dbDeleteReservation error:', error);
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
        console.error('[db] dbInsertPortfolioPhoto upload error:', uploadError);
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
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[db] dbInsertPortfolioPhoto upsert error:', error);

      return { success: false, error: '포트폴리오 저장에 실패했습니다' };
    }

    return {
      success: true,
      photo: toPortfolioPhoto(data),
    };
  } catch (error) {
    console.error('[db] dbInsertPortfolioPhoto unexpected error:', error);
    return { success: false, error: '포트폴리오 저장 중 오류가 발생했습니다' };
  }
}

export async function dbDeletePortfolioPhoto(photo: PortfolioPhoto): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('portfolio_photos').delete().eq('id', photo.id).eq('shop_id', photo.shopId);
  if (error) {
    console.error('[db] dbDeletePortfolioPhoto delete row error:', error);
    return { success: false, error: '포트폴리오 삭제에 실패했습니다' };
  }

  if (photo.imagePath) {
    const { error: storageError } = await supabase.storage.from(PORTFOLIO_BUCKET).remove([photo.imagePath]);
    if (storageError) {
      console.error('[db] dbDeletePortfolioPhoto remove file error:', storageError);
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
    console.error('[db] dbDeleteAllPortfolioPhotos delete rows error:', error);
    return { success: false, error: '포트폴리오 초기화에 실패했습니다' };
  }

  const paths = photos
    .map((photo) => photo.imagePath)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(PORTFOLIO_BUCKET).remove(paths);
    if (storageError) {
      console.error('[db] dbDeleteAllPortfolioPhotos remove files error:', storageError);
      return { success: false, error: '이미지 파일 초기화에 실패했습니다' };
    }
  }

  return { success: true };
}
