# BDX QA Checklist

> 2026-03-12 기준 전체 QA 결과 (브라우저 자동화 + 코드 분석)

## 범례
- [x] 통과
- [ ] 미통과 (수정 필요)
- [~] 부분 통과 (Minor 이슈 존재)

---

## 1. 빌드 & 타입

- [x] `npx tsc --noEmit` — 타입 에러 없음
- [x] `pnpm build` — 프로덕션 빌드 성공
- [x] `pnpm lint` — 에러 없음 (Warning: `<img>` → `<Image />` 8건)
- [x] 모든 페이지 정적/동적 렌더링 정상

---

## 2. 상담 플로우 — 이중 언어 (핵심 QA)

### 2.1 상담 시작 (`/consultation`)
- [x] 언어 선택 버튼 (한/영/중/일)
- [x] 디자이너 선택 — i18n 키 사용
- [x] 스텝 플로우 라벨 — 이중 언어 표시
- [x] 재개 팝업 — 한국어 전용 (사장님용)

### 2.2 고객 정보 (`/consultation/customer`)
- [x] 폼 라벨/플레이스홀더 — `t()` + `tKo()` 이중 표시
- [x] 기존 고객 검색 — i18n 처리
- [~] 헤더 "Customer Info" 영어 하드코딩 → Minor
- [ ] "고객이 원하는 디자인 참고 이미지 (최대 5장)" 한국어 하드코딩

### 2.3 기본 조건 (`/consultation/step1`)
- [x] BodyPartSelector — `t()` + `tKo()` 정상
- [x] OffSelector — 뱃지, "기본 포함" 모두 이중 언어
- [x] ExtensionSelector — 수량, 소계 이중 언어
- [x] ShapeSelector — 7종 쉐입 이중 언어
- [~] 헤더 "Basic Conditions" 영어 + "시술 부위 · 제거 · 연장 · 쉐입" 한국어 하드코딩

### 2.4 시술 범위 (`/consultation/step2`)
- [x] DesignScopeSelector — 대부분 이중 언어
- [x] ExpressionSelector — `EXPR_I18N_KEYS` 매핑 정상
- [ ] "이달의 아트" — "Special Design of the Month" 영어 하드코딩 (zh/ja에서 한국어 보조 없음)
- [~] 헤더 "Design Scope" 영어 + "디자인 범위" 한국어 하드코딩

### 2.5 추가 옵션 (`/consultation/step3`)
- [x] ColorSelector — 이중 언어 정상
- [x] PartsSelector 퀵칩 — `PARTS_I18N_MAP` 매핑 정상
- [ ] PartsSelector 등급 설명/예시 — `description`, `examples` 한국어 고정
- [~] 헤더 "Extra Options" 영어 + "발색 방법 · 파츠 · 컬러" 한국어 하드코딩

### 2.6 캔버스 (`/consultation/canvas`)
- [x] HandSwitcher — 왼손/오른손 이중 언어
- [x] FingerSummary — 시술 유형 뱃지 `TREATMENT_TYPE_I18N` 매핑
- [ ] HandIllustration AnnotationCard — `selection.note` 한국어 직접 표시 (Critical)
- [ ] PartsPalette 퀵칩 — `part.name` 한국어 직접 표시 (i18n 미적용)
- [ ] FingerSummary "Point" 뱃지 영어 하드코딩

### 2.7 요약 (`/consultation/summary`)
- [x] ConsultationSummaryCard — `VALUE_I18N_MAP`으로 값 번역
- [x] `biLabel()` / `biValue()` 헬퍼 패턴 적용
- [x] DiscountModal — 전체 이중 언어
- [x] PriceSummaryBar — 예상 금액/시간 이중 언어
- [x] `formatMinutes(minutes, locale)` — locale-aware
- [ ] "저장 시 고객 기록에 자동 추가" 한국어 하드코딩

### 2.8 공통 상담 UI
- [x] ConsultationHeader — title + titleKo 이중 표시
- [x] ConsultationFooter — 예상 금액 이중 언어

