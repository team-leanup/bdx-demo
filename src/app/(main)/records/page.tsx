'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import { FeatureDiscovery } from '@/components/onboarding/FeatureDiscovery';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, Input } from '@/components/ui';
import { useRecordsStore } from '@/store/records-store';
import { useAuthStore } from '@/store/auth-store';
import { useReservationStore } from '@/store/reservation-store';
import { useAppStore } from '@/store/app-store';
import { useConsultationStore } from '@/store/consultation-store';
import { useCustomerStore } from '@/store/customer-store';
import { useT } from '@/lib/i18n';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { DayReservationList } from '@/components/calendar/DayReservationList';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { DesignerDayGridCalendar } from '@/components/calendar/DesignerDayGridCalendar';
import { getSafetyTagMeta, sortSafetyTags } from '@/lib/tag-safety';
import type { TimeGridEvent } from '@/components/calendar/TimeGridCalendar';
import { DESIGN_SCOPE_LABEL } from '@/lib/labels';
import { useShopStore } from '@/store/shop-store';
import {
  MainTabBar,
  StatsCards,
  ViewModeToggle,
  ConsultationList,
  PeriodFilter,
  ConsultationPreviewModal,
} from '@/components/records';
import { TAG_PRESETS } from '@/data/tag-presets';
import type { ConsultationRecord } from '@/types/consultation';

type MainTab = 'reservations' | 'consultations';
type ViewMode = 'day' | 'month';
type FilterPeriod = 'all' | 'today' | 'week' | 'month';
type ReservationFilter = 'all' | 'mine';

