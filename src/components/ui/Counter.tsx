'use client';

import { cn } from '@/lib/cn';

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

export function Counter({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  className,
}: CounterProps) {
  const decrement = () => {
    if (value - step >= min) onChange(value - step);
  };
  const increment = () => {
    if (value + step <= max) onChange(value + step);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="w-11 h-11 rounded-xl border-2 border-border flex items-center justify-center text-text text-xl font-medium transition-all duration-150 hover:border-primary hover:text-primary active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
        >
          −
        </button>
        <span className="w-10 text-center font-semibold text-lg text-text tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="w-11 h-11 rounded-xl border-2 border-border flex items-center justify-center text-text text-xl font-medium transition-all duration-150 hover:border-primary hover:text-primary active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
        >
          +
        </button>
      </div>
    </div>
  );
}
