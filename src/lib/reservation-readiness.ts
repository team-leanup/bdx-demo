import type { BookingRequest } from '@/types/consultation';

export type ReservationReadinessState = 'ready' | 'onsite_required';

interface ReservationReadinessMeta {
  state: ReservationReadinessState;
  dotColor: string;
  label: string;
  shortLabel: string;
  className: string;
}

const RESERVATION_READINESS_META: Record<ReservationReadinessState, ReservationReadinessMeta> = {
  ready: {
    state: 'ready',
    dotColor: 'bg-emerald-500',
    label: '디자인 확정',
    shortLabel: '확정',
    className: 'bg-emerald-100 text-emerald-700',
  },
  onsite_required: {
    state: 'onsite_required',
    dotColor: 'bg-amber-400',
    label: '현장 상담 필요',
    shortLabel: '현장상담',
    className: 'bg-surface-alt text-text-secondary',
  },
};

export function getReservationReadiness(
  booking: Pick<BookingRequest, 'preConsultationCompletedAt'>,
): ReservationReadinessMeta {
  if (booking.preConsultationCompletedAt) {
    return RESERVATION_READINESS_META.ready;
  }

  return RESERVATION_READINESS_META.onsite_required;
}
