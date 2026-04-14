'use client';

import { cn } from '@/lib/cn';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function TimeInput({
  value,
  onChange,
  size = 'md',
  disabled = false,
  className,
}: TimeInputProps) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'px-2 rounded-xl border bg-surface text-text border-border',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'transition-all duration-200',
        size === 'sm' ? 'h-11 text-xs' : 'h-11 text-sm',
        disabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-primary/40',
        className,
      )}
    />
  );
}
