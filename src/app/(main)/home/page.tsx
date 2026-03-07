'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TourOverlay } from '@/components/onboarding/TourOverlay';
import { MOCK_SHOP } from '@/data/mock-shop';
import { useRecordsStore } from '@/store/records-store';
import { MOCK_CONSULTATIONS } from '@/data/mock-consultations';
import { useAppStore } from '@/store/app-store';
import { useReservationStore } from '@/store/reservation-store';
import { useConsultationStore } from '@/store/consultation-store';
import type { BookingChannel, BookingRequest } from '@/types/consultation';
import {
  GreetingHeader,
  HeroCTA,
  TodayReservationCard,
  RecentConsultationCard,
  TodayStatsCard,
  QuickActions,
  ReservationForm,
} from '@/components/home';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/store/auth-store';
import { useLocaleStore } from '@/store/locale-store';
import {
  IconUsers,
  IconCalendar,
  IconChart,
  IconGear,
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
  const restoreLocale = useLocaleStore((s) => s.restoreLocale);
  const additionalRecords = useRecordsStore((s) => s.additionalRecords);
  const records = useMemo(
    () => [...additionalRecords, ...MOCK_CONSULTATIONS],
    [additionalRecords],
  );

  const CHANNEL_BADGE: Record<BookingChannel, { label: string; icon: string; variant: 'primary' | 'neutral' | 'success' | 'warning' }> = {
    kakao: { label: t('home.channel_kakao'), icon: '💬', variant: 'warning' },
    naver: { label: t('home.channel_naver'), icon: '🟢', variant: 'success' },
    phone: { label: t('home.channel_phone'), icon: '📞', variant: 'neutral' },
    walk_in: { label: t('home.channel_walk_in'), icon: '🚶', variant: 'primary' },
  };

  useEffect(() => {
    restoreLocale();
  }, [restoreLocale]);

  useEffect(() => {
    if (searchParams.get('tour') === 'true') {
      const timer = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  const shopName = shopSettings.shopName || MOCK_SHOP.name;

  const today = getTodayStr();
  const todayConsultations = records.filter(
    (r) => r.createdAt.startsWith(today),
  );
  const todayRevenue = todayConsultations.reduce((sum, r) => sum + r.finalPrice, 0);

  const recentConsultations = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const allReservations = useReservationStore((s) => s.reservations);
  const addReservation = useReservationStore((s) => s.addReservation);
  const todayReservations = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return allReservations
      .filter((r) => r.reservationDate === todayStr)
      .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
  }, [allReservations]);
  const addReferenceImage = useConsultationStore((s) => s.addReferenceImage);
  const setBookingId = useConsultationStore((s) => s.setBookingId);

  const handleAddReservation = (newBooking: BookingRequest) => {
    addReservation({
      customerName: newBooking.customerName,
      phone: newBooking.phone,
      reservationDate: newBooking.reservationDate,
      reservationTime: newBooking.reservationTime,
      channel: newBooking.channel,
      requestNote: newBooking.requestNote,
      referenceImageUrls: newBooking.referenceImageUrls,
      language: newBooking.language,
      serviceLabel: newBooking.serviceLabel,
      customerId: newBooking.customerId,
    });
  };

  const handleStartConsultation = (booking: BookingRequest) => {
    if (booking.status === 'completed') return;
    setBookingId(booking.id);
    const params = new URLSearchParams();
    params.set('bookingId', booking.id);
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
      className="flex flex-col gap-4 px-4 pb-8 pt-2 md:px-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <GreetingHeader
        shopName={shopName}
        activeDesignerName={activeDesignerName}
        greeting={greeting}
        role={role}
        todayDateStr={todayDateStr}
        itemVariants={itemVariants}
      />

      <TourOverlay active={showTour} onComplete={() => {
        setShowTour(false);
        router.replace('/home', { scroll: false });
      }} />

      <TodayReservationCard
        reservations={todayReservations}
        channelBadge={CHANNEL_BADGE}
        onViewAll={() => router.push('/records')}
        onStartConsultation={handleStartConsultation}
        sectionTitle={t('home.section_todayReservation')}
        viewAllLabel={t('home.section_viewAll')}
        noReservationText={t('home.section_noReservation')}
        noReservationSubText={t('home.section_noReservationSub')}
        startConsultationLabel={t('home.section_startConsultation')}
        itemVariants={itemVariants}
      />

      <TodayStatsCard
        consultationCount={todayConsultations.length}
        reservationCount={todayReservations.length}
        revenue={todayRevenue}
        onViewDetail={() => router.push('/dashboard')}
        consultationLabel={t('home.stat_consultation')}
        reservationLabel={t('home.stat_reservation')}
        revenueLabel={t('home.stat_revenue')}
        todayRevenueLabel={t('home.section_todayRevenue')}
        viewDetailLabel={t('home.section_viewDetail')}
        itemVariants={itemVariants}
      />

      <AnimatePresence>
        {showReservationModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setShowReservationModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background px-4 pb-8 pt-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-lg md:rounded-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-text">{t('home.modal_title')}</h3>
                <button
                  onClick={() => setShowReservationModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt text-text-muted hover:bg-border transition-colors"
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

      <HeroCTA
        onStartConsultation={() => router.push('/consultation')}
        onNewReservation={() => setShowReservationModal(true)}
        consultationLabel={t('home.cta_consultation')}
        consultationTitle={t('home.cta_newConsultation')}
        reservationLabel={t('home.cta_reservation')}
        reservationTitle={t('home.cta_newReservation')}
        itemVariants={itemVariants}
      />

      <RecentConsultationCard
        records={recentConsultations}
        onViewAll={() => router.push('/records?view=list')}
        onRecordClick={(id) => router.push(`/records/${id}`)}
        sectionTitle={t('home.section_recentConsultation')}
        viewAllLabel={t('home.section_viewAllShort')}
        itemVariants={itemVariants}
      />

      <QuickActions
        actions={quickActions}
        onNavigate={(href) => router.push(href)}
        itemVariants={itemVariants}
      />
    </motion.div>
  );
}
