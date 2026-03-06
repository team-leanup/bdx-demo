'use client';

import { cn } from '@/lib/cn';

type ViewMode = 'timegrid' | 'month';
type ReservationFilter = 'all' | 'mine';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  reservationFilter: ReservationFilter;
  onReservationFilterChange: (filter: ReservationFilter) => void;
  viewLabels?: { timegrid: string; month: string };
  filterLabels?: { all: string; mine: string };
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  reservationFilter,
  onReservationFilterChange,
  viewLabels = { timegrid: '주간', month: '월간' },
  filterLabels = { all: '전체', mine: '내 예약' },
}: ViewModeToggleProps): React.ReactElement {
  const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
    { key: 'timegrid', label: viewLabels.timegrid },
    { key: 'month', label: viewLabels.month },
  ];

  return (
    <div className="flex items-center justify-between px-4 md:px-0">
      <div className="flex gap-0.5 p-1 rounded-full bg-surface-alt border border-border">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onViewModeChange(opt.key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              viewMode === opt.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex gap-0.5 p-1 rounded-full bg-surface-alt border border-border">
        <button
          onClick={() => onReservationFilterChange('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
            reservationFilter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text',
          )}
        >
          {filterLabels.all}
        </button>
        <button
          onClick={() => onReservationFilterChange('mine')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
            reservationFilter === 'mine'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text',
          )}
        >
          {filterLabels.mine}
        </button>
      </div>
    </div>
  );
}
