'use client';

import { cn } from '@/lib/cn';

interface TraitIconProps {
  value: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const TRAIT_ICON_MAP: Record<string, string> = {
  큐티클민감: '💅',
  손톱얇음: '⚠️',
  알러지주의: '🚫',
  손톱약함: '🩹',
  손톱잘부러짐: '💔',
  젤알러지없음: '✅',
  연장이력있음: '📏',
  리페어자주함: '🔄',
  오른손잡이: '👉',
  왼손잡이: '👈',
  대화선호: '💬',
  조용히: '🤫',
  빠른시술: '⚡',
  화려선호: '💎',
};

const SIZE_CLASSES: Record<NonNullable<TraitIconProps['size']>, { container: string; icon: string; text: string }> = {
  sm: { container: 'px-2.5 py-1.5 gap-1 rounded-xl', icon: 'text-sm', text: 'text-xs' },
  md: { container: 'px-3 py-2 gap-1.5 rounded-xl', icon: 'text-base', text: 'text-sm' },
  lg: { container: 'px-4 py-3 gap-2 rounded-2xl', icon: 'text-xl', text: 'text-sm' },
};

export function TraitIcon({
  value,
  icon,
  size = 'md',
  selected = false,
  onClick,
  className,
}: TraitIconProps): React.ReactElement {
  const resolvedIcon = icon ?? TRAIT_ICON_MAP[value];
  const sizeClasses = SIZE_CLASSES[size];

  const content = (
    <>
      {resolvedIcon && <span className={sizeClasses.icon}>{resolvedIcon}</span>}
      <span className={cn('font-medium', sizeClasses.text)}>{value}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center border transition-colors duration-150',
          sizeClasses.container,
          selected
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-surface border-border text-text-secondary hover:border-primary/40',
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center border',
        sizeClasses.container,
        selected
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-surface border-border text-text-secondary',
        className,
      )}
    >
      {content}
    </span>
  );
}

export default TraitIcon;
