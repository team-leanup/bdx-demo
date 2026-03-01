'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TourOverlay } from '@/components/onboarding/TourOverlay';
import { Badge } from '@/components/ui';
import { formatPrice, formatRelativeDate } from '@/lib/format';
import { BODY_PART_LABEL, DESIGN_SCOPE_LABEL } from '@/lib/labels';
import { MOCK_CONSULTATIONS } from '@/data/mock-consultations';
import { MOCK_SHOP } from '@/data/mock-shop';
import { useAppStore } from '@/store/app-store';
import { useReservationStore } from '@/store/reservation-store';
import { useConsultationStore } from '@/store/consultation-store';
import type { BookingChannel, BookingRequest } from '@/types/consultation';
import { ReservationForm } from '@/components/home/ReservationForm';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/store/auth-store';
import {
  IconScissors,
  IconWon,
  IconCalendar,
  IconSparkle,
  IconUsers,
  IconChart,
  IconGear,
  IconNote,
} from '@/components/icons';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};


export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [showTour, setShowTour] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const { shopSettings } = useAppStore();
  const { activeDesignerName, role } = useAuthStore();

  const CHANNEL_BADGE: Record<BookingChannel, { label: string; icon: string; variant: 'primary' | 'neutral' | 'success' | 'warning' }> = {
    kakao: { label: t('home.channel_kakao'), icon: '💬', variant: 'warning' },
    naver: { label: t('home.channel_naver'), icon: '🟢', variant: 'success' },
    phone: { label: t('home.channel_phone'), icon: '📞', variant: 'neutral' },
    walk_in: { label: t('home.channel_walk_in'), icon: '🚶', variant: 'primary' },
  };

  useEffect(() => {
    if (searchParams.get('tour') === 'true') {
      const timer = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  const shopName = shopSettings.shopName || MOCK_SHOP.name;

  const today = getTodayStr();
  const todayConsultations = MOCK_CONSULTATIONS.filter(
    (r) => r.createdAt.startsWith(today),
  );
  const todayRevenue = todayConsultations.reduce((sum, r) => sum + r.finalPrice, 0);

  const thisMonth = today.slice(0, 7);
  const monthConsultations = MOCK_CONSULTATIONS.filter((r) =>
    r.createdAt.startsWith(thisMonth),
  );

  const recentConsultations = [...MOCK_CONSULTATIONS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const reservationStore = useReservationStore();
  const todayReservations = reservationStore.getToday();
  const addReferenceImage = useConsultationStore((s) => s.addReferenceImage);

  const handleAddReservation = (newBooking: BookingRequest) => {
    reservationStore.addReservation({
      customerName: newBooking.customerName,
      phone: newBooking.phone,
      reservationDate: newBooking.reservationDate,
      reservationTime: newBooking.reservationTime,
      channel: newBooking.channel,
      requestNote: newBooking.requestNote,
      referenceImageUrls: newBooking.referenceImageUrls,
      language: newBooking.language,
    });
  };

  const handleStartConsultation = (booking: BookingRequest) => {
    const params = new URLSearchParams();
    if (booking.customerName) params.set('name', booking.customerName);
    if (booking.phone) params.set('phone', booking.phone);
    if (booking.requestNote) params.set('note', booking.requestNote);
    if (booking.language) params.set('lang', booking.language);
    if (booking.referenceImageUrls?.length) {
      booking.referenceImageUrls.forEach(url => addReferenceImage(url));
    }
    router.push(`/consultation/customer?${params.toString()}`);
  };

  const [todayDateStr, setTodayDateStr] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setTodayDateStr(new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }));
    const hour = new Date().getHours();
    setGreeting(hour < 12
      ? t('home.greeting_morning')
      : hour < 18
      ? t('home.greeting_afternoon')
      : t('home.greeting_evening'));
  }, [t]);

  const quickActions = [
    { label: t('home.quickAction_customers'), icon: IconUsers, href: '/customers' },
    { label: t('home.quickAction_schedule'), icon: IconCalendar, href: '/records' },
    { label: t('home.quickAction_dashboard'), icon: IconChart, href: '/dashboard' },
    { label: t('home.quickAction_settings'), icon: IconGear, href: '/settings' },
  ];

  return (
    <motion.div
      className="flex flex-col gap-4 px-4 pb-8 pt-5 md:px-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── 인사 섹션 ── */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-secondary">{shopName}</p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-text">
            {activeDesignerName ? `${activeDesignerName}님, ` : ''}{greeting} <span className="text-primary">✦</span>
          </h1>
          <p className="mt-0.5 text-xs text-text-muted">
            {role === 'owner' ? '원장' : '선생님'} · {todayDateStr}
          </p>
        </div>
        {/* 알림 / 아바타 자리 */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <span className="text-sm font-bold text-primary">
            {activeDesignerName?.slice(0, 1) ?? shopName.slice(0, 1)}
          </span>
        </div>
      </motion.div>

      {/* Tour Overlay */}
      <TourOverlay active={showTour} onComplete={() => {
        setShowTour(false);
        router.replace('/home', { scroll: false });
      }} />

      {/* ── 히어로 CTA — 2 equal buttons ── */}
      <motion.div data-tour-id="tour-new-consultation" variants={itemVariants} className="grid grid-cols-2 gap-3">
        {/* 새 상담 시작 */}
        <motion.button
          onClick={() => router.push('/consultation')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark px-4 py-5 text-left shadow-[var(--shadow-bento-hero)] active:scale-[0.98]"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <IconSparkle className="h-5 w-5 text-white" />
          </div>
          <p className="text-xs font-semibold text-white/70 tracking-wide">{t('home.cta_consultation')}</p>
          <h2 className="mt-0.5 text-base font-extrabold text-white leading-tight">{t('home.cta_newConsultation')}</h2>
        </motion.button>

        {/* 새 예약 등록 */}
        <motion.button
          onClick={() => setShowReservationModal(true)}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark px-4 py-5 text-left shadow-[var(--shadow-bento-hero)] active:scale-[0.98]"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <IconCalendar className="h-5 w-5 text-white" />
          </div>
          <p className="text-xs font-semibold text-white/70 tracking-wide">{t('home.cta_reservation')}</p>
          <h2 className="mt-0.5 text-base font-extrabold text-white leading-tight">{t('home.cta_newReservation')}</h2>
        </motion.button>
      </motion.div>

      {/* ── 예약 등록 모달 ── */}
      <AnimatePresence>
        {showReservationModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setShowReservationModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background px-4 pb-8 pt-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-text">{t('home.modal_title')}</h3>
                <button
                  onClick={() => setShowReservationModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-text-muted"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ReservationForm
                initialOpen={true}
                onSubmit={(newBooking) => {
                  handleAddReservation(newBooking);
                  setShowReservationModal(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 오늘의 예약 ── */}
      <motion.div variants={itemVariants} className="rounded-2xl bg-surface-elevated border border-border shadow-[var(--shadow-bento)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text">{t('home.section_todayReservation')}</span>
            {todayReservations.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                {todayReservations.length}
              </span>
            )}
          </div>
          <button
            onClick={() => router.push('/reservations')}
            className="text-xs font-semibold text-primary active:opacity-60"
          >
            {t('home.section_viewAll')}
          </button>
        </div>

        {/* 예약 리스트 or 빈 상태 */}
        {todayReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-alt">
              <IconCalendar className="h-6 w-6 text-text-muted" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-text-secondary">{t('home.section_noReservation')}</p>
              <p className="mt-0.5 text-xs text-text-muted">{t('home.section_noReservationSub')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {todayReservations.map((booking, idx) => {
              const channelInfo = CHANNEL_BADGE[booking.channel];
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.3 }}
                  onClick={() => handleStartConsultation(booking)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-alt active:bg-surface-alt transition-colors"
                >
                  {/* 시간 라벨 */}
                  <div className="flex w-11 shrink-0 flex-col items-center">
                    <span className="text-xs font-bold text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {booking.reservationTime}
                    </span>
                    <div className="mt-1 h-1 w-1 rounded-full bg-primary/40" />
                  </div>
                  {/* 세로 구분선 */}
                  <div className="h-10 w-px shrink-0 bg-border" />
                  {/* 고객 정보 */}
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-text truncate">
                        {booking.customerName}
                      </span>
                      <Badge variant={channelInfo.variant} size="sm">
                        {channelInfo.icon} {channelInfo.label}
                      </Badge>
                    </div>
                    {booking.requestNote && (
                      <p className="text-xs text-text-muted line-clamp-2 whitespace-pre-line">{booking.requestNote.replace(/\.\s*/g, '.\n')}</p>
                    )}
                  </div>
                  {/* 상담 시작 버튼 */}
                  <button className="shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-primary/20 active:scale-95 transition-transform">
                    {t('home.section_startConsultation')}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── 최근 상담 기록 ── */}
      <motion.div data-tour-id="tour-recent" variants={itemVariants} className="rounded-2xl bg-surface-elevated border border-border shadow-[var(--shadow-bento)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text">{t('home.section_recentConsultation')}</span>
          </div>
          <button
            onClick={() => router.push('/records')}
            className="text-xs font-semibold text-primary active:opacity-60"
          >
            {t('home.section_viewAllShort')}
          </button>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {recentConsultations.map((record, idx) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.06, duration: 0.3 }}
              onClick={() => router.push(`/records/${record.id}`)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-alt active:bg-surface-alt transition-colors"
            >
              {/* 이니셜 아바타 */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <span className="text-sm font-bold text-primary">
                  {(record.consultation.customerName ?? '?').slice(0, 1)}
                </span>
              </div>
              {/* 이름 + 배지 */}
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-text">
                    {record.consultation.customerName ?? ''}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {BODY_PART_LABEL[record.consultation.bodyPart] ?? record.consultation.bodyPart}
                  </Badge>
                  <Badge variant="primary" size="sm">
                    {DESIGN_SCOPE_LABEL[record.consultation.designScope] ?? record.consultation.designScope}
                  </Badge>
                </div>
                <span className="text-xs text-text-muted">
                  {formatRelativeDate(record.createdAt)}
                </span>
              </div>
              {/* 금액 */}
              <div className="shrink-0 text-right">
                <span
                  className="text-sm font-bold text-primary"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatPrice(record.finalPrice)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── 오늘 요약 스탯 + 매출 (통합) ── */}
      <motion.div data-tour-id="tour-stats" variants={itemVariants} className="rounded-2xl bg-surface-elevated border border-border shadow-[var(--shadow-bento)] overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-border">
          {/* 오늘 상담 */}
          <div className="flex flex-col items-center gap-1 py-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <IconScissors className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {todayConsultations.length}
            </span>
            <span className="text-[10px] text-text-muted">{t('home.stat_consultation')}</span>
          </div>
          {/* 예약 */}
          <div className="flex flex-col items-center gap-1 py-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <IconCalendar className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {todayReservations.length}
            </span>
            <span className="text-[10px] text-text-muted">{t('home.stat_reservation')}</span>
          </div>
          {/* 오늘 매출 */}
          <div className="flex flex-col items-center gap-1 py-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <IconWon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatPrice(todayRevenue)}
            </span>
            <span className="text-[10px] text-text-muted">{t('home.stat_revenue')}</span>
          </div>
        </div>
        {/* 매출 상세 바 */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-primary/5">
          <span className="text-xs font-medium text-text-secondary">{t('home.section_todayRevenue')}</span>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-semibold text-primary active:opacity-60"
          >
            {t('home.section_viewDetail')} →
          </button>
        </div>
      </motion.div>

      {/* ── 퀵 액션 4개 ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-2.5">
        {quickActions.map(({ label, icon: Icon, href }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-elevated border border-border p-3 shadow-[var(--shadow-bento)] active:scale-95 transition-transform hover:border-primary/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-alt">
              <Icon className="h-5 w-5 text-text-secondary" />
            </div>
            <span className="text-[10px] font-semibold text-text-secondary leading-none">{label}</span>
          </button>
        ))}
      </motion.div>

    </motion.div>
  );
}
