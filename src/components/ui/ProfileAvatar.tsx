'use client';

import Image from 'next/image';
import { useDesignerStore } from '@/store/designer-store';
import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
} as const;

interface ProfileAvatarProps {
  designerId: string;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function ProfileAvatar({
  designerId,
  name,
  size = 'md',
  className,
}: ProfileAvatarProps) {
  const imageUrl = useDesignerStore((s) => s.profileImages[designerId]);

  if (imageUrl) {
    return (
      <div className={cn(
        'relative rounded-full overflow-hidden flex-shrink-0',
        SIZES[size],
        className,
      )}>
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0',
        SIZES[size],
        className,
      )}
    >
      {name.charAt(0)}
    </div>
  );
}
