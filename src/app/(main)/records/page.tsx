'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FeatureDiscovery } from '@/components/onboarding/FeatureDiscovery';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, Badge, Input, BentoGrid, BentoCard } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { DESIGN_SCOPE_LABEL, BODY_PART_LABEL, EXPRESSION_LABEL, getDesignerName } from '@/lib/labels';
import { useRecordsStore } from '@/store/records-store';
import { MOCK_CONSULTATIONS } from '@/data/mock-consultations';
import { useAuthStore } from '@/store/auth-store';
import { useReservationStore } from '@/store/reservation-store';
import { useAppStore } from '@/store/app-store';
import { useT } from '@/lib/i18n';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { DayReservationList } from '@/components/calendar/DayReservationList';
import { TimeGridCalendar } from '@/components/calendar/TimeGridCalendar';
import type { TimeGridEvent } from '@/components/calendar/TimeGridCalendar';

type MainTab = 'reservations' | 'consultations';
type ViewMode = 'timegrid' | 'month';
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

const FILTER_KEYS: { key: FilterPeriod; i18nKey: string }[] = [
  { key: 'all', i18nKey: 'records.filterAll' },
  { key: 'today', i18nKey: 'records.filterToday' },
  { key: 'week', i18nKey: 'records.filterWeek' },
  { key: 'month', i18nKey: 'records.filterMonth' },
];

