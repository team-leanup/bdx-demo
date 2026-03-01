'use client';

import { cn } from '@/lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  className,
}: ToggleProps) {
  const trackClass = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
  const knobClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const knobOn = size === 'sm' ? 'translate-x-4' : 'translate-x-6';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none',
        trackClass,
        checked ? 'bg-primary' : 'bg-border',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200',
          knobClass,
          checked ? knobOn : 'translate-x-1',
        )}
      />
    </button>
  );
}
