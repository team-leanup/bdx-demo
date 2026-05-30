-- 2026-05-30: 사전상담/예약 제출 RLS 보강 (P0-2) — 원격 적용 완료(apply_migration)
-- 앞선 20260530_fix_anon_submit_rls 는 정책을 anon 으로만 만들었으나,
-- 로그인한 사장님이 본인 매장 고객화면(/pre-consult)을 테스트하면 요청 역할이 authenticated 라
-- pre_consultations 에 authenticated INSERT 정책이 없어 403 (owner 는 select/delete 만 존재).
-- (booking_requests 는 booking_auth_all 로 본인 샵은 가능하나, 일관성을 위해 함께 확장)
-- → 두 정책을 anon + authenticated 모두 허용하도록 확장. 검증은 shop_exists(shop_id) 로 동일 유지.
-- 검증: authenticated 역할 INSERT pc/bk 모두 통과 실측.

drop policy if exists pre_consultations_verified_insert on public.pre_consultations;
create policy pre_consultations_verified_insert
  on public.pre_consultations
  for insert
  to anon, authenticated
  with check ( public.shop_exists(shop_id) );

drop policy if exists booking_verified_insert on public.booking_requests;
create policy booking_verified_insert
  on public.booking_requests
  for insert
  to anon, authenticated
  with check (
    public.shop_exists(shop_id)
    and channel = any (array['kakao','naver','phone','walk_in','pre_consult'])
  );
