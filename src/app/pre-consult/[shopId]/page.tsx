'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { fetchBookingRequestById } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import type { BookingRequest } from '@/types/consultation';

// ─── Booking date formatter ────────────────────────────────────────────────────

function formatBookingDateTime(date: string, time: string): string {
  // date: "YYYY-MM-DD", time: "HH:MM"
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12)); // noon UTC = Korea day
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[d.getUTCDay()];
  return `${month}월 ${day}일 ${weekday}요일 ${time}`;
}

// ─── Inner component (uses useSearchParams) ────────────────────────────────────

function PreConsultStartInner(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ shopId: string }>();
  const searchParams = useSearchParams();
  const t = useT();
  const shopName = usePreConsultStore((s) => s.shopName);
  const setBookingId = usePreConsultStore((s) => s.setBookingId);

  const bookingIdParam = searchParams.get('bookingId');
  const [bookingInfo, setBookingInfo] = useState<BookingRequest | null>(null);

  // bookingId를 store에 저장하고 예약 정보 조회
  useEffect(() => {
    if (!bookingIdParam) return;
    setBookingId(bookingIdParam);
    fetchBookingRequestById(bookingIdParam, params.shopId)
      .then((result) => {
        if (result) setBookingInfo(result);
      })
      .catch(() => {
        // 조회 실패 — graceful degradation
      });
  }, [bookingIdParam, params.shopId, setBookingId]);

  const handleStart = (): void => {
    router.push(`/pre-consult/${params.shopId}/design`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center flex flex-col gap-4"
      >
        {/* Shop name badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mx-auto">
          <span className="font-bold">{shopName}</span>
          <span className="text-text-muted">{t('preConsult.sentBy')}</span>
        </div>

        {/* Booking date card — bookingId가 있을 때만 표시 */}
        {bookingInfo && (
          <div className="rounded-xl bg-surface-alt border border-border px-4 py-3 text-center">
            <p className="text-xs text-text-muted">예약 일시</p>
            <p className="mt-0.5 text-sm font-bold text-text">
              {formatBookingDateTime(bookingInfo.reservationDate, bookingInfo.reservationTime)}
            </p>
          </div>
        )}

        {/* Hero text */}
        <h1 className="text-2xl font-bold text-text whitespace-pre-line leading-tight">
          {t('preConsult.heroTitle')}
        </h1>
        <p className="text-text-muted text-sm">
          {t('preConsult.heroSub')}
        </p>
      </motion.div>

      {/* Start button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-xs"
      >
        <Button size="lg" fullWidth onClick={handleStart}>
          {t('preConsult.startBtn')}
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Page (Suspense boundary for useSearchParams) ─────────────────────────────

export default function PreConsultStartPage(): React.ReactElement {
  return (
    <Suspense>
      <PreConsultStartInner />
    </Suspense>
  );
}
