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

  useEffect(() => {
    // 제출 없이 직접 접근한 경우 → 시작 페이지로 리다이렉트
    if (!isSubmitted) {
      const shopId = window.location.pathname.split('/')[2];
      if (shopId) window.location.href = `/pre-consult/${shopId}`;
    }
  }, [isSubmitted]);

  useEffect(() => {
    if (!isSubmitted) return;
    // Delay reset so user sees the completion page before state is cleared
    const timer = setTimeout(() => {
      usePreConsultStore.getState().reset();
    }, 5000);
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

    </div>
  );
}
