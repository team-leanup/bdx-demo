'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, Input, Modal } from '@/components/ui';
import { ConsultationLinkContent } from '@/components/reservations/ConsultationLinkModal';
import { PreConsultSummaryInline } from '@/components/reservations/PreConsultSummaryInline';
import { useRecordsStore } from '@/store/records-store';
import { useAuthStore } from '@/store/auth-store';
import { useReservationStore } from '@/store/reservation-store';
import { useAppStore } from '@/store/app-store';
import { useConsultationStore } from '@/store/consultation-store';
import { useFieldModeStore } from '@/store/field-mode-store';
import { ConsultationStep } from '@/types/consultation';
import type { DesignCategory, RemovalPreference, LengthPreference, AddOnOption } from '@/types/pre-consultation';
import { useCustomerStore } from '@/store/customer-store';
import { useT } from '@/lib/i18n';
import { formatPrice, getKoreanWeekStart, getTodayInKorea, toKoreanDateString, toKoreanTimeString, getNowInKoreaIso } from '@/lib/format';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { DayReservationList } from '@/components/calendar/DayReservationList';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { DesignerDayGridCalendar } from '@/components/calendar/DesignerDayGridCalendar';
import { getSafetyTagMeta, sortSafetyTags } from '@/lib/tag-safety';
import { getBookingStage } from '@/lib/booking-stage';
import { cn } from '@/lib/cn';
import type { TimeGridEvent } from '@/components/calendar/TimeGridCalendar';
import { DESIGN_SCOPE_LABEL } from '@/lib/labels';
import { useShopStore } from '@/store/shop-store';
import { useLocaleStore } from '@/store/locale-store';
import {
  MainTabBar,
  ConsultationList,
  PeriodFilter,
} from '@/components/records';
import { TAG_PRESETS } from '@/data/tag-presets';
import { TagIconSvg } from '@/components/ui/TagIconSvg';
import { ReservationForm } from '@/components/home/ReservationForm';
import type { BookingChannel, BookingRequest } from '@/types/consultation';
import type { ConsultationRecord } from '@/types/consultation';

const READINESS_LEGEND = [
  { color: 'bg-slate-300', label: '링크 미발송' },
  { color: 'bg-amber-400', label: '응답 대기' },
  { color: 'bg-emerald-500', label: '응답 완료' },
] as const;

type MainTab = 'reservations' | 'consultations';
type ViewMode = 'day' | 'month';
type FilterPeriod = 'all' | 'today' | 'week' | 'month';

