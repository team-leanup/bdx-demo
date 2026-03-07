'use client';

import { useConsultationStore } from '@/store/consultation-store';
import { calculatePrice } from '@/lib/price-calculator';
import { estimateTime } from '@/lib/time-calculator';
import { formatPrice, formatMinutes } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useKo, useLocale } from '@/lib/i18n';

export interface PriceSummaryBarProps {
  className?: string;
  showEstimated?: boolean;
}

export function PriceSummaryBar({ className, showEstimated = true }: PriceSummaryBarProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const consultation = useConsultationStore((s) => s.consultation);
  const breakdown = calculatePrice(consultation);
  const minutes = estimateTime(consultation);

  if (!showEstimated) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 md:px-8 py-2 md:py-3 bg-surface-alt border-b border-border',
        className,
      )}
    >
      {showEstimated && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">
            {t('consultation.estimatedAmount')}
            {locale !== 'ko' && (
              <span className="ml-1 text-[10px] opacity-60">{tKo('consultation.estimatedAmount')}</span>
            )}
          </span>
          <span className="text-sm font-bold text-text">{formatPrice(breakdown.subtotal)}</span>
        </div>
      )}
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted">
          {t('consultation.estimatedTimeLabel')}
          {locale !== 'ko' && (
            <span className="ml-1 text-[10px] opacity-60">{tKo('consultation.estimatedTimeLabel')}</span>
          )}
        </span>
        <span className="text-sm font-semibold text-text">~{formatMinutes(minutes, locale)}</span>
      </div>
    </div>
  );
}
