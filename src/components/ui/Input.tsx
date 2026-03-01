'use client';

import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full h-11 md:h-12 px-4 rounded-xl border bg-surface text-text text-base md:text-base placeholder:text-text-muted transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          error
            ? 'border-error focus:ring-error'
            : 'border-border hover:border-primary/40',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