function isInPeriod(dateStr: string, period: FilterPeriod): boolean {
  const today = getTodayInKorea();
  const todayDate = new Date(`${today}T12:00:00`);
  const normalizedDate = toKoreanDateString(dateStr);
  const d = new Date(`${normalizedDate}T12:00:00`);
  if (period === 'all') return true;
  if (period === 'today') return normalizedDate === today;
  if (period === 'week') {
    const startOfWeek = new Date(todayDate);
    const dayOfWeek = (todayDate.getDay() + 6) % 7; // Monday=0, Sunday=6
    startOfWeek.setDate(todayDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  }
  if (period === 'month') {
    return d.getFullYear() === todayDate.getFullYear() && d.getMonth() === todayDate.getMonth();
  }
  return true;
}

function getMonday(dateStr: string): string {
  return getKoreanWeekStart(dateStr);
}

function getTodayStr(): string {
  return getTodayInKorea();
}

function toTimeGridEvents(
  reservations: import('@/types/consultation').BookingRequest[],
  getCustomerById: (id: string) => import('@/types/customer').Customer | undefined,
): TimeGridEvent[] {
  const events: TimeGridEvent[] = [];

  for (const r of reservations) {
    const [h, m] = r.reservationTime.split(':').map(Number);
    const endH = Math.min(h + 1, 23);
    const customer = r.customerId ? getCustomerById(r.customerId) : undefined;
    const durationMap: Record<string, string> = { short: '짧음', normal: '보통', long: '김' };
    const sensitivityMap: Record<string, string> = { normal: '보통', sensitive: '민감' };
    events.push({
      id: `res-${r.id}`,
      title: r.customerName,
      date: r.reservationDate,
      startTime: r.reservationTime,
      endTime: `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      type: 'reservation',
      status: r.status,
      channel: r.channel,
      customerPhone: r.phone,
      requestNote: r.requestNote,
      language: r.language,
      designerId: r.designerId,
      originalId: r.id,
      customerId: r.customerId,
      serviceLabel: r.serviceLabel,
      consultationLinkSentAt: r.consultationLinkSentAt,
      preConsultationCompletedAt: r.preConsultationCompletedAt,
      nailShape: customer?.preference?.preferredShape ?? undefined,
      cuticleSensitivity: customer?.preference?.cuticleSensitivity ? sensitivityMap[customer.preference.cuticleSensitivity] : undefined,
      durationPreference: customer?.durationPreference ? durationMap[customer.durationPreference] : undefined,
      customerNote: r.requestNote,
      visitCount: customer?.visitCount ?? 0,
      preferredColors: customer?.treatmentHistory?.[0]?.colorLabels ?? [],
      removalNeeded: (() => {
        const raw = r.preConsultationData as Record<string, unknown> | undefined;
        const pref = raw?.removalPreference as string | undefined;
        if (pref === 'self_shop') return '자샵 제거';
        if (pref === 'other_shop') return '타샵 제거';
        return undefined;
      })(),
    });
  }

  return events;
}

export default function RecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [mainTab, setMainTab] = useState<MainTab>('reservations');
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [designerFilter, setDesignerFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [linkGenBooking, setLinkGenBooking] = useState<BookingRequest | null>(null);

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [weekStartDate, setWeekStartDate] = useState(getMonday(getTodayStr()));
  const [selectedEvent, setSelectedEvent] = useState<TimeGridEvent | null>(null);
  const [customerFilterId, setCustomerFilterId] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', phone: '', startTime: '', requestNote: '', referenceImages: [] as string[], language: 'ko' as 'ko' | 'en' | 'zh' | 'ja', deposit: '' as string });
  const editPhotoRef = useRef<HTMLInputElement>(null);
  const [showAddReservationModal, setShowAddReservationModal] = useState(false);
  const [reservationPrefill, setReservationPrefill] = useState<{ time?: string; designerId?: string; channel?: BookingChannel } | null>(null);
  const [reservationNaverMode, setReservationNaverMode] = useState(false);
  const [showPreConsultInline, setShowPreConsultInline] = useState(false);

  const closeSelectedEventSheet = (): void => {
    setLinkGenBooking(null);
    setEditMode(false);
    setSelectedEvent(null);
    setShowPreConsultInline(false);
  };

  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const hydrateFromBooking = useFieldModeStore((s) => s.hydrateFromBooking);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const getCustomerById = useCustomerStore((s) => s.getById);
  const customers = useCustomerStore((s) => s.customers);

  const designers = useShopStore((s) => s.designers);
  const shopName = useShopStore((s) => s.shop?.name);
  const role = useAuthStore((s) => s.role);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const allReservations = useReservationStore((s) => s.reservations);
  const addReservation = useReservationStore((s) => s.addReservation);
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const removeReservation = useReservationStore((s) => s.removeReservation);
  const removeRecord = useRecordsStore((s) => s.removeRecord);
  const updateRecord = useRecordsStore((s) => s.updateRecord);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const { shopSettings } = useAppStore();
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const allConsultations = useMemo(() => getAllRecords(), [getAllRecords]);

  const { calendarStartHour, calendarEndHour } = useMemo(() => {
    const openHours = shopSettings.businessHours
      .filter((bh) => bh.isOpen && bh.openTime && bh.closeTime)
      .map((bh) => ({
        open: parseInt(bh.openTime!.split(':')[0], 10),
        close: parseInt(bh.closeTime!.split(':')[0], 10),
      }))
      .filter((h) => !Number.isNaN(h.open) && !Number.isNaN(h.close));
    if (openHours.length === 0) return { calendarStartHour: 10, calendarEndHour: 20 };
    const earliest = Math.min(...openHours.map((h) => h.open));
    const latest = Math.max(...openHours.map((h) => h.close));
    return { calendarStartHour: earliest, calendarEndHour: latest };
  }, [shopSettings.businessHours]);

  const activeDesigners = useMemo(
    () => designers.filter((designer) => designer.isActive),
    [designers],
  );

  const dayReservations = useMemo(
    () =>
      allReservations
        .filter((r) => r.reservationDate === selectedDate)
        .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime)),
    [allReservations, selectedDate],
  );

  const weekStats = useMemo(() => {
    const today = getTodayStr();
    // N-12: KST 기준으로 날짜 파싱 (UTC 파싱 방지)
    const todayDate = new Date(`${today}T00:00:00+09:00`);
    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const thisWeek = allReservations.filter((r) => {
      const d = new Date(r.reservationDate);
      return d >= weekStart && d <= weekEnd;
    });

    const now = new Date();
    const todayRemaining = allReservations.filter((r) => {
      if (r.reservationDate !== today) return false;
      if (r.status === 'completed' || r.status === 'cancelled') return false;
      const [h, m] = r.reservationTime.split(':').map(Number);
      const dt = new Date(today);
      dt.setHours(h, m, 0, 0);
      return dt >= now;
    });

    return { weekCount: thisWeek.length, todayRemainingCount: todayRemaining.length };
  }, [allReservations]);


  const timeGridEvents = useMemo(
    () => toTimeGridEvents(allReservations, getCustomerById),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allReservations, getCustomerById, customers],
  );

  const sorted = useMemo(
    () =>
      [...allConsultations].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [allConsultations],
  );

  const listFiltered = useMemo(() => {
    return sorted.filter((r) => {
      if (role === 'staff' && activeDesignerId && r.designerId !== activeDesignerId) return false;
      if (customerFilterId && r.customerId !== customerFilterId) return false;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (r.consultation.customerName ?? '').toLowerCase().includes(q) ||
        (r.consultation.customerPhone ?? '').includes(q) ||
        DESIGN_SCOPE_LABEL[r.consultation.designScope]?.toLowerCase().includes(q);
      const matchPeriod = isInPeriod(r.createdAt, filter);
      let matchTag = true;
      if (tagFilter) {
        if (tagFilter === '외국인') {
          matchTag = !!r.language && r.language !== 'ko';
        } else {
          const customerTags = getPinnedTags(r.customerId);
          matchTag = customerTags.some((t) => t.value === tagFilter);
        }
      }
      return matchSearch && matchPeriod && matchTag;
    });
  }, [sorted, search, filter, tagFilter, role, activeDesignerId, getPinnedTags, customerFilterId]);

  const handleEventClick = (ev: TimeGridEvent) => {
    if (ev.type === 'consultation') {
      router.push(`/records/${ev.originalId}`);
    } else if (ev.type === 'reservation') {
      setSelectedEvent(ev);
      setEditMode(false);
      const booking = allReservations.find((r) => r.id === ev.originalId);
      setEditForm({
        title: ev.title,
        phone: ev.customerPhone ?? '',
        startTime: ev.startTime,
        requestNote: ev.requestNote ?? '',
        referenceImages: booking?.referenceImageUrls ?? [],
        language: (booking?.language ?? 'ko') as 'ko' | 'en' | 'zh' | 'ja',
        deposit: String(booking?.deposit ?? ''),
      });
    }
  };

  const handleSaveReservation = () => {
    if (!selectedEvent) return;
    const depositAmount = editForm.deposit ? parseInt(editForm.deposit, 10) : undefined;
    updateReservation(selectedEvent.originalId, {
      customerName: editForm.title,
      phone: editForm.phone,
      reservationTime: editForm.startTime,
      requestNote: editForm.requestNote,
      referenceImageUrls: editForm.referenceImages.length > 0 ? editForm.referenceImages : undefined,
      language: editForm.language,
      deposit: !isNaN(depositAmount ?? NaN) && depositAmount ? depositAmount : undefined,
    });
    closeSelectedEventSheet();
  };

  const handleStartConsultation = () => {
    if (!selectedEvent) return;
    const booking = allReservations.find((reservation) => reservation.id === selectedEvent.originalId);
    if (booking) {
      if (booking.requestNote) {
        sessionStorage.setItem('consultation_customer_memo', booking.requestNote);
      } else {
        sessionStorage.removeItem('consultation_customer_memo');
      }
      if (booking.language && ['ko', 'en', 'zh', 'ja'].includes(booking.language)) {
        setConsultationLocale(booking.language);
      }
      hydrateConsultation({
        ...booking.preConsultationData,
        bookingId: booking.id,
        customerName: booking.customerName,
        customerPhone: booking.phone,
        customerId: booking.customerId ?? booking.preConsultationData?.customerId,
        referenceImages: booking.preConsultationData?.referenceImages ?? booking.referenceImageUrls ?? [],
        entryPoint: 'staff',
        currentStep: ConsultationStep.START,
      });
      // field-mode store에도 동일 예약 데이터 반영
      const raw = booking.preConsultationData as Record<string, unknown> | undefined;
      hydrateFromBooking({
        bookingId: booking.id,
        customerName: booking.customerName,
        customerPhone: booking.phone,
        customerId: booking.customerId ?? booking.preConsultationData?.customerId ?? null,
        designerId: booking.designerId ?? booking.preConsultationData?.designerId ?? '',
        designCategory: (raw?.designCategory ?? null) as DesignCategory | null,
        removalType: (raw?.removalPreference ?? 'none') as RemovalPreference,
        lengthType: (raw?.lengthPreference ?? 'keep') as LengthPreference,
        addOns: (raw?.addOns ?? []) as AddOnOption[],
        selectedPhotoUrl: (raw?.selectedPhotoUrl as string | undefined) ?? null,
        selectedPhotoId: (raw?.selectedPhotoId as string | undefined) ?? null,
      });
    }
    closeSelectedEventSheet();
    router.push('/field-mode');
  };

  const handleQuickSale = () => {
    if (!selectedEvent) return;
    const params = new URLSearchParams();
    params.set('bookingId', selectedEvent.originalId);
    if (selectedEvent.customerId) params.set('customerId', selectedEvent.customerId);
    params.set('customerName', selectedEvent.title);
    closeSelectedEventSheet();
    router.push(`/quick-sale?${params.toString()}`);
  };

  const handleDeleteRecord = () => {
    if (!selectedEvent) return;
    setConfirmDelete(true);
  };

  const executeDelete = () => {
    if (!selectedEvent) return;
    if (selectedEvent.type === 'reservation') {
      removeReservation(selectedEvent.originalId);
    } else {
      removeRecord(selectedEvent.originalId);
    }
    setConfirmDelete(false);
    closeSelectedEventSheet();
  };

  const handleEditModeEnter = () => {
    if (!selectedEvent) return;
    setEditMode(true);
    const booking = allReservations.find((r) => r.id === selectedEvent.originalId);
    setEditForm({
      title: selectedEvent.title,
      phone: selectedEvent.customerPhone ?? '',
      startTime: selectedEvent.startTime,
      requestNote: selectedEvent.requestNote ?? '',
      referenceImages: booking?.referenceImageUrls ?? [],
      language: (booking?.language ?? 'ko') as 'ko' | 'en' | 'zh' | 'ja',
      deposit: String(booking?.deposit ?? ''),
    });
  };

  const handleEventMove = (reservationId: string, updates: { reservationTime: string; designerId?: string }): void => {
    updateReservation(reservationId, updates);
  };

  const handleSlotLongPress = (time: string, designerId: string): void => {
    setReservationPrefill({ time, designerId });
    setReservationNaverMode(false);
    setShowAddReservationModal(true);
  };

  const handleAddReservation = (newBooking: BookingRequest): void => {
    addReservation({
      customerName: newBooking.customerName,
      phone: newBooking.phone,
      reservationDate: newBooking.reservationDate,
      reservationTime: newBooking.reservationTime,
      channel: newBooking.channel,
      requestNote: newBooking.requestNote,
      referenceImageUrls: newBooking.referenceImageUrls,
      language: newBooking.language,
      designerId: newBooking.designerId,
      serviceLabel: newBooking.serviceLabel,
      customerId: newBooking.customerId,
    });
  };

  const periodLabels: Record<FilterPeriod, string> = {
    all: t('records.filterAll'),
    today: t('records.filterToday'),
    week: t('records.filterWeek'),
    month: t('records.filterMonth'),
  };

  useEffect(() => {
    const legacyView = searchParams.get('view');
    if (!legacyView) return;

    switch (legacyView) {
      case 'list':
        setMainTab('consultations');
        break;
      case 'month':
        setMainTab('reservations');
        setViewMode('month');
        break;
      case 'day':
      case 'daily':
      case 'timegrid':
      case 'week':
      default:
        setMainTab('reservations');
        setViewMode('day');
        break;
    }
  }, [searchParams]);

  useEffect(() => {
    const nextCustomerId = searchParams.get('customerId');
    setCustomerFilterId(nextCustomerId);

    if (!nextCustomerId) return;

    const customer = getCustomerById(nextCustomerId);
    setMainTab('consultations');
    setSearch(customer?.name ?? nextCustomerId);
  }, [searchParams, getCustomerById]);

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (!bookingId) return;

    // N-17: timeGridEvents 대신 전체 예약에서 검색 (오늘 날짜 외 예약도 딥링크 가능)
    const targetReservation = allReservations.find((r) => r.id === bookingId);
    if (!targetReservation) return;

    const targetEvent = timeGridEvents.find(
      (event) => event.type === 'reservation' && event.originalId === bookingId,
    );

    setMainTab('reservations');
    setViewMode('day');
    setSelectedDate(targetReservation.reservationDate);
    if (targetEvent) {
      setSelectedEvent(targetEvent);
    } else {
      setSelectedEvent({
        id: `res-${targetReservation.id}`,
        originalId: targetReservation.id,
        type: 'reservation',
        title: targetReservation.customerName,
        date: targetReservation.reservationDate,
        startTime: targetReservation.reservationTime,
        endTime: '',
        status: targetReservation.status,
        customerId: targetReservation.customerId,
        customerPhone: targetReservation.phone,
        requestNote: targetReservation.requestNote,
        language: targetReservation.language,
        serviceLabel: targetReservation.serviceLabel,
        designerId: targetReservation.designerId,
        consultationLinkSentAt: targetReservation.consultationLinkSentAt,
        preConsultationCompletedAt: targetReservation.preConsultationCompletedAt,
      });
    }

    // 사전상담 완료된 예약이면 전용 페이지로 바로 이동
    if (targetReservation.preConsultationCompletedAt) {
      router.replace(`/records/preconsult/${targetReservation.id}`);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('bookingId');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/records?${nextQuery}` : '/records', { scroll: false });
  }, [searchParams, timeGridEvents, allReservations, router]);

  return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="px-4 md:px-0 pt-4">
        <h1 className="text-2xl font-bold text-text">{t('nav.records')}</h1>
      </div>

      <MainTabBar activeTab={mainTab} onTabChange={setMainTab} />

      {mainTab === 'reservations' && (
        <>
          <div className="flex items-center justify-between px-4 md:px-0">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              {READINESS_LEGEND.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
            <span className="text-xs text-text-secondary tabular-nums">
              이번주 {weekStats.weekCount}건 · 오늘 남은 {weekStats.todayRemainingCount}건
            </span>
          </div>

          {/* 디자이너 필터 토글 */}
          <div className="flex gap-1.5 overflow-x-auto px-4 md:px-0 pb-0.5">
            {[{ id: null as string | null, name: '전체' }, ...activeDesigners.map((d) => ({ id: d.id as string | null, name: d.name })), { id: '__unassigned__' as string | null, name: '미지정' }].map((d) => (
              <button
                key={d.id ?? 'all'}
                type="button"
                onClick={() => setDesignerFilter(d.id === null ? null : designerFilter === d.id ? null : d.id)}
                className={cn(
                  'flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  (d.id === null ? designerFilter === null : designerFilter === d.id)
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-alt text-text-secondary',
                )}
              >
                {d.name}
              </button>
            ))}
          </div>

          {viewMode === 'day' && (
            <div className="flex flex-col gap-2 px-4 md:px-0">
              <Card className="p-3 relative">
                <WeekCalendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  reservations={allReservations}
                />
                {/* 월간 뷰 전환 아이콘 */}
                <button
                  type="button"
                  onClick={() => setViewMode('month')}
                  className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-lg bg-surface-alt text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                  title="월간 보기"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                  </svg>
                </button>
              </Card>
              <DesignerDayGridCalendar
                date={selectedDate}
                events={designerFilter
                  ? timeGridEvents.filter((e) => designerFilter === '__unassigned__' ? !e.designerId : e.designerId === designerFilter)
                  : timeGridEvents
                }
                designers={designerFilter
                  ? activeDesigners.filter((d) => d.id === designerFilter).map((d) => ({ id: d.id, name: d.name }))
                  : activeDesigners.map((d) => ({ id: d.id, name: d.name }))
                }
                startHour={calendarStartHour}
                endHour={calendarEndHour}
                onEventClick={handleEventClick}
                onEventMove={handleEventMove}
                onSlotLongPress={handleSlotLongPress}
                onAddReservation={() => {
                  setReservationPrefill({ time: undefined, designerId: undefined });
                  setReservationNaverMode(false);
                  setShowAddReservationModal(true);
                }}
                role={role}
                activeDesignerId={activeDesignerId}
              />
            </div>
          )}

          {viewMode === 'month' && (
            <div className="flex flex-col gap-2 px-4 md:px-0">
              <Card className="p-4 relative">
                <MonthCalendar
                  selectedDate={selectedDate}
                  onSelectDate={(date) => { setSelectedDate(date); setViewMode('day'); }}
                  reservations={allReservations}
                />
                {/* 일간 뷰 전환 아이콘 */}
                <button
                  type="button"
                  onClick={() => setViewMode('day')}
                  className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-lg bg-surface-alt text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                  title="일간 보기"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </button>
              </Card>
              <DayReservationList date={selectedDate} reservations={dayReservations} />
            </div>
          )}
        </>
      )}

      {mainTab === 'consultations' && (
        <>
          <div className="px-4 md:px-0">
            <Input
              placeholder={t('records.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <p className="mt-2 text-xs text-text-muted">이름 / 전화번호 / 서비스명으로 검색할 수 있어요.</p>
          </div>

          {customerFilterId && (
            <div className="px-4 md:px-0">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-primary">고객 기준 필터 적용됨</p>
                  <p className="mt-1 text-sm text-text">
                    {getCustomerById(customerFilterId)?.name ?? customerFilterId} 시술 기록만 보고 있어요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerFilterId(null);
                    setSearch('');
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('customerId');
                    const nextQuery = params.toString();
                    router.replace(nextQuery ? `/records?${nextQuery}` : '/records', { scroll: false });
                  }}
                  className="rounded-xl border border-primary/20 bg-surface px-3 py-2 text-xs font-semibold text-primary"
                >
                  필터 해제
                </button>
              </div>
            </div>
          )}

          {/* R-5: 태그 필터 칩 */}
          <div className="relative after:absolute after:right-0 after:top-0 after:bottom-0 after:w-8 after:bg-gradient-to-l after:from-background after:to-transparent after:pointer-events-none">
          <div className="flex gap-2 overflow-x-auto px-4 md:px-0 pb-1 scrollbar-hide">
            <button
              onClick={() => setTagFilter(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                tagFilter === null
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-alt'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setTagFilter(tagFilter === '외국인' ? null : '외국인')}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold leading-none transition-colors ${
                tagFilter === '외국인'
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-alt'
              }`}
            >
              <TagIconSvg icon="🌏" className="h-3.5 w-3.5" />
              <span>외국인</span>
            </button>
            {TAG_PRESETS.filter((p) => ['design', 'shape', 'etc'].includes(p.category)).flatMap((p) => p.options).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTagFilter(tagFilter === opt.value ? null : opt.value)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold leading-none transition-colors ${
                  tagFilter === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-text-secondary hover:bg-surface-alt'
                }`}
              >
                {opt.icon && <TagIconSvg icon={opt.icon} className="h-3.5 w-3.5" />}
                <span>{opt.value}</span>
              </button>
            ))}
          </div>
          </div>

          <PeriodFilter
            filter={filter}
            onFilterChange={setFilter}
            labels={periodLabels}
          />

          <ConsultationList
            records={listFiltered}
            onRecordClick={(id) => router.push(`/records/${id}`)}
            emptyTitle={t('records.noResults')}
            emptyDescription={t('records.noResultsHint')}
          />

        </>
      )}

      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={closeSelectedEventSheet}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-2xl bg-background pt-5 pb-safe md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto md:w-full md:max-h-[85vh] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
            >
              <div className="mb-4 flex flex-shrink-0 items-center justify-between px-5">
                <h3 className="text-base font-semibold text-text">
                  {linkGenBooking
                    ? '상담 링크 생성'
                    : editMode
                      ? '예약 수정'
                      : (selectedEvent.type === 'reservation' ? '예약 상세' : '기록 상세')}
                </h3>
                <button
                  onClick={linkGenBooking ? () => setLinkGenBooking(null) : closeSelectedEventSheet}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-text-muted"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-5 pb-8">
                {linkGenBooking ? (
                  <ConsultationLinkContent
                    booking={linkGenBooking}
                    shopName={shopName || shopSettings.shopName}
                    onClose={() => setLinkGenBooking(null)}
                    closeLabel="예약 상세로 돌아가기"
                  />
                ) : editMode ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">고객명</label>
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">연락처</label>
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        placeholder="010-0000-0000"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">시작 시간</label>
                      <input
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">메모</label>
                      <textarea
                        value={editForm.requestNote}
                        onChange={(e) => setEditForm((f) => ({ ...f, requestNote: e.target.value }))}
                        rows={2}
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
                        placeholder="요청사항이나 메모를 입력하세요"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-text-muted">상담 언어</label>
                      <select
                        value={editForm.language}
                        onChange={(e) => setEditForm((f) => ({ ...f, language: e.target.value as 'ko' | 'en' | 'zh' | 'ja' }))}
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">예약금</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-muted">₩</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editForm.deposit}
                          onChange={(e) => setEditForm((f) => ({ ...f, deposit: e.target.value.replace(/[^0-9]/g, '') }))}
                          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          placeholder="예약금 입력 (선택)"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">참고 이미지</label>
                      <div className="flex gap-2 flex-wrap">
                        {editForm.referenceImages.map((url, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0">
                            <Image src={url} alt="" fill unoptimized className="object-cover" />
                            <button
                              type="button"
                              onClick={() => setEditForm((f) => ({ ...f, referenceImages: f.referenceImages.filter((_, idx) => idx !== i) }))}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center"
                            >
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {editForm.referenceImages.length < 5 && (
                          <button
                            type="button"
                            onClick={() => editPhotoRef.current?.click()}
                            className="w-16 h-16 rounded-lg border border-dashed border-border bg-surface-alt flex flex-col items-center justify-center gap-0.5 text-text-muted hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span className="text-[9px]">추가</span>
                          </button>
                        )}
                      </div>
                      <input
                        ref={editPhotoRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files) return;
                          const current = editForm.referenceImages;
                          for (let i = 0; i < files.length && current.length + i < 5; i++) {
                            const url = URL.createObjectURL(files[i]);
                            setEditForm((f) => ({ ...f, referenceImages: [...f.referenceImages, url] }));
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleSaveReservation}
                        className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white active:scale-[0.98] transition-transform"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                      >
                        취소
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">고객명</span>
                      <span className="text-sm font-semibold text-text">{selectedEvent.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">날짜</span>
                      <span className="text-sm font-medium text-text">{selectedEvent.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">시간</span>
                      <span className="text-sm font-medium text-text">{selectedEvent.startTime} – {selectedEvent.endTime}</span>
                    </div>
                    {selectedEvent.channel && (
                      <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">채널</span>
                        <span className="truncate max-w-[180px] text-sm font-medium text-text">{{ kakao: '카카오', naver: '네이버', phone: '전화', walk_in: '방문', instagram: '인스타그램' }[selectedEvent.channel] ?? selectedEvent.channel}</span>
                      </div>
                    )}
                    {selectedEvent.customerPhone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">연락처</span>
                        <span className="text-sm font-medium text-text">{selectedEvent.customerPhone}</span>
                      </div>
                    )}
                    {selectedEvent.type === 'reservation' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">상담 준비</span>
                        <ReservationReadinessBadge
                          booking={{ preConsultationCompletedAt: selectedEvent.preConsultationCompletedAt, consultationLinkSentAt: selectedEvent.consultationLinkSentAt, channel: selectedEvent.channel as BookingRequest['channel'] }}
                          size="sm"
                        />
                      </div>
                    )}
                    {selectedEvent.requestNote && (
                      <div className="mt-2 rounded-xl bg-surface-alt p-3">
                        <p className="text-xs text-text-secondary">{selectedEvent.requestNote}</p>
                      </div>
                    )}
                    {/* 예약금 표시 */}
                    {(() => {
                      const booking = allReservations.find((r) => r.id === selectedEvent.originalId);
                      const depositAmount = booking?.deposit ?? booking?.preConsultationData?.deposit;
                      if (!depositAmount || depositAmount <= 0) return null;
                      return (
                        <div className="flex justify-between">
                          <span className="text-sm text-text-secondary">예약금</span>
                          <span className="text-sm font-semibold text-primary">{formatPrice(depositAmount)}</span>
                        </div>
                      );
                    })()}
                    {selectedEvent.customerId && (() => {
                      // 주의사항은 기존 상담 이력이 있거나 사전 상담이 완료된 경우에만 표시
                      const customer = getCustomerById(selectedEvent.customerId!);
                      const booking = allReservations.find((r) => r.id === selectedEvent.originalId);
                      const hasConsultationHistory = (customer?.visitCount ?? 0) > 0 || !!booking?.preConsultationData;
                      if (!hasConsultationHistory) return null;

                      const pinnedTags = sortSafetyTags(getPinnedTags(selectedEvent.customerId!));
                      if (pinnedTags.length === 0) return null;
                      const dangerTags = pinnedTags.filter((tag) => {
                        const level = getSafetyTagMeta(tag).level;
                        return level === 'high' || level === 'medium';
                      });
                      const infoTags = pinnedTags.filter((tag) => {
                        const level = getSafetyTagMeta(tag).level;
                        return level === 'reference' || level === 'preferred';
                      });
                      return (
                        <>
                          {dangerTags.length > 0 && (
                            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
                              <div className="flex items-center gap-1 mb-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-red-600 flex-shrink-0">
                                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[10px] font-medium text-red-700">주의사항</span>
                                <span className="ml-auto text-[9px] bg-red-200 text-red-700 rounded-full px-1.5 py-0.5 font-semibold">{dangerTags.length}</span>
                              </div>
                              <div className="flex flex-col gap-2">
                                {dangerTags.map((tag) => {
                                  const meta = getSafetyTagMeta(tag);
                                  return (
                                    <div key={tag.id} className="rounded-xl border border-white/60 bg-white/60 px-3 py-2 flex">
                                      <div className="w-1 rounded-full flex-shrink-0 mr-2.5 bg-red-400" />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <CustomerTagChip tag={tag} size="sm" className="!bg-red-100 !text-red-700 !border-red-200" />
                                          <span className="text-[10px] font-semibold text-red-700">{meta.label}</span>
                                        </div>
                                        <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{meta.description}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {infoTags.length > 0 && (
                            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                              <div className="flex items-center gap-1 mb-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-amber-600 flex-shrink-0">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[10px] font-medium text-amber-700">참고사항</span>
                                <span className="ml-auto text-[9px] bg-amber-200 text-amber-700 rounded-full px-1.5 py-0.5 font-semibold">{infoTags.length}</span>
                              </div>
                              <div className="flex flex-col gap-2">
                                {infoTags.map((tag) => {
                                  const meta = getSafetyTagMeta(tag);
                                  return (
                                    <div key={tag.id} className="rounded-xl border border-white/60 bg-white/60 px-3 py-2 flex">
                                      <div className={cn("w-1 rounded-full flex-shrink-0 mr-2.5", {
                                        'bg-amber-400': meta.level === 'reference',
                                        'bg-emerald-400': meta.level === 'preferred',
                                      })} />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <CustomerTagChip tag={tag} size="sm" />
                                          <span className={cn("text-[10px] font-semibold", {
                                            'text-amber-700': meta.level === 'reference',
                                            'text-emerald-700': meta.level === 'preferred',
                                          })}>{meta.label}</span>
                                        </div>
                                        <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{meta.description}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {/* Stage 기반 액션 영역 */}
                    {(() => {
                      const booking = allReservations.find((r) => r.id === selectedEvent.originalId);
                      const matchedRecord = allConsultations.find(
                        (r) => r.consultation?.bookingId === selectedEvent.originalId,
                      );
                      const stage = booking ? getBookingStage(booking, matchedRecord) : 'just_registered';
                      const hasSheet = !!matchedRecord || !!booking?.preConsultationData;

                      const handleSheetClick = () => {
                        if (matchedRecord) {
                          router.push(`/consultation/treatment-sheet?consultationId=${matchedRecord.id}&customerId=${matchedRecord.customerId}`);
                        }
                        // preConsultationData 분기는 인라인 토글로 대체됨
                      };

                      return (
                        <>
                          {/* 영역 1: 고객 상세 + 시술 확인서 (Stage 1 제외) */}
                          {stage !== 'just_registered' && (
                            <div className="mt-2 flex flex-col gap-2">
                              {stage === 'in_treatment' && matchedRecord && !matchedRecord.finalizedAt && (
                                <button
                                  onClick={() => {
                                    const now = getNowInKoreaIso();
                                    updateRecord(matchedRecord.id, { finalizedAt: now });
                                    if (selectedEvent?.originalId) {
                                      updateReservation(selectedEvent.originalId, { status: 'completed' });
                                    }
                                    const customer = getCustomerById(matchedRecord.customerId);
                                    if (customer) {
                                      const newVisitCount = customer.visitCount + 1;
                                      const newTotalSpend = customer.totalSpend + matchedRecord.finalPrice;
                                      updateCustomer(matchedRecord.customerId, {
                                        visitCount: newVisitCount,
                                        totalSpend: newTotalSpend,
                                        averageSpend: Math.round(newTotalSpend / newVisitCount),
                                        lastVisitDate: getTodayInKorea(),
                                      });
                                    }
                                  }}
                                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-white hover:bg-primary-dark active:scale-[0.98] transition-all"
                                >
                                  결제 완료
                                </button>
                              )}
                              {stage === 'completed' && (
                                <div className="flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 py-2.5">
                                  <span className="text-xs font-semibold text-emerald-700">✓ 결제 완료됨</span>
                                </div>
                              )}
                              <div className="flex gap-2">
                                {selectedEvent.customerId && (
                                  <button
                                    onClick={() => router.push(`/customers/${selectedEvent.customerId}`)}
                                    className={cn(
                                      "rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 active:scale-[0.98] transition-all",
                                      hasSheet ? 'flex-1' : 'w-full',
                                    )}
                                  >
                                    고객 상세
                                  </button>
                                )}
                                {matchedRecord && (
                                  <button
                                    onClick={handleSheetClick}
                                    className="flex-1 rounded-xl border border-primary/30 bg-primary px-4 py-2.5 text-xs font-medium text-white hover:bg-primary/90 active:scale-[0.98] transition-all"
                                  >
                                    시술 확인서
                                  </button>
                                )}
                                {!matchedRecord && booking?.preConsultationData && (
                                  <button
                                    onClick={() => { closeSelectedEventSheet(); router.push(`/records/preconsult/${booking.id}`); }}
                                    className="flex-1 rounded-xl border border-primary/30 bg-primary px-4 py-2.5 text-xs font-medium text-white hover:bg-primary/90 active:scale-[0.98] transition-all"
                                  >
                                    사전 상담 보기
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 영역 3: 하단 CTA (Stage별) */}
                          {stage === 'just_registered' && (
                            <div className="mt-3 flex flex-col gap-2">
                              <button
                                onClick={() => booking && setLinkGenBooking(booking)}
                                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white active:scale-[0.98] transition-transform"
                              >
                                상담 링크 보내기
                              </button>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleEditModeEnter}
                                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={closeSelectedEventSheet}
                                  className="flex-1 rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                                >
                                  닫기
                                </button>
                              </div>
                              <button
                                onClick={handleDeleteRecord}
                                className="mt-2 w-full rounded-xl py-2.5 text-xs font-medium text-error hover:bg-error/10 transition-colors"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                          {stage === 'link_sent' && (
                            <div className="mt-3 flex flex-col gap-2">
                              <button
                                onClick={handleStartConsultation}
                                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white active:scale-[0.98] transition-transform"
                              >
                                상담 시작
                              </button>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => booking && setLinkGenBooking(booking)}
                                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                                >
                                  링크 재발송
                                </button>
                                <button
                                  onClick={handleEditModeEnter}
                                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                                >
                                  수정
                                </button>
                              </div>
                              <button
                                onClick={closeSelectedEventSheet}
                                className="w-full rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                              >
                                닫기
                              </button>
                            </div>
                          )}
                          {stage === 'pre_consult_done' && (
                            <div className="mt-3 flex flex-col gap-2">
                              <button
                                onClick={handleStartConsultation}
                                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white active:scale-[0.98] transition-transform"
                              >
                                상담 시작
                              </button>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleEditModeEnter}
                                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={closeSelectedEventSheet}
                                  className="flex-1 rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                                >
                                  닫기
                                </button>
                              </div>
                            </div>
                          )}
                          {stage === 'in_treatment' && (
                            <div className="mt-3 flex flex-col gap-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={handleQuickSale}
                                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                                >
                                  매출 등록
                                </button>
                                <button
                                  onClick={closeSelectedEventSheet}
                                  className="flex-1 rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                                >
                                  닫기
                                </button>
                              </div>
                            </div>
                          )}
                          {stage === 'completed' && (
                            <div className="mt-3 flex flex-col gap-2">
                              <button
                                onClick={() => {
                                  const recordId = matchedRecord?.id ?? selectedEvent.originalId;
                                  closeSelectedEventSheet();
                                  router.push(`/records/${recordId}`);
                                }}
                                className="w-full rounded-xl border border-primary bg-primary/5 px-4 py-3 text-sm font-semibold text-primary active:scale-[0.98] transition-transform"
                              >
                                공유카드 만들기
                              </button>
                              <button
                                onClick={closeSelectedEventSheet}
                                className="w-full rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                              >
                                닫기
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showAddReservationModal}
        onClose={() => { setShowAddReservationModal(false); setReservationPrefill(null); setReservationNaverMode(false); }}
        title={reservationNaverMode ? '네이버 예약 등록' : '예약 등록'}
      >
        <ReservationForm
          naverMode={reservationNaverMode}
          initialValues={reservationPrefill ? {
            date: selectedDate,
            time: reservationPrefill.time,
            designerId: reservationPrefill.designerId,
          } : { date: selectedDate }}
          onSubmit={(booking) => {
            handleAddReservation(booking);
            setShowAddReservationModal(false);
            setReservationPrefill(null);
            setReservationNaverMode(false);
          }}
          onCancel={() => { setShowAddReservationModal(false); setReservationPrefill(null); setReservationNaverMode(false); }}
        />
      </Modal>

      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="기록 삭제">
        <div className="p-5">
          <p className="text-sm text-text-secondary mb-4">이 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
            >
              취소
            </button>
            <button
              onClick={executeDelete}
              className="flex-1 rounded-lg bg-error/10 border border-error/30 py-2 text-xs font-semibold text-error hover:bg-error/20 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
