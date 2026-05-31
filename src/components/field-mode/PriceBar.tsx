'use client';

import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import type { PreConsultPriceEstimate } from '@/types/pre-consultation';
import { CATEGORY_LABELS } from '@/lib/labels';

interface PriceBarProps {
  estimate: PreConsultPriceEstimate;
  designCategory?: string;
  /** resolved 카테고리 라벨 — 커스텀 카테고리 포함. 제공 시 designCategory보다 우선 */
  categoryLabel?: string;
  hasRemoval?: boolean;
  hasExtension?: boolean;
  addOnCount?: number;
  onStartTreatment: () => void;
}

export function PriceBar({
  estimate,
  designCategory,
  categoryLabel,
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
  if (categoryLabel) {
    summaryParts.push(categoryLabel);
  } else if (designCategory) {
    // fallback: builtin 라벨만 (커스텀은 호출부에서 categoryLabel로 전달 권장)
    const builtinLabel = CATEGORY_LABELS[designCategory];
    if (builtinLabel) summaryParts.push(builtinLabel);
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
            <span className="text-xl font-bold text-text tracking-tight truncate">
              {priceDisplay}
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