export default function RecordsPage() {
  const router = useRouter();
  const t = useT();
  const [mainTab, setMainTab] = useState<MainTab>('reservations');
  const [viewMode, setViewMode] = useState<ViewMode>('timegrid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [reservationFilter, setReservationFilter] = useState<ReservationFilter>('all');
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [weekStartDate, setWeekStartDate] = useState(getMonday(getTodayStr()));
  const [selectedEvent, setSelectedEvent] = useState<TimeGridEvent | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', phone: '', startTime: '', requestNote: '', referenceImages: [] as string[] });
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const role = useAuthStore((s) => s.role);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const allReservations = useReservationStore((s) => s.reservations);
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const removeReservation = useReservationStore((s) => s.removeReservation);
  const removeRecord = useRecordsStore((s) => s.removeRecord);
  const { shopSettings } = useAppStore();
  const additionalRecords = useRecordsStore((s) => s.additionalRecords);
  const allConsultations = useMemo(
    () => [...additionalRecords, ...MOCK_CONSULTATIONS],
    [additionalRecords],
  );

  // Derive calendar hours from business hours
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
      return matchSearch && matchPeriod;
    });
  }, [sorted, search, filter, role, activeDesignerId]);

  const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
    { key: 'timegrid', label: '주간' },
    { key: 'month', label: '월간' },
  ];

  return (
    <div className="flex flex-col gap-4 pb-6">
      <FeatureDiscovery
        featureId="records-views"
        icon="🗂️"
        title="기록 관리"
        description={"예약 관리와 상담 기록을\n탭으로 나누어 편리하게 관리하세요."}
      />
      {/* Header */}
      <div className="px-4 md:px-0 pt-4">
        <h1 className="text-2xl font-bold text-text">{t('nav.records')}</h1>
      </div>

      {/* Main Tab UI */}
      <div className="px-4 md:px-0">
        <div className="flex border-b border-border">
          <button
            onClick={() => setMainTab('reservations')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold text-center transition-colors relative',
              mainTab === 'reservations' ? 'text-primary' : 'text-text-secondary hover:text-text',
            )}
          >
            예약 관리
            {mainTab === 'reservations' && (
              <motion.div layoutId="mainTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setMainTab('consultations')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold text-center transition-colors relative',
              mainTab === 'consultations' ? 'text-primary' : 'text-text-secondary hover:text-text',
            )}
          >
            상담 기록
            {mainTab === 'consultations' && (
              <motion.div layoutId="mainTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* ════════ 예약 관리 탭 ════════ */}
      {mainTab === 'reservations' && (
        <>
          {/* Stats — 2 cols */}
          <BentoGrid cols={2} className="px-4 md:px-0">
            <BentoCard span="1x1" variant="accent">
              <div className="p-4 flex flex-col items-center justify-center h-full">
                <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {weekStats.weekCount}
                </span>
                <span className="text-xs text-text-secondary mt-1">이번 주 예약</span>
              </div>
            </BentoCard>
            <BentoCard span="1x1">
              <div className="p-4 flex flex-col items-center justify-center h-full">
                <span className="text-2xl font-extrabold text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {weekStats.todayRemainingCount}
                </span>
                <span className="text-xs text-text-secondary mt-1">오늘 남은 예약</span>
              </div>
            </BentoCard>
          </BentoGrid>

          {/* View toggle + reservation filter */}
          <div className="flex items-center justify-between px-4 md:px-0">
            <div className="flex gap-0.5 p-1 rounded-full bg-surface-alt border border-border">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setViewMode(opt.key)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                    viewMode === opt.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 p-1 rounded-full bg-surface-alt border border-border">
              <button
                onClick={() => setReservationFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  reservationFilter === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text',
                )}
              >
                전체
              </button>
              <button
                onClick={() => setReservationFilter('mine')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  reservationFilter === 'mine'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text',
                )}
              >
                내 예약
              </button>
            </div>
          </div>

          {/* Timegrid View */}
          {viewMode === 'timegrid' && (
            <div className="px-4 md:px-0">
              <TimeGridCalendar
                events={timeGridEvents}
                weekStartDate={weekStartDate}
                onWeekChange={setWeekStartDate}
                startHour={calendarStartHour}
                endHour={calendarEndHour}
                onEventClick={(ev) => {
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
                    });
                  }
                }}
              />
            </div>
          )}

          {/* Month View */}
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

      {/* ════════ 상담 기록 탭 ════════ */}
      {mainTab === 'consultations' && (
        <>
          {/* Stats — 2 cols */}
          <BentoGrid cols={2} className="px-4 md:px-0">
            <BentoCard span="1x1" variant="accent">
              <div className="p-4 flex flex-col items-center justify-center h-full">
                <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {allConsultations.length}
                </span>
                <span className="text-xs text-text-secondary mt-1">총 상담 기록</span>
              </div>
            </BentoCard>
            <BentoCard span="1x1">
              <div className="p-4 flex flex-col items-center justify-center h-full">
                <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {todayConsultations}건
                </span>
                <span className="text-xs text-text-secondary mt-1">오늘 상담</span>
              </div>
            </BentoCard>
          </BentoGrid>

          {/* Search */}
          <div className="px-4 md:px-0">
            <Input
              placeholder={t('records.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Period filter */}
          <div className="flex gap-2 overflow-x-auto px-4 md:px-0 pb-1">
            {FILTER_KEYS.map(({ key, i18nKey }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                  filter === key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface border border-border text-text-secondary',
                )}
              >
                {t(i18nKey)}
              </button>
            ))}
          </div>

          {/* Consultation list */}
          <div className="rounded-xl border border-border overflow-hidden mx-4 md:mx-0">
            {listFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-surface">
                <svg className="mb-3 h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-base font-medium text-text-secondary">{t('records.noResults')}</p>
                <p className="mt-1 text-sm text-text-muted">{t('records.noResultsHint')}</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border bg-surface">
                {listFiltered.map((record) => {
                  const c = record.consultation;
                  const timeStr = record.createdAt.split('T')[1]?.substring(0, 5) ?? '';
                  return (
                    <button
                      key={record.id}
                      onClick={() => router.push(`/records/${record.id}`)}
                      className="flex flex-col gap-1.5 px-4 py-3 text-left hover:bg-surface-alt active:bg-surface-alt transition-colors"
                    >
                      {/* 1행: 시간 + 고객명 + 디자이너 + 금액 */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold bg-primary/10 text-primary shrink-0">상담</span>
                        <span className="text-xs font-semibold text-primary shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
                        <span className="text-sm font-semibold text-text truncate">{c.customerName}</span>
                        <span className="text-xs text-text-muted shrink-0">· {getDesignerName(record.designerId)}</span>
                        <span className="ml-auto text-sm font-bold text-primary shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPrice(record.finalPrice)}
                        </span>
                      </div>
                      {/* 2행: 시술 부위 + 디자인 + 기법 태그 */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                          {BODY_PART_LABEL[c.bodyPart] ?? c.bodyPart}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          {DESIGN_SCOPE_LABEL[c.designScope] ?? c.designScope}
                        </span>
                        {c.expressions.map((exp) => (
                          <span key={exp} className="inline-flex items-center rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] text-text-muted">
                            {EXPRESSION_LABEL[exp] ?? exp}
                          </span>
                        ))}
                        {c.hasParts && c.partsSelections.length > 0 && (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                            파츠 {c.partsSelections.reduce((sum, p) => sum + p.quantity, 0)}개
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 예약 상세 모달 ── */}
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
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background px-5 pb-8 pt-5"
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
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">연락처</label>
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="010-0000-0000"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">시작 시간</label>
                      <input
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">메모</label>
                      <textarea
                        value={editForm.requestNote}
                        onChange={(e) => setEditForm((f) => ({ ...f, requestNote: e.target.value }))}
                        rows={2}
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        placeholder="요청사항이나 메모를 입력하세요"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary">참고 이미지</label>
                      <div className="flex gap-2 flex-wrap">
                        {editForm.referenceImages.map((url, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0">
                            <img src={url} alt="" className="w-full h-full object-cover" />
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
                        onClick={() => {
                          updateReservation(selectedEvent.originalId, {
                            customerName: editForm.title,
                            phone: editForm.phone,
                            reservationTime: editForm.startTime,
                            requestNote: editForm.requestNote,
                            referenceImageUrls: editForm.referenceImages.length > 0 ? editForm.referenceImages : undefined,
                          });
                          setSelectedEvent(null);
                          setEditMode(false);
                        }}
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
                    {selectedEvent.requestNote && (
                      <div className="mt-2 rounded-xl bg-surface-alt p-3">
                        <p className="text-xs text-text-secondary">{selectedEvent.requestNote}</p>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (selectedEvent.title) params.set('name', selectedEvent.title);
                          if (selectedEvent.customerPhone) params.set('phone', selectedEvent.customerPhone);
                          if (selectedEvent.requestNote) params.set('note', selectedEvent.requestNote);
                          if (selectedEvent.language) params.set('lang', selectedEvent.language);
                          setSelectedEvent(null);
                          router.push(`/consultation/customer?${params.toString()}`);
                        }}
                        className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white active:scale-[0.98] transition-transform"
                      >
                        상담 시작
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(true);
                          const booking = allReservations.find((r) => r.id === selectedEvent.originalId);
                          setEditForm({
                            title: selectedEvent.title,
                            phone: selectedEvent.customerPhone ?? '',
                            startTime: selectedEvent.startTime,
                            requestNote: selectedEvent.requestNote ?? '',
                            referenceImages: booking?.referenceImageUrls ?? [],
                          });
                        }}
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
                      onClick={() => {
                        if (confirm('이 기록을 삭제하시겠습니까?')) {
                          if (selectedEvent.type === 'reservation') {
                            removeReservation(selectedEvent.originalId);
                          } else {
                            removeRecord(selectedEvent.originalId);
                          }
                          setSelectedEvent(null);
                        }
                      }}
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
