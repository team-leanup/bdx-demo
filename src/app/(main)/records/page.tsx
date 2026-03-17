'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import { FeatureDiscovery } from '@/components/onboarding/FeatureDiscovery';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, Input, Modal } from '@/components/ui';
import { ConsultationLinkContent } from '@/components/reservations/ConsultationLinkModal';
import { useRecordsStore } from '@/store/records-store';
import { useAuthStore } from '@/store/auth-store';
import { useReservationStore } from '@/store/reservation-store';
import { useAppStore } from '@/store/app-store';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { useCustomerStore } from '@/store/customer-store';
import { useT } from '@/lib/i18n';
import { formatPrice, getKoreanWeekStart, getTodayInKorea, toKoreanDateString, toKoreanTimeString } from '@/lib/format';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { DayReservationList } from '@/components/calendar/DayReservationList';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { DesignerDayGridCalendar } from '@/components/calendar/DesignerDayGridCalendar';
import { getSafetyTagMeta, sortSafetyTags } from '@/lib/tag-safety';
import { cn } from '@/lib/cn';
import type { TimeGridEvent } from '@/components/calendar/TimeGridCalendar';
import { DESIGN_SCOPE_LABEL } from '@/lib/labels';
import { useShopStore } from '@/store/shop-store';
import { useLocaleStore } from '@/store/locale-store';
import {
  MainTabBar,
  StatsCards,
  ViewModeToggle,
  ConsultationList,
  PeriodFilter,
  ConsultationPreviewModal,
} from '@/components/records';
import { TAG_PRESETS } from '@/data/tag-presets';
import { TagIconSvg } from '@/components/ui/TagIconSvg';
import type { BookingRequest } from '@/types/consultation';
import type { ConsultationRecord } from '@/types/consultation';

