'use client';

import { useMemo } from 'react';
import { useConsultationStore } from '@/store/consultation-store';
import { useAppStore } from '@/store/app-store';
import { calculatePrice, buildServicePricingFromShopSettings } from '@/lib/price-calculator';
import { estimateTime } from '@/lib/time-calculator';
import { formatPrice, formatMinutes } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useLocale } from '@/lib/i18n';

export interface PriceSummaryBarProps {
  className?: string;
  showEstimated?: boolean;
}

export function PriceSummaryBar({ className, showEstimated = true }: PriceSummaryBarProps) {
  const t = useT();
  const locale = useLocale();
  const consultation = useConsultationStore((s) => s.consultation);
  const shopSettings = useAppStore((s) => s.shopSettings);
  const pricing = useMemo(() => buildServicePricingFromShopSettings(shopSettings), [shopSettings]);
  const breakdown = calculatePrice(consultation, pricing);
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
          <span className="text-xs text-text-muted">{t('consultation.estimatedAmount')}</span>
          <span className="text-sm font-bold text-text">{formatPrice(breakdown.subtotal)}</span>
        </div>
      )}
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted">{t('consultation.estimatedTimeLabel')}</span>
        <span className="text-sm font-semibold text-text">~{formatMinutes(minutes, locale)}</span>
      </div>
    </div>
  );
}
