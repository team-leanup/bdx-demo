import { cn } from '@/lib/cn';
import { getReservationReadiness } from '@/lib/reservation-readiness';
import type { BookingRequest } from '@/types/consultation';

interface ReservationReadinessBadgeProps {
  booking: Pick<BookingRequest, 'preConsultationCompletedAt'>;
  size?: 'sm' | 'xs';
  compact?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ReservationReadinessBadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  xs: 'px-1.5 py-0.5 text-[9px]',
};

export function ReservationReadinessBadge({
  booking,
  size = 'sm',
  compact = false,
  className,
}: ReservationReadinessBadgeProps): React.ReactElement {
  const readiness = getReservationReadiness(booking);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold',
        SIZE_CLASSES[size],
        readiness.className,
        className,
      )}
      title={readiness.label}
    >
      <span>{readiness.icon}</span>
      <span>{compact ? readiness.shortLabel : readiness.label}</span>
    </span>
  );
}
