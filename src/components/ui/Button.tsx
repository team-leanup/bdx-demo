'use client';

import { cn } from '@/lib/cn';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none';

  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary-dark active:scale-[0.98]',
    secondary:
      'border border-border text-text bg-surface hover:bg-surface-alt active:scale-[0.98]',
    ghost:
      'bg-transparent text-text-secondary hover:bg-surface-alt active:scale-[0.98]',
    outline:
      'border-2 border-primary text-primary bg-transparent hover:bg-primary/5 active:scale-[0.98]',
    danger:
      'bg-error text-white hover:bg-error/90 active:scale-[0.98]',
    success:
      'bg-success text-white hover:bg-success/90 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm gap-1.5',
    md: 'h-11 px-5 text-base',
    lg: 'h-14 md:h-16 px-7 text-lg md:text-xl',
  };

  return (
    <button
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
