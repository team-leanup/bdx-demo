-- 0601 QA(HIGH): path-C(직접접근) 사전상담은 reservation_time=''(빈 문자열)로 INSERT된다.
-- 기존 uq_shoplink_slot/uq_booking_link_slot는 '미정'만 제외하고 ''는 제외하지 않아,
-- 같은 날 같은 샵에서 두 번째 시간미정 제출이 (shop_id, today, '') 중복으로 23505 위반 →
-- pre_consultation만 'completed'로 남고 booking_request 없는 orphan 상태가 됨.
-- 시간미정('' 또는 '미정')은 슬롯 점유가 아니므로 UNIQUE 대상에서 모두 제외한다.
DROP INDEX IF EXISTS uq_shoplink_slot;
CREATE UNIQUE INDEX uq_shoplink_slot
  ON public.booking_requests (shop_id, reservation_date, reservation_time)
  WHERE consultation_link_id IS NULL
    AND channel = 'pre_consult'
    AND status IN ('pending', 'confirmed')
    AND reservation_time <> '미정'
    AND reservation_time <> '';

DROP INDEX IF EXISTS uq_booking_link_slot;
CREATE UNIQUE INDEX uq_booking_link_slot
  ON public.booking_requests (consultation_link_id, reservation_date, reservation_time)
  WHERE consultation_link_id IS NOT NULL
    AND status IN ('pending', 'confirmed')
    AND reservation_time <> '미정'
    AND reservation_time <> '';
