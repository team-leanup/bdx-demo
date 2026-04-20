'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';

function formatSlot(date: string, time: string, locale: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const wd = locale === 'ko' ? weekdaysKo[dt.getUTCDay()] : weekdaysEn[dt.getUTCDay()];
  return locale === 'ko'
    ? `${m}월 ${d}일 (${wd}) ${time}`
    : `${m}/${d} (${wd}) ${time}`;
}

export default function PreConsultCompletePage(): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const isSubmitted = usePreConsultStore((s) => s.isSubmitted);
  const shopData = usePreConsultStore((s) => s.shopData);
  const selectedSlotDate = usePreConsultStore((s) => s.selectedSlotDate);
  const selectedSlotTime = usePreConsultStore((s) => s.selectedSlotTime);

  const hasBookingSlot = Boolean(selectedSlotDate && selectedSlotTime);

  useEffect(() => {
    if (!isSubmitted) {
      const shopId = window.location.pathname.split('/')[2];
      if (shopId) window.location.href = `/pre-consult/${shopId}`;
    }
  }, [isSubmitted]);

  useEffect(() => {
    if (!isSubmitted) return;
    const timer = setTimeout(() => {
      usePreConsultStore.getState().reset();
    }, 60000);
    return () => clearTimeout(timer);
  }, [isSubmitted]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      {/* Animated check circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <svg
          className="w-12 h-12 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>

      {/* Title & subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-text">
          {hasBookingSlot ? t('preConsult.bookingCompleteTitle') : t('preConsult.completeTitle')}
        </h1>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-1">
            {hasBookingSlot ? tKo('preConsult.bookingCompleteTitle') : tKo('preConsult.completeTitle')}
          </p>
        )}
        <p className="text-sm text-text-muted mt-3">
          {hasBookingSlot ? t('preConsult.bookingCompleteSub') : t('preConsult.completeSub')}
        </p>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {hasBookingSlot ? tKo('preConsult.bookingCompleteSub') : tKo('preConsult.completeSub')}
          </p>
        )}
      </motion.div>

      {/* Confirmed slot (공유 상담 링크 경로) */}
      {hasBookingSlot && selectedSlotDate && selectedSlotTime && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-sm w-full rounded-2xl bg-primary/5 border border-primary/20 px-5 py-4"
        >
          <p className="text-xs text-text-muted text-center">
            {t('preConsult.confirmedDateTime')}
          </p>
          <p className="mt-1 text-lg font-bold text-primary text-center">
            {formatSlot(selectedSlotDate, selectedSlotTime, locale)}
          </p>
          {shopData?.name && (
            <p className="text-xs text-text-muted text-center mt-2">
              @ <strong className="text-text-secondary">{shopData.name}</strong>
            </p>
          )}
        </motion.div>
      )}

      {/* Info notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="px-5 py-4 rounded-2xl bg-surface border border-border text-center max-w-sm w-full"
      >
        <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed">
          {hasBookingSlot
            ? t('preConsult.bookingCompleteNotice')
            : t('preConsult.autoSaveNotice')}
        </p>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-2 whitespace-pre-line leading-relaxed">
            {hasBookingSlot
              ? tKo('preConsult.bookingCompleteNotice')
              : tKo('preConsult.autoSaveNotice')}
          </p>
        )}
      </motion.div>
    </div>
  );
}
