'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, Input, Modal } from '@/components/ui';
import { ConsultationLinkContent } from '@/components/reservations/ConsultationLinkModal';
import { PreConsultDetailView } from '@/components/consultation/PreConsultDetailView';
import type { PreConsultationData } from '@/types/pre-consultation';
import { PretreatmentAlertModal } from '@/components/alerts/PretreatmentAlertModal';
import type { CustomerTag } from '@/types/customer';
import { useRecordsStore } from '@/store/records-store';
import { useAuthStore } from '@/store/auth-store';
import { useReservationStore } from '@/store/reservation-store';
import { useAppStore } from '@/store/app-store';
import { useConsultationStore } from '@/store/consultation-store';
import { useFieldModeStore } from '@/store/field-mode-store';
import { ConsultationStep } from '@/types/consultation';
import type { RemovalPreference, LengthPreference, AddOnOption, WrappingPreference } from '@/types/pre-consultation';
import { asDesignCategory } from '@/lib/design-category-guard';
import { useCustomerStore } from '@/store/customer-store';
import { useT } from '@/lib/i18n';
import { formatPrice, getKoreanWeekStart, getTodayInKorea, toKoreanDateString, toKoreanTimeString, getNowInKoreaIso } from '@/lib/format';
import { isInPeriod, toTimeGridEvents } from '@/lib/date-utils';
import type { FilterPeriod } from '@/lib/date-utils';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { DayReservationList } from '@/components/calendar/DayReservationList';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { DesignerDayGridCalendar } from '@/components/calendar/DesignerDayGridCalendar';
import { getSafetyTagMeta, sortSafetyTags } from '@/lib/tag-safety';
import { getBookingStage } from '@/lib/booking-stage';
import { cn } from '@/lib/cn';
import type { TimeGridEvent } from '@/components/calendar/TimeGridCalendar';
import { resolveRecordCategoryLabelKo } from '@/lib/category-resolver';
import { useShopStore } from '@/store/shop-store';
import { useLocaleStore } from '@/store/locale-store';
import {
  MainTabBar,
  ConsultationList,
  PeriodFilter,
} from '@/components/records';
import { ReservationForm } from '@/components/home/ReservationForm';
import type { BookingChannel, BookingRequest, NailShape } from '@/types/consultation';
import type { ConsultationRecord } from '@/types/consultation';

const READINESS_LEGEND = [
  { color: 'bg-slate-300', label: '링크 미발송' },
  { color: 'bg-amber-400', label: '응답 대기' },
  { color: 'bg-emerald-500', label: '응답 완료' },
  { color: 'bg-blue-500', label: '시술 완료' },
] as const;

type MainTab = 'reservations' | 'consultations';
type ViewMode = 'day' | 'month';


