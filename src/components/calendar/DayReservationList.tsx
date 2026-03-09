'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useReservationStore } from '@/store/reservation-store';
import { useConsultationStore } from '@/store/consultation-store';
import { useCustomerStore } from '@/store/customer-store';
import { Button } from '@/components/ui/Button';
import { PretreatmentAlertModal } from '@/components/alerts/PretreatmentAlertModal';
import { LinkCustomerModal } from '@/components/reservations/LinkCustomerModal';
import { ConsultationLinkModal } from '@/components/reservations/ConsultationLinkModal';
import type { BookingChannel, BookingStatus, BookingRequest } from '@/types/consultation';
import type { CustomerTag } from '@/types/customer';
import type { Locale } from '@/store/locale-store';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import { useLocaleStore } from '@/store/locale-store';
import { useShopStore } from '@/store/shop-store';

const CHANNEL_BADGE_STYLE: Record<BookingChannel, { className: string; emoji: string }> = {
  kakao: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', emoji: '💬' },
  naver: { className: 'bg-green-100 text-green-800 border-green-200', emoji: '🟢' },
  phone: { className: 'bg-blue-100 text-blue-800 border-blue-200', emoji: '📞' },
  walk_in: { className: 'bg-surface-alt text-text-secondary border-border', emoji: '🚶' },
};

const CHANNEL_I18N_KEY: Record<BookingChannel, string> = {
  kakao: 'channel.kakao',
  naver: 'channel.naver',
  phone: 'channel.phone',
  walk_in: 'channel.walkIn',
};

const STATUS_BADGE_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-success/10 text-success border-success/20',
  completed: 'bg-surface-alt text-text-secondary border-border',
  cancelled: 'bg-error/10 text-error border-error/20',
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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('');
  const [channel, setChannel] = useState<BookingChannel>('kakao');
  const [note, setNote] = useState('');
  const [language, setLanguage] = useState<Locale>('ko');
  const [designerId, setDesignerId] = useState('');

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
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const setBookingId = useConsultationStore((s) => s.setBookingId);
  const getDesignerNameFromStore = useShopStore((s) => s.getDesignerName);
  const [showForm, setShowForm] = useState(false);
  const [alertBooking, setAlertBooking] = useState<BookingRequest | null>(null);
  const [alertTags, setAlertTags] = useState<CustomerTag[]>([]);
  const [linkModalBooking, setLinkModalBooking] = useState<BookingRequest | null>(null);
  const [linkGenBooking, setLinkGenBooking] = useState<BookingRequest | null>(null);

  const localeMap: Record<string, string> = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(localeMap[locale] || 'ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  const navigateToConsultation = (booking: BookingRequest): void => {
    setBookingId(booking.id);
    const params = new URLSearchParams();
    params.set('bookingId', booking.id);
    if (booking.customerName) params.set('name', booking.customerName);
    if (booking.phone) params.set('phone', booking.phone);
    if (booking.requestNote) params.set('note', booking.requestNote);
    if (booking.language) params.set('lang', booking.language);
    router.push(`/consultation/customer?${params.toString()}`);
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
                      {/* Time */}
                      <div className="text-center flex-shrink-0 w-12">
                        <p className="text-sm font-bold text-primary">{booking.reservationTime}</p>
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
                          {booking.designerId && getDesignerName(booking.designerId) && (
                            <span className="text-[10px] font-medium text-text-muted">
                              {getDesignerName(booking.designerId)}{t('common.designerSuffix')}
                            </span>
                          )}
                        </div>

                        {booking.requestNote && (
                          <p className="text-xs text-text-muted truncate mt-1">{booking.requestNote}</p>
                        )}
                        {!booking.customerId && (
                          <button
                            onClick={() => setLinkModalBooking(booking)}
                            className="text-[10px] text-warning font-medium hover:underline mt-1"
                          >
                            고객 연결 필요
                          </button>
                        )}
                      </div>

                      <div className="flex gap-1.5 flex-shrink-0 self-center">
                        <button
                          onClick={() => setLinkGenBooking(booking)}
                          className="rounded-lg bg-surface-alt border border-border px-2.5 py-2 text-xs font-semibold text-text-secondary hover:bg-border active:scale-95 transition-all"
                          title={t('calendar.consultationLink')}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                        <Button
                          size="sm"
                          onClick={() => handleStartConsultation(booking)}
                        >
                          {t('calendar.startConsultation')}
                        </Button>
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
        customerName={alertBooking?.customerName ?? ''}
        pinnedTags={alertTags}
      />

      <LinkCustomerModal
        isOpen={linkModalBooking !== null}
        onClose={() => setLinkModalBooking(null)}
        reservationId={linkModalBooking?.id ?? ''}
        reservationName={linkModalBooking?.customerName ?? ''}
        reservationPhone={linkModalBooking?.phone}
      />

      <ConsultationLinkModal
        isOpen={linkGenBooking !== null}
        onClose={() => setLinkGenBooking(null)}
        booking={linkGenBooking}
      />
    </div>
  );
}
