-- CF-5: 포트폴리오 사진을 커스텀 메뉴 카테고리(custom-*)로 분류할 수 있도록
-- style_category check를 builtin 4종 + custom-* 형식까지 허용하도록 완화한다.
alter table public.portfolio_photos drop constraint if exists portfolio_photos_style_category_check;
alter table public.portfolio_photos add constraint portfolio_photos_style_category_check
  check (
    style_category is null
    or style_category = any (array['simple','french','magnet','art'])
    or style_category like 'custom-%'
  );
