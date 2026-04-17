'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { fetchBookingRequestById, fetchConsultationLinkPublic, fetchShopPreConsultLinkData } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { SlotPicker } from '@/components/pre-consult/SlotPicker';
import type { BookingRequest } from '@/types/consultation';
import type { ConsultationLinkPublicData } from '@/types/consultation-link';

function formatBookingDateTime(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[d.getUTCDay()];
  return `${month}월 ${day}일 ${weekday}요일 ${time}`;
}

function PreConsultStartInner(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ shopId: string }>();
  const searchParams = useSearchParams();
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const shopName = usePreConsultStore((s) => s.shopName);
  const setBookingId = usePreConsultStore((s) => s.setBookingId);
  const setConsultationLinkId = usePreConsultStore((s) => s.setConsultationLinkId);
  const setSelectedSlot = usePreConsultStore((s) => s.setSelectedSlot);
  const setLinkDesignerId = usePreConsultStore((s) => s.setLinkDesignerId);
  const setSelectedCategory = usePreConsultStore((s) => s.setSelectedCategory);
  const selectedSlotDate = usePreConsultStore((s) => s.selectedSlotDate);
  const selectedSlotTime = usePreConsultStore((s) => s.selectedSlotTime);

  const bookingIdParam = searchParams.get('bookingId');
  const linkIdParam = searchParams.get('linkId');

  const [bookingInfo, setBookingInfo] = useState<BookingRequest | null>(null);
  const [linkData, setLinkData] = useState<ConsultationLinkPublicData | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 우선순위 1: bookingId 있으면 해당 예약 정보 로드 (사장님이 발송한 링크)
    if (bookingIdParam) {
      setBookingId(bookingIdParam);
      fetchBookingRequestById(bookingIdParam, params.shopId)
        .then((result) => {
          if (result) setBookingInfo(result);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
      return;
    }

    // 우선순위 2: linkId 있으면 해당 링크 정보 로드 (구 공유 링크)
    if (linkIdParam) {
      setConsultationLinkId(linkIdParam);
      fetchConsultationLinkPublic(linkIdParam)
        .then((result) => {
          if (!result || result.shopId !== params.shopId) {
            setLinkError(t('preConsult.linkInvalid'));
          } else {
            setLinkData(result);
            if (result.styleCategory) setSelectedCategory(result.styleCategory);
            if (result.designerId) setLinkDesignerId(result.designerId);
          }
        })
        .catch(() => setLinkError(t('preConsult.linkInvalid')))
        .finally(() => setIsLoading(false));
      return;
    }

    // 기본: 샵 고정 상담 링크 — shopId로 기본 slot 데이터 로드
    fetchShopPreConsultLinkData(params.shopId)
      .then((result) => {
        if (result) setLinkData(result);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [bookingIdParam, linkIdParam, params.shopId, setBookingId, setConsultationLinkId, setSelectedCategory, setLinkDesignerId, t]);

  const handleStart = (): void => {
    router.push(`/pre-consult/${params.shopId}/design`);
  };

  const canStart = linkIdParam && linkData
    ? Boolean(selectedSlotDate && selectedSlotTime)
    : true;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (linkError) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center flex flex-col gap-3 max-w-sm">
          <h1 className="text-xl font-bold text-text">{t('preConsult.linkInvalidTitle')}</h1>
          {locale !== 'ko' && (
            <p className="text-xs text-text-muted opacity-60">{tKo('preConsult.linkInvalidTitle')}</p>
          )}
          <p className="text-sm text-text-muted">{linkError}</p>
        </div>
      </div>
    );
  }

  const displayShopName = linkData?.shopName || shopName;
  const heroTitle = linkData?.title || t('preConsult.heroTitle');
  const heroSub = linkData?.description || t('preConsult.heroSub');

  return (
    <div className="flex-1 flex flex-col px-6 py-6 gap-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center flex flex-col gap-3 pt-4"
      >
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mx-auto">
          <span className="font-bold">{displayShopName}</span>
          <span className="text-text-muted">{t('preConsult.sentBy')}</span>
        </div>

        {bookingInfo && (
          <div className="rounded-xl bg-surface-alt border border-border px-4 py-3 text-center mx-auto max-w-xs">
            <p className="text-xs text-text-muted">{t('preConsult.bookingDateTime')}</p>
            <p className="mt-0.5 text-sm font-bold text-text">
              {formatBookingDateTime(bookingInfo.reservationDate, bookingInfo.reservationTime)}
            </p>
          </div>
        )}

        <h1 className="text-2xl font-bold text-text whitespace-pre-line leading-tight">
          {heroTitle}
        </h1>
        {locale !== 'ko' && !linkData?.title && (
          <p className="text-[11px] text-text-muted opacity-60 whitespace-pre-line">
            {tKo('preConsult.heroTitle')}
          </p>
        )}
        <p className="text-text-muted text-sm">{heroSub}</p>
        {linkData?.designerName && (
          <p className="text-xs text-text-secondary">
            {t('preConsult.designerLabel')}: <strong>{linkData.designerName}</strong>
          </p>
        )}
      </motion.div>

      {/* 상담 링크 경로: 날짜/시간 선택 단계 추가 */}
      {linkData && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="max-w-md mx-auto w-full"
        >
          <SlotPicker
            link={linkData}
            selectedDate={selectedSlotDate}
            selectedTime={selectedSlotTime}
            onSelect={setSelectedSlot}
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs mx-auto mt-auto pb-4 pt-3"
      >
        <Button size="lg" fullWidth disabled={!canStart} onClick={handleStart}>
          {linkData && selectedSlotDate && selectedSlotTime
            ? t('preConsult.startBtn')
            : linkData
            ? t('preConsult.selectTimeFirst')
            : t('preConsult.startBtn')}
        </Button>
      </motion.div>
    </div>
  );
}

export default function PreConsultStartPage(): React.ReactElement {
  return (
    <Suspense>
      <PreConsultStartInner />
    </Suspense>
  );
}
