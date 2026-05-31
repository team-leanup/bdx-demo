# Production 준비도 점검 — go/no-go (2026-05-31)

> `/goal 보안 외 production 사용에 모두 적합한가?` — 8축 멀티에이전트 점검(보안 제외) → 블로커 적대검증 → 종합.

## 판정: **GO-WITH-CAVEATS**

> 확정 블로커 없음. 8개 축 모두 minor-gaps — 지금 실서비스 출시 가능하나, high 권고 6건(에러 모니터링 부재·field-mode error.tsx·pinch-zoom 차단·html2canvas eager 로드·법적 문서 결함 2건)은 첫 달 안에 해결 권장.

**확정 출시 블로커: 0건.** 8개 축 모두 `minor-gaps`(blocker 없음).

| 축 | 판정 |
|---|---|
| D1-build — 빌드·배포·환경설정 | minor-gaps |
| D2-perf — 성능(번들·이미지·폴링·리렌더) | minor-gaps |
| D3-data — 데이터 정합성·영속성·마이그레이션 | minor-gaps |
| D4-reliability — 안정성·에러처리 | minor-gaps |
| D5-a11y — 접근성·반응형·모바일 | minor-gaps |
| D6-i18n — i18n 완성도(고객 대면) | minor-gaps |
| D7-ops — 운영·관측성·코드위생 | minor-gaps |
| D8-meta — 법적·SEO·PWA·메타 | minor-gaps |

## 이번 라운드에서 수정 완료 ✅
- 성능: html2canvas-pro 동적 import (기록상세·포트폴리오·wrap-up 첫 로드 ~65KB↓)
- 신뢰성: field-mode/error.tsx · global-error.tsx 에러 경계 신규(시술 중 흰 화면 방지)
- 접근성: 루트 viewport userScalable 차단 해제(고객 pinch-zoom 허용) + themeColor
- 신뢰성: 예약/기록/포트폴리오 DB 쓰기 실패 → 전역 DbErrorToaster로 사용자 알림(silent failure 해소)
- 신뢰성: 예약등록·고객추가 더블탭 가드, payment 스테일 클로저 수정
- 법적: 이용약관 조항번호 누락(제6조) 재정렬, 개인정보 처리방침 placeholder('운영 전 반영 예정') 제거
- 메타: manifest.json 없는 아이콘 참조 수정, robots.txt 신규(관리자 라우트 색인 차단), apple-touch 보고
- i18n: 사전상담 시작화면 zh/ja 요일 현지어 표기
- 운영/위생: 디버그 console.log 제거, supabase env 누락 경고, next.config outputFileTracingRoot, .env.example, 테스트 아티팩트 git 추적 해제

## 권고 — 계정/큰 작업 필요 (출시 후) ⏭️
- **에러 모니터링(Sentry 등) 도입** — 현재 프로덕션 장애 인지 수단 없음. Free tier로 충분. DSN만 주시면 스캐폴딩 가능. (최우선 권고)
- apple-touch-icon PNG 생성(현재 SVG라 iOS 홈화면 미적용) — 디자인 에셋 필요

