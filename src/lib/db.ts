import { supabase } from '@/lib/supabase';
import type { Customer, CustomerTag, SmallTalkNote, VisitFrequency, TagCategory, TagAccent } from '@/types/customer';
import type { ConsultationRecord, ConsultationType, BookingRequest, BookingChannel, BookingStatus, DailyChecklist } from '@/types/consultation';
import type { Shop, Designer, BusinessHours } from '@/types/shop';

// ─── Fetchers ────────────────────────────────────────────────────────────────

export async function fetchShop(): Promise<Shop | null> {
  const { data, error } = await supabase.from('shops').select('*').limit(1).single();
  if (error || !data) {
    console.error('[db] fetchShop error:', error);
    return null;
  }
  return {
    id: data.id,
    ownerId: data.owner_id ?? '',
    name: data.name,
    phone: data.phone ?? undefined,
    address: data.address ?? undefined,
    themeId: data.theme_id ?? '',
    businessHours: (data.business_hours as unknown as BusinessHours[]) ?? [],
    baseHandPrice: data.base_hand_price ?? 0,
    baseFootPrice: data.base_foot_price ?? 0,
    logoUrl: data.logo_url ?? undefined,
    createdAt: data.created_at ?? '',
    updatedAt: data.updated_at ?? '',
  };
}

export async function fetchDesigners(): Promise<Designer[]> {
  const { data, error } = await supabase.from('designers').select('*');
  if (error || !data) {
    console.error('[db] fetchDesigners error:', error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    shopId: row.shop_id,
    name: row.name,
    role: row.role as 'owner' | 'staff',
    profileImageUrl: row.profile_image_url ?? undefined,
    phone: row.phone ?? undefined,
    isActive: row.is_active ?? false,
    createdAt: row.created_at ?? '',
  }));
}

export async function fetchCustomers(): Promise<Customer[]> {
  const [customersRes, tagsRes, notesRes] = await Promise.all([
    supabase.from('customers').select('*'),
    supabase.from('customer_tags').select('*'),
    supabase.from('small_talk_notes').select('*'),
  ]);

  if (customersRes.error) {
    console.error('[db] fetchCustomers customers error:', customersRes.error);
    return [];
  }
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
  }));
}

export async function fetchConsultationRecords(): Promise<ConsultationRecord[]> {
  const { data, error } = await supabase.from('consultation_records').select('*');
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
  }));
}

export async function fetchBookingRequests(): Promise<BookingRequest[]> {
  const { data, error } = await supabase.from('booking_requests').select('*');
  if (error || !data) {
    console.error('[db] fetchBookingRequests error:', error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
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
  }));
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

export async function dbUpsertShop(shop: Shop): Promise<void> {
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
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('[db] dbUpsertShop error:', error);
  }
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
  });
  if (error) {
    console.error('[db] dbUpsertRecord error:', error);
  }
}

export async function dbDeleteRecord(id: string): Promise<void> {
  const { error } = await supabase.from('consultation_records').delete().eq('id', id);
  if (error) {
    console.error('[db] dbDeleteRecord error:', error);
  }
}

// ─── Reservation Mutations ────────────────────────────────────────────────────

export async function dbUpsertReservation(reservation: BookingRequest): Promise<void> {
  const { error } = await supabase.from('booking_requests').upsert({
    id: reservation.id,
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
  });
  if (error) {
    console.error('[db] dbUpsertReservation error:', error);
  }
}

export async function dbDeleteReservation(id: string): Promise<void> {
  const { error } = await supabase.from('booking_requests').delete().eq('id', id);
  if (error) {
    console.error('[db] dbDeleteReservation error:', error);
  }
}
