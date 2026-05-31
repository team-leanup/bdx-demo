# BDX 현황표 ↔ Supabase DB 자동 동기화

파일럿 샵 가입자 수, 스토리지 사용량 등을 구글 시트에서 자동으로 보기 위한 셋업 가이드.

## 구성

- **DB 함수** (`supabase/migrations/...add_bdx_admin_stats_rpc.sql`) — Supabase 에 이미 적용 완료
  - `public.get_bdx_admin_stats()` — 전체 집계 (**service_role 키 필요** — 0530 보안 변경)
  - `public.get_bdx_shop_stats()` — 샵별 상세 (service_role 키 필요)
- **Apps Script** (`scripts/sheets-bdx-stats.gs`) — 시트에 붙여넣을 코드
- **시트** — `BDX-현황표` (https://docs.google.com/spreadsheets/d/1U2zYcGAGFY6slF-nLOeB3l0xcTGWibkaU3V88t0Va-Q)
  - `전체 현황` 탭 — 가입자/샵/디자이너/스토리지 요약
  - `샵별 현황` 탭 — 샵별 가입일, 오너 이메일, 사용량

## 셋업 (1회만)

1. 시트 열기 → `확장 프로그램` → `Apps Script`
2. `Code.gs` 의 모든 내용 삭제 → `scripts/sheets-bdx-stats.gs` 내용 전체 붙여넣기 → 저장
3. 좌측 톱니바퀴 (`Project Settings`) → `Script properties` → `Add script property`
   - `SUPABASE_URL` = `https://pzwmqorvrhdkckkdqemo.supabase.co`
   - `SUPABASE_SERVICE_KEY` = (Supabase Dashboard → Project Settings → API → `service_role` `secret`) **필수**
   - `SUPABASE_ANON_KEY` = (동일 페이지 → `anon` `public`)  ※ 현재 코드 미사용(하위호환 보관용)

   > ⚠️ **2026-05-30 보안 변경**: 두 RPC 모두 anon 에게 비즈니스 지표·PII 를 노출하므로
   > anon/authenticated EXECUTE 권한을 회수하고 **service_role 전용**으로 좁혔습니다.
   > 따라서 `전체 현황`·`샵별 현황` 두 탭 모두 `SUPABASE_SERVICE_KEY` 가 있어야 동기화됩니다.
4. 상단 함수 선택 박스에서 `syncAll` 선택 → `▶ 실행` → 권한 승인 (Google 계정 로그인)
5. 시계 아이콘 (`트리거`) → `+ 트리거 추가`
   - 실행 함수: `syncAll`
   - 이벤트 소스: `시간 기반`
   - 주기: 원하는 간격 (`시간 단위 타이머` → `1시간마다` 권장)

## 결과

설정 후 `전체 현황` 탭이 다음 형태로 자동 갱신됨:

| 항목 | 값 |
|------|-----|
| 최종 갱신 | 2026-05-07 17:48 |
| 전체 가입 계정 | 25 |
| 최근 7일 가입 | 0 |
| 최근 30일 가입 | 2 |
| 샵 | 22 |
| 고객 | 144 |
| 상담 기록 | 104 |
| 예약 | 80 |
| 포트폴리오 사진 | 39 |
| 스토리지 사용량 | 36.5 MB |
| ㄴ portfolio-images | 79개 / 23.4 MB |
| ㄴ pre-consult-refs | 5개 / 11.5 MB |
| ㄴ designer-profile-images | 3개 / 17.0 KB |

## 주의

- `SUPABASE_SERVICE_KEY` 는 절대 공개 저장소에 커밋하지 말 것 (Script properties 에만 저장)
- DB 함수는 `SECURITY DEFINER` 로 작성되어 있으므로, RLS 우회하여 집계만 반환
- 비집계 PII (이메일 등) 가 노출되는 함수는 service_role 만 호출 가능