---

## 3. 사장님 페이지 (항상 한국어)

### 3.1 홈 (`/home`)
- [x] 인사말, 통계, CTA — `t()` 키 사용 (ko 고정)
- [x] 예약 카드 — 상태/채널/태그 표시 정상
- [x] 사전상담 알림 배너 — "주자훈 님이 사전 상담을 제출했어요" 정상 표시
- [x] 예약 상태 자동 전환 — 사전상담 제출 후 "디자인 확정" 상태로 변경
- [x] 알림 벨 미확인 카운트 — 뱃지 "1개" 정상
- [~] "상담 완료" 하드코딩 (Minor, ko 고정이므로)
- [~] 역할 표시 "원장"/"선생님" 하드코딩 (i18n 키 존재하나 미사용)

### 3.2 대시보드 (`/dashboard`)
- [x] KPI 카드 4종 — 이달 상담 건수, 인기 디자인, 재방문율, 오늘 예약
- [x] 이번 주 요약 — 주간 상담/영업일/일평균 + 차트
- [x] 상담 추이 차트 (일별/주별/월별)
- [x] 디자이너별 상담 현황
- [x] 시간대별 예약
- [x] 외국인 예약 현황
- [x] 재방문 골든타임 알림
- [x] 업셀링 리포트
- [x] 인기 서비스 / 고객 분석
- [~] Recharts width/height 경고 (콘솔, Minor)

### 3.3 고객 관리 (`/customers`)
- [x] 검색, 필터 탭 (전체/단골/일반), 통계 카드
- [x] 고객 목록 — 이름, 방문 횟수, 총액
- [x] 신규 고객 자동 추가 — 상담 제출 후 고객 목록에 반영
- [~] VIP 필터 기준 이중 정의 (`isRegular || visitCount >= 5` vs `isRegular`)
- [~] 스몰토크 작성자 `designer-001` 하드코딩

### 3.4 기록 (`/records`)
- [x] 주간 캘린더 + 디자이너별 타임그리드
- [x] 예약 관리 / 상담 기록 탭 전환
- [x] 날짜 상태 범례 (상담 필요/상담 완료)
- [x] 예약 카드 태그 표시 (큐티클민감 등)
- [~] `confirm()` 사용 (iOS 호환성)
- [~] 예약 모달 `channel` 원시값 노출

### 3.5 설정 (`/settings`)
- [x] 매장/서비스/테마/앱 4탭 — 로드 정상
- [x] 선생님 관리 (프로필 수정/사진 업로드/삭제)
- [x] 운영 정보 (영업시간, 휴무일, 저장)
- [x] 테마 변경 실시간 반영

---

## 4. 알림 시스템 (신규 섹션)

### 4.1 사전상담 알림 플로우
- [x] 고객 상담 제출 → DB 저장 (`dbCompletePreconsultationBooking`) 정상
- [x] 같은 브라우저/탭 내 알림 즉시 반영 (Zustand + localStorage)
- [x] 알림 벨 뱃지 카운트 정상
- [x] 알림 배너 텍스트 + 확인/닫기 정상
- [x] 알림 센터 — 빈 상태 안내문 정상
- [ ] **크로스 기기 실시간 알림 없음** — Supabase Realtime 미사용. 고객이 다른 기기에서 제출 시 사장님은 새로고침/재로그인해야 확인 가능 (Critical)

### 4.2 시술 전 알림 (PretreatmentAlertModal)
- [x] 핀 태그 있는 고객 → 상담 시작 전 모달 표시
- [x] 세이프티 태그 색상 코드 (🔴 높음 / 🟠 중간 / 🟡 참고 / 🟢 선호)

### 4.3 재방문 골든타임 알림
- [x] 홈 RevisitReminderCard — 28일 경과 고객 표시
- [x] 대시보드 computeGoldenTimeTargets — 이번 주 타이밍 정밀 필터
- [~] 홈 vs 대시보드 기준 상이 (홈: 28일 단순 초과, 대시보드: 이번 주 해당 + visitCount >= 2)

