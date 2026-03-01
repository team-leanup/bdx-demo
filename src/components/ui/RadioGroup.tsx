'use client';

import { cn } from '@/lib/cn';

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
  direction = 'horizontal',
  className,
}: RadioGroupProps) {
  return (
    <div
      className={cn(
        'flex gap-2',
        direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className,
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-primary/40',
            )}
          >
            <span
              className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                isSelected ? 'border-primary' : 'border-border',
              )}
            >
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-primary block" />
              )}
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
