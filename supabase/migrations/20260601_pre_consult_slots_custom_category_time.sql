-- 0601: 슬롯 차단 RPC가 커스텀 카테고리(custom-*) 시술시간도 해석.
-- built-in은 settings->categoryPricing[key].time, custom은 settings->customCategories[](id=key).time.
-- 수동 예약도 designCategory가 pre_consultation_data에 실리므로 동일 경로로 시간 적용.
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
              -- built-in 카테고리: categoryPricing[key].time
              NULLIF(v_shop.settings->'categoryPricing'->(br.pre_consultation_data->>'designCategory')->>'time','')::int,
              -- custom 카테고리: customCategories 배열에서 id=key 의 time
              (SELECT NULLIF(c->>'time','')::int
                 FROM jsonb_array_elements(COALESCE(v_shop.settings->'customCategories','[]'::jsonb)) c
                WHERE c->>'id' = (br.pre_consultation_data->>'designCategory')
                LIMIT 1),
              60
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