### 4.4 알림 읽음 상태
- [x] localStorage `bdx-preconsult-read-v2` 기반 읽음 관리
- [x] 같은 탭 내 `bdx-preconsult-notifications-updated` 커스텀 이벤트 동기화
- [x] 다른 탭 `storage` 이벤트 동기화
- [~] 닫기(X)와 확인 버튼 모두 `markRead()` 호출 — 의미적 차이 없음

---

## 5. 고객 상담 링크 플로우 (신규 섹션)

### 5.1 상담 링크 생성
- [x] 예약 카드 "상담 링크" 버튼 → URL 생성 정상
- [x] URL 파라미터 포함: `name`, `phone`, `bookingId`, `entry=customer-link`, `shopName`, `lang`
- [x] QR 코드 생성 (범용, bookingId 없음) — UI 확인 가능

### 5.2 customer-link 진입 플로우
- [x] 스플래시 "잠시만요, 상담을 준비하고 있어요" → 2.5초 후 자동 전환
- [x] 샵명 "admin-leanup" 스플래시에 표시
- [x] sessionStorage로 스플래시 1회 제한 — 뒤로가기 시 재표시 안 함
- [x] Step 1 고객 정보 — 이름/전화번호 URL 파라미터에서 프리필
- [x] 기존 고객 검색 UI 숨김 (customer-link 모드)
- [x] Step 2 기본 조건 → Step 3 시술 유형 → Step 4 특성 → Step 5 요약 순서 정상

### 5.3 customer-link 요약/제출
- [x] 할인/추가금 UI 숨김 (customer-link 모드)
- [x] "상담 제출" → save-complete 정상 이동
- [x] save-complete: "사전 상담이 저장됐어요" + 요약 카드 표시
- [x] staff 전용 버튼 (고객 상세, 홈으로) 숨김 정상
- [x] "새 상담 다시 작성하기" 버튼 표시 (고객 전용)

### 5.4 제출 후 사장님 화면 반영
- [x] 예약 카드 상태: "현장 상담 필요" → "디자인 확정" 전환
- [x] 오늘 상담 카운트 증가 (1 → 2)
- [x] 오늘 매출 반영 (₩65,000 → ₩130,000)
- [x] 최근 상담에 새 항목 추가
- [x] 고객 태그 (큐티클민감) 예약 카드에 표시

### 5.5 보안/접근 제어
- [x] `/consultation/*` 경로 인증 없이 접근 가능 (미들웨어 PUBLIC)
- [ ] **customer-link에서 `/consultation/step3`, `/consultation/canvas` URL 직접 접근 가능** — 라우트 보호 없음. `isCustomerLinkFlow`는 클라이언트 상태 기반이므로 브라우저 URL 조작 시 staff용 기능 노출 가능 (Medium)
- [~] consultation-store sessionStorage — 탭 닫으면 진행 중 상담 데이터 소멸 (의도적이나 UX 리스크)

---

## 6. i18n 시스템 (신규 섹션)

### 6.1 (main) 페이지 한국어 강제
- [ ] **SideNav 언어 변경 시 (main) 페이지가 외국어로 전환됨** (Critical)
  - 원인: `layout.tsx`의 `useLayoutEffect([setLocale])`가 최초 마운트 1회만 실행
  - SideNav에서 `setLocale('ja')` 호출 후 되돌릴 기회 없음
  - 재현: 설정 → SideNav 하단 언어 드롭다운 → 日本語 선택 → 사이드바/콘텐츠 전체 일본어
  - 수정: `useLayoutEffect` 의존성에 `locale` 추가 또는 SideNav에서 (main) 컨텍스트 언어 변경 UI 제거

### 6.2 Dual Language Display
- [x] 상담 페이지: 외국어 + 한국어 보조 표시 패턴 일관 적용
- [x] `useT()` / `useKo()` / `useLocale()` 훅 정상 동작

---

## 7. 코드 품질

