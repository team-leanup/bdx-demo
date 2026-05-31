-- 0531 R3 (HIGH security): booking_verified_insert 채널 주입 차단.
-- 기존 정책은 anon/authenticated가 kakao/naver/phone/walk_in/pre_consult 어떤 채널로든
-- 임의 shop_id에 booking_requests INSERT 가능 → 타 샵에 스팸 예약 주입·통계 왜곡.
-- 정상 익명 제출은 공유링크 셀프예약(channel='pre_consult')뿐이고,
-- 원장 직접 등록 채널(kakao/naver/phone/walk_in)은 booking_auth_all(authenticated + 본인샵)이 이미 커버.
-- → verified_insert를 pre_consult 전용으로 좁힌다.
drop policy if exists booking_verified_insert on public.booking_requests;
create policy booking_verified_insert
  on public.booking_requests
  for insert
  to anon, authenticated
  with check (
    public.shop_exists(shop_id)
    and channel = 'pre_consult'
  );
