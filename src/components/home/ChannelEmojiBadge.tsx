'use client';

import { Badge } from '@/components/ui';

interface ChannelEmojiBadgeProps {
  variant: string;
  icon: string;
  label: string;
}

export function ChannelEmojiBadge({ variant, label }: ChannelEmojiBadgeProps): React.ReactElement {
  return (
    <Badge variant={variant as 'primary' | 'neutral' | 'success' | 'warning'} size="sm">
      {label}
    </Badge>
  );
}
