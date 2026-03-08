import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string;
  height?: string;
  animation?: 'pulse' | 'shimmer' | 'none';
  style?: React.CSSProperties;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  style,
}: SkeletonProps): React.ReactElement {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-surface-alt via-surface to-surface-alt bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-surface-alt',
        variantStyles[variant],
        animationStyles[animation],
        className,
      )}
      style={{
        width,
        height,
        ...style,
      }}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  gap?: 'sm' | 'md' | 'lg';
  lastLineWidth?: number;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  gap = 'sm',
  lastLineWidth = 0.6,
  className,
}: SkeletonTextProps): React.ReactElement {
  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  return (
    <div className={cn('flex flex-col', gapStyles[gap], className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            'h-4',
            i === lines - 1 && lastLineWidth < 1 && `w-[${lastLineWidth * 100}%]`,
          )}
          style={i === lines - 1 && lastLineWidth < 1 ? { width: `${lastLineWidth * 100}%` } : undefined}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  hasImage?: boolean;
  imageAspect?: 'square' | 'video' | 'wide';
  textLines?: number;
  className?: string;
}

export function SkeletonCard({
  hasImage = true,
  imageAspect = 'video',
  textLines = 2,
  className,
}: SkeletonCardProps): React.ReactElement {
  const aspectStyles = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  };

  return (
    <div className={cn('bg-surface rounded-2xl border border-border p-4 md:p-5', className)}>
      {hasImage && (
        <Skeleton
          variant="rounded"
          className={cn('w-full mb-4', aspectStyles[imageAspect])}
        />
      )}
      <div className="space-y-3">
        <Skeleton variant="text" className="h-5 w-3/4" />
        {textLines > 1 && (
          <div className="space-y-2">
            {Array.from({ length: textLines - 1 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="text"
                className="h-4"
                style={{ width: i === textLines - 2 ? '60%' : '100%' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function SkeletonAvatar({
  size = 'md',
  className,
}: SkeletonAvatarProps): React.ReactElement {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton
      variant="circular"
      className={cn(sizeStyles[size], className)}
    />
  );
}

interface SkeletonListProps {
  count?: number;
  hasAvatar?: boolean;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SkeletonList({
  count = 3,
  hasAvatar = true,
  gap = 'md',
  className,
}: SkeletonListProps): React.ReactElement {
  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn('flex flex-col', gapStyles[gap], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {hasAvatar && <SkeletonAvatar size="md" />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-3/4" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  hasHeader = true,
  className,
}: SkeletonTableProps): React.ReactElement {
  return (
    <div className={cn('w-full', className)}>
      {hasHeader && (
        <div className="flex gap-4 pb-3 border-b border-border mb-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" className="h-4 flex-1" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                variant="text"
                className="h-4 flex-1"
                style={{ width: colIndex === 0 ? '30%' : undefined }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
