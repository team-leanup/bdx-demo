'use client';

import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface SelectCardProps {
  selected: boolean;
  onSelect: () => void;
  title?: string;
  subLabel?: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export function SelectCard({
  selected,
  onSelect,
  title,
  subLabel,
  description,
  icon,
  children,
  className,
  variant = 'horizontal',
}: SelectCardProps) {
  const isVertical = variant === 'vertical';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl border-2 p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        isVertical ? 'text-center' : 'text-left',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-alt',
        className,
      )}
    >
      {(icon || title) && (
        <div
          className={cn(
            isVertical
              ? 'flex flex-col items-center gap-2'
              : 'flex items-start gap-3',
          )}
        >
          {icon && (
            <span
              className={cn(
                'text-2xl flex-shrink-0',
                selected ? 'text-primary' : 'text-text-muted',
              )}
            >
              {icon}
            </span>
          )}
          <div className={cn(isVertical ? 'w-full' : 'flex-1 min-w-0')}>
            {title && (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <p
                  className={cn(
                    'font-semibold text-sm',
                    selected ? 'text-primary' : 'text-text',
                  )}
                >
                  {title}
                </p>
                {subLabel && (
                  <span className="text-[11px] text-text-muted font-medium">{subLabel}</span>
                )}
              </div>
            )}
            {description && (
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            )}
          </div>
          {!isVertical && selected && (
            <svg
              className="w-5 h-5 text-primary flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      )}
      {children}
    </button>
  );
}
