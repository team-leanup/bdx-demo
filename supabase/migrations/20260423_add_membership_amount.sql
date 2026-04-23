-- 2026-04-23 반영: 회원권 금액 기반 잔액 추적
-- 지승호 대표 피드백: "얼마 남았는지" 기준으로 표기 + 차액 현금/카드 결제

-- membership_transactions 에 amount_delta 추가
-- - purchase 시 +구매금액
-- - use / manual_deduct 시 -차감금액
-- NULL 허용 (기존 레거시 트랜잭션 + 금액 추적 불가능한 케이스 호환)
ALTER TABLE IF EXISTS public.membership_transactions
  ADD COLUMN IF NOT EXISTS amount_delta INTEGER;

COMMENT ON COLUMN public.membership_transactions.amount_delta IS
  '금액 기반 차감/추가. +purchase 시 구매금액, -use/manual_deduct 시 차감금액. NULL은 레거시 데이터.';

-- 주의: customers.membership JSON 컬럼 내부 필드(usedAmount, remainingAmount)는
-- JSONB 구조라 마이그레이션 없이 앱 레이어에서 추가/읽기 가능.
-- 하위 호환: 필드 부재 시 횟수 기반으로 추정 (src/lib/membership.ts).
