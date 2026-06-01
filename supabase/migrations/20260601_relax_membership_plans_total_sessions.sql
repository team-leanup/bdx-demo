-- 0601: 회원권이 '금액 차감' 방식으로 전환되어 횟수(total_sessions)는 더 이상 입력받지 않음(금액권=0).
-- 기존 CHECK (total_sessions > 0)가 금액권(0) INSERT를 막아 '회원권 상품 추가'가 전부 실패하던 버그 수정.
-- (이미 remote에 apply_migration로 적용됨 — 이 파일은 레포 기록용 SSOT)
ALTER TABLE public.membership_plans
  DROP CONSTRAINT IF EXISTS membership_plans_total_sessions_check;

ALTER TABLE public.membership_plans
  ADD CONSTRAINT membership_plans_total_sessions_check CHECK (total_sessions >= 0);

-- 신규 행이 total_sessions를 누락해도 0으로 안전하게 들어가도록 기본값 부여.
ALTER TABLE public.membership_plans
  ALTER COLUMN total_sessions SET DEFAULT 0;
