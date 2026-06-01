-- 0601: 상담기록과 연결 안 된 단독 포트폴리오 사진도 공유카드 링크가 동작하도록.
-- 기존엔 share_card_id가 consultation_records에만 있어, record_id=null 사진 공유 시
-- dbCreateShareCard가 0행 업데이트(에러 없이 success) → 공개 페이지 404("존재하지 않는 공유카드").
-- 포트폴리오 사진에도 컬럼 추가 + fetchShareCardPublicData가 사진 기반으로 폴백.
-- (이미 remote에 apply_migration로 적용됨 — 이 파일은 레포 기록용 SSOT)
ALTER TABLE public.portfolio_photos ADD COLUMN IF NOT EXISTS share_card_id text;
CREATE INDEX IF NOT EXISTS portfolio_photos_share_card_id_idx
  ON public.portfolio_photos (share_card_id) WHERE share_card_id IS NOT NULL;
