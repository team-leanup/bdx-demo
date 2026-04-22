-- 2026-04-22: 회원권 + 차액(현금/카드) 복합 결제 지원
-- 시술금이 회원권 단가보다 클 때 차액을 현금/카드로 받는 경우 저장
-- 예) 시술 7만원 − 회원권 단가 5만원 = 차액 2만원을 card로 받음
--   payment_method = 'membership'
--   secondary_payment_method = 'card'
--   secondary_amount = 20000

ALTER TABLE consultation_records
  ADD COLUMN IF NOT EXISTS secondary_payment_method text,
  ADD COLUMN IF NOT EXISTS secondary_amount integer;

COMMENT ON COLUMN consultation_records.secondary_payment_method IS
  '복합 결제 시 차액의 결제 수단 (cash|card). 회원권 단독 결제 시 null';
COMMENT ON COLUMN consultation_records.secondary_amount IS
  '복합 결제 시 차액 금액 (원). null 또는 0이면 차액 없음';

-- Supabase RLS는 기존 정책 (shop_id 기반) 그대로 적용됨 (컬럼 추가만)
