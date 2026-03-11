'use client';

import { useMemo } from 'react';
import { useConsultationStore } from '@/store/consultation-store';
import { useAppStore } from '@/store/app-store';
import { calculatePrice, buildServicePricingFromShopSettings } from '@/lib/price-calculator';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useT, useKo, useLocale } from '@/lib/i18n';

interface ConsultationFooterProps {
  onNext: () => void;
  nextLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  showEstimated?: boolean;
}

export function ConsultationFooter({
  onNext,
  nextLabel,
  disabled = false,
  loading = false,
  className,
  showEstimated = true,
}: ConsultationFooterProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const consultation = useConsultationStore((s) => s.consultation);
  const shopSettings = useAppStore((s) => s.shopSettings);
  const pricing = useMemo(() => buildServicePricingFromShopSettings(shopSettings), [shopSettings]);
  const breakdown = calculatePrice(consultation, pricing);
  const label = nextLabel ?? t('common.next');
  const shouldShowEstimated = showEstimated !== false;

  return (
    <footer
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border',
        'md:static md:flex-shrink-0',
        'flex items-center px-4 md:px-8 py-3 gap-4',
        shouldShowEstimated ? 'justify-between' : 'justify-center',
        'safe-bottom',
        className,
      )}
    >
      {shouldShowEstimated && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted">
            {t('consultation.estimatedAmount')}
            {locale !== 'ko' && (
              <span className="ml-1 text-[10px] opacity-60">{tKo('consultation.estimatedAmount')}</span>
            )}
          </span>
          <span className="text-base font-bold text-text">{formatPrice(breakdown.subtotal)}</span>
        </div>
      )}
      <Button
        variant="primary"
        size="lg"
        onClick={onNext}
        disabled={disabled}
        loading={loading}
        className={cn(
          shouldShowEstimated ? 'flex-1 max-w-48 md:max-w-xs' : 'w-full max-w-48 md:max-w-xs',
        )}
      >
        {label}
      </Button>
    </footer>
  );
}
