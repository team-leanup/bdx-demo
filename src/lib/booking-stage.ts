import type { BookingRequest, ConsultationRecord } from '@/types/consultation';

export type BookingStage = 'just_registered' | 'link_sent' | 'pre_consult_done' | 'in_treatment' | 'completed';

export const STAGE_LABELS: Record<BookingStage, string> = {
  just_registered: '방금 등록',
  link_sent: '링크 발송됨',
  pre_consult_done: '사전 상담 완료',
  in_treatment: '시술 중',
  completed: '완료',
};

export function getBookingStage(
  booking: BookingRequest,
  matchedRecord?: ConsultationRecord | null,
): BookingStage {
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
