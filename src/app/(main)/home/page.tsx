'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { TourOverlay } from '@/components/onboarding/TourOverlay';
import { useShopStore } from '@/store/shop-store';
import { useRecordsStore } from '@/store/records-store';
import { useAppStore } from '@/store/app-store';
import { useReservationStore } from '@/store/reservation-store';
import { useConsultationStore } from '@/store/consultation-store';
import { useFieldModeStore } from '@/store/field-mode-store';
import { ConsultationStep } from '@/types/consultation';
import type { BookingChannel, BookingRequest } from '@/types/consultation';
import type { DesignCategory, RemovalPreference, LengthPreference, AddOnOption } from '@/types/pre-consultation';
import {
  GreetingHeader,
  HeroCTA,
  TodayReservationCard,
  RecentConsultationCard,
  ReservationForm,
  RevisitReminderCard,
  ShareLinkCard,
} from '@/components/home';
import { PreConsultationNotificationCenter } from '@/components/home/PreConsultationNotificationCenter';
import { Modal } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/store/auth-store';
import { useLocaleStore } from '@/store/locale-store';
import type { PreConsultationNotification } from '@/lib/preconsult-notifications';
import {
  formatNowInKorea,
  getCurrentHourInKorea,
  getTodayInKorea,
  toKoreanDateString,
} from '@/lib/format';

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
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const { shopSettings } = useAppStore();
  const { activeDesignerName, role, currentShopId } = useAuthStore();
  const restoreLocale = useLocaleStore((s) => s.restoreLocale);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const records = useMemo(() => getAllRecords(), [getAllRecords]);

  const CHANNEL_BADGE: Record<BookingChannel, { label: string; icon: string; variant: 'primary' | 'neutral' | 'success' | 'warning' }> = {
    kakao: { label: t('home.channel_kakao'), icon: '💬', variant: 'neutral' },
    naver: { label: t('home.channel_naver'), icon: '🟢', variant: 'neutral' },
    phone: { label: t('home.channel_phone'), icon: '📞', variant: 'neutral' },
    walk_in: { label: t('home.channel_walk_in'), icon: '🚶', variant: 'neutral' },
    pre_consult: { label: '미리 정하기', icon: '📋', variant: 'primary' },
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

  useEffect(() => {
    if (searchParams.get('notifications') === 'preconsult') {
      setShowNotificationCenter(true);
    }
  }, [searchParams]);
  const storeShopName = useShopStore((s) => s.shop?.name);
  const shopName = shopSettings.shopName || (storeShopName ?? '내 매장');

  const today = getTodayInKorea();
  const todayConsultations = records.filter(
    (r) => toKoreanDateString(r.createdAt) === today,
  );
  const todayRevenue = records
    .filter((r) => r.finalizedAt && toKoreanDateString(r.finalizedAt) === today)
    .reduce((sum, r) => sum + r.finalPrice, 0);

  const recentConsultations = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const allReservations = useReservationStore((s) => s.reservations);
  const addReservation = useReservationStore((s) => s.addReservation);
  const hydrateFromDB = useReservationStore((s) => s.hydrateFromDB);

  useEffect(() => {
    const poll = (): void => {
      if (document.visibilityState === 'visible') {
        hydrateFromDB().catch(console.error);
      }
    };

    // N-10: 마운트 즉시 1회 호출 (최대 30초 구데이터 방지)
    hydrateFromDB().catch(console.error);

    const interval = setInterval(poll, 30000);
    document.addEventListener('visibilitychange', poll);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [hydrateFromDB]);
  const todayReservations = useMemo(() => {
    const todayStr = getTodayInKorea();
    return allReservations
      .filter((r) => r.reservationDate === todayStr)
      .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
  }, [allReservations]);
  const foreignCount = todayReservations.filter((r) => r.language && r.language !== 'ko').length;
  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const hydrateFromBooking = useFieldModeStore((s) => s.hydrateFromBooking);

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
      designerId: newBooking.designerId,
      serviceLabel: newBooking.serviceLabel,
      customerId: newBooking.customerId,
    });
  };

  const clearHomeQuery = (key: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/home?${nextQuery}` : '/home', { scroll: false });
  };

  const handleCloseNotificationCenter = (): void => {
    setShowNotificationCenter(false);
    if (searchParams.get('notifications') === 'preconsult') {
      clearHomeQuery('notifications');
    }
  };

  const handleSelectNotification = (
    notification: PreConsultationNotification,
  ): void => {
    setShowNotificationCenter(false);
    if (searchParams.get('notifications') === 'preconsult') {
      clearHomeQuery('notifications');
    }
    router.push(`/records/preconsult/${notification.bookingId}`);
  };

  const handleStartConsultation = (booking: BookingRequest) => {
    if (booking.status === 'completed') return;
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
    // field-mode store에도 동일 예약 데이터 반영 (실제 이동 목적지)
    // preConsultationData는 JSONB로 저장되어 런타임에 pre-consult 필드를 포함할 수 있음
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
    router.push('/field-mode');
  };

  const [todayDateStr, setTodayDateStr] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setTodayDateStr(formatNowInKorea('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }));
    const hour = getCurrentHourInKorea();
    setGreeting(hour < 12
      ? t('home.greeting_morning')
      : hour < 18
      ? t('home.greeting_afternoon')
      : t('home.greeting_evening'));
  }, [t]);


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

      <PreConsultationNotificationCenter
        isOpen={showNotificationCenter}
        onClose={handleCloseNotificationCenter}
        reservations={allReservations}
        onSelectNotification={handleSelectNotification}
      />

      <TodayReservationCard
        reservations={todayReservations}
        shopName={shopName}
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

      <Modal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        title={t('home.modal_title')}
      >
        <ReservationForm
          onCancel={() => setShowReservationModal(false)}
          onSubmit={(newBooking) => {
            handleAddReservation(newBooking);
            setShowReservationModal(false);
          }}
        />
      </Modal>

      <HeroCTA
        onStartConsultation={() => {
          useFieldModeStore.getState().reset();
          router.push('/field-mode');
        }}
        onNewReservation={() => setShowReservationModal(true)}
        onQuickSale={() => router.push('/quick-sale')}
        consultationLabel="현장 시술"
        consultationTitle="디자인 고르기"
        consultationSubtitle="포트폴리오에서 디자인 고르기"
        reservationLabel={t('home.cta_reservation')}
        reservationTitle={t('home.cta_newReservation')}
        quickSaleLabel="매출"
        quickSaleTitle="즉시 매출"
        itemVariants={itemVariants}
      />

      <motion.div variants={itemVariants}>
        <ShareLinkCard />
      </motion.div>

      <RecentConsultationCard
        records={recentConsultations}
        onViewAll={() => router.push('/records?view=list')}
        onRecordClick={(id) => router.push(`/records/${id}`)}
        sectionTitle={t('home.section_recentConsultation')}
        viewAllLabel={t('home.section_viewAllShort')}
        itemVariants={itemVariants}
      />

      <RevisitReminderCard
        shopName={shopName}
        itemVariants={itemVariants}
      />

    </motion.div>
  );
}