## 그 외 medium/low (영향 낮음, 점진 개선)
- [medium] Supabase 환경변수 누락 시 placeholder-key로 사일런트 실패 @ `src/lib/supabase.ts:11-13`
- [medium] dashboard First Load JS 425kB — recharts 미분할 @ `src/app/(main)/dashboard/page.tsx:8-15, src/components/dashb`
- [low] next.config.ts에 outputFileTracingRoot 미설정 — workspace root 경고 @ `next.config.ts (전체), /Users/unvisr/package.json 존재`
- [low] package.json에 engines 필드 없음 — Node 버전 불일치 위험 @ `package.json (전체)`
- [low] .env.example 파일 없음 @ `프로젝트 루트`
- [medium] /records 페이지에서 30초 예약 폴링이 2중 실행 (records/page + NotificationBellButton) @ `src/app/(main)/records/page.tsx:128-141 + src/components/lay`
- [medium] i18n.ts 190KB 소스가 단일 번들(~85KB gz)로 모든 페이지에 항상 로드됨 — 4개 언어 전부 포함 @ `src/lib/i18n.ts (4984 lines, 190KB) — shared chunk 1502-7ea5`
- [low] 홈/설정/pre-consult 매장 로고를 <img>로 렌더(next/image 미적용) — Supabase Storage 원본 사이즈 그대로 전송 @ `src/components/home/GreetingHeader.tsx:42, src/app/(main)/se`
- [low] home/page.tsx의 CHANNEL_BADGE 객체가 컴포넌트 바디 안에서 매 렌더마다 재생성 @ `src/app/(main)/home/page.tsx:68-74`
- [medium] addQuickSaleRecord DB 실패 시 customer.totalSpend 롤백 없음 @ `src/store/records-store.ts:258-270, 279-283`
- [medium] persist 스토어 version 미설정—구형 localStorage에서 신규 필드 누락 시 기본값 적용 안 됨 @ `src/store/records-store.ts:350(name:'bdx-records'), src/stor`
- [low] 두 가격 계산기 공존—consultation 플로우(price-calculator.ts) vs field-mode(pre-consult-price.ts) 결과값이 동일 시술에서 다를 수 있음 @ `src/lib/price-calculator.ts:7-24(DEFAULT_SERVICE_PRICING), s`
- [low] demo 모드에서 addRecord/addQuickSaleRecord 호출 시 DB 실패를 throw로 처리—콘솔 에러 노출 @ `src/store/records-store.ts:112-120, src/store/auth-store.ts:`
- [medium] 대시보드·홈·고객 목록 — DB hydration 전 _dbReady 미검사로 0건 플래시 @ `src/app/(main)/dashboard/page.tsx:65-68, src/app/(main)/home`
- [medium] portfolio togglePhotoVisibility — DB 실패 시 낙관적 업데이트 롤백 없음 @ `src/store/portfolio-store.ts:280-290`
- [medium] removeRecord·removeReservation — DB 삭제 실패 시 로컬 롤백 없음 @ `src/store/records-store.ts:311-342, src/store/reservation-st`
- [low] ReservationForm 예약 등록 버튼에 제출 중 비활성화(isSubmitting) 가드 없음 @ `src/components/home/ReservationForm.tsx:172-205, 424-431`
- [low] 고객 추가 모달 — 더블탭 시 동일 고객 중복 생성 가능 @ `src/app/(main)/customers/page.tsx:37-61 (handleCreateCustome`
- [low] safeSetItem이 Zustand persist setItem 훅에 연결되지 않아 QuotaExceededError 미감지 @ `src/lib/storage-budget.ts:112-124, src/store/customer-store.`
- [medium] 정산 화면 할인/예약금 칩 버튼 터치 타겟 ~34px — 44px 미달 @ `src/app/field-mode/settlement/page.tsx:597-661`
- [medium] 고객 태그 색상 선택 버튼 20×20px — 터치 타겟 44px 크게 미달 @ `src/app/(main)/customers/[id]/page.tsx:973-984`
- [low] 이중언어 보조 레이블(한국어 가이드) 색상 대비 1.65~1.85:1 — WCAG AA 4.5:1 크게 미달 @ `src/components/pre-consult/BodyPartToggle.tsx:69, SlotPicker`
- [low] Modal 컴포넌트 포커스 트랩 없음 — 키보드 사용자가 모달 외부로 탭 이동 가능 @ `src/components/ui/Modal.tsx:19-26`
- [low] WeekCalendar 월간뷰 전환 버튼 28×28px — 터치 타겟 미달 @ `src/components/calendar/WeekCalendar.tsx:108`
- [medium] ShareCard OG 메타 하드코딩 한국어 @ `src/app/share/[shareCardId]/page.tsx:19-23`
- [medium] ShareCard 이미지 내 시술 유형·형태·부위 라벨 한국어 고정 @ `src/app/share/[shareCardId]/ShareCardClient.tsx:17-65 (INSTA`
- [low] pre-consult 시작 페이지 — zh/ja locale에서 예약 요일이 영어로 표시 @ `src/app/pre-consult/[shopId]/page.tsx:15-23 (formatBookingDa`
- [medium] 예약 추가·수정·삭제 DB 쓰기 fire-and-forget — 실패 시 사용자 알림 없음 @ `src/store/reservation-store.ts:107, 118, 127`
- [medium] SupabaseProvider hydrate 5개 실패 시 빈 화면 — 사용자 알림 없음 @ `src/components/SupabaseProvider.tsx:68-72, 79`
- [medium] payment/page.tsx useCallback에 shopSettings 의존성 누락 — 스테일 클로저 @ `src/app/(main)/payment/page.tsx:157, 175`
- [low] global-error.tsx 없음 — 루트 레이아웃 크래시 시 브라우저 기본 에러 화면 노출 @ `src/app/ (global-error.tsx 미존재)`
- [low] lint 경고 20건 빌드에 포함 — <img> 15건, exhaustive-deps 5건 @ `src/app/(auth)/login/page.tsx:117, src/app/(auth)/splash/pag`
- [low] QA 스크린샷 PNG 27개 + dataurl.txt가 git 히스토리에 추적됨 @ `/Users/unvisr/Downloads/bdx-demo/qa-*.png, share-card-v2-*.p`
- [medium] manifest.json 아이콘이 존재하지 않는 favicon.ico 참조 — PWA 설치 불가 @ `public/manifest.json:11-16`
- [medium] apple-touch-icon이 SVG 파일 지정 — iOS 홈화면 아이콘 미적용 @ `src/app/layout.tsx:39 (icons.apple: '/bdx-logo/bdx-symbol.sv`
- [medium] robots.txt 없음 — 관리자 전용 라우트가 검색 색인 대상 @ `public/ (파일 없음)`
- [low] OG 이미지 크기가 2400×1260(2×) — 일부 플랫폼에서 5MB 경고 또는 리사이즈 @ `public/bdx-og-image-final.png (1.86MB, 2400×1260)`
- [low] pre-consult([shopId]) 고객 진입 URL에 OG 메타데이터 없음 — 공유 링크 프리뷰 미작동 @ `src/app/pre-consult/[shopId]/layout.tsx (metadata export 없음)`
- [low] viewport themeColor 미설정 — 브라우저 주소창 색상 없음 @ `src/app/layout.tsx:62-68 (Viewport export)`