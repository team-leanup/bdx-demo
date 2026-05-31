-- 0531 QA fixes
-- 1) 예약금(deposit) 영속화 — consultation_records.deposit 컬럼 추가.
--    지금까지 deposit은 Zustand/localStorage에만 존재해 리로드 후 소실되고,
--    삭제 시 totalSpend 롤백이 deposit을 빠뜨려 과소 차감되던 문제(HIGH).
ALTER TABLE public.consultation_records ADD COLUMN IF NOT EXISTS deposit integer;

-- 2) 종료 상태(completed/cancelled) 슬롯 재예약 허용.
--    기존 UNIQUE 인덱스가 완료/취소 행까지 포함해, 시술 완료된 날짜/시간 슬롯을
--    새 고객이 다시 예약할 수 없던 문제(MED). active(pending/confirmed) 행만 중복 방지.
DROP INDEX IF EXISTS uq_shoplink_slot;
CREATE UNIQUE INDEX uq_shoplink_slot
  ON public.booking_requests (shop_id, reservation_date, reservation_time)
  WHERE consultation_link_id IS NULL
    AND channel = 'pre_consult'
    AND status IN ('pending', 'confirmed')
    AND reservation_time <> '미정';

DROP INDEX IF EXISTS uq_booking_link_slot;
CREATE UNIQUE INDEX uq_booking_link_slot
  ON public.booking_requests (consultation_link_id, reservation_date, reservation_time)
  WHERE consultation_link_id IS NOT NULL
    AND status IN ('pending', 'confirmed')
    AND reservation_time <> '미정';
