# BDX User Flow 명세 (현행)

> 네일샵 다국어 상담 앱 BDX의 **전체 사용자 흐름**을 코드 기준으로 정리한 문서.
> 11개 flow를 멀티에이전트로 end-to-end 추적해 정의 + 모든 케이스(빈데이터·취소·다국어·1인샵·실패·경계값) 감사 후 작성.
> 최종 갱신: 2026-05-31 · 감사/수정 내역: [docs/qa-deep-20260531-userflow.md](qa-deep-20260531-userflow.md)

## 화면(라우트) 한눈에

```
인증/진입   /splash · /intro · /login · /signup · /signup/google · /terms · /privacy · /intro-demo
온보딩      /onboarding → shop-info → portfolio-upload → portfolio-classify → pricing → surcharges → notice → complete
사장님 앱   /home · /records(+/[id] /day /preconsult/[bookingId]) · /customers(+/[id]) · /portfolio(+/[id] /upload)
           /dashboard · /settings · /quick-sale · /payment
손님 사전상담 /pre-consult/[shopId] → /consult → /design → /confirm → /complete   (ko/en/zh/ja)
현장 시술   /field-mode → /treatment → /settlement → /wrap-up
공유/QR     /share/[shareCardId] · /qr
```

## flow 목록

| # | Flow | 단계 | 한 줄 |
|---|------|------|-------|
| F1-auth | 인증·진입 플로우 | 8 | 신규 샵원장은 / → /splash(5초) → /intro(슬라이드) → /signup → /onboarding → /home… |
| F2-onboarding | 온보딩 (매장 첫 세팅) | 9 | 신규 사장님이 회원가입 직후 매장명·로고·포트폴리오·가격·추가금·고객안내문구를 설정하는 7단계 플로우. 가이드 슬라이드(ind… |
| F3-home | 홈 대시보드 | 12 | 샵원장이 매일 시작하는 대시보드. 오늘 예약 목록(스테이지별 CTA 분기)·HeroCTA(현장시술/예약/매출)·사전상담 알림·… |
| F4-records | 예약·기록 관리 (Records) | 8 | 샵원장이 예약·상담 기록을 관리하는 메인 작업 화면. 주/일/월 캘린더로 예약을 시각화하고, 타임그리드 이벤트 클릭 시 바텀시… |
| F5-customers | 고객 관리·매출등록 (Customers & Quick-Sale) | 8 | 샵원장이 고객 목록을 조회하고, 고객 상세에서 태그/선호도/회원권/시술이력/스몰토크를 관리하며, 즉시매출(quick-sale)… |
| F6-portfolio | 포트폴리오 (메뉴판 / 시술기록 / 상세 / 업로드) | 11 | 샵원장이 시술 사진을 업로드하고, 메뉴판(isFeatured)에 등록하고, 시술 기록 갤러리에서 검색·필터링하고, 공유카드를 … |
| F7-dashboard | 통계 대시보드 (Dashboard) | 11 | 샵원장이 대시보드 탭을 열면 오늘 매출·전월 대비 성장·KPI 카드·업셀링·이번 주 요약·상담 추이 차트·디자이너별 현황·시간… |
| F8-settings | 설정 (Settings) | 13 | 샵원장이 매장 정보·선생님·영업시간·가격·파츠·회원권·테마를 관리하는 플로우. /settings는 (main) 레이아웃 안에 … |
| F9-preconsult | 사전상담 다국어 플로우 (Pre-consult multilingual flow) | 5 | 손님이 샵 공유 링크 또는 사장님 발송 링크로 진입해 디자인 카테고리 선택 → 네일 상태/제거/랩핑/길이/모양/느낌/스타일/추… |
| F10-fieldmode | 현장 시술 (Field Mode) | 6 | 샵 원장이 현장에서 직접 시술을 진행할 때 사용하는 플로우. 포트폴리오에서 디자인 선택 → 옵션(제거/길이/추가) 설정 → 시… |
| F11-share | 공유카드·QR (Share Card & QR) | 8 | 샵원장이 시술 완료 후 공유카드를 생성해 외국인 손님에게 공유하고, 손님이 링크로 카드를 열람·저장·사전상담 진입하는 흐름. … |

---

## F1-auth · 인증·진입 플로우

신규 샵원장은 / → /splash(5초) → /intro(슬라이드) → /signup → /onboarding → /home 경로로 진입한다. 기존 사용자는 / → (auth 체크) → /home 또는 /login → /home 으로 리다이렉트된다. 데모 사용자는 /login 또는 /signup 의 '로그인 없이 서비스 체험하기' 버튼으로 bdx-demo=true 쿠키를 세팅 후 /home 으로 즉시 진입한다. Google OAuth는 /auth/callback 을 거쳐 신규이면 /signup/google(샵 정보 입력)으로, 기존이면 /home 으로 이어진다.

**진입 / 이탈:** 진입: / (루트) 또는 직접 URL (/splash, /login, /signup, /signup/google, /auth/callback, /onboarding/*). 빠져나가기: 인증 완료 후 /home 또는 /onboarding. 데모는 /home. 중간 이탈 시 미들웨어가 보호된 경로를 /login 으로 redirect.

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 1. 루트 진입 | `/` | RootPage가 useAuthStore.isInitialized를 기다린다. 초기화 완료 후 로그인 상태이면 /home(온보딩 완료) 또는 /onboarding, pendingGoogleSignup이면 /signup/google, 로그아웃이면 /splash로 replace 한다. | 로그인됨 → /home 또는 /onboarding \| pendingGoogleSignup → /signup/google \| 비로그인 → /splash |
| 2. 스플래시 | `/splash` | BDX 로고 + 점 애니메이션을 5초간 보여준 뒤 router.push('/intro') 한다. auth 상태를 전혀 확인하지 않는다. | 5초 후 무조건 /intro 이동 |
| 3. 인트로 슬라이드 | `/intro` | 3개 슬라이드(스와이프/탭 진행)로 앱 기능 소개. '건너뛰기' 또는 마지막 슬라이드의 '시작하기' 모두 router.push('/signup')으로 이동한다. | 건너뛰기 or 시작하기 → /signup \| 뒤로가기(OS) → / (RootPage가 다시 auth 체크) |
| 4. 회원가입 | `/signup` | 샵이름·원장이름·이메일·비밀번호(6자+)·약관동의 입력 후 '회원가입 후 시작하기'. 또는 Google 버튼으로 OAuth. Supabase signUp 후 shop/designer 생성 → /onboarding 리다이렉트. 이미 로그인 상태면 useEffect가 /home 또는 /onboarding 으로 즉시 replace. | 이메일 가입 성공 → /onboarding \| Google 가입 → OAuth → /auth/callback → /signup → /signup/google \| 이미 로그인 → /home 또는 /onboarding \| 이메일 인증 필요 시(identities 없음) → 오류 메시지, 머무름 |
| 5. 로그인 | `/login` | 이메일+비밀번호 또는 Google 로그인 또는 데모 체험. 이미 로그인 상태면 /home 또는 /onboarding으로 즉시 redirect. loginWithPassword 성공 → useEffect가 /home 또는 /onboarding로 이동. 데모 로그인 → bdx-demo=true 쿠키 설정 → store 업데이트 → useEffect가 /home 으로 이동. | 이메일 로그인 성공 → /home 또는 /onboarding \| Google → /auth/callback \| 데모 → /home \| 비밀번호 오류 → 에러 메시지 \| pendingGoogleSignup → /signup/google |
| 6. Google OAuth 콜백 | `/auth/callback` | code 파라미터로 Supabase exchangeCodeForSession. 성공하면 next 파라미터(getSafeNextPath로 검증)로 redirect. 에러이면 /login?oauth_error=코드 로 redirect. hasSupabaseEnv 없으면 env_missing 오류. | 성공 + next=/login → /login \| 성공 + next=/signup → /signup \| 실패 → /login?oauth_error=xxx |
| 7. Google 회원가입 완료 | `/signup/google` | pendingGoogleSignup이 없으면 /login으로 redirect. 있으면 Google 이메일 표시(disabled), 이름·샵이름 입력·약관 동의 후 completePendingGoogleSignup 호출 → shop/designer 생성 → useEffect가 /onboarding으로 이동. | pendingGoogleSignup 없음 → /login \| 완료 성공 → /onboarding \| 이미 로그인됨 → /home 또는 /onboarding |
| 8. 온보딩 | `/onboarding → /onboarding/shop-info → .../portfolio-upload → .../portfolio-classify → .../pricing → .../surcharges → .../notice → .../complete` | AuthGuard로 보호. 온보딩이 이미 완료(currentShopOnboardingComplete=true)면 layout에서 /home으로 redirect. 각 단계를 순서대로 진행, 뒤로가기 버튼은 STEPS 배열 기준 이전 경로로 push. complete 페이지에서 DB 커밋 후 '현장모드 시작'(/field-mode) 또는 '홈으로'(/home) 선택. | 온보딩 완료됨 → /home redirect \| shopName 없이 complete 도달 → /onboarding redirect \| DB 커밋 성공 → 목적지 이동 \| DB 실패 → error 메시지, 재시도 가능 |

---

## F2-onboarding · 온보딩 (매장 첫 세팅)

신규 사장님이 회원가입 직후 매장명·로고·포트폴리오·가격·추가금·고객안내문구를 설정하는 7단계 플로우. 가이드 슬라이드(index 0) → shop-info(1) → portfolio-upload(2) → portfolio-classify(3) → pricing(4) → surcharges(5) → notice(6) → complete(7). Zustand(localStorage) + onboarding-photo-store(sessionStorage)로 상태를 유지하고, complete 페이지에서 DB 일괄 커밋.

**진입 / 이탈:** 진입: 회원가입(email/Google) 직후 signup 페이지가 router.replace('/onboarding'), 또는 로그인 후 onboardingComplete=false일 때 root page → /onboarding. 미들웨어에서 /onboarding/* 는 PUBLIC_PREFIXES에 포함(인증 체크 생략), AuthGuard가 클라이언트에서 인증 확인 후 미인증 시 /login 리다이렉트. / 이탈: complete 페이지의 3개 CTA(현장모드/고객미리보기/홈으로) 또는 commitDB 성공 후 layout useEffect가 /home으로 강제 이동.

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 진입 (가이드 슬라이드) | `/onboarding (page.tsx)` | 회원가입 후 root page가 onboardingComplete=false를 감지하여 /onboarding으로 redirect. 4장의 기능 소개 슬라이드. 헤더/진행바 미표시(index=0). '건너뛰기' 또는 마지막 슬라이드의 '시작하기' 모두 shop-info로 이동. | 슬라이드 4장 중 어느 단계에서나 '건너뛰기' → /onboarding/shop-info 즉시 이동 |
| 기본 정보 입력 | `/onboarding/shop-info` | 매장명(필수)·연락처(선택)·로고 이미지(선택) 입력. 매장명 있어야 '다음' 활성화. setShopSettings()로 localStorage 즉시 저장 후 portfolio-upload로 이동. 로고는 onboarding-photo-store의 pendingLogoDataUrl에 임시 저장. | 매장명 미입력 → '다음' 버튼 disabled. 로고 업로드 실패 → 조용히 무시(catch 블록), 사용자 피드백 없음 |
| 포트폴리오 업로드 | `/onboarding/portfolio-upload` | 최소 3장~최대 20장 업로드. 파일 선택 → FileReader → resizeTreatmentPhoto(1600px, 400KB) 비동기 처리. sessionStorage에 저장. count >= 3이면 '다음' 활성화. | count < 3 → 버튼 disabled + '최소 3장' 안내. count = 20 → 더 추가하기 버튼 숨김 |
| 포트폴리오 분류 | `/onboarding/portfolio-classify (phase: classify)` | 사진 1장씩 카드로 표시, 심플/프렌치/자석/아트 중 선택 → 320ms 딜레이 후 다음 사진 자동 전환. '건너뛰기'로 분류 없이 다음 사진으로 이동. classifiedCount >= 3이면 '분류 마치고 대표 디자인 선택' CTA 표시. | 마지막 사진에서 분류 or 건너뛰기 → phase=featured. 분류 0개도 featured 진입 가능(사진이 있으면 모두 선택 가능) |
| 대표 디자인 선택 | `/onboarding/portfolio-classify (phase: featured)` | 전체 사진 그리드에서 3~5장 선택. canFinish = selectedCount >= 3. '다음' 클릭 → storeFeaturedIds() → /onboarding/pricing으로 이동. | selected < 3 → '다음' 버튼 disabled. 사진 0장인 경우 classify 페이지에 가드 있어 upload로 redirect됨 |
| 가격 & 시간 설정 | `/onboarding/pricing` | 심플/프렌치/자석/아트 4개 카테고리별 가격(₩)과 시간(분) 설정. '다음' 클릭 → setShopSettings({categoryPricing}) → /onboarding/surcharges. 유효성 검사 없음. | shopName 없으면 /onboarding으로 redirect(useEffect guard). 가격·시간 모두 0이어도 진행 가능 |
| 추가 비용 설정 | `/onboarding/surcharges` | 자샵제거·타샵제거·연장(토글+금액)·파츠초과·큰파츠·포인트아트 금액 설정. '다음' → setShopSettings({surcharges}) → /onboarding/notice. | extensionEnabled=true인 상태에서 금액을 0으로 비우고 다음 → extension=0 저장(실질 비활성화되나 UI는 ON으로 보임) |
| 고객 안내 문구 | `/onboarding/notice` | 최대 120자 안내 문구 입력. 고객 화면 실시간 미리보기 제공. '완료하기' → await setShopSettings({customerNotice}) → /onboarding/complete. 빈 값이면 기존 기본값 유지. | 문구 비워도 기존값 fallback으로 저장. setShopSettings 실패해도 complete으로 진행(반환값 미확인) |
| 완료 & DB 커밋 | `/onboarding/complete` | savingRef double-tap 가드 포함 commitDB() 실행. shop 정보 updateShop → 로고 uploadShopLogo(선택, 실패해도 진행) → setShopSettings(categoryPricing/surcharges/customerNotice) → dbBatchInsertPortfolioPhotos(순차) → setCurrentShopOnboardingComplete(true) → photos 초기화. CTA 3개: 현장모드/고객미리보기/홈으로. | DB 저장 실패 → error=true 표시, savingRef 해제. 성공 후 뒤로가기 → layout이 onboardingComplete=true 감지 → /home 강제 리다이렉트 |

---

## F3-home · 홈 대시보드

샵원장이 매일 시작하는 대시보드. 오늘 예약 목록(스테이지별 CTA 분기)·HeroCTA(현장시술/예약/매출)·사전상담 알림·최근 시술 기록·재방문 알림으로 구성. 예약 스테이지(just_registered → link_sent → pre_consult_done → in_treatment → completed/cancelled)에 따라 CTA가 분기되며, 사전상담 완료 예약은 바로 /field-mode/treatment로 진입.

**진입 / 이탈:** 진입: /login → AuthGuard 통과 → /home (정상 로그인) / onboarding 완료 후 /home?tour=true / 다른 탭(records·dashboard 등) TabBar 탭 / URL 직접 입력. 빠져나가기: TabBar(records·customers·dashboard·settings) / HeroCTA '디자인 고르기' → /field-mode / HeroCTA '즉시 매출' → /quick-sale / '시술 시작' CTA → /field-mode or /field-mode/treatment / '고객 정보' → /customers/{id} / '시술 완료' → /records/{id} or /records / '상담 내용' → /records/preconsult/{bookingId}

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 1. 앱 진입 / 인증 확인 | `/home (AuthGuard → AppShell)` | AuthGuard가 isInitialized + isAuthenticated를 확인. 미인증이면 /login으로 replace. 인증됐지만 온보딩 미완이면 /onboarding으로 replace. layout.tsx useLayoutEffect에서 setLocale('ko') 강제. | isAuthenticated=false → /login \| onboardingComplete=false → /onboarding \| 모두 통과 → home 렌더 |
| 2. 홈 마운트 – 데이터 로드 | `/home page.tsx` | useEffect: hydrateFromDB() 즉시 1회 + 30초 폴링 + visibilitychange 폴링. getAllRecords()로 로컬 records 동기 읽기. getTodayInKorea()로 오늘 날짜 필터. greeting/todayDateStr는 별도 useEffect에서 설정(초기 렌더 시 빈값). | shop-demo → DEMO_RESERVATIONS 병합 \| 실제 shopId → DB 그대로 |
| 3. GreetingHeader 표시 | `src/components/home/GreetingHeader.tsx` | shopName(설정 우선·폴백 '내 매장'), activeDesignerName, 역할 라벨, 오늘 날짜, 로고/이니셜 표시. | logoPublicUrl 있으면 img 표시 \| 없으면 이니셜 뱃지 |
| 4. TodayReservationCard – 오늘 예약 목록 | `src/components/home/TodayReservationCard.tsx` | todayReservations(예약 날짜 = 오늘, 시간순 정렬)를 map. 각 예약에 대해 getBookingStage()로 스테이지 계산 후 CTA 분기: just_registered→상담링크보내기, link_sent→시술시작, pre_consult_done→상담내용+시술시작, in_treatment→결제대기(span), completed→시술완료, 그 외→시술시작. 예약 0개 시 빈 상태 표시. | 예약 없음 → 빈 상태 \| 예약 있음 → 스테이지별 CTA \| customerId 있으면 '고객 정보' 버튼 추가 |
| 5-A. 예약 카드 탭 (just_registered) | `TodayReservationCard.tsx handleCardClick` | setLinkGenBooking(booking) → ConsultationLinkModal 오픈. 모달 오픈 즉시 useEffect가 consultationLinkSentAt을 기록(링크 미발송이어도 stage가 link_sent로 변경됨). | stage=completed/cancelled → 카드 탭 무시 \| stage=pre_consult_done → 미리보기 모달 |
| 5-B. 시술 시작 (pre_consult_done or link_sent) | `page.tsx handleStartConsultation → /field-mode or /field-mode/treatment` | consultationLocale 설정, hydrateConsultation + hydrateFromBooking으로 예약 데이터 주입. preConsultationCompletedAt + validatedCategory 둘 다 있으면 startTreatment() 후 /field-mode/treatment로 직행. 아니면 /field-mode. | 사전상담 완료 + 유효 카테고리 → /field-mode/treatment \| 그 외 → /field-mode |
| 6. HeroCTA – 신규 현장 시술/예약/즉시 매출 | `src/components/home/HeroCTA.tsx` | '디자인 고르기' → fieldModeStore.reset() 후 /field-mode. '새 예약 등록' → ReservationForm 모달 오픈. '즉시 매출' → /quick-sale 이동. | 각 버튼 독립 동작 |
| 7. 예약 등록 모달 (ReservationForm) | `src/components/home/ReservationForm.tsx` | 고객명·연락처·시술종류·디자이너·날짜·시간(10:00-20:00 고정 30분 단위)·채널·언어·요청사항·참고이미지(최대3장) 입력. 고객명+시간 필수(빈값이면 버튼 disabled). 제출 시 reservation-store.addReservation() 호출(status='pending'으로 강제, DB fire-and-forget). 모달 닫힘. | 기존 고객 검색 선택 시 customerId 연결 \| 없으면 addReservation 내부에서 신규 고객 자동 생성 |
| 8. ShareLinkCard – 손님 공유 링크 복사 | `src/components/home/ShareLinkCard.tsx` | 버튼 탭 시 '/pre-consult/{shopId}' URL을 클립보드에 복사. 성공/실패 toast 표시. | currentShopId 없으면 컴포넌트 자체 null 반환(미표시) |
| 9. RecentConsultationCard – 최근 시술 아코디언 | `src/components/home/RecentConsultationCard.tsx` | 기본 닫힘(isOpen=false). 헤더 탭 시 토글. 최근 4건 표시. 각 항목 클릭 → /records/{id}. | isOpen=false → 내용 숨김 \| isOpen=true + records=[] → 빈 flex-col(빈 상태 없음) |
| 10. RevisitReminderCard – 재방문 알림 | `src/components/home/RevisitReminderCard.tsx` | lastVisitDate가 4주 이상 된 고객(최대 5명) 표시. 단골 우선 정렬. 각 고객에 SMS 열기 버튼(sms: URL)과 문자 내용 복사 버튼. overdueCustomers=0이면 컴포넌트 null(미표시). | 재방문 대상 없으면 카드 미표시 \| SMS 버튼 → sms: 스킴으로 기본 메시지 앱 |
| 11. 사전상담 알림 배너 (ConsultationAlertBanner) + 알림 센터 | `AppShell > ConsultationAlertBanner / PreConsultationNotificationCenter` | 예약 중 preConsultationCompletedAt 있고 읽지 않은 항목이 있으면 배너 표시(모든 (main) 페이지). '확인' → /records?bookingId=X. '나중에' → 배너 dismisss + markRead. 홈 ?notifications=preconsult 쿼리 시 알림 센터 모달 오픈. | unread 알림 없으면 배너 null \| dismissed=true → 배너 null \| 새 알림 storage event → dismissed 리셋 |

---

## F4-records · 예약·기록 관리 (Records)

샵원장이 예약·상담 기록을 관리하는 메인 작업 화면. 주/일/월 캘린더로 예약을 시각화하고, 타임그리드 이벤트 클릭 시 바텀시트에서 상태 전환·시술 시작·정산 완료까지 인라인 처리. '시술 기록' 탭에서 과거 상담 기록을 검색/필터하며, 사전상담 전용 상세 페이지(/records/preconsult/[bookingId])에서 확정 및 시술 시작 처리.

**진입 / 이탈:** 진입: /records (TabBar 직접 탭), /records?bookingId=X (딥링크), /records?view=day 등 (레거시 파라미터). 빠져나가기: /field-mode 또는 /field-mode/treatment (시술 시작), /records/[id] (기록 상세), /records/preconsult/[bookingId] (사전상담 상세), /customers/[id] (고객 카드), /quick-sale (매출 등록), /payment (결제).

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 1. 진입 | `/records` | 페이지 마운트 시 hydrateFromDB()로 DB 최신 예약 fetch. 30초 폴링 + visibilitychange + focus 이벤트로 자동 갱신. URL ?bookingId=X 파라미터가 있으면 해당 예약으로 날짜 이동 후 바텀시트 자동 오픈(사전상담 완료된 경우 /records/preconsult/[id]로 즉시 리다이렉트). | ?view=legacy 파라미터로 탭/뷰 모드 복원; ?customerId=X로 고객 기준 필터 자동 적용 |
| 2. 스케줄 탭 — 일간 타임그리드 | `/records (reservations tab, day viewMode)` | WeekCalendar(7일 스크롤 + 예약 dot)로 날짜 선택. DesignerDayGridCalendar에 디자이너별 컬럼으로 예약 블록 표시(영업시간 기준 start/endHour). 이벤트 클릭 → 바텀시트 오픈. 슬롯 롱프레스 600ms → 예약 추가 모달. 드래그 → 시간/디자이너 이동(확인 모달). 현재 시각 표시선 1분 갱신. | 1인샵: 미지정 예약을 원장 컬럼에 통합 / 멀티디자이너: '함께 보기' 토글로 컬럼 on/off |
| 3. 스케줄 탭 — 월간 뷰 | `/records (reservations tab, month viewMode)` | MonthCalendar에서 날짜 선택 시 DayReservationList로 해당 일 예약 목록 표시. 각 예약에 '상담 시작' 버튼 노출(완료건은 '상담 내용 보기', 취소건은 버튼 없음). | 예약 0건인 날 선택 → 빈 상태 메시지 + '예약 추가' 버튼 |
| 4. 예약 바텀시트 — stage별 CTA | `/records (bottomsheet overlay)` | Stage에 따라 CTA 분기: just_registered(상담링크 보내기+수정+삭제), link_sent(시술시작+링크재발송+수정), pre_consult_done(시술시작+수정), in_treatment(결제완료 인라인+매출등록), completed(공유카드 만들기), cancelled(예약삭제). 사전상담 완료된 예약은 인라인 미리보기 + '전체보기' 링크. 오늘 예약 + 안전태그 있으면 주의사항 자동 리마인드 모달. | editMode: 고객명/연락처/시간/메모/언어/예약금/참고이미지 수정 후 저장; linkGenBooking: 상담링크 생성 화면 인라인 전환 |
| 5. 시술 시작 — field-mode 진입 | `/field-mode 또는 /field-mode/treatment` | 사전상담 완료(preConsultationCompletedAt + validCategory) → startTreatment() 후 /field-mode/treatment 직행. 미완료 → /field-mode 진입(옵션 선택 플로우). hydrateConsultation + hydrateFromBooking으로 두 store에 예약 데이터 주입. | 주의사항 태그 있는 고객: PretreatmentAlertModal 먼저 표시 (DayReservationList 경로만) |
| 6. 사전상담 상세 (/records/preconsult/[bookingId]) | `/records/preconsult/[bookingId]` | 예약 데이터 + PreConsultDetailView로 사전상담 내용 표시. '확정만 하기' → status=confirmed, /records로 이동. '이 정보로 시술 시작 →' → resolveOrCreateCustomer 후 /field-mode/treatment 이동. | booking not found → 에러 상태 + 돌아가기 버튼; booking.customerId 없으면 전화/이름으로 자동 매칭 또는 신규 고객 생성 |
| 7. 시술 기록 상세 (/records/[id]) | `/records/[id]` | 상담 데이터, 사전상담 응답, 이미지, 가격 내역(저장 lineItems 우선), 결제 정보 표시. 미결제 시 '결제하기'(payment 페이지) 또는 '결제 완료'(인라인 확정). finalPrice 수정 인라인 편집. 삭제 확인 모달. 결제 완료 후 '공유카드 만들기' 활성. | isFieldModeRecord: 저장된 storedGross를 SSOT로 사용(calculatePrice 재계산 사용 안 함); record not found → 에러 상태 |
| 8. 시술 기록 목록 탭 | `/records (consultations tab)` | 전체 기록을 날짜 역순 정렬. 이름/전화/서비스명 검색 + 기간 필터(전체/오늘/이번주/이번달). 고객 기준 필터 뱃지 표시. 기록 없음 시 빈 상태 안내. | role=staff + activeDesignerId: 자신의 기록만 표시 |

---

## F5-customers · 고객 관리·매출등록 (Customers & Quick-Sale)

샵원장이 고객 목록을 조회하고, 고객 상세에서 태그/선호도/회원권/시술이력/스몰토크를 관리하며, 즉시매출(quick-sale)을 등록하거나 상담 플로우 완료 후 결제(payment)를 처리하는 흐름. 외국인 손님은 이 flow의 직접 사용자가 아니고, 사장님(원장)이 상담 후 기록을 남기고 결제를 처리하는 B2B-side flow다.

**진입 / 이탈:** 진입: (main)/layout TabBar '고객' 탭 → /customers \| /customers/[id] 헤더 '매출' 버튼 → /quick-sale \| records 시술 완료 후 → /payment?recordId=. 이탈: quick-sale 성공 후 /records?view=list \| payment 완료 후 /home 또는 /records \| customers/[id] 뒤로가기 → /customers.

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 1. 고객 목록 진입 | `/customers` | 사장님이 하단 탭 '고객'을 누른다. 전체/단골/일반 필터탭과 검색창이 표시된다. PAGE_SIZE=12, 고객 카드 2열 그리드로 렌더링. 회원권 활성 고객은 잔액 뱃지 표시. | staff role이면 자신 담당 고객만 표시. 검색어 없고 고객 0명이면 '검색 결과가 없습니다' 문구 표시(신규 샵 케이스에서도 동일 문구 노출). |
| 2. 새 고객 등록 | `/customers (모달)` | '+새 고객 등록' 버튼 → 모달. 이름(필수)/전화번호/메모 입력. 전화번호 8자리 이상 입력 시 중복 고객 경고 표시. '등록' 버튼 클릭 시 createCustomer 호출 → /customers/[id]로 이동. | 중복 전화번호 감지 시 '고객 카드 보기' 링크 제공. createCustomer는 shopId 없으면 throw — customers/page.tsx는 try/catch 없어 에러 미처리. |
| 3. 고객 상세 조회 | `/customers/[id]` | 기본정보 카드(방문횟수·평균단가·최근방문·총이용금액), 특이사항(pinned tags), 시술성향 태그, 선호도 프로필, 예약이력, 회원권, 시술기록(사진·결제합계), 시술이력 타임라인, 스몰토크 순서로 렌더링. | 존재하지 않는 id면 '고객을 찾을 수 없습니다' + 뒤로가기 버튼. detectedLanguage 있으면 '번역된 상담 이력 보기' 버튼 노출. 시술사진 있으면 상단 캐러셀 노출. |
| 4. 태그 편집 | `/customers/[id] (인라인)` | '편집' 버튼 클릭 → editingTags=true. 태그별 강조/색상/상단고정 조작, 커스텀 태그 추가, 고정 태그 드래그 순서 변경. '완료' 클릭 시 updateTagsInStore + DB 동기화. | '취소' 클릭 시 localTags를 customer.tags로 복원(안전). 저장 실패 시 UI 피드백 없음(DB 에러는 console.error만). |
| 5. 회원권 등록/수정 | `/customers/[id] (모달)` | '회원권 등록' 버튼 → 모달. 상품 선택(설정에 등록된 플랜) 또는 직접 입력. 충전금액·만료일 입력 후 '등록'. addMembership 호출, DB 동기화. | 기존 회원권 수정 시 usedAmount 유지, remainingAmount 재계산. 만료일 비워두면 1년 후 자동 설정. DB sync 실패해도 UI에 에러 토스트 없음. |
| 6. 회원권 금액 차감 (수동) | `/customers/[id] (모달)` | '금액 차감' 버튼 → 모달. 차감 금액 입력 시 예상 차감/차감 후 잔액 실시간 미리보기. '차감하기' 클릭 시 manualDeductMembership 호출. | 잔액 초과 입력 시 잔액만큼만 실제 차감(UI는 capped 값 미리보기 표시). expired/used_up 회원권은 차감 차단. |
| 7. 즉시 매출 등록 (Quick-Sale) | `/quick-sale?customerId=&customerName=` | 고객 상세 헤더 '매출' 버튼 → /quick-sale. QuickSaleForm: 고객 검색(드롭다운 자동완성), 시술종류, 날짜/시간, 금액, 결제방법, 담당 디자이너, 메모. '매출 등록' 제출 → addQuickSaleRecord → DB 저장 → '매출이 등록되었어요' 토스트 → /records?view=list 이동. | 회원권 버튼은 항상 비활성(PaymentMethodSelector에 membershipRemainingAmount 미전달). 제출 중 submittingRef로 중복 방지. 성공 1.2초 후 자동 이동. |
| 8. 상담 플로우 완료 후 결제 (Payment) | `/payment?recordId=` | Section 1 시술내용 요약 → Section 2 결제수단 선택(현금/카드/회원권, 회원권 잔액 뱃지) → 결제하기 → Section 3 고객 정보 등록(walk-in인 경우) 또는 건너뜀 → Section 4 사진 저장(선택) → Section 5 완료 화면. | 고객에 active 회원권 있으면 잔액 차감 UI 표시. 잔액 < 시술금이면 차액 현금/카드 선택. recordId 없거나 record.finalizedAt 없으면 /home 리다이렉트. |

---

## F6-portfolio · 포트폴리오 (메뉴판 / 시술기록 / 상세 / 업로드)

샵원장이 시술 사진을 업로드하고, 메뉴판(isFeatured)에 등록하고, 시술 기록 갤러리에서 검색·필터링하고, 공유카드를 생성하는 플로우. 외국인 손님은 이 화면에 직접 접근하지 않으나, 사전상담(field-mode)의 메뉴 그리드와 공유카드를 통해 포트폴리오 결과물을 소비한다.

**진입 / 이탈:** 진입: 하단 탭바 '포트폴리오' / /portfolio/upload 직접 접근 / 시술 기록 상세에서 사진 링크 / PortfolioOverlay에서 '이 디자인으로 시술 시작'. 나가는 경로: /portfolio/upload (업로드), /portfolio/[id] (상세), /field-mode (시술 시작), /records/[id] (기록 상세), /customers/[id] (고객 상세).

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 포트폴리오 탭 진입 | `/portfolio` | BottomTabBar에서 진입. hydrateFromDB()가 useEffect로 호출되어 DB에서 포트폴리오 사진을 로드한다. 기본 탭은 '메뉴'. | _dbReady 플래그가 없으므로 로드 중에도 빈 화면(혹은 이미 localStorage에 있는 stale 데이터)을 표시. |
| 메뉴 탭 확인 | `/portfolio (activeTab=menu)` | isFeatured=true인 사진을 categoryOrder(심플/프렌치/자석/아트 + 커스텀) 순서로 그룹핑해 메뉴카드로 표시. menuCount===0이면 빈 상태 메시지, 그 아래에 카테고리별 '메뉴에 추가' 섹션도 동시 렌더링. | menuCount===0 → 빈 상태 + 카테고리 섹션 동시 표시(중복·혼란). menuCount>0 → 카테고리별 MenuCard 렌더. |
| 메뉴 등록 — 기록 탭에서 '+ 메뉴판 등록' 클릭 | `/portfolio (activeTab=records)` | MenuToggleRow에서 가격 입력 팝업 → 확인 → toggleMenu(id, price) 호출 → store 낙관적 업데이트 + dbUpdatePhotoFeatured fire-and-forget. | 가격 0원 입력 시 '0원' 메뉴 등록됨. 가격 미입력 시 toggleMenu(id, undefined) → DB에 price 필드 업데이트 안 됨(is_featured만 갱신). DB 실패 시 롤백 없음·피드백 없음. |
| 메뉴 해제 | `/portfolio (menu 탭)` | MenuCard에서 '해제' 클릭 → toggleMenu(id) price 인자 없음 → isFeatured=false, price=undefined. DB에는 is_featured=false, price=null 기록. | DB 실패 시 store는 이미 변경됐고 롤백 없음. |
| 사진 업로드 | `/portfolio/upload` | 파일 선택 → 미리보기 → 고객/기록 연결(선택) → 태그 3개 이상 선택 → 업로드 버튼 → resizePortfolioImage → addPhoto(DB insert) → onSuccess → /portfolio로 이동. | 태그 <3개 → 버튼 disabled+opacity-50(에러메시지 없음). 파일 미선택 → '사진을 선택해주세요' 에러. DB 실패 → error state 표시. 성공 → ?toast=uploaded 쿼리 파라미터로 토스트. |
| 시술 기록 탭 필터/검색 | `/portfolio (activeTab=records)` | 검색어·시술종류·날짜·가격·해시태그·글로벌베스트 필터 조합. 결과를 styleCategory별 섹션으로 그룹핑. 빈 결과 시 안내 메시지. | 글로벌 베스트 필터: 예약 없는 새 샵 → 항상 0건. 시술종류 드롭다운: photo.serviceType이 없는 사진은 '전체'에만 포함. |
| 사진 상세 오버레이 열기 | `/portfolio (overlay)` | 사진 카드 탭 → PortfolioOverlay 렌더. 현재 필터 기준 photoIds 배열로 좌우 네비게이션. 해시태그, 공유카드, 시술 시작, 메뉴 등록/해제, 기록 상세 CTA 제공. | 사진 수 많을 때 인디케이터 도트 overflow. 오버레이 내에서 EditPhotoModal 열고 Escape → overlay도 함께 닫힘. |
| 공유카드 만들기 | `/portfolio (overlay → ShareCardGeneratorModal)` | linkedRecord 있으면 실제 consultation 사용. 없으면 fake consultation 객체 생성(as unknown as ConsultationType). ShareCardGeneratorModal에서 카드 템플릿 선택 → 생성·저장. | imageDataUrl이 빈 문자열이면 공유카드 이미지 없음. fake consultation은 일부 필드만 채워짐. |
| 이 디자인으로 시술 시작 | `/portfolio (overlay) → /field-mode?portfolioId=xxx` | PortfolioOverlay에서 버튼 클릭 → router.push('/field-mode?portfolioId={id}'). | field-mode 페이지가 portfolioId 파라미터를 읽지 않으므로 해당 사진이 pre-select되지 않고 전체 그리드 처음부터 시작. |
| 사진 정보 수정 (EditPhotoModal) | `/portfolio/[id] 또는 overlay 내` | 시술종류·디자인타입·가격·촬영일·메모·태그·컬러·메뉴 등록 수정 → updatePhotoMetadata(DB+낙관적업데이트). 실패 시 롤백+에러 표시. | overlay 내 편집 후 onSuccess 토스트 없음(prop 미전달). /portfolio/[id]에서는 토스트 있음. |
| 사진 삭제 | `/portfolio/[id]` | 삭제 확인 모달 → removePhoto(낙관적 삭제+DB delete) → 성공 시 /portfolio?toast=deleted. 실패 시 롤백+에러 토스트. | 삭제 중 deleting=true로 버튼 비활성화. 삭제 후 공유카드가 있으면 share_cards 테이블은 별도 처리 없음(레코드 고아 가능). |

---

## F7-dashboard · 통계 대시보드 (Dashboard)

샵원장이 대시보드 탭을 열면 오늘 매출·전월 대비 성장·KPI 카드·업셀링·이번 주 요약·상담 추이 차트·디자이너별 현황·시간대별 예약·외국인 예약·재방문 골든타임 섹션을 순서대로 조회한다. 모든 데이터는 클라이언트 Zustand 스토어(records/reservations/customers/shopSettings)에서 useMemo로 계산되며 서버 요청은 없다. 비원장 역할은 접근 차단된다.

**진입 / 이탈:** 진입: 하단 TabBar '대시보드' 탭 클릭 → /dashboard. 인증 미완 시 AuthGuard가 /login으로 redirect. 비원장 역할은 '원장님 전용' 안내 화면에서 블로킹됨. 이탈: 다른 탭 이동 또는 뒤로가기. 드릴다운: KPI 카드 탭 → KPIBottomSheet 오버레이. 외국인 예약 숫자 탭 → /records?filter=foreign.

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 1. 진입 및 인증 확인 | `/dashboard (app/(main)/dashboard/page.tsx)` | MainLayout의 AuthGuard가 isInitialized·isAuthenticated를 확인. 로딩 중에는 BDX 로고 pulse 표시. 인증 완료 후 isOwner() 검사 — 비원장이면 잠금 안내 UI 렌더링. 원장이면 전체 대시보드 렌더링. | 비원장(staff role) → '원장님 전용 페이지입니다' 안내 표시, 대시보드 미노출. 비로그인 → /login redirect. |
| 2. KPI 헤더 섹션 (오늘 매출 / 전월 대비) | `page.tsx:170-271` | computeTodayRevenue, computeMonthlyRevenue, computeMonthlyConsultations, computeChangeRate를 useMemo로 계산. 오늘 매출·전월 대비 성장률·전월 대비 상담 건수 3분할 표시. monthlyTargetRevenue가 설정되어 있으면 목표 달성률 progress bar 추가 표시. getRevenueAdvice / getCountAdvice로 조언 문구 계산. | monthlyTargetRevenue 미설정 → progress bar 숨김. 전월 0건이면 change=0으로 처리. |
| 3. 업셀링 리포트 섹션 | `page.tsx:273-310` | buildServicePricingFromShopSettings + computeUpsellMetrics로 finalizedAt이 있는 레코드 기준 파츠/컬러 추가 매출 집계. record.upsellAmount가 있으면 그 값 우선 사용. | 레코드 0건 → totalUpsellRevenue=0, upsellRate=0% 표시 (빈 상태 안내 없음). |
| 4. KPI 카드 5개 (이달 상담 건수·인기 디자인·재방문율·오늘 예약·오늘 매출) | `components/dashboard/KPICards.tsx` | computeKPICards로 7개 KPI를 계산 후 VISIBLE_KPI_LABELS에 있는 5개만 BentoCard로 렌더링. 각 카드는 탭 시 KPIBottomSheet 드릴다운 오버레이 노출. Escape 키로 닫기 지원. | 데이터 없으면 카드 값이 0건/0%/-로 표시. 드릴다운 내부: 인기 디자인 breakdown.length===0이면 '데이터가 없습니다.' 텍스트. |
| 5. 이번 주 요약 (WeeklySummary 바 차트) | `components/dashboard/WeeklySummary.tsx` | computeDailyConsultations(14일)에서 이번 주 월~일 슬라이스 추출. 주간 상담 건수·영업일·일 평균 표시 후 Recharts BarChart 렌더링. | 이번 주 상담 0건 → workDays=0이라 dayAvg=0건. 차트는 모든 막대 0으로 렌더링. |
| 6. 상담 추이 차트 (RevenueChart) | `components/dashboard/RevenueChart.tsx` | computeDailyConsultations(60일) 데이터를 일별/주별/월별 토글로 aggregation. 기간 탭 클릭 시 로컬 period state 전환. Recharts AreaChart 렌더링. | 데이터 0건 → 빈 면적 차트만 표시, 빈 상태 안내 없음. |
| 7. 디자이너별 상담 현황 (DesignerPerformance) | `components/dashboard/DesignerPerformance.tsx` | computeDesignerStats로 isActive 디자이너별 상담·예약·매출·완료율 계산 후 진행 바 + Recharts BarChart + 개인 카드로 표시. | 디자이너 0명(1인샵 설정 완료 전) → 빈 섹션만 렌더링, 안내 없음. 1인샵(디자이너 1명) → 정상 단일 행. |
| 8. 시간대별 예약 (HourlyBookings) | `components/dashboard/HourlyBookings.tsx` | computeHourlyDistribution(이달 예약)으로 10~19시 baseline + 실제 예약 시간으로 확장. 피크 시간 요약 + BarChart + 상위 3 리스트 표시. | 이달 예약 0건 → baseline 10~19시 범위, count 전부 0. peakHour=undefined이라 피크 팁 미표시. 상위 3 리스트에 0건 항목이 올라옴. |
| 9. 외국인 예약 현황 섹션 | `page.tsx:347-397` | computeForeignReservationSummary(오늘·비취소 예약)로 en/zh/ja 별 건수·준비율 계산. 언어별 readyRate 프로그레스 바 표시. '오늘의 외국인 예약 N명' 버튼은 /records?filter=foreign으로 링크. | 외국인 예약 0건 → foreignerCount=0명, 언어 3개 항목은 opacity-60으로 표시됨. '오늘의 외국인 예약' 링크 클릭 시 records 페이지로 이동하나 filter=foreign 파라미터가 records 페이지에서 처리되지 않음. |
| 10. 재방문 골든타임 알림 섹션 | `page.tsx:399-447 / analytics.ts:518-564` | computeGoldenTimeTargets(visitCount≥2 고객, 28일 주기)로 이번 주 예약 없는 고객 중 예상 재방문일이 이번 주인 대상 필터링. '문구 복사' 버튼(clipboard API) + SMS 링크 표시. | 대상 0명 → '이번 주에는 별도 리마인더가 필요한 고객이 없습니다.' 안내 표시(정상). phone 없는 고객 → SMS 버튼 숨김(정상). |
| 11. 인기 서비스 / 고객 분석 (2x1 카드 2개) | `components/dashboard/ServiceAnalytics.tsx, CustomerAnalytics.tsx` | ServiceAnalytics: computeDesignScopeBreakdown·computeExpressionBreakdown·computePopularTreatments로 인기 시술 TOP5 진행 바 + 표현 기법 BarChart + 시술범위 비율 렌더링. CustomerAnalytics: computeCustomerAnalytics로 신규/재방문 PieChart + VIP TOP5 렌더링. | 레코드 0건 → 인기 시술 항목 없음(섹션 타이틀만), 표현 기법 차트 빈 축만 렌더링. 고객 0명 → 파이 0/0 렌더링(Recharts는 빈 pie를 렌더링 시도). |

---

## F8-settings · 설정 (Settings)

샵원장이 매장 정보·선생님·영업시간·가격·파츠·회원권·테마를 관리하는 플로우. /settings는 (main) 레이아웃 안에 있어 항상 한국어로 고정되며 4개 탭(매장·서비스·테마·앱)으로 구성된다. staff 역할은 테마·앱 탭만 접근 가능. 외부 손님(foreign customer)은 이 페이지를 직접 보지 않는다.

**진입 / 이탈:** 진입: /settings (네비게이션 탭바 또는 직접 URL). 비로그인 → middleware가 /login으로 리다이렉트. 데모 모드는 bdx-demo 쿠키로 통과. \| 빠져나가기: 탭바로 다른 화면 이동 / 로그아웃 → /login / 데모 전환 → /home

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 진입 | `/settings` | 인증 체크(middleware), 데모 모드 배너 표시. FeatureDiscovery onboarding 배너 조건부 렌더. 4개 탭 초기화, staff 역할이면 theme/app 탭만 노출. 기본 탭은 '매장'. | role=staff → theme 탭 기본값; isDemoMode=true → 황색 경고 배너 |
| 매장 탭 — 로고 업로드 | `/settings (shop tab)` | 파일 선택 → resizeImageToBase64(file, 400) → uploadShopLogo → 성공/실패 피드백 shopFeedback 표시 | logoUploading=true → 버튼 disabled; 업로드 실패 → error 피드백 |
| 매장 탭 — 매장 정보 수정 | `/settings (shop tab)` | 수정 버튼 → editingShop=true → Input 폼(이름·전화·주소·상세주소). 저장: updateShop + setShopSettings 병렬 호출, 성공/실패 피드백. 취소: 로컬 state를 shopSettings/shop 값으로 복원. | shopName 빈 값 → 에러 피드백; DB 실패 → 에러 피드백 |
| 매장 탭 — 선생님 관리(StaffSection) | `/settings (shop tab)` | 선생님 목록 조회. 추가: 이름 필수 검증 → createDesigner. 수정: editingId 하나만 유지, updateDesigner. 삭제: 2단계 확인 → deleteDesigner(연결 이력 있으면 비활성화 fallback). PIN 변경: 4자리 숫자 → setPassword(해시+DB). | role=owner → 삭제 차단; 이력 있는 선생님 → 비활성화로 대체; PIN 형식 오류 → 에러 피드백 |
| 매장 탭 — 영업시간(OperatingHoursSection) | `/settings (shop tab)` | 일괄/요일별 모드 전환. 일괄: 공통 시간+휴무일 배지 토글. 요일별: 각 요일 isOpen 토글+시작/종료 TimeInput. 저장: setShopSettings({businessHours}) → DB 반영 확인. | 저장 성공 → '운영 정보가 저장되었습니다.' 피드백; 실패 → 에러 피드백 |
| 서비스 탭 — 가격표 편집 | `/settings (service tab)` | 수정 버튼 → editingPrices=true → 7개 number input. 저장(handleSavePrices): parseInt 파싱 → 음수/NaN 차단 → setShopSettings(void) → 즉시 편집 모드 종료. | 음수/NaN → silent return(아무 일도 없음); DB 에러 → 사용자 피드백 없음 |
| 서비스 탭 — 시술 종류 편집 | `/settings (service tab)` | 수정 버튼 → editingCategoryPricing=true → 4개 기본 카테고리 가격/시간 입력 + 커스텀 카테고리 추가(최대 4개). 저장: cleanedCustom 필터링 후 setShopSettings(void). 취소: 스토어 값으로 복원. | 커스텀 카테고리 이름 빈 값 → 저장 시 필터링으로 조용히 제거 |
| 서비스 탭 — 커스텀 파츠 관리(CustomPartsManager) | `/settings (service tab)` | 파츠 목록 표시. 추가: 이름+가격 필수 → addPart(로컬 store) → useEffect가 setShopSettings 호출(직렬화 중복 방지). 수정/삭제: 2단계 확인 후 store 즉시 업데이트. | DB write 실패 → 화면에 피드백 없음(console.error만) |
| 서비스 탭 — 시술 항목 토글 | `/settings (service tab)` | 6개 시술 항목(오프·프렌치·자석·아트·파츠·연장) Toggle → void setShopSettings 즉시 호출. 별도 저장 버튼 없음. | DB write 실패 → 사용자 피드백 없음 |
| 서비스 탭 — 회원권 상품(MembershipPlansSection) | `/settings (service tab)` | useEffect: dbReady=false면 hydrateFromDB. 추가 모달(이름+금액+유효기간) → addPlan(로컬+void dbUpsert). 수정 모달 → updatePlan. 활성토글 → togglePlanActive. 삭제 모달(1단계) → removePlan(로컬+void dbDelete). | isFormValid=false → 추가/저장 버튼 비활성; DB 에러 → 피드백 없음 |
| 서비스 탭 — 재방문 알림 문구(RevisitMessageSection) | `/settings (service tab)` | DEFAULT_TEMPLATE 초기값. 변수 삽입 버튼({customerName}/{shopName}). 텍스트 편집 → 미리보기 실시간 업데이트. 저장 → setShopSettings → saved 피드백 1.6초 후 idle. | dirty=false → 저장 버튼 비활성; 저장 실패 → status='error' 표시 |
| 테마 탭 | `/settings (theme tab)` | ThemeSelector 컴포넌트 렌더. 테마 선택 즉시 반영. | staff 역할 포함 모두 접근 가능 |
| 앱 탭 — 로그아웃/데모 전환 | `/settings (app tab)` | 로그아웃: logout() → router.push('/login'). 데모 전환: logout() → loginAsDemo() → /home. 데모 나가기: logout() → /login. | isDemoMode → '데모 모드 나가기' 버튼 표시; 일반 → '데모 모드로 전환' 버튼 표시 |

---

## F9-preconsult · 사전상담 다국어 플로우 (Pre-consult multilingual flow)

손님이 샵 공유 링크 또는 사장님 발송 링크로 진입해 디자인 카테고리 선택 → 네일 상태/제거/랩핑/길이/모양/느낌/스타일/추가옵션 → 확인 견적 → 이름/전화 입력 → 접수까지 이어지는 사전상담 플로우. Zustand(localStorage persist)로 상태 유지, 4개 언어(ko/en/zh/ja) 지원. 3가지 제출 경로(A: 공유링크+슬롯, A-2: 샵고정링크+슬롯, B: bookingId, C: 직접접근 레거시)가 confirm 페이지에서 분기.

**진입 / 이탈:** 진입: /pre-consult/[shopId]?bookingId=XXX 또는 ?linkId=XXX 또는 파라미터 없이 직접 접근. 빠져나가기: complete 페이지에서 '닫기' 또는 60초 자동 reset → /pre-consult/[shopId] (start 페이지로 순환). 중간 이탈: 브라우저 뒤로가기로만 가능(명시적 Back 버튼 없음). shopId 미존재 시 Next.js notFound() → not-found.tsx.

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 1. 링크 진입 (Start) | `/pre-consult/[shopId]` | layout.tsx에서 서버 사이드로 shopId → fetchShopPublicData. 404면 notFound() 호출. 클라이언트에서 bookingId/linkId 파라미터를 읽어 async로 예약 정보 또는 공유링크 정보 fetch. LanguageSelector + PreConsultProgressBar 레이아웃 로드. 슬롯 있는 링크면 SlotPicker 노출, 날짜+시간 선택 필수 후 '시작하기' 활성화. | bookingId 있으면 예약 날짜/이름/전화 자동표시 → 슬롯 없이 시작. linkId 있으면 슬롯 포함 링크 → 날짜+시간 선택 필수. 둘 다 없으면 샵 고정 링크(슬롯 있으면 선택, 없으면 바로 시작). linkError 발생 시 만료 안내 화면. |
| 2. 디자인 선택 (Design) | `/pre-consult/[shopId]/design` | BodyPartToggle(현재 hand만, 렌더 생략). CategoryPicker(2×2 그리드, 샵 serviceStructure 기준 카테고리 ON/OFF). 카테고리 선택 시 DesignGallery AnimatePresence로 슬라이드인. isFeatured 포트폴리오 사진 표시, 가격 뱃지, 확대 오버레이. 사진 선택 후 '이 디자인으로 할게요' 버튼 또는 skip으로 다음 단계. | 포트폴리오 사진 없으면 galleryEmpty 안내 + Skip 버튼. 카테고리 미선택이면 갤러리 미표시(진행 불가 — 카테고리 선택이 사실상 필수). |
| 3. 상세 상담 (Consult) | `/pre-consult/[shopId]/consult` | 순차적 섹션 언락(upload → nailStatus → length → shape → vibe → style → addons → additionalRequest → review). 각 섹션 완료 시 다음 섹션이 AnimatePresence로 등장 + 자동 스크롤. 새로고침 시 Zustand 스냅샷으로 완료된 섹션 복원. 피로도 완화 메시지(midMsg1~3) 중간 삽입. 마지막 ConsultReview에서 '이대로 진행하기' 클릭 → confirm 이동. | upload: 사진 있으면 Next, 없으면 Skip. nailStatus: 기존 네일 선택 시 제거 위치 질문 → 랩핑 질문. length: 연장 선택 시 연장 길이 서브섹션 추가. style: stylePreference 선택 전까지 Next 버튼 미표시(필수 블로킹). ConsultReview의 '수정하기'는 해당 섹션부터 이후 모두 초기화. |
| 4. 확인 및 접수 (Confirm) | `/pre-consult/[shopId]/confirm` | 선택 내용 요약(카테고리, 손/발, 네일상태, 제거, 길이, 모양, 랩핑, 느낌, 스타일, 키워드, 추가옵션, 요청사항) + 가격 견적(기본+추가금 항목별 명세). 이름/전화/전화확인 입력(bookingId 경로에서는 read-only). 제출 시 경로 분기(A/A-2/B/C). Gate1(isSubmitted 체크), Gate2(bookingId preConsultationCompletedAt 체크) 재제출 방지. 클라이언트 rate limit 3회/분. | 경로 A: consultationLinkId+slot → dbCreateBookingFromConsultationLink. 경로 A-2: slot+linkId없음+bookingId없음 → dbCreateBookingFromShopLink. 경로 B: bookingId → dbCompletePreconsultationBooking. 경로 C: 파라미터 없음 → dbCreatePreConsultation + dbCompletePreConsultation. slotTaken 에러 시 '방금 다른 분이 예약' 메시지. |
| 5. 완료 (Complete) | `/pre-consult/[shopId]/complete` | 체크 애니메이션 + 완료 메시지. 슬롯 경로면 확정 일시 표시, 아니면 '자동 저장됨' 안내. isSubmitted=false이면 start 페이지로 즉시 리다이렉트. 60초 후 store.reset() 자동 실행. '닫기' 버튼으로 수동 reset + start 이동. | hasBookingSlot=true이면 예약 일시 카드 표시 + '샵에서 확인 후 연락' 안내. false이면 사전상담 완료 + '예약은 매장 별도 진행' 안내. |

---

## F10-fieldmode · 현장 시술 (Field Mode)

샵 원장이 현장에서 직접 시술을 진행할 때 사용하는 플로우. 포트폴리오에서 디자인 선택 → 옵션(제거/길이/추가) 설정 → 시술 중 추가 항목 기록 → 정산(결제/회원권/예약금/할인) → 마무리(사진/고객연결/포트폴리오). 사전 상담 예약에서 진입하면 디자인·옵션이 미리 채워진 채 시술 화면부터 시작. AuthGuard로 보호되고 locale은 항상 ko 강제.

**진입 / 이탈:** 진입: /home CTA('시술 시작') → /field-mode 또는 /field-mode/treatment (사전상담 완료 예약). /records, /records/preconsult/[bookingId] 에서도 hydrateFromBooking 후 진입. 빠져나가기: wrap-up '홈으로 돌아가기' → reset() → /home. 뒤로가기는 /home으로 직접 라우팅하거나 browser history back.

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 1. 진입 | `/field-mode` | 원장이 홈에서 '현장 시술' CTA를 탭하거나 예약 카드에서 '시술 시작'을 탭. 홈은 hydrateFromBooking으로 예약 데이터(디자인·옵션·고객정보)를 store에 주입. 사전상담 완료 예약은 /field-mode/treatment로 직행. 일반 진입은 /field-mode(포트폴리오). 인증 없으면 AuthGuard가 로그인으로 리다이렉트. | 사전상담 완료 예약 → Step 3(시술 중) 직행 / 일반 → Step 2(포트폴리오) |
| 2. 디자인 선택 | `/field-mode (phase: portfolio → design-confirm)` | 카테고리 탭 + 정렬(직원추천/인기)로 포트폴리오 그리드 탐색. 사진 탭 → design-confirm 바텀시트 오버레이(사진 확대 + 가격·시간 표시). '이 디자인으로 진행' → phase: options로. 포트폴리오 비어 있으면 빈 상태 UI + 카테고리만으로 시작 버튼(selectCategoryOnly → 바로 options로). | 사진 있음 → 확인 시트 → 옵션 / 사진 없음 → 카테고리 직접 선택 → 옵션 |
| 3. 옵션 선택 | `/field-mode (phase: options)` | QuickOptionsPanel: 제거(없음/자샵/타샵), 길이(기본/짧게/연장+세부), 랩핑 토글, 추가옵션 칩(스톤/파츠/글리터/포인트아트), 커스텀 파츠 스테퍼. 하단 PriceBar에서 실시간 가격 확인. '시술 시작→' 버튼 → startTreatment() → treatmentStartedAt 설정 → /field-mode/treatment 이동. | 연장 선택 시 세부 길이 패널 확장 / 서비스구조 OFF 항목 자동 제외 |
| 4. 시술 중 | `/field-mode/treatment` | 상단 타이머(경과시간), 디자인 카드(사진+카테고리+기본가), 사전상담 접이식 섹션(bookingId 있을 때), AddOnMiniPanel(커스텀 파츠 스테퍼+표준 추가금+직접입력). 하단 '현재 합계 + 시술 완료→'. Wake Lock으로 화면 꺼짐 방지. 뒤로가기 탭 → 확인 다이얼로그. 시술 완료 → completeTreatment() → /field-mode/settlement. | 사전상담 from-pre-consult sessionStorage flag 있으면 안내 배너 표시 |
| 5. 정산 | `/field-mode/settlement` | 디자인/옵션/추가항목 카드로 가격 내역 표시. 커스텀 파츠 빠른 추가 카드. 할인(0/5/10/15/20%), 예약금 차감(없음/자동preset/직접입력). 최종금액 표시. 결제수단 선택(현금/카드/회원권). 회원권 잔액 표시, 잔액 부족 시 차액 결제수단 추가 선택. '결제 완료' → addQuickSaleRecord → wrap-up 이동. | 회원권: 고객연결 없으면 비활성 / 잔액부족 시 복합결제 / DB실패 시 에러배너(but still navigates) |
| 6. 마무리 | `/field-mode/wrap-up` | 성공 배너. 고객 정보 섹션(이름/전화 입력 or 기존고객 자동매칭/건너뛰기). 사진 저장 섹션(촬영/갤러리, 포트폴리오 저장). 자동 데이터화 체크리스트. '공유카드 만들기' + '홈으로 돌아가기'. 홈으로 가기 → 미저장 사진 자동저장 → records 재조회 → reset() → /home. | recordId 없으면 오류 안내 + 돌아가기 / 사진저장 실패 시 재시도 가능 |

---

## F11-share · 공유카드·QR (Share Card & QR)

샵원장이 시술 완료 후 공유카드를 생성해 외국인 손님에게 공유하고, 손님이 링크로 카드를 열람·저장·사전상담 진입하는 흐름. 원장은 records/[id], field-mode wrap-up, 포트폴리오 3개 진입점에서 ShareCardGeneratorModal을 열어 이미지 다운로드 및 공유 링크를 복사한다. QR 페이지(/qr)는 샵 홍보용 QR 코드 2종(앱·가이드)을 인쇄용으로 생성한다.

**진입 / 이탈:** 진입: records/[id] '공유카드 만들기' 버튼 / field-mode/wrap-up 공유카드 버튼 / PortfolioOverlay 공유카드 버튼 / 외부 공유 링크 직접 접속(beauty-decision.com/share/[id]) / /qr 직접 접속. 빠져나가는 경로: 공유카드 열람 후 CTA 클릭 → /pre-consult/[shopId] / 모달 닫기(X 버튼 또는 배경 클릭) → 원래 페이지 복귀 / not-found에서 '/' → /splash → /intro

| 단계 | 화면 | 동작 | 분기 |
|------|------|------|------|
| 원장: 공유카드 생성 진입 | `/records/[id] 또는 /field-mode/wrap-up 또는 PortfolioOverlay` | 원장이 '공유카드 만들기' 버튼을 클릭. 결제 완료 상태일 때만 버튼이 활성화됨. ShareCardGeneratorModal이 AnimatePresence로 마운트됨. 모달 마운트 직후 useEffect가 isOpen 감지 → resolvedShareCardId가 없으면 crypto.randomUUID()로 신규 ID 생성 → dbCreateShareCard(recordId, newId, shopId) 호출 → consultation_records.share_card_id UPDATE | record.shareCardId가 이미 존재하면 DB 호출 생략. 생성 실패 시 shareCardError 표시(한국어). 포트폴리오 사진 없으면 다운로드 버튼 disabled, '시술 사진이 없어요' 표시 |
| 원장: 카드 미리보기 및 다운로드 | `/records/[id] → ShareCardGeneratorModal` | ScaledPreview로 9:16 비율 미리보기. 포트폴리오 사진 2장 이상이면 사진 선택 UI(그리드). 9:16 스토리/3:4 포스트 버튼 클릭 → html2canvas-pro로 오프스크린 ShareCardImageTemplate DOM 캡처 → JPEG data URL → anchor.click()으로 다운로드. 공유 링크 복사 버튼은 share card ID가 생성된 후에만 표시 | resolvedImageUrl 없으면 다운로드 불가. html2canvas 실패 시 console.error만 (사용자 피드백 없음). 200ms settle 딜레이 후 캡처 |
| 원장: 공유 링크 복사 | `/records/[id] → ShareCardGeneratorModal` | resolvedShareCardId 있을 때만 '공유 링크 복사' 버튼 표시. navigator.clipboard.writeText()로 https://beauty-decision.com/share/{shareCardId} 복사. 복사 성공 시 버튼 상태 변경(2.5초 후 원복). 카카오톡/네이버 예약 URL은 shopSettings에서 설정된 경우에만 추가 표시 | clipboard API 실패 시 document.execCommand('copy') 폴백. shareUrl이 null이면 버튼 자체가 렌더링 안 됨 |
| 외국인 손님: 공유 링크 접속 | `/share/[shareCardId]` | Server Component가 fetchShareCardPublicData(shareCardId) 호출. consultation_records를 share_card_id로 조회 후 get_shop_public_data RPC(SECURITY DEFINER)로 샵 정보 조회. portfolio_photos(is_public=true)에서 이미지 URL 수집. ShareCardPublicData를 ShareCardClient에 전달. 클라이언트에서 카드 렌더링(framer-motion 0.5s 페이드인) | data가 null이면 notFound() → not-found.tsx 표시. 사진 없으면 💅 이모지 플레이스홀더. DB 에러(네트워크 등)는 global error.tsx로 fallback |
| 외국인 손님: 카드 열람 및 이미지 저장 | `/share/[shareCardId]` | 9:16 비율 카드 렌더링. '이미지 저장' 버튼 클릭 → html2canvas-pro로 #share-card-capture-target DOM 캡처(scale:3, useCORS:true) → JPEG data URL → anchor.click()으로 다운로드. 저장 중 스피너 표시. isDownloading guard로 중복 클릭 방지 | html2canvas 실패 시 console.error만(사용자 피드백 없음). iOS Safari에서 data: URI download attr 미지원(새 탭에서 열림). 이미지 CORS 실패 시 조용히 실패 |
| 외국인 손님: CTA → 사전상담 진입 | `/share/[shareCardId] → ShareCardCTASection → /pre-consult/[shopId]` | consultationLinkId가 없으므로 항상 ctaConsult 버튼(이 디자인으로 상담하기) 표시. 클릭 시 /pre-consult/{shopId}?from=share&designCategory={category}로 이동. pre-consult에는 LanguageSelector 있어 언어 선택 가능. from=share 파라미터는 현재 pre-consult에서 사용되지 않음(dead param). designCategory는 /pre-consult/[shopId]/design/page.tsx에서 selectedCategory 자동 세팅 | consultationLinkId prop이 전달되지 않으므로 ctaBook 분기에 도달 불가 |
| 없는 카드 접근 | `/share/[shareCardId] → not-found.tsx` | fetchShareCardPublicData가 null 반환 → notFound() 호출 → not-found.tsx 렌더링. not-found.tsx는 useT()로 shareCard.notFound 키 사용(4개 언어 번역 있음). '/' 링크 제공 | useT()가 현재 locale로 번역. 외국인 손님이 직접 접속하면 locale이 ko(기본값)이므로 한국어 노출. '/' 링크는 비로그인 사용자를 /splash → /intro로 리다이렉트 |
| QR 코드 페이지 (원장용) | `/qr` | qrcode.react로 앱 URL, 가이드 URL QR 2종 생성. 프린트 버튼 window.print(). PNG 다운로드 버튼은 QRCodeCanvas ref를 통해 canvas.toDataURL() 후 anchor.click(). 인증 불필요(PUBLIC_ROUTES 등록) | QRCodeCanvas ref를 HTMLCanvasElement로 타입 선언하나 qrcode.react v4 내부 ref 구조에 따라 null 가능. ref가 null이면 다운로드 버튼 클릭 시 아무것도 안 됨(silently) |

---
