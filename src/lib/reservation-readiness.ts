import type { BookingRequest } from '@/types/consultation';

export type ReservationReadinessState = 'link_not_sent' | 'waiting_response' | 'completed';

interface ReservationReadinessMeta {
  state: ReservationReadinessState;
  dotColor: string;
  label: string;
  shortLabel: string;
  className: string;
}

const RESERVATION_READINESS_META: Record<ReservationReadinessState, ReservationReadinessMeta> = {
  completed: {
    state: 'completed',
    dotColor: 'bg-emerald-500',
    label: '사전 상담 완료',
    shortLabel: '상담완료',
    className: 'bg-emerald-50 text-emerald-700',
  },
  waiting_response: {
    state: 'waiting_response',
    dotColor: 'bg-amber-400',
    label: '응답 대기',
    shortLabel: '대기중',
    className: 'bg-amber-50 text-amber-700',
  },
  link_not_sent: {
    state: 'link_not_sent',
    dotColor: 'bg-slate-300',
    label: '링크 미발송',
    shortLabel: '미발송',
    className: 'bg-slate-50 text-slate-500',
  },
};

export function getReservationReadiness(
  booking: Pick<BookingRequest, 'preConsultationCompletedAt' | 'consultationLinkSentAt'>,
): ReservationReadinessMeta {
  if (booking.preConsultationCompletedAt) {
    return RESERVATION_READINESS_META.completed;
  }

  if (booking.consultationLinkSentAt) {
    return RESERVATION_READINESS_META.waiting_response;
  }

  return RESERVATION_READINESS_META.link_not_sent;
}
