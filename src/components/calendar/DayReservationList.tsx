'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useReservationStore } from '@/store/reservation-store';
import { useConsultationStore } from '@/store/consultation-store';
import { useFieldModeStore } from '@/store/field-mode-store';
import { useCustomerStore } from '@/store/customer-store';
import { useRecordsStore } from '@/store/records-store';
import { getBookingStage } from '@/lib/booking-stage';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui';
import { PretreatmentAlertModal } from '@/components/alerts/PretreatmentAlertModal';
import { LinkCustomerModal } from '@/components/reservations/LinkCustomerModal';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import type { BookingChannel, BookingStatus, BookingRequest, NailShape } from '@/types/consultation';
import type { RemovalPreference, LengthPreference, AddOnOption, WrappingPreference } from '@/types/pre-consultation';
import { asDesignCategory } from '@/lib/design-category-guard';
import { ConsultationStep } from '@/types/consultation';
import type { CustomerTag } from '@/types/customer';
import type { Locale } from '@/store/locale-store';
import { cn } from '@/lib/cn';
import { KOREA_TIME_ZONE, parseKoreanDateString } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { useLocaleStore } from '@/store/locale-store';
import { useShopStore } from '@/store/shop-store';
import { useAppStore } from '@/store/app-store';

const CHANNEL_BADGE_STYLE: Record<BookingChannel, { className: string; emoji: string }> = {
  kakao: { className: 'bg-surface-alt text-text-secondary border-transparent', emoji: '💬' },
  naver: { className: 'bg-surface-alt text-text-secondary border-transparent', emoji: '🟢' },
  phone: { className: 'bg-surface-alt text-text-secondary border-transparent', emoji: '📞' },
  walk_in: { className: 'bg-surface-alt text-text-secondary border-transparent', emoji: '🚶' },
  pre_consult: { className: 'bg-primary/10 text-primary border-transparent', emoji: '📋' },
};

const CHANNEL_I18N_KEY: Record<BookingChannel, string> = {
  kakao: 'channel.kakao',
  naver: 'channel.naver',
  phone: 'channel.phone',
  walk_in: 'channel.walkIn',
  pre_consult: 'channel.preConsult',
};

const STATUS_BADGE_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-surface-alt text-text-secondary border-transparent',
  confirmed: 'bg-surface-alt text-text-secondary border-transparent',
  completed: 'bg-surface-alt text-text-muted border-transparent',
  cancelled: 'bg-error/10 text-error border-transparent',
};

const STATUS_I18N_KEY: Record<BookingStatus, string> = {
  pending: 'calendar.statusPending',
  confirmed: 'calendar.statusConfirmed',
  completed: 'calendar.statusCompleted',
  cancelled: 'calendar.statusCancelled',
};

const LANGUAGE_FLAG: Record<string, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  zh: '🇨🇳',
  ja: '🇯🇵',
};

const CHANNEL_VALUES: BookingChannel[] = ['kakao', 'naver', 'phone', 'walk_in'];

const LANGUAGE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

// Timeline dot colors by status
const STATUS_DOT: Record<BookingStatus, string> = {
  pending: 'bg-warning',
  confirmed: 'bg-success',
  completed: 'bg-text-muted',
  cancelled: 'bg-error',
};

interface DayReservationListProps {
  date: string;
  reservations: BookingRequest[];
}

