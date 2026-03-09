import type { BookingRequest } from '@/types/consultation';

export type ReservationReadinessState = 'ready' | 'onsite_required';

interface ReservationReadinessMeta {
  state: ReservationReadinessState;
  icon: string;
  label: string;
  shortLabel: string;
  className: string;
}

const RESERVATION_READINESS_META: Record<ReservationReadinessState, ReservationReadinessMeta> = {
  ready: {
    state: 'ready',
    icon: '🟢',
    label: '디자인 확정',
    shortLabel: '확정',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  onsite_required: {
    state: 'onsite_required',
    icon: '🟡',
    label: '현장 상담 필요',
    shortLabel: '현장상담',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
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