### 7.1 TypeScript
- [x] `npx tsc --noEmit` 에러 없음
- [ ] `as any` BookingStatus 우회 (`summary/page.tsx:66`)
- [~] 동적 i18n 키 (`t('shape.' + value)`) 폴백 없음

### 7.2 React 패턴
- [~] `calculatePrice` / `estimateTime` 중복 호출 (useMemo 미사용)
- [~] `useEffect([], ...)` 빈 의존성 배열 (ESLint 경고 가능)
- [~] `VALUE_I18N_MAP` 컴포넌트 내부 상수 (렌더링마다 재생성)

### 7.3 데이터 저장
- [x] `addRecord()` → `dbUpsertRecord()` 자동 DB 저장 확인
- [~] DB 저장은 fire-and-forget (`.catch(console.error)`) — 실패 시 로컬만 저장, UI 피드백 없음
- [~] `updateReservationAfterPreconsult`는 `updateReservation`의 단순 alias — 코드 혼동

### 7.4 코드 중복
- [~] `CustomerLinkSplash` 컴포넌트가 `consultation/page.tsx`와 `consultation/customer/page.tsx`에 동일 복제
- [~] ESLint Warning: `<img>` 8건 → `next/image` `<Image />` 권장

### 7.5 보안/호환성
- [~] `color-mix()` CSS — Chrome 111+ / Safari 16.2+ 필요
- [x] XSS/주입 취약점 — 발견 안됨
- [x] 사용자 입력 검증 — 기본 수준 적용
- [x] 콘솔 에러: PretendardVariable.woff2 404 (로컬 폰트 파일 누락, 개발환경)

---

## 8. 반응형 / 접근성

- [x] 모바일 레이아웃 (375px~)
- [x] 태블릿 레이아웃 (768px~)
- [x] iOS safe-area 처리 (`env(safe-area-inset-bottom)`)
- [~] `aria-label` 일부 누락 (갤러리, 태그 편집 버튼)
- [x] Tailwind CSS v4 테마 변수 일관 사용

---

## 수정 필요 항목 요약

| # | 심각도 | 내용 | 파일 |
|---|--------|------|------|
| 1 | **Critical** | SideNav 언어 변경 → (main) 페이지 외국어 전환 | `layout.tsx`, `SideNav.tsx` |
| 2 | **Critical** | 크로스 기기 실시간 알림 없음 (Supabase Realtime 미사용) | `reservation-store.ts`, `SupabaseProvider.tsx` |
| 3 | Critical | AnnotationCard `selection.note` 한국어 노출 | `HandIllustration.tsx` |
| 4 | Major | customer-link에서 `/step3`, `/canvas` URL 직접 접근 가능 | `step3/page.tsx`, `canvas/page.tsx` |
| 5 | Major | PARTS_GRADE description/examples 한국어 | `PartsSelector.tsx`, `PartsPalette.tsx` |
| 6 | Major | PartsPalette 퀵칩 한국어 | `PartsPalette.tsx` |
| 7 | Major | "Special Design of the Month" 영어 고정 | `DesignScopeSelector.tsx` |
| 8 | Major | step 헤더 설명문 한국어 하드코딩 | `step1~3/page.tsx`, `customer/page.tsx` |
| 9 | Major | summary 안내문구 한국어 하드코딩 | `summary/page.tsx` |
| 10 | Major | "Point" 뱃지 영어 하드코딩 | `FingerSummary.tsx` |
| 11 | Medium | `as any` BookingStatus | `summary/page.tsx` |
| 12 | Medium | DB 저장 silent failure (fire-and-forget) | `records-store.ts` |
| 13 | Minor | CustomerLinkSplash 코드 중복 | `consultation/page.tsx`, `customer/page.tsx` |
| 14 | Minor | 재방문 알림 홈/대시보드 기준 상이 | `RevisitReminderCard.tsx`, `analytics.ts` |
| 15 | Minor | `<img>` → `<Image />` ESLint 경고 8건 | `login`, `signup`, `splash`, `SideNav` |
| 16 | Minor | PretendardVariable.woff2 404 (개발환경) | 폰트 파일 누락 |
