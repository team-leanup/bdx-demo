-- 0601: 슬롯 차단 RPC의 카테고리 시술시간 폴백을 90→60분으로 통일.
-- 스케줄 타임그리드(toTimeGridEvents)의 미분류 예약 폴백(60분)과 일치시켜
-- designCategory 없는 예약에서도 스케줄 표시 종료시간 == 슬롯 차단 구간이 되게 함.
-- (이전 20260601_pre_consult_slots_endtime.sql의 COALESCE(...,90)을 60으로만 변경)
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
