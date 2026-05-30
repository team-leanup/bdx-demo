-- 2026-05-30: 고객 사전상담/예약 제출 RLS 수정 (P0) — 원격 적용 완료(apply_migration)
-- 원인: pre_consultations / booking_requests 의 *_verified_insert 정책 with_check 가
--       EXISTS(SELECT 1 FROM shops WHERE id = shop_id) 를 사용하는데, 이 서브쿼리는
--       anon 역할의 shops RLS 하에서 평가된다. anon 은 shop-demo 외 실제 샵을 SELECT 하지
--       못하므로 EXISTS=false → with_check 실패 → "new row violates row-level security policy".
--       결과: 모든 실제 샵에서 고객의 사전상담/예약 제출이 전면 차단됨 (shop-demo 만 동작).
-- 해결: 샵 존재 여부를 SECURITY DEFINER 함수로 확인(shops RLS 우회)하여 with_check 에 사용.
--       boolean(존재 여부)만 반환하므로 정보 노출 위험 없음.

create or replace function public.shop_exists(p_shop_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.shops where id = p_shop_id);
$$;

revoke execute on function public.shop_exists(text) from public;
grant execute on function public.shop_exists(text) to anon, authenticated;

-- pre_consultations: anon INSERT (경로 C 직접 제출)
drop policy if exists pre_consultations_verified_insert on public.pre_consultations;
create policy pre_consultations_verified_insert
  on public.pre_consultations
  for insert
  to anon
  with check ( public.shop_exists(shop_id) );

-- booking_requests: anon INSERT (경로 A 링크예약 / A-2 샵링크) — 채널 제한 유지
drop policy if exists booking_verified_insert on public.booking_requests;
create policy booking_verified_insert
  on public.booking_requests
  for insert
  to anon
  with check (
    public.shop_exists(shop_id)
    and channel = any (array['kakao','naver','phone','walk_in','pre_consult'])
  );
