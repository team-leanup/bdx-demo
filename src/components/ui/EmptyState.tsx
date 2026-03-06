'use client';

import { cn } from '@/lib/cn';
import { Button } from './Button';
import type { ReactNode } from 'react';

type EmptyStateVariant = 'default' | 'compact' | 'card';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: EmptyStateVariant;
  className?: string;
}

const defaultIcons: Record<string, ReactNode> = {
  search: (
    <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  empty: (
    <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  error: (
    <svg className="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  offline: (
    <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  ),
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className,
}: EmptyStateProps): React.ReactElement {
  const variantStyles: Record<EmptyStateVariant, string> = {
    default: 'py-16 px-6',
    compact: 'py-8 px-4',
    card: 'py-12 px-6 bg-surface rounded-2xl border border-border',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variantStyles[variant],
        className,
      )}
    >
      {icon && (
        <div className="mb-4">
          {icon}
        </div>
      )}
      
      <h3 className={cn(
        'font-semibold text-text',
        variant === 'compact' ? 'text-base' : 'text-lg',
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          'text-text-secondary mt-2 max-w-sm',
          variant === 'compact' ? 'text-sm' : 'text-base',
        )}>
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className={cn(
          'flex items-center gap-3',
          variant === 'compact' ? 'mt-4' : 'mt-6',
        )}>
          {action && (
            <Button
              variant={action.variant ?? 'primary'}
              size={variant === 'compact' ? 'sm' : 'md'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={variant === 'compact' ? 'sm' : 'md'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface EmptySearchResultProps {
  query?: string;
  onClear?: () => void;
  className?: string;
}

export function EmptySearchResult({
  query,
  onClear,
  className,
}: EmptySearchResultProps): React.ReactElement {
  return (
    <EmptyState
      icon={defaultIcons.search}
      title={query ? `"${query}"에 대한 검색 결과가 없습니다` : '검색 결과가 없습니다'}
      description="다른 검색어로 다시 시도해 보세요"
      action={onClear ? { label: '검색 초기화', onClick: onClear, variant: 'secondary' } : undefined}
      variant="compact"
      className={className}
    />
  );
}

interface EmptyListProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyList({
  title = '데이터가 없습니다',
  description,
  action,
  className,
}: EmptyListProps): React.ReactElement {
  return (
    <EmptyState
      icon={defaultIcons.empty}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = '오류가 발생했습니다',
  description = '잠시 후 다시 시도해 주세요',
  onRetry,
  className,
}: ErrorStateProps): React.ReactElement {
  return (
    <EmptyState
      icon={defaultIcons.error}
      title={title}
      description={description}
      action={onRetry ? { label: '다시 시도', onClick: onRetry, variant: 'primary' } : undefined}
      className={className}
    />
  );
}

interface OfflineStateProps {
  onRetry?: () => void;
  className?: string;
}

export function OfflineState({
  onRetry,
  className,
}: OfflineStateProps): React.ReactElement {
  return (
    <EmptyState
      icon={defaultIcons.offline}
      title="인터넷 연결 없음"
      description="네트워크 연결을 확인하고 다시 시도해 주세요"
      action={onRetry ? { label: '다시 시도', onClick: onRetry, variant: 'secondary' } : undefined}
      className={className}
    />
  );
}