export default function RecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [mainTab, setMainTab] = useState<MainTab>('reservations');
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [foreignFilterActive, setForeignFilterActive] = useState(false);
  // 디자이너 토글: 로그인 디자이너는 항상 표시, 나머지는 토글
  const [extraDesignerIds, setExtraDesignerIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [linkGenBooking, setLinkGenBooking] = useState<BookingRequest | null>(null);

  const [selectedDate, setSelectedDate] = useState(getTodayInKorea());
  const [weekStartDate, setWeekStartDate] = useState(getKoreanWeekStart(getTodayInKorea()));
  const [selectedEvent, setSelectedEvent] = useState<TimeGridEvent | null>(null);
  const [customerFilterId, setCustomerFilterId] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', phone: '', reservationDate: '', startTime: '', requestNote: '', referenceImages: [] as string[], language: 'ko' as 'ko' | 'en' | 'zh' | 'ja', deposit: '' as string });
  const editPhotoRef = useRef<HTMLInputElement>(null);
  const [showAddReservationModal, setShowAddReservationModal] = useState(false);
  const [reservationPrefill, setReservationPrefill] = useState<{ time?: string; designerId?: string; channel?: BookingChannel } | null>(null);
  const [reservationNaverMode, setReservationNaverMode] = useState(false);
  // 주의사항 자동 리마인드 모달 — 오늘 예약 바텀시트가 열릴 때 pinned 주의 태그가 있으면 자동 표시
  const [reminderCustomerName, setReminderCustomerName] = useState<string>('');
  const [reminderTags, setReminderTags] = useState<CustomerTag[]>([]);
  const [reminderOpen, setReminderOpen] = useState(false);
  const reminderShownForIdRef = useRef<string | null>(null);

  const closeSelectedEventSheet = (): void => {
    setLinkGenBooking(null);
    setEditMode(false);
    setSelectedEvent(null);
    reminderShownForIdRef.current = null;
  };

  useEffect(() => {
    if (!selectedEvent) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSelectedEventSheet(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const hydrateFromBooking = useFieldModeStore((s) => s.hydrateFromBooking);
  const startTreatment = useFieldModeStore((s) => s.startTreatment);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const getCustomerById = useCustomerStore((s) => s.getById);
  const customers = useCustomerStore((s) => s.customers);

  const designers = useShopStore((s) => s.designers);
  const shopName = useShopStore((s) => s.shop?.name);
  const role = useAuthStore((s) => s.role);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const allReservations = useReservationStore((s) => s.reservations);
  const hydrateReservations = useReservationStore((s) => s.hydrateFromDB);
  const addReservation = useReservationStore((s) => s.addReservation);
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const removeReservation = useReservationStore((s) => s.removeReservation);

  // 페이지 진입 시 booking_requests 최신 데이터 fetch — 사전상담 응답이 시간그리드에 표시되도록
  // 0529 이슈 #5: visibilitychange + focus + 30초 폴링으로 손님 confirm 직후 사장님 화면에 즉시 반영.
  useEffect(() => {
    void hydrateReservations();
    const poll = (): void => {
      if (document.visibilityState === 'visible') {
        void hydrateReservations();
      }
    };
    const interval = setInterval(poll, 30000);
    document.addEventListener('visibilitychange', poll);
    window.addEventListener('focus', poll);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', poll);
      window.removeEventListener('focus', poll);
    };
  }, [hydrateReservations]);
  const removeRecord = useRecordsStore((s) => s.removeRecord);
  const updateRecord = useRecordsStore((s) => s.updateRecord);
  const recordTreatmentCompletion = useCustomerStore((s) => s.recordTreatmentCompletion);
  const { shopSettings } = useAppStore();
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const allConsultations = useMemo(() => getAllRecords(), [getAllRecords]);

  // 예약 상세 바텀시트가 열릴 때 — 오늘 예약 + 진행 전 상태 + 주의/참고 태그 있음 → 리마인드 모달 자동 표시
  useEffect(() => {
    if (!selectedEvent) return;
    if (selectedEvent.type !== 'reservation') return;
    if (!selectedEvent.customerId) return;
    // 같은 예약을 edit/linkGen 모드 등으로 토글해도 중복 표시되지 않도록
    if (reminderShownForIdRef.current === selectedEvent.originalId) return;

    // 오늘 예약만
    const today = getTodayInKorea();
    if (toKoreanDateString(selectedEvent.date) !== today) return;

    // 이미 완료/취소된 예약은 리마인드 불필요
    const booking = allReservations.find((r) => r.id === selectedEvent.originalId);
    if (!booking) return;
    if (booking.status === 'completed' || booking.status === 'cancelled') return;

    // 위험/참고 태그가 있을 때만 표시 (단순 선호는 제외)
    const pinnedTags = sortSafetyTags(getPinnedTags(selectedEvent.customerId));
    const relevantTags = pinnedTags.filter((tag) => {
      const level = getSafetyTagMeta(tag).level;
      return level === 'high' || level === 'medium' || level === 'reference';
    });
    if (relevantTags.length === 0) return;

    reminderShownForIdRef.current = selectedEvent.originalId;
    setReminderCustomerName(selectedEvent.title);
    setReminderTags(relevantTags);
    setReminderOpen(true);
  }, [selectedEvent, allReservations, getPinnedTags]);

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

  // 표시할 디자이너: 로그인 디자이너(항상) + 토글 선택된 디자이너/미지정
  const visibleDesignerIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeDesignerId) ids.add(activeDesignerId);
    for (const id of extraDesignerIds) ids.add(id);
    return ids;
  }, [activeDesignerId, extraDesignerIds]);

  const filteredDesignerList = useMemo(() => {
    // 1인샵: '미지정' 컬럼 없이 원장 한 명만 표시 (담당 미지정 예약도 원장 컬럼에 합쳐 보여줌)
    if (activeDesigners.length === 1) {
      return [{ id: activeDesigners[0].id, name: activeDesigners[0].name }];
    }
    const list = activeDesigners
      .filter((d) => visibleDesignerIds.has(d.id))
      .map((d) => ({ id: d.id, name: d.name }));
    // 미지정 토글이 켜져있으면 미지정 컬럼 추가
    if (extraDesignerIds.has('__unassigned__')) {
      list.push({ id: '__unassigned__', name: '미지정' });
    }
    // 아무 토글도 없으면 (activeDesigner만) 전체 표시
    if (!activeDesignerId && extraDesignerIds.size === 0) {
      return [...activeDesigners.map((d) => ({ id: d.id, name: d.name })), { id: '__unassigned__', name: '미지정' }];
    }
    return list;
  }, [activeDesigners, visibleDesignerIds, extraDesignerIds, activeDesignerId]);

  // [MED] ?filter=foreign 활성 시 language !== 'ko' 예약만 노출
  const baseReservations = useMemo(
    () => foreignFilterActive ? allReservations.filter((r) => r.language && r.language !== 'ko') : allReservations,
    [allReservations, foreignFilterActive],
  );

  const dayReservations = useMemo(
    () =>
      baseReservations
        .filter((r) => r.reservationDate === selectedDate)
        .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime)),
    [baseReservations, selectedDate],
  );

  const weekStats = useMemo(() => {
    const today = getTodayInKorea();
    // N-12: KST 기준으로 날짜 파싱 (UTC 파싱 방지)
    const todayDate = new Date(`${today}T00:00:00+09:00`);
    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const thisWeek = allReservations.filter((r) => {
      // [MEDIUM] timezone-naive 방지: YYYY-MM-DD + KST 정오로 파싱
      const d = new Date(`${r.reservationDate}T12:00:00+09:00`);
      // [MEDIUM] 취소 건 제외 — '이번주 N건'에 취소가 포함되던 버그 수정
      return d >= weekStart && d <= weekEnd && r.status !== 'cancelled';
    });

    const now = new Date();
    const todayRemaining = allReservations.filter((r) => {
      if (r.reservationDate !== today) return false;
      if (r.status === 'completed' || r.status === 'cancelled') return false;
      if (!r.reservationTime || !r.reservationTime.includes(':')) return false;
      const [h, m] = r.reservationTime.split(':').map(Number);
      const dt = new Date(today);
      dt.setHours(h, m, 0, 0);
      return dt >= now;
    });

    // R-1: 다음 예약까지 남은 분 계산
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const upcomingToday = allReservations
      .filter((r) => {
        if (r.reservationDate !== today) return false;
        if (r.status === 'completed' || r.status === 'cancelled') return false;
        if (!r.reservationTime || !r.reservationTime.includes(':')) return false;
        const [h, m] = r.reservationTime.split(':').map(Number);
        return h * 60 + m > nowMinutes;
      })
      .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
    let nextReservationMinutes: number | null = null;
    if (upcomingToday.length > 0) {
      const [h, m] = upcomingToday[0].reservationTime.split(':').map(Number);
      nextReservationMinutes = h * 60 + m - nowMinutes;
    }

    // R-2: 이번주 취소 건수 (thisWeek에서 취소가 제외되었으므로 allReservations에서 별도 집계)
    const cancelCount = allReservations.filter((r) => {
      const d = new Date(`${r.reservationDate}T12:00:00+09:00`);
      return d >= weekStart && d <= weekEnd && r.status === 'cancelled';
    }).length;

    return { weekCount: thisWeek.length, todayRemainingCount: todayRemaining.length, nextReservationMinutes, cancelCount };
  }, [allReservations]);


  const timeGridEvents = useMemo(
    () => toTimeGridEvents(baseReservations, getCustomerById, {
      categoryPricing: shopSettings.categoryPricing,
      customCategories: shopSettings.customCategories,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseReservations, getCustomerById, customers, shopSettings.categoryPricing, shopSettings.customCategories],
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
        resolveRecordCategoryLabelKo(r.consultation, shopSettings).toLowerCase().includes(q);
      const matchPeriod = isInPeriod(r.createdAt, filter);
      return matchSearch && matchPeriod;
    });
  }, [sorted, search, filter, role, activeDesignerId, customerFilterId, shopSettings]);

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
        reservationDate: booking?.reservationDate ?? '',
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
      reservationDate: editForm.reservationDate,
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
      const validatedCategory = asDesignCategory(raw?.designCategory, shopSettings);
      hydrateFromBooking({
        bookingId: booking.id,
        customerName: booking.customerName,
        customerPhone: booking.phone,
        customerId: booking.customerId ?? booking.preConsultationData?.customerId ?? null,
        designerId: booking.designerId ?? booking.preConsultationData?.designerId ?? '',
        designCategory: validatedCategory,
        removalType: (raw?.removalPreference ?? 'none') as RemovalPreference,
        lengthType: (raw?.lengthPreference ?? 'keep') as LengthPreference,
        addOns: (raw?.addOns ?? []) as AddOnOption[],
        // 0531 — 정산 가격 정합성: 랩핑·커스텀파츠·사진가격·손톱모양도 함께 hydrate해야
        // 시술 시작 직후 정산 견적이 사전상담 견적과 일치한다.
        wrappingPreference: (raw?.wrappingPreference as WrappingPreference | undefined) ?? null,
        customPartSelections: (raw?.customPartSelections as Record<string, number> | undefined) ?? {},
        selectedPhotoPrice: (raw?.selectedPhotoPrice as number | undefined) ?? null,
        nailShape: (raw?.nailShape as NailShape | undefined) ?? null,
        selectedPhotoUrl: (raw?.selectedPhotoUrl as string | undefined) ?? null,
        selectedPhotoId: (raw?.selectedPhotoId as string | undefined) ?? null,
      });

      // 사전 상담 제출 완료 + 유효한 디자인 카테고리면 시술 화면 직행
      // (2026-04-20 R4: asDesignCategory로 유효성 검증)
      const hasPreConsult = !!booking.preConsultationCompletedAt && !!validatedCategory;
      if (hasPreConsult) {
        startTreatment();
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('field-mode:from-pre-consult', booking.id);
        }
        closeSelectedEventSheet();
        router.push('/field-mode/treatment');
        return;
      }
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
    // 0531 R2 — quick-sale 금액은 시술 총액을 입력하는 필드이므로 예약금을 별도 전달하지 않는다.
    //   (전달 시 totalSpend = 총액 + 예약금 으로 이중계상됨. 예약금 차감은 field-mode 정산 경로에서만 처리.)
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
      // 완료/진행 예약에 연결된 시술 기록이 있으면 함께 삭제
      // (removeRecord가 고객 방문/매출/이력 롤백까지 처리 — orphan 기록 방지)
      const matchedRecord = allConsultations.find(
        (r) => r.consultation?.bookingId === selectedEvent.originalId,
      );
      if (matchedRecord) removeRecord(matchedRecord.id);
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
      reservationDate: booking?.reservationDate ?? '',
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
      designCategory: newBooking.designCategory,
      customerId: newBooking.customerId,
    });
  };

  const periodLabels: Record<FilterPeriod, string> = {
    all: t('records.filterAll'),
    today: t('records.filterToday'),
    week: t('records.filterWeek'),
    month: t('records.filterMonth'),
  };

  // [MED] ?date= 쿼리파라미터로 진입 시 선택 날짜 설정 (사전상담 확정 후 리다이렉트 등)
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return;
    setSelectedDate(dateParam);
    // URL에서 date 파라미터 제거
    const params = new URLSearchParams(searchParams.toString());
    params.delete('date');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/records?${nextQuery}` : '/records', { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // [MED] ?filter=foreign: 예약 탭으로 전환 + language !== 'ko' 외국인 예약만 표시
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam !== 'foreign') {
      setForeignFilterActive(false);
      return;
    }
    setMainTab('reservations');
    setViewMode('day');
    setForeignFilterActive(true);
    // URL에서 filter 파라미터 제거
    const params = new URLSearchParams(searchParams.toString());
    params.delete('filter');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/records?${nextQuery}` : '/records', { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (!bookingId) return;

    // N-17: timeGridEvents 대신 전체 예약에서 검색 (오늘 날짜 외 예약도 딥링크 가능)
    const targetReservation = allReservations.find((r) => r.id === bookingId);
    if (!targetReservation) return;

    // 사전상담 완료된 예약이면 state 변경 없이 즉시 전용 페이지로 이동 (바텀시트 깜빡임 방지)
    if (targetReservation.preConsultationCompletedAt) {
      router.replace(`/records/preconsult/${targetReservation.id}`);
      return;
    }

    const targetEvent = timeGridEvents.find(
      (event) => event.type === 'reservation' && event.originalId === bookingId,
    );

    setMainTab('reservations');
    setViewMode('day');
    setSelectedDate(targetReservation.reservationDate);
    if (targetEvent) {
      setSelectedEvent(targetEvent);
    } else {
      // [MED] endTime 공백 방지 — duration 기반으로 계산, 없으면 1시간 기본값
      const _dlTime = targetReservation.reservationTime;
      let _dlEndTime = '';
      if (_dlTime && _dlTime.includes(':')) {
        const [_dlH, _dlM] = _dlTime.split(':').map(Number);
        if (!isNaN(_dlH) && !isNaN(_dlM)) {
          const durationMins = (targetReservation as BookingRequest & { duration?: number }).duration ?? 60;
          const totalMins = _dlH * 60 + _dlM + durationMins;
          const endHours = Math.min(Math.floor(totalMins / 60), 23);
          const endMins = totalMins % 60;
          _dlEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        }
      }
      setSelectedEvent({
        id: `res-${targetReservation.id}`,
        originalId: targetReservation.id,
        type: 'reservation',
        title: targetReservation.customerName,
        date: targetReservation.reservationDate,
        startTime: targetReservation.reservationTime,
        endTime: _dlEndTime,
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

      {foreignFilterActive && (
        <div className="mx-4 md:mx-0 flex items-center justify-between gap-2 rounded-xl bg-primary/10 px-4 py-2.5">
          <span className="text-xs font-medium text-primary">외국인 예약만 표시 중 ({baseReservations.length}건)</span>
          <button
            onClick={() => setForeignFilterActive(false)}
            className="text-xs text-primary underline underline-offset-2"
          >
            전체 보기
          </button>
        </div>
      )}

      {mainTab === 'reservations' && (
        <>
          <div className="flex flex-col gap-1.5 px-4 md:flex-row md:items-center md:justify-between md:gap-2 md:px-0">
            <div className="flex items-center gap-3 text-xs text-text-secondary overflow-x-auto">
              {READINESS_LEGEND.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1 whitespace-nowrap">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${item.color}`} />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
            <span className="text-xs text-text-secondary tabular-nums flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
              <span className="whitespace-nowrap">이번주 {weekStats.weekCount}건 · 오늘 남은 {weekStats.todayRemainingCount}건</span>
              {weekStats.nextReservationMinutes !== null && (
                <span className="text-primary font-medium whitespace-nowrap">
                  · 다음 예약{' '}
                  {weekStats.nextReservationMinutes >= 60
                    ? `${Math.floor(weekStats.nextReservationMinutes / 60)}시간 후`
                    : `${weekStats.nextReservationMinutes}분 후`}
                </span>
              )}
              {weekStats.cancelCount > 0 && (
                <span className="text-error font-medium">· 취소 {weekStats.cancelCount}건</span>
              )}
            </span>
          </div>

          {/* 디자이너 토글 — 로그인 디자이너 제외, 나머지 다중 선택. 1인샵은 함께보기 불필요 → 숨김 */}
          {activeDesigners.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto px-4 md:px-0 pb-0.5">
            <span className="text-[11px] font-medium text-text-muted flex-shrink-0 whitespace-nowrap">함께 보기</span>
            {[...activeDesigners.filter((d) => d.id !== activeDesignerId), { id: '__unassigned__', name: '미지정', isActive: true }].map((d) => {
              const isOn = extraDesignerIds.has(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setExtraDesignerIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(d.id)) next.delete(d.id); else next.add(d.id);
                      return next;
                    });
                  }}
                  className="flex items-center gap-1.5 flex-shrink-0"
                >
                  <div className={cn(
                    'w-8 h-[18px] rounded-full transition-colors relative',
                    isOn ? 'bg-primary' : 'bg-border',
                  )}>
                    <div className={cn(
                      'absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform',
                      isOn ? 'translate-x-[16px]' : 'translate-x-[2px]',
                    )} />
                  </div>
                  <span className={cn('text-[11px] font-medium', isOn ? 'text-primary' : 'text-text-secondary')}>{d.name}</span>
                </button>
              );
            })}
          </div>
          )}

          {viewMode === 'day' && (
            <div className="flex flex-col gap-2 px-4 md:px-0">
              <Card className="p-3">
                <WeekCalendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  reservations={allReservations}
                  onToggleMonthView={() => setViewMode('month')}
                />
              </Card>
              <DesignerDayGridCalendar
                date={selectedDate}
                events={(activeDesigners.length === 1
                  // 1인샵: 담당 미지정 예약을 원장 컬럼으로 정규화 (미지정 컬럼 없이 한 컬럼에 표시)
                  ? timeGridEvents.map((e) => ({ ...e, designerId: e.designerId ?? activeDesigners[0].id }))
                  : timeGridEvents
                ).filter((e) =>
                  visibleDesignerIds.size === 0 || visibleDesignerIds.has(e.designerId ?? '__unassigned__')
                )}
                designers={filteredDesignerList}
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
                onToggleMonthView={() => setViewMode('month')}
                role={role}
                activeDesignerId={activeDesignerId}
              />
            </div>
          )}

          {viewMode === 'month' && (
            <div className="flex flex-col gap-2 px-4 md:px-0">
              {/* 0601: 일간 뷰 전환 버튼을 캘린더 헤더(이전/다음 달 화살표) 위에 겹치지 않게
                  별도 행으로 분리 — absolute top-2 right-2 가 다음 달 버튼과 포개지던 버그 수정. */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewMode('day')}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary hover:text-primary hover:border-primary/40 transition-colors min-h-[44px]"
                  aria-label="일간 타임그리드 보기"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  일간 보기
                </button>
              </div>
              <Card className="p-4">
                <MonthCalendar
                  selectedDate={selectedDate}
                  onSelectDate={(date) => setSelectedDate(date)}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="record-sheet-title"
            >
              <div className="mb-4 flex flex-shrink-0 items-center justify-between px-5">
                <h3 id="record-sheet-title" className="text-base font-semibold text-text">
                  {linkGenBooking
                    ? '상담 링크 생성'
                    : editMode
                      ? '예약 수정'
                      : (selectedEvent.type === 'reservation' ? '예약 상세' : '기록 상세')}
                </h3>
                <button
                  onClick={linkGenBooking ? () => setLinkGenBooking(null) : closeSelectedEventSheet}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-alt text-text-muted"
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
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text-secondary">예약 날짜</label>
                        <input
                          type="date"
                          value={editForm.reservationDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, reservationDate: e.target.value }))}
                          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                      {selectedEvent.startTime && selectedEvent.startTime.includes(':') ? (
                        <span className="text-sm font-medium text-text">
                          {selectedEvent.startTime}
                          {selectedEvent.endTime ? ` – ${selectedEvent.endTime}` : ''}
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-medium text-text-muted">시간 미정</span>
                      )}
                    </div>
                    {selectedEvent.channel && (
                      <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">채널</span>
                        <span className="truncate max-w-[180px] text-sm font-medium text-text">{{ kakao: '카카오', naver: '네이버', phone: '전화', walk_in: '방문', instagram: '인스타그램', pre_consult: '사전 상담', consultation_link: '상담 링크', manual: '직접 등록' }[selectedEvent.channel] ?? selectedEvent.channel}</span>
                      </div>
                    )}
                    {selectedEvent.customerPhone && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">연락처</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text">{selectedEvent.customerPhone}</span>
                          <a
                            href={`tel:${selectedEvent.customerPhone}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all"
                            title="전화걸기"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                            </svg>
                          </a>
                        </div>
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
                    {/* 사전상담 인라인 뷰 — preConsultationCompletedAt 있을 때만 */}
                    {selectedEvent.preConsultationCompletedAt && (() => {
                      const booking = allReservations.find((r) => r.id === selectedEvent.originalId);
                      const preConsultData = booking?.preConsultationData as unknown as PreConsultationData | undefined;
                      if (!preConsultData) return null;
                      return (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-text-secondary">사전 상담 내용</span>
                            <button
                              type="button"
                              onClick={() => { closeSelectedEventSheet(); router.push(`/records/preconsult/${booking!.id}`); }}
                              className="ml-auto text-[11px] font-semibold text-primary hover:underline"
                            >
                              전체 보기 →
                            </button>
                          </div>
                          <PreConsultDetailView
                            data={preConsultData}
                            options={{
                              elevated: false,
                              customParts: shopSettings.customParts,
                              customCategories: shopSettings.customCategories,
                              categoryLabels: shopSettings.categoryLabels,
                              customerLanguage: booking?.language,
                            }}
                          />
                        </div>
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
                          // 시술 확인서(/consultation/treatment-sheet) 대신 종합 상담 상세 페이지로 이동
                          closeSelectedEventSheet();
                          router.push(`/records/${matchedRecord.id}`);
                        }
                      };

                      return (
                        <>
                          {/* 영역 1: 고객 상세 + 시술 확인서 (Stage 1, cancelled 제외) */}
                          {stage !== 'just_registered' && stage !== 'cancelled' && (
                            <div className="mt-2 flex flex-col gap-2">
                              {stage === 'in_treatment' && matchedRecord && !matchedRecord.finalizedAt && (
                                <button
                                  onClick={() => {
                                    if (matchedRecord.finalizedAt) return;
                                    const now = getNowInKoreaIso();
                                    updateRecord(matchedRecord.id, { finalizedAt: now });
                                    if (selectedEvent?.originalId) {
                                      updateReservation(selectedEvent.originalId, { status: 'completed' });
                                    }
                                    if (matchedRecord.customerId) {
                                      // 0529: totalSpend는 회원권 차감분 포함 실제 시술 금액 기준 (field-mode·payment와 일관)
                                      // 0531: 예약금(deposit)도 포함 — records/[id] handleFinalize와 통일
                                      const totalServicePrice = matchedRecord.finalPrice + (matchedRecord.membershipApplied ?? 0) + (matchedRecord.deposit ?? 0);
                                      recordTreatmentCompletion(matchedRecord.customerId, totalServicePrice, {
                                        recordId: matchedRecord.id,
                                        date: getTodayInKorea(),
                                        bodyPart: matchedRecord.consultation?.bodyPart ?? 'hand',
                                        // 0531: designScope 손실 매핑 방지 — designCategory 우선 라벨 사용
                                        designScope: matchedRecord.consultation ? resolveRecordCategoryLabelKo(matchedRecord.consultation, shopSettings) : '기타',
                                        price: totalServicePrice,
                                        imageUrls: [],
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
                                  <span className="text-xs font-semibold text-emerald-700">✓ 시술 완료</span>
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
                                    시술 상세
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
                            </div>
                          )}
                          {stage === 'link_sent' && (
                            <div className="mt-3 flex flex-col gap-2">
                              <button
                                onClick={handleStartConsultation}
                                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white active:scale-[0.98] transition-transform"
                              >
                                시술 시작
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
                                시술 시작
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
                              {matchedRecord ? (
                                <button
                                  onClick={() => {
                                    closeSelectedEventSheet();
                                    // 상담 상세로 이동하면서 공유카드 생성 모달 자동 오픈 (?share=1)
                                    router.push(`/records/${matchedRecord.id}?share=1`);
                                  }}
                                  className="w-full rounded-xl border border-primary bg-primary/5 px-4 py-3 text-sm font-semibold text-primary active:scale-[0.98] transition-transform"
                                >
                                  공유카드 만들기
                                </button>
                              ) : (
                                // 0531 — 시술 기록이 삭제된 완료 예약: bookingId로 잘못 이동하던 404 방지
                                <p className="text-center text-xs text-text-muted py-2">시술 기록이 삭제되었습니다</p>
                              )}
                              <button
                                onClick={closeSelectedEventSheet}
                                className="w-full rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                              >
                                닫기
                              </button>
                            </div>
                          )}
                          {stage === 'cancelled' && (
                            <div className="mt-3 flex flex-col gap-2">
                              <button
                                onClick={closeSelectedEventSheet}
                                className="w-full rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
                              >
                                닫기
                              </button>
                            </div>
                          )}

                          {/* 일정 삭제 — 모든 단계에서 스케줄표에서 바로 삭제
                              (잘못 입력 시 삭제 후 재등록 / 완료 건은 시술 기록·매출까지 함께 정리) */}
                          <button
                            onClick={handleDeleteRecord}
                            className="mt-1 w-full rounded-xl py-2.5 text-xs font-medium text-error hover:bg-error/10 transition-colors min-h-[44px]"
                          >
                            {matchedRecord ? '시술 기록 삭제' : '일정 삭제'}
                          </button>
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

      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="일정 삭제">
        <div className="p-5">
          {(() => {
            const matchedRecord = selectedEvent
              ? allConsultations.find((r) => r.consultation?.bookingId === selectedEvent.originalId)
              : undefined;
            return (
              <p className="text-sm text-text-secondary mb-4">
                {matchedRecord?.finalizedAt
                  ? '이 일정의 시술·결제 기록을 삭제하면 고객의 방문 횟수와 누적 매출에서도 함께 제외돼요. 삭제 후에는 되돌릴 수 없어요.'
                  : '이 일정을 삭제하시겠습니까? 삭제된 일정은 복구할 수 없어요.'}
              </p>
            );
          })()}
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

      {/* 오늘 예약 주의사항 리마인드 모달 — 바텀시트 위에 자동 표시 */}
      <PretreatmentAlertModal
        isOpen={reminderOpen}
        onClose={() => setReminderOpen(false)}
        onConfirm={() => setReminderOpen(false)}
        customerName={reminderCustomerName}
        pinnedTags={reminderTags}
        title="오늘 예약 · 주의사항"
        description="시술 전 아래 주의사항을 다시 한 번 확인해 주세요."
        confirmLabel="확인했어요"
        cancelLabel="나중에"
      />
    </div>
  );
}
