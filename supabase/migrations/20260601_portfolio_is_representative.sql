-- 0601: 카테고리 대표사진(커버) 명시 지정.
-- 기존엔 '첫 번째 메뉴등록(is_featured) 사진'이 자동 대표였으나,
-- 사장님이 추천/인기처럼 토글로 카테고리별 대표 1장을 직접 고를 수 있게 함.
-- 카테고리당 1장 원칙은 앱(portfolio-store.setRepresentative)에서 보장(같은 styleCategory 내 단일 true).
-- CategoryPicker는 1순위 is_representative → 2순위 is_featured(첫장) 폴백으로 커버를 고른다.
ALTER TABLE public.portfolio_photos
  ADD COLUMN IF NOT EXISTS is_representative boolean NOT NULL DEFAULT false;