function AddReservationForm({ date, onDone }: { date: string; onDone: () => void }) {
  const t = useT();
  const addReservation = useReservationStore((s) => s.addReservation);
  const designers = useShopStore((s) => s.designers);
  const customers = useCustomerStore((s) => s.customers);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('');
  const [channel, setChannel] = useState<BookingChannel>('kakao');
  const [note, setNote] = useState('');
  const [language, setLanguage] = useState<Locale>('ko');
  const [designerId, setDesignerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCustomers = customerSearch.trim()
    ? customers.filter((c) => {
        const q = customerSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(customerSearch);
      }).slice(0, 5)
    : [];

  const handleSelectCustomer = (customerId: string): void => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomerId(customerId);
      setName(customer.name);
      setPhone(customer.phone ?? '');
      setCustomerSearch(customer.name);
      setShowDropdown(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !time) return;
    addReservation({
      customerName: name.trim(),
      phone: phone.trim(),
      reservationDate: date,
      reservationTime: time,
      channel,
      requestNote: note.trim() || undefined,
      referenceImageUrls: [],
      language,
      designerId: designerId || undefined,
      customerId: selectedCustomerId,
    });
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-3 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5"
    >
      <p className="text-xs font-bold text-primary">{t('calendar.addFormTitle')}</p>

      {/* 고객 검색 */}
      <div className="relative">
        <input
          type="text"
          value={customerSearch}
          onChange={(e) => {
            setCustomerSearch(e.target.value);
            setShowDropdown(true);
            if (selectedCustomerId) {
              const c = customers.find((x) => x.id === selectedCustomerId);
              if (c && c.name !== e.target.value) setSelectedCustomerId(undefined);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="고객 검색 (선택)"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
        />
        {selectedCustomerId && (
          <span className="absolute right-3 top-2.5 text-[10px] text-success font-medium">연결됨</span>
        )}
        {showDropdown && filteredCustomers.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-surface shadow-lg max-h-40 overflow-y-auto">
            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCustomer(c.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-surface-alt transition-colors flex justify-between items-center"
              >
                <span className="font-medium text-text">{c.name}</span>
                <span className="text-xs text-text-muted">{c.phone}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('calendar.addFormNamePlaceholder')}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t('calendar.addFormPhonePlaceholder')}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text focus:outline-none focus:border-primary"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as BookingChannel)}
          className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text focus:outline-none focus:border-primary"
        >
          {CHANNEL_VALUES.map((ch) => (
            <option key={ch} value={ch}>{t(CHANNEL_I18N_KEY[ch])}</option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Locale)}
          className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text focus:outline-none focus:border-primary"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <select
        value={designerId}
        onChange={(e) => setDesignerId(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text focus:outline-none focus:border-primary"
      >
        <option value="">{t('calendar.addFormDesignerPlaceholder')}</option>
        {designers.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('calendar.addFormNotePlaceholder')}
        rows={2}
        className="w-full resize-none px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
        >
          {t('calendar.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || !time}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          {t('calendar.register')}
        </button>
      </div>
    </motion.div>
  );
}

export function DayReservationList({ date, reservations }: DayReservationListProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const getDesignerNameFromStore = useShopStore((s) => s.getDesignerName);
  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const hydrateFromBooking = useFieldModeStore((s) => s.hydrateFromBooking);
  const startTreatment = useFieldModeStore((s) => s.startTreatment);
  const shopSettings = useAppStore((s) => s.shopSettings);
  const records = useRecordsStore((s) => s.records);
  const removeRecord = useRecordsStore((s) => s.removeRecord);
  const removeReservation = useReservationStore((s) => s.removeReservation);
  const [showForm, setShowForm] = useState(false);
  const [alertBooking, setAlertBooking] = useState<BookingRequest | null>(null);
  const [alertTags, setAlertTags] = useState<CustomerTag[]>([]);
  const [linkModalBooking, setLinkModalBooking] = useState<BookingRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookingRequest | null>(null);

  // 삭제 대상에 연결된 시술 기록 (완료 건이면 매출·통계 롤백 안내용)
  const deleteTargetRecord = deleteTarget
    ? records.find((r) => r.consultation?.bookingId === deleteTarget.id)
    : undefined;

  const handleConfirmDelete = (): void => {
    if (!deleteTarget) return;
    // 연결된 시술 기록 먼저 삭제 (removeRecord가 고객 방문/매출/이력 롤백 처리)
    const matched = records.find((r) => r.consultation?.bookingId === deleteTarget.id);
    if (matched) removeRecord(matched.id);
    removeReservation(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleAlertQuickSale = (): void => {
    if (alertBooking) {
      const params = new URLSearchParams();
      params.set('bookingId', alertBooking.id);
      if (alertBooking.customerId) params.set('customerId', alertBooking.customerId);
      params.set('customerName', alertBooking.customerName);
      router.push(`/quick-sale?${params.toString()}`);
    }
    setAlertBooking(null);
    setAlertTags([]);
  };

  const localeMap: Record<string, string> = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
  const formatDate = (dateStr: string) => {
    const d = parseKoreanDateString(dateStr);
    return new Intl.DateTimeFormat(localeMap[locale] || 'ko-KR', {
      timeZone: KOREA_TIME_ZONE,
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(d);
  };

  const navigateToConsultation = (booking: BookingRequest): void => {
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
      designCategory: asDesignCategory(raw?.designCategory, shopSettings),
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

    // [HIGH] pre_consult_done: 사전상담 완료 + 유효 카테고리면 field-mode 처음부터 재시작하지 않고 바로 시술 화면으로
    const validatedCategory = asDesignCategory(raw?.designCategory, shopSettings);
    const hasPreConsult = !!booking.preConsultationCompletedAt && !!validatedCategory;
    if (hasPreConsult) {
      startTreatment();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('field-mode:from-pre-consult', booking.id);
      }
      router.push('/field-mode/treatment');
      return;
    }

    router.push('/field-mode');
  };

  const handleStartConsultation = (booking: BookingRequest): void => {
    if (booking.customerId) {
      const pinnedTags = getPinnedTags(booking.customerId);
      if (pinnedTags.length > 0) {
        setAlertBooking(booking);
        setAlertTags(pinnedTags);
        return;
      }
    }
    navigateToConsultation(booking);
  };

  const handleAlertConfirm = (): void => {
    if (alertBooking) {
      navigateToConsultation(alertBooking);
    }
    setAlertBooking(null);
    setAlertTags([]);
  };

  const handleAlertClose = (): void => {
    setAlertBooking(null);
    setAlertTags([]);
  };

  const getDesignerName = (id?: string) => {
    if (!id) return null;
    const name = getDesignerNameFromStore(id);
    return name || null;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text">{formatDate(date)}</h3>
        <span className="text-xs text-text-muted">{t('calendar.reservationCount').replace('{count}', String(reservations.length))}</span>
      </div>

      {/* Reservation list */}
      {reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-border bg-surface-alt">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-text-muted mb-2">
            <rect x="4" y="7" width="24" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 13h24" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 4v6M21 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 19h12M10 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-text-muted">{t('calendar.noReservation')}</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <AnimatePresence>
            {reservations.map((booking, idx) => {
              const channelStyle = CHANNEL_BADGE_STYLE[booking.channel];
              const statusStyle = STATUS_BADGE_STYLE[booking.status];
              const dotColor = STATUS_DOT[booking.status];
              const isLast = idx === reservations.length - 1;
              // 0529 버그D: 완료 예약은 '상담시작'(현장모드) 대신 '상담 내용 보기'로 분기
              const matchedRecord = records.find((r) => r.consultation?.bookingId === booking.id);
              const stage = getBookingStage(booking, matchedRecord);

              return (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-3"
                >
                  {/* Timeline */}
                  <div className="flex flex-col items-center flex-shrink-0 w-5 pt-3">
                    <div className={cn('w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white', dotColor)} />
                    {!isLast && <div className="w-0.5 flex-1 bg-border mt-1 mb-1" />}
                  </div>

                  {/* Card */}
                  <div className={cn('flex-1 mb-2', isLast ? 'mb-0' : '')}>
                    <div className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-surface">
                      {/* Time — 0601: 유효 시간(HH:MM)만 강조 표시. 빈 값·'미정' 등
                          미스케줄 사전상담은 데이터처럼 안 보이게 muted '미정' 라벨로. */}
                      <div className="text-center flex-shrink-0 w-12">
                        {booking.reservationTime && booking.reservationTime.includes(':') ? (
                          <p className="text-sm font-bold text-primary">{booking.reservationTime}</p>
                        ) : (
                          <p className="text-xs font-medium text-text-muted">미정</p>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Name row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-text">{booking.customerName}</span>
                          {booking.language && booking.language !== 'ko' && (
                            <span className="text-sm leading-none">{LANGUAGE_FLAG[booking.language]}</span>
                          )}
                        </div>

                        {/* Badge row */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5',
                              channelStyle.className,
                            )}
                          >
                            <span>{channelStyle.emoji}</span>
                            <span>{t(CHANNEL_I18N_KEY[booking.channel])}</span>
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
                              statusStyle,
                            )}
                          >
                            {t(STATUS_I18N_KEY[booking.status])}
                          </span>
                          <ReservationReadinessBadge booking={booking} size="sm" compact />
                          {booking.designerId && getDesignerName(booking.designerId) && (
                            <span className="text-[10px] font-medium text-text-muted">
                              {getDesignerName(booking.designerId)}{t('common.designerSuffix')}
                            </span>
                          )}
                        </div>

                        {booking.requestNote && (
                          <p className="text-xs text-text-muted truncate mt-1">{booking.requestNote}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 self-center">
                        {stage === 'completed' && matchedRecord ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(`/records/${matchedRecord.id}`)}
                          >
                            상담 내용 보기
                          </Button>
                        ) : stage === 'cancelled' ? null : (
                          <Button
                            size="sm"
                            onClick={() => handleStartConsultation(booking)}
                          >
                            {t('calendar.startConsultation')}
                          </Button>
                        )}
                        {/* 일정 삭제 — 스케줄표에서 바로 삭제 (잘못 입력 시 삭제 후 재등록) */}
                        <button
                          type="button"
                          aria-label="일정 삭제"
                          onClick={() => setDeleteTarget(booking)}
                          className="flex h-11 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.16-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.04-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add reservation */}
      <AnimatePresence>
        {showForm ? (
          <AddReservationForm date={date} onDone={() => setShowForm(false)} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-dashed border-border bg-surface-alt text-sm font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {t('calendar.addReservation')}
          </button>
        )}
      </AnimatePresence>

      <PretreatmentAlertModal
        isOpen={alertBooking !== null}
        onClose={handleAlertClose}
        onConfirm={handleAlertConfirm}
        onQuickSale={handleAlertQuickSale}
        customerName={alertBooking?.customerName ?? ''}
        pinnedTags={alertTags}
      />

      <LinkCustomerModal
        isOpen={linkModalBooking !== null}
        onClose={() => setLinkModalBooking(null)}
        reservationId={linkModalBooking?.id ?? ''}
        reservationName={linkModalBooking?.customerName ?? ''}
        reservationPhone={linkModalBooking?.phone}
        reservationLanguage={linkModalBooking?.language}
        reservationDesignerId={linkModalBooking?.designerId}
      />

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="일정 삭제">
        <div className="p-5">
          <p className="text-sm text-text-secondary mb-4">
            {deleteTargetRecord?.finalizedAt
              ? '이 일정의 시술·결제 기록을 삭제하면 고객의 방문 횟수와 누적 매출에서도 함께 제외돼요. 삭제 후에는 되돌릴 수 없어요.'
              : '이 일정을 삭제하시겠습니까? 삭제된 일정은 복구할 수 없어요.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-colors min-h-[44px]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 rounded-xl bg-error py-2.5 text-sm font-bold text-white min-h-[44px]"
            >
              삭제
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
