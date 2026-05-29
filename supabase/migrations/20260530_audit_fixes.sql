-- 2026-05-30 심층 감사 수정: 보안 / 데이터 정합성
-- (Supabase MCP apply_migration 으로 원격 적용 완료 — 저장소 추적용)

-- 1) 레거시 4인자 complete_preconsultation_for_booking 오버로드 제거
--    (p_shop_id 없는 버전 — shop 검증을 우회해 임의 booking 의 pre_consultation_data 를
--     anon 이 덮어쓸 수 있던 취약점. 5인자 버전만 유지.)
DROP FUNCTION IF EXISTS public.complete_preconsultation_for_booking(text, jsonb, timestamptz, text);

-- 2) 공유 상담 링크 슬롯 중복 예약 방지
--    링크 기반 예약만 대상 (consultation_link_id IS NOT NULL). NULL 인 일반/사전상담 예약은 제외.
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_link_slot
  ON public.booking_requests (consultation_link_id, reservation_date, reservation_time)
  WHERE consultation_link_id IS NOT NULL;

-- 3) 포트폴리오 대표(추천)/인기 뱃지 영속화 — 기존엔 로컬 상태만 토글되어 새로고침 시 유실
ALTER TABLE public.portfolio_photos
  ADD COLUMN IF NOT EXISTS is_staff_pick boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false;

-- 4) 플랫폼 관리자/통계 RPC 권한 회수
--    get_bdx_shop_stats 는 owner_email(PII), get_bdx_admin_stats 는 전체 비즈니스 지표를 노출.
--    함수 EXECUTE 는 기본 PUBLIC 에 부여되므로 PUBLIC 에서 회수해야 anon/authenticated 가 차단됨.
REVOKE EXECUTE ON FUNCTION public.get_bdx_admin_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_bdx_shop_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_bdx_admin_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_bdx_shop_stats() TO service_role;