function isInPeriod(dateStr: string, period: FilterPeriod): boolean {
  const now = new Date();
  const d = new Date(dateStr);
  if (period === 'all') return true;
  if (period === 'today') return d.toDateString() === now.toDateString();
  if (period === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  }
  if (period === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  return true;
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
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
    const time = c.createdAt.split('T')[1]?.substring(0, 5) || '10:00';
    const [h, m] = time.split(':').map(Number);
    const durationMin = c.estimatedMinutes || 60;
    const endTotal = h * 60 + m + durationMin;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    events.push({
      id: `con-${c.id}`,
      title: c.consultation.customerName || 'Unknown',
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
  const [reservationFilter, setReservationFilter] = useState<ReservationFilter>('all');
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [weekStartDate, setWeekStartDate] = useState(getMonday(getTodayStr()));
  const [selectedEvent, setSelectedEvent] = useState<TimeGridEvent | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', phone: '', startTime: '', requestNote: '', referenceImages: [] as string[], language: 'ko' as 'ko' | 'en' | 'zh' | 'ja' });
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);

  const designers = useShopStore((s) => s.designers);
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

  const filteredReservations = useMemo(() => {
    if (reservationFilter === 'mine' && activeDesignerId) {
      return allReservations.filter((r) => r.designerId === activeDesignerId);
    }
    return allReservations;
  }, [allReservations, reservationFilter, activeDesignerId]);

  const dayReservations = useMemo(
    () =>
      filteredReservations
        .filter((r) => r.reservationDate === selectedDate)
        .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime)),
    [filteredReservations, selectedDate],
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

    const thisWeek = filteredReservations.filter((r) => {
      const d = new Date(r.reservationDate);
      return d >= weekStart && d <= weekEnd;
    });

    const now = new Date();
    const todayRemaining = filteredReservations.filter((r) => {
      if (r.reservationDate !== today) return false;
      if (r.status === 'completed' || r.status === 'cancelled') return false;
      const [h, m] = r.reservationTime.split(':').map(Number);
      const dt = new Date(today);
      dt.setHours(h, m, 0, 0);
      return dt >= now;
    });

    return { weekCount: thisWeek.length, todayRemainingCount: todayRemaining.length };
  }, [filteredReservations]);

  const todayConsultations = useMemo(() => {
    const today = getTodayStr();
    return allConsultations.filter((c) => c.createdAt.split('T')[0] === today).length;
  }, [allConsultations]);

  const timeGridEvents = useMemo(
    () => toTimeGridEvents(filteredReservations, []),
    [filteredReservations],
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
  }, [sorted, search, filter, tagFilter, role, activeDesignerId, getPinnedTags]);

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
      });
    }
  };

  const handleSaveReservation = () => {
    if (!selectedEvent) return;
    updateReservation(selectedEvent.originalId, {
      customerName: editForm.title,
      phone: editForm.phone,
      reservationTime: editForm.startTime,
      requestNote: editForm.requestNote,
      referenceImageUrls: editForm.referenceImages.length > 0 ? editForm.referenceImages : undefined,
      language: editForm.language,
    });
    setSelectedEvent(null);
    setEditMode(false);
  };

  const handleStartConsultation = () => {
    if (!selectedEvent) return;
    const booking = allReservations.find((reservation) => reservation.id === selectedEvent.originalId);
    if (booking) {
      hydrateConsultation({
        ...booking.preConsultationData,
        bookingId: booking.id,
        customerName: booking.customerName,
        customerPhone: booking.phone,
        customerId: booking.customerId ?? booking.preConsultationData?.customerId,
        referenceImages: booking.preConsultationData?.referenceImages ?? booking.referenceImageUrls ?? [],
        entryPoint: 'staff',
      });
    }
    const params = new URLSearchParams();
    if (selectedEvent.title) params.set('name', selectedEvent.title);
    if (selectedEvent.customerPhone) params.set('phone', selectedEvent.customerPhone);
    if (selectedEvent.requestNote) params.set('note', selectedEvent.requestNote);
    if (selectedEvent.language) params.set('lang', selectedEvent.language);
    setSelectedEvent(null);
    router.push(`/consultation/customer?${params.toString()}`);
  };

  const handleDeleteRecord = () => {
    if (!selectedEvent) return;
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      if (selectedEvent.type === 'reservation') {
        removeReservation(selectedEvent.originalId);
      } else {
        removeRecord(selectedEvent.originalId);
      }
      setSelectedEvent(null);
    }
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

  return (
    <div className="flex flex-col gap-4 pb-6">
      <FeatureDiscovery
        featureId="records-views"
        icon="🗂️"
        title="기록 관리"
        description={"예약 관리와 상담 기록을\n탭으로 나누어 편리하게 관리하세요."}
      />

      <div className="px-4 md:px-0 pt-4">
        <h1 className="text-2xl font-bold text-text">{t('nav.records')}</h1>
      </div>

      <MainTabBar activeTab={mainTab} onTabChange={setMainTab} />

      {mainTab === 'reservations' && (
        <>
          <StatsCards
            primaryValue={weekStats.weekCount}
            primaryLabel="이번 주 예약"
            secondaryValue={weekStats.todayRemainingCount}
            secondaryLabel="오늘 남은 예약"
          />

          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            reservationFilter={reservationFilter}
            onReservationFilterChange={setReservationFilter}
          />

          {viewMode === 'day' && (
            <div className="flex flex-col gap-4 px-4 md:px-0">
              <Card className="p-3">
                <WeekCalendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  reservations={filteredReservations}
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
                  reservations={filteredReservations}
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
          </div>

          {/* R-5: 태그 필터 칩 */}
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
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                tagFilter === '외국인'
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-alt'
              }`}
            >
              🌏 외국인
            </button>
            {TAG_PRESETS.find((p) => p.category === 'etc')?.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTagFilter(tagFilter === opt.value ? null : opt.value)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tagFilter === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-text-secondary hover:bg-surface-alt'
                }`}
              >
                {opt.icon} {opt.value}
              </button>
            ))}
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
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background px-5 pb-8 pt-5 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-lg md:rounded-2xl md:max-h-[85vh] md:overflow-y-auto"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-text">
                  {editMode ? '예약 수정' : (selectedEvent.type === 'reservation' ? '예약 상세' : '상담 상세')}
                </h3>
                <button
                  onClick={() => { setSelectedEvent(null); setEditMode(false); }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-text-muted"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {editMode ? (
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
                        <span className="text-sm font-medium text-text">{selectedEvent.channel}</span>
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
                    {selectedEvent.customerId && (() => {
                      const pinnedTags = sortSafetyTags(getPinnedTags(selectedEvent.customerId!));
                      if (pinnedTags.length === 0) return null;
                      return (
                        <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
                          <p className="text-[10px] font-bold text-red-700 mb-1.5">주의 / 특이사항</p>
                          <div className="flex flex-col gap-2">
                            {pinnedTags.map((tag) => {
                              const safety = getSafetyTagMeta(tag);

                              return (
                                <div key={tag.id} className="rounded-xl border border-white/60 bg-white/60 px-3 py-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-sm leading-none">{safety.icon}</span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <CustomerTagChip tag={tag} size="sm" />
                                        <span className="text-[10px] font-semibold text-red-700">{safety.label}</span>
                                      </div>
                                      <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{safety.description}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    {selectedEvent.customerId && (
                      <button
                        onClick={() => router.push(`/customers/${selectedEvent.customerId}`)}
                        className="mt-2 w-full rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        고객 상세 보기
                      </button>
                    )}
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
                        onClick={() => setSelectedEvent(null)}
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
    </div>
  );
}
