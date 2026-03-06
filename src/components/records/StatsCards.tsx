'use client';

import { BentoGrid, BentoCard } from '@/components/ui';

interface StatsCardsProps {
  primaryValue: number | string;
  primaryLabel: string;
  secondaryValue: number | string;
  secondaryLabel: string;
}

export function StatsCards({
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
}: StatsCardsProps): React.ReactElement {
  return (
    <BentoGrid cols={2} className="px-4 md:px-0">
      <BentoCard span="1x1" variant="accent">
        <div className="p-4 flex flex-col items-center justify-center h-full">
          <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {primaryValue}
          </span>
          <span className="text-xs text-text-secondary mt-1">{primaryLabel}</span>
        </div>
      </BentoCard>
      <BentoCard span="1x1">
        <div className="p-4 flex flex-col items-center justify-center h-full">
          <span className="text-2xl font-extrabold text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {secondaryValue}
          </span>
          <span className="text-xs text-text-secondary mt-1">{secondaryLabel}</span>
        </div>
      </BentoCard>
    </BentoGrid>
  );
}
