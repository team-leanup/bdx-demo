'use client';

import { cn } from '@/lib/cn';

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

interface PeriodFilterProps {
  filter: FilterPeriod;
  onFilterChange: (filter: FilterPeriod) => void;
  labels: Record<FilterPeriod, string>;
}

export function PeriodFilter({
  filter,
  onFilterChange,
  labels,
}: PeriodFilterProps): React.ReactElement {
  const FILTER_KEYS: FilterPeriod[] = ['all', 'today', 'week', 'month'];

  return (
    <div className="flex gap-2 overflow-x-auto px-4 md:px-0 pb-1">
      {FILTER_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={cn(
            'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all',
            filter === key
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface border border-border text-text-secondary',
          )}
        >
          {labels[key]}
        </button>
      ))}
    </div>
  );
}
