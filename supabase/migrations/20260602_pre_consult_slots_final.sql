-- 0602: get_shop_pre_consult_data 최종 정본(통합).
-- 같은 날(20260601) 4개 마이그레이션이 파일명 알파벳순 재적용될 때 fallback60(커스텀 미포함)이
-- custom_category_time(커스텀 포함)을 덮어쓰는 회귀를 방지하기 위해, 날짜상 최후순위(20260602)에
-- 완전한 정본을 둔다. 라이브 DB는 이미 custom_category_time이 마지막 적용돼 정상이나, 멱등 재적용으로
-- 레포 재적용(supabase db push) 시에도 항상 이 버전이 최종이 되게 한다.
-- 규칙: 취소만 제외(pending/confirmed/completed 차단) · endTime=시작+카테고리시술시간
--   (built-in: categoryPricing[key].time, custom: customCategories[](id=key).time, 폴백 60) · slotInterval 30
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
