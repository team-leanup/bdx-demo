'use client';

import { cn } from '@/lib/cn';
import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
  /** 입력 필드 오른쪽에 렌더링할 엘리먼트 (비밀번호 토글 등) */
  rightElement?: React.ReactNode;
}

export function Input({ label, error, hint, className, id, rightElement, ...props }: InputProps) {
  const inputId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

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
      <div className="relative w-full">
        <input
          id={inputId}
          className={cn(
            'w-full h-12 px-4 rounded-xl border bg-surface text-text text-base placeholder:text-text-muted transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary',
            error
              ? 'border-error focus-visible:ring-error'
              : 'border-border hover:border-text-muted',
            rightElement ? 'pr-11' : '',
            className,
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
