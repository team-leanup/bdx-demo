import type { BookingRequest, ConsultationRecord } from '@/types/consultation';

export type BookingStage = 'just_registered' | 'link_sent' | 'pre_consult_done' | 'in_treatment' | 'completed' | 'cancelled';

export const STAGE_LABELS: Record<BookingStage, string> = {
  just_registered: '방금 등록',
  link_sent: '링크 발송됨',
  pre_consult_done: '사전 상담 완료',
  in_treatment: '시술 중',
  completed: '완료',
  cancelled: '취소됨',
};

// ── 사용자 표시용 4단계 (링크 미발송 / 응답 대기 / 응답 완료 / 시술 완료) ──
// 내부 6단계(BookingStage)를 원장이 이해하기 쉬운 4단계로 매핑. cancelled 는 별도 스타일이라 제외(null).
export type DisplayStage = 'link_not_sent' | 'waiting_response' | 'response_done' | 'treatment_done';

export const DISPLAY_STAGE_LABELS: Record<DisplayStage, string> = {
  link_not_sent: '링크 미발송',
  waiting_response: '응답 대기',
  response_done: '응답 완료',
  treatment_done: '시술 완료',
};

/** 4단계 점/뱃지 색 (범례·타임그리드·카드가 동일 색 공유) */
export const DISPLAY_STAGE_DOT: Record<DisplayStage, string> = {
  link_not_sent: 'bg-slate-300',
  waiting_response: 'bg-amber-400',
  response_done: 'bg-emerald-500',
  treatment_done: 'bg-blue-500',
};

export const DISPLAY_STAGE_ORDER: DisplayStage[] = [
  'link_not_sent', 'waiting_response', 'response_done', 'treatment_done',
];

export function toDisplayStage(stage: BookingStage): DisplayStage | null {
  switch (stage) {
    case 'just_registered': return 'link_not_sent';
    case 'link_sent': return 'waiting_response';
    case 'pre_consult_done':
    case 'in_treatment': return 'response_done';
    case 'completed': return 'treatment_done';
    case 'cancelled': return null; // 취소는 회색+취소선 별도 스타일
  }
}

export function getBookingStage(
  booking: BookingRequest,
  matchedRecord?: ConsultationRecord | null,
): BookingStage {
  // Stage 0: cancelled
  if (booking.status === 'cancelled') {
    return 'cancelled';
  }
  // Stage 5: completed
  if (booking.status === 'completed' || matchedRecord?.finalizedAt) {
    return 'completed';
  }
  // Stage 4: in_treatment — matchedRecord 있지만 finalizedAt 없음
  if (matchedRecord && !matchedRecord.finalizedAt) {
    return 'in_treatment';
  }
  // Stage 3: pre_consult_done
  if (booking.preConsultationCompletedAt) {
    return 'pre_consult_done';
  }
  // Stage 2: link_sent
  if (booking.consultationLinkSentAt) {
    return 'link_sent';
  }
  // Stage 1: just_registered
  return 'just_registered';
}
