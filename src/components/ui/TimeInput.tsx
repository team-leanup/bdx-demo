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
        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
        'transition-all duration-200',
        size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
        disabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-primary/40',
        className,
      )}
    />
  );
}