const READINESS_LEGEND = [
  { color: 'bg-amber-400', label: '상담 필요' },
  { color: 'bg-emerald-500', label: '상담 완료' },
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
    startOfWeek.setDate(todayDate.getDate() - todayDate.getDay());
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
  consultations: import('@/types/consultation').ConsultationRecord[],
): TimeGridEvent[] {
  const events: TimeGridEvent[] = [];

  for (const r of reservations) {
    const [h, m] = r.reservationTime.split(':').map(Number);
    const endH = Math.min(h + 1, 23);
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
      preConsultationCompletedAt: r.preConsultationCompletedAt,
    });
  }

  for (const c of consultations) {
    const date = c.createdAt.split('T')[0];
    const time = toKoreanTimeString(c.createdAt);
    const [h, m] = time.split(':').map(Number);
    const durationMin = c.estimatedMinutes || 60;
    const endTotal = h * 60 + m + durationMin;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    events.push({
      id: `con-${c.id}`,
      title: c.consultation.customerName || '이름 없음',
      date,
      startTime: time,
      endTime: `${String(Math.min(endH, 23)).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      type: 'consultation',
      status: 'done',
      designerId: c.designerId,
      originalId: c.id,
      designScope: c.consultation.designScope,
      bodyPart: c.consultation.bodyPart,
      finalPrice: c.finalPrice,
      expressions: c.consultation.expressions,
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
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [previewRecord, setPreviewRecord] = useState<ConsultationRecord | null>(null);
  const [linkGenBooking, setLinkGenBooking] = useState<BookingRequest | null>(null);

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [weekStartDate, setWeekStartDate] = useState(getMonday(getTodayStr()));
  const [selectedEvent, setSelectedEvent] = useState<TimeGridEvent | null>(null);
  const [customerFilterId, setCustomerFilterId] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', phone: '', startTime: '', requestNote: '', referenceImages: [] as string[], language: 'ko' as 'ko' | 'en' | 'zh' | 'ja', deposit: '' as string });
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const closeSelectedEventSheet = (): void => {
    setLinkGenBooking(null);
    setEditMode(false);
    setSelectedEvent(null);
  };

  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const getCustomerById = useCustomerStore((s) => s.getById);

  const designers = useShopStore((s) => s.designers);
  const shopName = useShopStore((s) => s.shop?.name);
  const role = useAuthStore((s) => s.role);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const allReservations = useReservationStore((s) => s.reservations);
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const removeReservation = useReservationStore((s) => s.removeReservation);
  const removeRecord = useRecordsStore((s) => s.removeRecord);
  const { shopSettings } = useAppStore();
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const allConsultations = useMemo(() => getAllRecords(), [getAllRecords]);

  const { calendarStartHour, calendarEndHour } = useMemo(() => {
    const openHours = shopSettings.businessHours
      .filter((bh) => bh.isOpen && bh.openTime && bh.closeTime)
      .map((bh) => ({
        open: parseInt(bh.openTime!.split(':')[0], 10),
        close: parseInt(bh.closeTime!.split(':')[0], 10),
      }));
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
    const todayDate = new Date(today);
    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - todayDate.getDay());
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

  const todayConsultations = useMemo(() => {
    const today = getTodayStr();
    return allConsultations.filter((c) => c.createdAt.split('T')[0] === today).length;
  }, [allConsultations]);

  const timeGridEvents = useMemo(
    () => toTimeGridEvents(allReservations, []),
    [allReservations],
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
    }
    closeSelectedEventSheet();
    router.push('/consultation');
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

    const targetEvent = timeGridEvents.find(
      (event) => event.type === 'reservation' && event.originalId === bookingId,
    );
    if (!targetEvent) return;

    setMainTab('reservations');
    setViewMode('day');
    setSelectedDate(targetEvent.date);
    setSelectedEvent(targetEvent);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('bookingId');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/records?${nextQuery}` : '/records', { scroll: false });
  }, [searchParams, timeGridEvents, router]);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <FeatureDiscovery
        featureId="records-views"
        icon="🗂️"
        title="기록 관리"
        description={"상담 관리와 상담 기록을\n탭으로 나누어 편리하게 관리하세요."}
      />

      <div className="px-4 md:px-0 pt-4">
        <h1 className="text-2xl font-bold text-text">{t('nav.records')}</h1>
      </div>

      <MainTabBar activeTab={mainTab} onTabChange={setMainTab} />

      {mainTab === 'reservations' && (
        <>
          <StatsCards
            primaryValue={weekStats.weekCount}
            primaryLabel="이번 주 상담"
            secondaryValue={weekStats.todayRemainingCount}
            secondaryLabel="오늘 남은 상담"
          />

          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          <div className="px-4 md:px-0">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-xs text-text-secondary">
              <span className="font-semibold text-text">상담 상태</span>
              {READINESS_LEGEND.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          {viewMode === 'day' && (
            <div className="flex flex-col gap-4 px-4 md:px-0">
              <Card className="p-3">
                <WeekCalendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  reservations={allReservations}
                />
              </Card>
              <DesignerDayGridCalendar
                date={selectedDate}
                events={timeGridEvents}
                designers={activeDesigners.map((d) => ({ id: d.id, name: d.name }))}
                startHour={calendarStartHour}
                endHour={calendarEndHour}
                onEventClick={handleEventClick}
                onEventMove={handleEventMove}
                role={role}
                activeDesignerId={activeDesignerId}
              />
            </div>
          )}

          {viewMode === 'month' && (
            <div className="flex flex-col gap-4 px-4 md:px-0">
              <Card className="p-4">
                <MonthCalendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  reservations={allReservations}
                />
              </Card>
              <DayReservationList date={selectedDate} reservations={dayReservations} />
            </div>
          )}
        </>
      )}

      {mainTab === 'consultations' && (
        <>
          <StatsCards
            primaryValue={allConsultations.length}
            primaryLabel="총 상담 기록"
            secondaryValue={`${todayConsultations}건`}
            secondaryLabel="오늘 상담"
          />

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
                    {getCustomerById(customerFilterId)?.name ?? customerFilterId} 상담 기록만 보고 있어요.
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
            onRecordPreview={(record) => setPreviewRecord(record)}
            emptyTitle={t('records.noResults')}
            emptyDescription={t('records.noResultsHint')}
          />

          {/* R-3: 미리보기 모달 */}
          <ConsultationPreviewModal
            record={previewRecord}
            onClose={() => setPreviewRecord(null)}
            onViewDetail={() => {
              if (previewRecord) router.push(`/records/${previewRecord.id}`);
            }}
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
                <h3 className="text-base font-bold text-text">
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
                        className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white active:scale-[0.98] transition-transform"
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
                          booking={{ preConsultationCompletedAt: selectedEvent.preConsultationCompletedAt }}
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
                                <span className="text-[10px] font-bold text-red-700">주의사항</span>
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
                                <span className="text-[10px] font-bold text-amber-700">참고사항</span>
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
                    {/* 고객 상세 + 시술 확인서 버튼 (가로 배치) */}
                    {(() => {
                      const booking = allReservations.find((r) => r.id === selectedEvent.originalId);
                      const matchedRecord = allConsultations.find(
                        (r) => r.consultation?.bookingId === selectedEvent.originalId
                          || (r.customerId === selectedEvent.customerId
                            && selectedEvent.date === r.createdAt?.slice(0, 10)),
                      );
                      const hasSheet = !!matchedRecord || !!booking?.preConsultationData;
                      const handleSheetClick = () => {
                        if (matchedRecord) {
                          router.push(`/consultation/treatment-sheet?consultationId=${matchedRecord.id}&customerId=${matchedRecord.customerId}`);
                        } else if (booking?.preConsultationData) {
                          hydrateConsultation({
                            ...booking.preConsultationData,
                            bookingId: booking.id,
                            customerName: booking.customerName,
                            customerPhone: booking.phone,
                            customerId: booking.customerId ?? booking.preConsultationData.customerId,
                            referenceImages: booking.preConsultationData.referenceImages ?? booking.referenceImageUrls ?? [],
                            entryPoint: 'staff',
                            currentStep: ConsultationStep.SUMMARY,
                          });
                          router.push('/consultation/summary');
                        }
                      };
                      return (
                        <div className="mt-2 flex gap-2">
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
                          {hasSheet && (
                            <button
                              onClick={handleSheetClick}
                              className="flex-1 rounded-xl border border-primary/30 bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                              </svg>
                              {matchedRecord ? '시술 확인서' : '사전 상담 내역'}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                    {(() => {
                      if (selectedEvent.type !== 'reservation') {
                        return null;
                      }

                      const booking = allReservations.find((reservation) => reservation.id === selectedEvent.originalId);
                      if (!booking) {
                        return null;
                      }

                      return (
                        <button
                          onClick={() => setLinkGenBooking(booking)}
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 active:scale-[0.98] transition-all"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          고객용 상담 링크
                        </button>
                      );
                    })()}
                    <div className="mt-3 flex gap-2">
                      {selectedEvent.status === 'completed' ? (
                        <span className="flex-1 rounded-xl bg-surface-alt px-4 py-3 text-sm font-bold text-text-muted text-center">
                          상담 완료
                        </span>
                      ) : (
                        <button
                          onClick={handleStartConsultation}
                          className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white active:scale-[0.98] transition-transform"
                        >
                          상담 시작
                        </button>
                      )}
                      <button
                        onClick={handleEditModeEnter}
                        className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                      >
                        수정
                      </button>
                      <button
                        onClick={closeSelectedEventSheet}
                        className="rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
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
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
