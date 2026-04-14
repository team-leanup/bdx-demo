'use client';

import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/format';
import { IconScissors, IconCalendar, IconWon, IconGlobe } from '@/components/icons';

interface TodayStatsCardProps {
  consultationCount: number;
  reservationCount: number;
  revenue: number;
  foreignCount: number;
  onViewDetail: () => void;
  consultationLabel: string;
  reservationLabel: string;
  revenueLabel: string;
  todayRevenueLabel: string;
  viewDetailLabel: string;
  itemVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { duration: number; ease: number[] } };
  };
}

export function TodayStatsCard({
  consultationCount,
  reservationCount,
  revenue,
  foreignCount,
  onViewDetail,
  consultationLabel,
  reservationLabel,
  revenueLabel,
  todayRevenueLabel,
  viewDetailLabel,
  itemVariants,
}: TodayStatsCardProps): React.ReactElement {
  return (
    <motion.div data-tour-id="tour-stats" variants={itemVariants} className="rounded-2xl bg-surface border border-border overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
        {/* 오늘 상담 */}
        <div className="flex flex-col items-center gap-1 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <IconScissors className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-base md:text-lg font-semibold text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {consultationCount}
          </span>
          <span className="text-[11px] text-text-muted text-center leading-tight">{consultationLabel}</span>
        </div>
        {/* 예약 */}
        <div className="flex flex-col items-center gap-1 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <IconCalendar className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-base md:text-lg font-semibold text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {reservationCount}
          </span>
          <span className="text-[11px] text-text-muted text-center leading-tight">{reservationLabel}</span>
        </div>
        {/* 오늘 매출 */}
        <div className="flex flex-col items-center gap-1 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <IconWon className="h-3.5 w-3.5 text-primary" />
          </div>
          <span
            className={`text-base font-extrabold truncate w-full text-center ${revenue === 0 ? 'text-text-muted' : 'text-primary'}`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatPrice(revenue)}
          </span>
          <span className="text-[11px] text-text-muted text-center leading-tight">{revenueLabel}</span>
        </div>
        {/* 외국인 예약 */}
        <div className="flex flex-col items-center gap-1 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <IconGlobe className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-base md:text-lg font-semibold text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {foreignCount}
          </span>
          <span className="text-[11px] text-text-muted text-center leading-tight">외국인</span>
        </div>
      </div>
      {/* 매출 상세 바 */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-surface-alt">
        <span className="text-xs font-medium text-text-secondary">{todayRevenueLabel}</span>
        <button
          onClick={onViewDetail}
          className="text-xs font-semibold text-primary active:opacity-60"
        >
          {viewDetailLabel}
        </button>
      </div>
    </motion.div>
  );
}
