-- 0601: 사전상담 슬롯 차단 정밀화
-- get_shop_pre_consult_data 가 예약별 endTime(종료시간)을 함께 반환하도록 변경.
--  - endTime = 예약 시작 + 해당 카테고리 시술시간(shops.settings.categoryPricing[*].time), 없으면 90분
--  - status: 취소(cancelled) 제외 — pending/confirmed/completed 모두 해당 시간 점유로 간주해 슬롯 차단
--    (이전엔 pending/confirmed만 막아 completed 예약 시간대가 다른 손님에게 열려 있던 버그)
--  - reservation_time 이 'HH:MM' 형식이 아닌(미정 등) 예약은 슬롯 차단 대상에서 제외
-- consultation-link-slots.ts 가 이 endTime 으로 정확한 구간겹침(S < bEnd && S+newDur > bStart)을 판정.

CREATE OR REPLACE FUNCTION public.get_shop_pre_consult_data(p_shop_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_shop public.shops%ROWTYPE;
  v_booked_slots JSONB;
  v_valid_from DATE := CURRENT_DATE;
  v_valid_until DATE := (CURRENT_DATE + INTERVAL '30 days')::date;
BEGIN
  SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'date', br.reservation_date,
      'time', br.reservation_time,
      'endTime', to_char(
        (br.reservation_time::time
          + (COALESCE(
              NULLIF(v_shop.settings->'categoryPricing'->(br.pre_consultation_data->>'designCategory')->>'time','')::int,
              90
            ) || ' minutes')::interval),
        'HH24:MI')
    )),
    '[]'::jsonb
  ) INTO v_booked_slots
  FROM public.booking_requests br
  WHERE br.shop_id = p_shop_id
    AND br.status IN ('pending','confirmed','completed')
    AND br.reservation_date ~ '^\d{4}-\d{2}-\d{2}$'
    AND br.reservation_time ~ '^\d{2}:\d{2}$'
    AND br.reservation_date::date >= v_valid_from
    AND br.reservation_date::date <= v_valid_until;

  RETURN jsonb_build_object(
    'id', 'shop:' || v_shop.id,
    'shopId', v_shop.id,
    'shopName', v_shop.name,
    'shopPhone', v_shop.phone,
    'shopAddress', v_shop.address,
    'status', 'active',
    'validFrom', v_valid_from,
    'validUntil', v_valid_until,
    'estimatedDurationMin', 90,
    'slotIntervalMin', 30,
    'bookedSlots', v_booked_slots,
    'businessHours', v_shop.business_hours,
    'portfolio', '[]'::jsonb,
    'expiresAt', (now() + INTERVAL '1 year')
  );
END;
$function$;
