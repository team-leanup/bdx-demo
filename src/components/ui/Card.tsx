import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className, onClick, hoverable }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-3xl shadow-[var(--shadow-bento)] border border-border p-4 md:p-6',
        hoverable &&
          'cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-bento-hover)] hover:-translate-y-1 active:scale-[0.99]',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
