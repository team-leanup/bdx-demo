'use client';

import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface ColorSelectorProps {
  className?: string;
}

const EXTRA_COLOR_PRICE = 3000;

export function ColorSelector({ className }: ColorSelectorProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const extraColorCount = useConsultationStore((s) => s.consultation.extraColorCount);
  const setExtraColorCount = useConsultationStore((s) => s.setExtraColorCount);

  const handleDecrement = () => {
    if (extraColorCount > 0) setExtraColorCount(extraColorCount - 1);
  };
  const handleIncrement = () => {
    if (extraColorCount < 10) setExtraColorCount(extraColorCount + 1);
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-2 mb-1">
        {/* Paint palette icon */}
        <div className="w-7 h-7 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <circle cx="8" cy="9" r="1.5" fill="currentColor" />
            <circle cx="12" cy="7" r="1.5" fill="currentColor" />
            <circle cx="16" cy="9" r="1.5" fill="currentColor" />
            <circle cx="16" cy="14" r="1.5" fill="currentColor" />
            <circle cx="14.5" cy="17" r="2" fill="currentColor" fillOpacity="0.9" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-secondary">{t('selector.colorAdd')}</p>
          {locale !== 'ko' && <span className="text-xs text-text-muted opacity-60">{tKo('selector.colorAdd')}</span>}
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-border bg-surface flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">
              {t('selector.extraColorCount')}
              {locale !== 'ko' && (
                <span className="ml-1 text-[10px] text-text-muted opacity-60">{tKo('selector.extraColorCount')}</span>
              )}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {t('selector.baseIncluded').replace('{price}', formatPrice(EXTRA_COLOR_PRICE))}
            </p>
            {locale !== 'ko' && (
              <p className="text-[10px] text-text-muted opacity-60">
                {tKo('selector.baseIncluded').replace('{price}', formatPrice(EXTRA_COLOR_PRICE))}
              </p>
            )}
          </div>
          {extraColorCount > 0 && (
            <motion.span
              key={extraColorCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-base font-bold text-primary bg-primary/10 px-3 py-1 rounded-full"
            >
              +{formatPrice(extraColorCount * EXTRA_COLOR_PRICE)}
            </motion.span>
          )}
        </div>

        {/* Large custom counter */}
        <div className="flex items-center justify-between gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleDecrement}
            disabled={extraColorCount <= 0}
            className="w-12 h-12 rounded-2xl bg-surface-alt border-2 border-border flex items-center justify-center text-xl font-bold text-text disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200"
          >
            −
          </motion.button>

          <div className="flex-1 flex flex-col items-center gap-1">
            <motion.span
              key={extraColorCount}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-bold text-text tabular-nums"
            >
              {extraColorCount}
            </motion.span>
            <span className="text-xs text-text-muted">{t('selector.extraColor')}</span>
            {locale !== 'ko' && (
              <span className="text-[10px] text-text-muted opacity-60">{tKo('selector.extraColor')}</span>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleIncrement}
            disabled={extraColorCount >= 10}
            className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-xl font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 active:bg-primary/80 shadow-sm shadow-primary/30 transition-all duration-200"
          >
            +
          </motion.button>
        </div>

      </div>

      {/* Empty state hint when no colors selected */}
      {extraColorCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-alt border border-border"
        >
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <div>
            <p className="text-xs text-text-muted">{t('selector.colorBaseHint')}</p>
            {locale !== 'ko' && (
              <p className="text-[10px] text-text-muted opacity-60 mt-0.5">{tKo('selector.colorBaseHint')}</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
