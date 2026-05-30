-- 2026-05-30: 오프/제거 추가금 이중필드 정합화 (데이터 백필) — 원격 적용 완료(execute_sql)
-- 배경: 자샵/타샵 오프 가격이 두 표현으로 분리 저장됨.
--   - settings.baseOffSameShop / baseOffOtherShop  → 상담(calculatePrice)·records 가격분해
--   - settings.surcharges.selfRemoval / otherRemoval → 사전상담(calculatePreConsultPrice)·현장모드
-- settings 저장이 baseOff* 만 갱신하고 surcharges.*Removal 은 온보딩에서만 설정돼,
-- 설정에서 오프 가격을 바꿔도 사전상담/현장에 반영되지 않는 분리가 발생.
-- 코드는 handleSavePrices 가 이제 두 표현을 모두 동기화하도록 수정했고(다음 저장부터),
-- 본 백필은 기존 데이터를 일괄 정합화한다. 비-기본값(의도된 값) 우선 통일.

with calc as (
  select id,
    case when (settings->>'baseOffSameShop') ~ '^\d+$' and (settings->>'baseOffSameShop')::int <> 5000
         then (settings->>'baseOffSameShop')::int
         else coalesce(nullif(settings->'surcharges'->>'selfRemoval','')::int, 5000) end as v_same,
    case when (settings->>'baseOffOtherShop') ~ '^\d+$' and (settings->>'baseOffOtherShop')::int <> 10000
         then (settings->>'baseOffOtherShop')::int
         else coalesce(nullif(settings->'surcharges'->>'otherRemoval','')::int, 10000) end as v_other
  from shops
  where id <> 'shop-demo' and settings->'surcharges' is not null
)
update shops s
set settings = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(s.settings, '{baseOffSameShop}', to_jsonb(c.v_same)),
          '{baseOffOtherShop}', to_jsonb(c.v_other)),
        '{surcharges,selfRemoval}', to_jsonb(c.v_same)),
      '{surcharges,otherRemoval}', to_jsonb(c.v_other)),
    updated_at = now()
from calc c
where s.id = c.id;
