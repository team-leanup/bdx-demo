-- Membership Plan Templates
-- 2026-04-17 회의 결정: 사장님이 설정 탭에서 회원권 상품(템플릿)을 등록하고,
--                       고객 카드에서 상품을 선택해 부여. 정산 시 자동 차감.

CREATE TABLE IF NOT EXISTS membership_plans (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
  valid_days INTEGER CHECK (valid_days IS NULL OR valid_days > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_plans_shop_id ON membership_plans(shop_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_shop_active
  ON membership_plans(shop_id, is_active, sort_order)
  WHERE is_active = true;

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION touch_membership_plans_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_membership_plans_updated_at ON membership_plans;
CREATE TRIGGER trg_touch_membership_plans_updated_at
BEFORE UPDATE ON membership_plans
FOR EACH ROW
EXECUTE FUNCTION touch_membership_plans_updated_at();

-- RLS
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS membership_plans_owner_select ON membership_plans;
CREATE POLICY membership_plans_owner_select ON membership_plans
  FOR SELECT
  USING (shop_id = (SELECT get_my_shop_id()));

DROP POLICY IF EXISTS membership_plans_owner_insert ON membership_plans;
CREATE POLICY membership_plans_owner_insert ON membership_plans
  FOR INSERT
  WITH CHECK (shop_id = (SELECT get_my_shop_id()));

DROP POLICY IF EXISTS membership_plans_owner_update ON membership_plans;
CREATE POLICY membership_plans_owner_update ON membership_plans
  FOR UPDATE
  USING (shop_id = (SELECT get_my_shop_id()))
  WITH CHECK (shop_id = (SELECT get_my_shop_id()));

DROP POLICY IF EXISTS membership_plans_owner_delete ON membership_plans;
CREATE POLICY membership_plans_owner_delete ON membership_plans
  FOR DELETE
  USING (shop_id = (SELECT get_my_shop_id()));

-- 데모 샵 전용 개방 (shop-demo)
DROP POLICY IF EXISTS membership_plans_demo_open ON membership_plans;
CREATE POLICY membership_plans_demo_open ON membership_plans
  FOR ALL
  USING (shop_id = 'shop-demo')
  WITH CHECK (shop_id = 'shop-demo');

COMMENT ON TABLE membership_plans IS '샵별 회원권 상품 템플릿. 사장님이 설정에서 등록, 고객 카드에서 선택으로 부여.';
COMMENT ON COLUMN membership_plans.valid_days IS '구매일로부터 유효기간(일). NULL이면 무기한.';
