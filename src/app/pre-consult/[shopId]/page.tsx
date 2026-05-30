'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { fetchBookingRequestById, fetchConsultationLinkPublic, fetchShopPreConsultLinkData } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { SlotPicker } from '@/components/pre-consult/SlotPicker';
import { computeAvailableDates } from '@/lib/consultation-link-slots';
import type { BookingRequest } from '@/types/consultation';
import type { ConsultationLinkPublicData } from '@/types/consultation-link';

function formatBookingDateTime(date: string, time: string, locale: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekday = locale === 'ko' ? weekdaysKo[d.getUTCDay()] : weekdaysEn[d.getUTCDay()];
  return locale === 'ko'
    ? `${month}월 ${day}일 ${weekday}요일 ${time}`
    : `${month}/${day} (${weekday}) ${time}`;
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
    // SL-02: start 페이지 진입 시 URL 파라미터 기준으로 linkId/slot 항상 초기화.
    // partialize에서 제외했어도 이전 세션 메모리 상태가 남을 수 있으므로
    // linkIdParam 유무에 관계없이 명시적으로 설정.
    setConsultationLinkId(linkIdParam ?? null);
    if (!linkIdParam) {
      setSelectedSlot(null, null);
    }

    // 우선순위 1: bookingId 있으면 해당 예약 정보 로드 (사장님이 발송한 링크)
    if (bookingIdParam) {
      setBookingId(bookingIdParam);
      fetchBookingRequestById(bookingIdParam, params.shopId)
        .then((result) => {
          if (result) {
            setBookingInfo(result);
            const storeApi = usePreConsultStore.getState();
            if (result.customerName) storeApi.setCustomerName(result.customerName);
            if (result.phone) storeApi.setCustomerPhone(result.phone);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
      return;
    }

    // 우선순위 2: linkId 있으면 해당 링크 정보 로드 (구 공유 링크)
    if (linkIdParam) {
      fetchConsultationLinkPublic(linkIdParam)
        .then((result) => {
          if (!result || result.shopId !== params.shopId) {
            setLinkError(t('preConsult.linkInvalid'));
          } else if (result.status !== 'active') {
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
  }, [bookingIdParam, linkIdParam, params.shopId, setBookingId, setConsultationLinkId, setSelectedSlot, setSelectedCategory, setLinkDesignerId, t]);

  const handleStart = (): void => {
    router.push(`/pre-consult/${params.shopId}/design`);
  };

  // 예약 가능한 슬롯이 있는 링크(공유 링크 + 샵 고정 링크 모두)면 시간 선택을 필수로 한다.
  // 미선택 시 confirm 에서 경로 C 로 빠져 reservation_time='미정' booking 이 생성되고,
  // 그 슬롯이 다음 손님에게 막히지 않는 문제(가용 슬롯 표시에 booked 반영 안 됨)를 방지.
  // 슬롯이 아예 없는 샵(영업시간 없음/만석)은 종전대로 시간 없이 진행 허용.
  const hasAvailableSlots = useMemo(
    () => (linkData ? computeAvailableDates(linkData).length > 0 : false),
    [linkData],
  );
  const canStart = linkData && hasAvailableSlots
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
              {formatBookingDateTime(bookingInfo.reservationDate, bookingInfo.reservationTime, locale)}
            </p>
          </div>
        )}

        <h1 className="text-2xl font-bold text-text whitespace-pre-line leading-tight">
          {heroTitle}
        </h1>
        {locale !== 'ko' && !linkData?.title && (
          <p className="text-xs text-text-muted opacity-60 whitespace-pre-line">
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
          {canStart ? t('preConsult.startBtn') : t('preConsult.selectTimeFirst')}
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
