'use client';

import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import type { PreConsultPriceEstimate } from '@/types/pre-consultation';
import { CATEGORY_LABELS } from '@/lib/labels';

interface PriceBarProps {
  estimate: PreConsultPriceEstimate;
  designCategory?: string;
  hasRemoval?: boolean;
  hasExtension?: boolean;
  addOnCount?: number;
  onStartTreatment: () => void;
}

export function PriceBar({
  estimate,
  designCategory,
  hasRemoval,
  hasExtension,
  addOnCount,
  onStartTreatment,
}: PriceBarProps): React.ReactElement {
  const t = useT();

  const priceDisplay =
    estimate.minTotal === estimate.maxTotal
      ? `₩${estimate.minTotal.toLocaleString()}`
      : `₩${estimate.minTotal.toLocaleString()}~${estimate.maxTotal.toLocaleString()}`;

  const summaryParts: string[] = [];
  if (designCategory && CATEGORY_LABELS[designCategory]) {
    summaryParts.push(CATEGORY_LABELS[designCategory]);
  }
  if (hasRemoval) summaryParts.push('제거');
  if (hasExtension) summaryParts.push('연장');
  if (addOnCount && addOnCount > 0) summaryParts.push(`추가${addOnCount}개`);
  const summaryLine = summaryParts.join(' · ');

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-between gap-4 max-w-screen-sm mx-auto">
        {/* Price + time info */}
        <div className="flex flex-col gap-0.5 min-w-0">
          {summaryLine.length > 0 && (
            <span className="text-xs text-text-muted truncate">{summaryLine}</span>
          )}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs text-text-muted font-medium whitespace-nowrap">
              {t('fieldMode.estimatedPrice')}
            </span>
            <span className="text-xl font-black text-text tracking-tight truncate">
              {priceDisplay}
            </span>
            <span className="text-xs text-text-muted whitespace-nowrap">
              · ~{estimate.estimatedMinutes}{t('fieldMode.minutes')}
            </span>
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          onClick={onStartTreatment}
          className="flex-shrink-0"
        >
          {t('fieldMode.startTreatment')} →
        </Button>
      </div>
    </motion.div>
  );
}
