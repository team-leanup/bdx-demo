'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';

export default function PreConsultCompletePage(): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const isSubmitted = usePreConsultStore((s) => s.isSubmitted);
  const shopData = usePreConsultStore((s) => s.shopData);

  const kakaoTalkUrl = shopData?.kakaoTalkUrl;
  const naverReservationUrl = shopData?.naverReservationUrl;
  const shopPhone = shopData?.phone;
  const hasBookingOptions = !!(kakaoTalkUrl || naverReservationUrl || shopPhone);

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
    }, 30000); // Extended to 30s so user can use booking CTAs
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
            transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>

      {/* Title & subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-text">
          {t('preConsult.completeTitle')}
        </h1>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-1">
            {tKo('preConsult.completeTitle')}
          </p>
        )}
        <p className="text-sm text-text-muted mt-3">
          {t('preConsult.completeSub')}
        </p>
        {locale !== 'ko' && (
          <p className="text-[10px] text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.completeSub')}
          </p>
        )}
      </motion.div>

      {/* Auto-save notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="px-5 py-4 rounded-2xl bg-surface border border-border text-center max-w-sm w-full"
      >
        <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed">
          {t('preConsult.autoSaveNotice')}
        </p>
        {locale !== 'ko' && (
          <p className="text-[10px] text-text-muted opacity-60 mt-2 whitespace-pre-line leading-relaxed">
            {tKo('preConsult.autoSaveNotice')}
          </p>
        )}
      </motion.div>

      {/* Booking CTAs */}
      {hasBookingOptions && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="max-w-sm w-full flex flex-col gap-3"
        >
          {/* Section title */}
          <div className="text-center">
            <p className="text-sm font-semibold text-text">
              {t('preConsult.bookNowTitle')}
            </p>
            {locale !== 'ko' && (
              <p className="text-[10px] text-text-muted opacity-60 mt-0.5">
                {tKo('preConsult.bookNowTitle')}
              </p>
            )}
            <p className="text-xs text-text-muted mt-1">
              {t('preConsult.bookNowSub')}
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-2">
            {kakaoTalkUrl && (
              <a
                href={kakaoTalkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
                style={{ background: '#FEE500', color: '#191F28' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.56-.96 3.6-.99 3.83 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.55.08 1.13.12 1.72.12 5.52 0 10-3.58 10-7.94C22 6.58 17.52 3 12 3z" />
                </svg>
                <span>{t('preConsult.bookKakao')}</span>
              </a>
            )}
            {naverReservationUrl && (
              <a
                href={naverReservationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98]"
                style={{ background: '#03C75A' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.27 10.27L7.73 21h6.54l4.27-5.38V21H22V3h-3.46v7.27L13.73 3H7.19l9.08 7.27z" />
                  <path d="M2 3h3.46v18H2z" />
                </svg>
                <span>{t('preConsult.bookNaver')}</span>
              </a>
            )}
            {shopPhone && (
              <a
                href={`tel:${shopPhone}`}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border font-semibold text-sm text-text-secondary transition-all active:scale-[0.98]"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>{t('preConsult.bookPhone')}: {shopPhone}</span>
              </a>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
}
