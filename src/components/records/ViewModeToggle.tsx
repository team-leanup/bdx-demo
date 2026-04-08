'use client';

import { cn } from '@/lib/cn';

type ViewMode = 'day' | 'month';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  viewLabels?: { day: string; month: string };
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  viewLabels = { day: '일간', month: '월간' },
}: ViewModeToggleProps): React.ReactElement {
  const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
    { key: 'day', label: viewLabels.day },
    { key: 'month', label: viewLabels.month },
  ];

  return (
    <div className="flex gap-0.5 p-1 rounded-full bg-surface-alt border border-border w-fit">
      {VIEW_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onViewModeChange(opt.key)}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-medium transition-all',
            viewMode === opt.key
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
