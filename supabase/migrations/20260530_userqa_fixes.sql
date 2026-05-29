-- 사용자관점 QA 후속 수정 (2026-05-30) — 원격 적용 완료(apply_migration)
-- 1) 포트폴리오 파츠 메모 영속화용 컬럼 (PortfolioOverlay partsMemo → DB)
ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS parts_memo text;

-- 2) 샵 링크(consultation_link_id NULL) 사전상담 슬롯 중복 예약 방지
--    채널=pre_consult, 취소/미정 제외 — 워크인/수동 예약·디자이너별 일정에는 영향 없음
CREATE UNIQUE INDEX IF NOT EXISTS uq_shoplink_slot
  ON booking_requests (shop_id, reservation_date, reservation_time)
  WHERE consultation_link_id IS NULL
    AND channel = 'pre_consult'
    AND status <> 'cancelled'
    AND reservation_time <> '미정';
