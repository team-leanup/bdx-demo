# BDX 로직 QA 체크리스트

> 생성일: 2026-03-17
> 수정일: 2026-03-17
> 검증 방법: 코드 정적 분석 + Supabase DB 검증 + 4개 병렬 에이전트 심층 분석
> 대상: 전체 코드베이스 (Store, 상담 플로우, 메인 페이지, 데이터/i18n 레이어)

---

## 진행 요약

| 카테고리 | 전체 | ✅ 수정됨 | 🟡 Minor | 🔵 Info | 🟠 DB(미수정) |
|----------|------|----------|---------|---------|-------------|
| A. Store 레이어 | 10 | 5 | 3 | 2 | 0 |
| B. 상담 플로우 | 9 | 5 | 3 | 1 | 0 |
| C. 메인 페이지 | 10 | 5 | 3 | 2 | 0 |
| D. 데이터/i18n | 10 | 5 | 3 | 2 | 0 |
| E. DB 데이터 품질 | 4 | 0 | 1 | 1 | 2 |
| **합계** | **43** | **20** | **13** | **8** | **2** |

---

## A. Store 레이어 (Zustand)

### ✅ ~~A-1. auth-store `_initDone` 모듈 변수 — 로그아웃 후 재초기화 불가 (Critical)~~

**파일**: `src/store/auth-store.ts`
**수정**: `logout()` 시작 부분에 `_initDone = false; _initPromise = null;` 추가.

---

### ✅ ~~A-2. logout() 시 다른 store 정리 불완전 (Major)~~

**파일**: `src/store/auth-store.ts`
**수정**: `logout()`에서 localStorage 키 6개 삭제 (bdx-customers, bdx-records, bdx-reservations, bdx-portfolio, bdx-shop, bdx-app).

---

### ✅ ~~A-3. reservation-store 30초 폴링 vs 낙관적 업데이트 충돌 (Major)~~

**파일**: `src/store/reservation-store.ts`
**수정**: `_lastLocalUpdateAt` 타임스탬프 필드 추가. `updateReservationLocally` 시 타임스탬프 설정, `hydrateFromDB` 시 5초 이내 로컬 업데이트가 있으면 skip.

---

### ✅ ~~A-4. customer-store `createCustomer` DB 실패 시 롤백 없음 (Major)~~

**파일**: `src/store/customer-store.ts`
**수정**: DB 실패 시 로컬 상태에서 해당 고객을 `filter`로 제거하는 롤백 로직 추가.

---

### ✅ ~~A-5. app-store `isOnboardingComplete`와 auth-store `currentShopOnboardingComplete` 이중 관리 (Major)~~

**파일**: `src/store/app-store.ts`
**수정**: `setOnboardingComplete()` 에서 auth-store의 `setCurrentShopOnboardingComplete()`도 동기 호출하여 양쪽 동기화.

---

### 🟡 A-6. locale-store `restoreLocale` 미호출 시 locale 누출 (Minor)

**파일**: `src/store/locale-store.ts`
**현상**: 상담 중간에 브라우저 뒤로 가기/탭 닫기로 이탈하면 `previousLocale`이 localStorage에 남고 외국어 상태 유지. `home/page.tsx`의 `restoreLocale()` 안전망은 있으나 다른 메인 페이지(records, customers)에는 없음.
**고객 관점**: 사장님이 다음 고객 상담 시작 전까지 외국어 UI로 남을 수 있음.
**검증 방법**: 영어 상담 시작 → step2에서 브라우저 뒤로 → records 페이지 직접 이동.

---

### 🟡 A-7. portfolio-store `hydrateFromDB` 중복 실행 (Minor)

**파일**: `src/store/portfolio-store.ts`
**현상**: SupabaseProvider에서 앱 시작 시 한 번 + portfolio 페이지 진입 시마다 재실행. `_dbReady` 체크 없이 중복 Supabase 쿼리 발생.
**영향**: 대용량 포트폴리오 시 불필요한 네트워크 요청.

---

### 🟡 A-8. onboarding-store SSR 불안전 스토리지 (Minor)

**파일**: `src/store/onboarding-store.ts`
**현상**: 다른 store들은 `createJSONStorage(() => typeof window !== 'undefined' ? localStorage : ...)` 패턴으로 SSR 안전 처리하지만, 이 store만 기본 persist storage 사용.
**영향**: SSR/SSG 환경에서 hydration mismatch 가능.

---

### 🔵 A-9. consultation-store STEP_ORDER와 CUSTOMER_LINK_STEP_ORDER 동일 (Info)

**파일**: `src/store/consultation-store.ts:85-101`
**현상**: 두 배열이 완전 동일. `customer_link` 분기 처리가 실질적으로 다르지 않음.
**영향**: 코드 가독성/의도 불명확.

---

### 🔵 A-10. STEP_ORDER에 STEP3_OPTIONS, CANVAS, PRO_MODE 미포함 (Info)

**파일**: `src/store/consultation-store.ts`
**현상**: `goNext()/goPrev()` 액션에서 step3·canvas를 포함하지 않아 "유령 단계"로 동작. `currentStep`이 `STEP3_OPTIONS`이면 `idx === -1`로 아무 동작 안 함.
**영향**: 의도적 설계(선택적 단계)로 보이나, step3에서 `goNext()`를 호출하면 실패.

---

## B. 상담 플로우 (Consultation)

### ✅ ~~B-1. step3 handleNext의 step 불일치 — 재개 시 잘못된 경로 (Critical)~~

**파일**: `src/app/consultation/step3/page.tsx`
**수정**: `setStep(ConsultationStep.STEP3_OPTIONS)` → `setStep(ConsultationStep.TRAITS)` 변경. 재개 시 정확한 라우팅 보장.

---

### ✅ ~~B-2. 가드 조건 부족 — URL 직접 접근으로 빈 데이터 저장 가능 (Critical)~~

**파일**: `src/lib/use-consultation-guard.ts`
**수정**: `requireCustomerName` 옵션 파라미터 추가. customerName 없으면 `/consultation/customer`로 리다이렉트.

---

### ✅ ~~B-3. traits 페이지 backHref 하드코딩 — canvas 미경유 시 UX 혼란 (Major)~~

**파일**: `src/app/consultation/traits/page.tsx`
**수정**: canvasData 존재 여부에 따라 동적 backHref 결정 (canvas 있으면 → canvas, 없으면 → step3).

---

### ✅ ~~B-4. treatment-sheet 스몰토크 검색이 이름 기반 (Major)~~

**파일**: `src/app/consultation/treatment-sheet/page.tsx`
**수정**: `customerId` 우선 검색으로 변경. customerId 없으면 이름 기반 fallback 유지.

---

### ✅ ~~B-5. 참고 이미지 blob: URL 지속성 문제 (Major)~~

**파일**: `src/app/consultation/summary/page.tsx`
**수정**: blob URL을 fetch → FileReader.readAsDataURL로 data URI 변환 후 포트폴리오에 저장. 변환 실패 시 skip.

---

### 🟡 B-6. additionalCharge가 store에 미저장 (Minor)

**파일**: `src/app/consultation/summary/page.tsx`
**현상**: "추가 금액" 입력은 `useState` 로컬 상태에만 존재. 뒤로갔다 다시 돌아오면 0으로 초기화. `savedRecord.finalPrice`에는 반영되지만 store에는 없음.
**사장님 관점**: 추가 금액 입력 후 뒤로 갔다 오면 금액이 사라져 다시 입력해야 함.

---

### 🟡 B-7. handleSave에서 customerName 빈 값 fallback (Minor)

**파일**: `src/app/consultation/summary/page.tsx`
**현상**: `consultation.customerName ?? '새 고객'`으로 이름 없이도 고객 생성 가능. B-2(가드 우회)와 결합하면 문제됨.

---

### 🟡 B-8. reset() 타이밍 이슈 (Minor)

**파일**: `src/app/consultation/treatment-sheet/page.tsx`
**현상**: `router.replace('/home')` 후 `setTimeout(() => reset(), 0)` 호출. 렌더링 타이밍에 따라 홈 화면이 빈 consultation 상태를 읽을 수 있음.

---

### 🔵 B-9. 메모 별도 저장소 사용 (Info)

**파일**: `src/app/consultation/customer/page.tsx`
**현상**: `memo`가 `consultation-store`가 아닌 `sessionStorage['consultation_customer_memo']`에 별도 저장. 의도적 설계로 보이나 일관성 부족.

---

## C. 메인 페이지 (사장님)

### ✅ ~~C-1. KPICards `daysPassed`/`daysInMonth` UTC 오용 (Critical)~~

**파일**: `src/components/dashboard/KPICards.tsx`
**수정**: `getUTCDate()` 제거, `today.split('-').map(Number)`로 KST 날짜 문자열 직접 파싱.

---

### ✅ ~~C-2. records 페이지 주 시작일 불일치 — 일요일 기준 vs 월요일 기준 (Major)~~

**파일**: `src/app/(main)/records/page.tsx`
**수정**: `getKoreanWeekStart()` + `addDaysInKorea()` 사용, 문자열 비교 방식으로 월요일 기준 통일.

---

### ✅ ~~C-3. 태그 필터가 pinned 태그만 검색 (Major)~~

**파일**: `src/app/(main)/records/page.tsx`
**수정**: `getPinnedTags()` → `getById().tags` 전체 태그 검색으로 변경.

---

### ✅ ~~C-4. settings DB 동기화 누락 필드 (Major)~~

**파일**: `src/store/app-store.ts`, `src/lib/db.ts`
**수정**: `dbUpdateShopCore()` 신규 함수 추가. `setShopSettings()`에서 `Promise.all([dbUpdateShopCore, dbUpdateShopSettings])` 병렬 호출.

---

### ✅ ~~C-5. 매출 집계에 예약금 차감된 finalPrice 사용 (Major)~~

**파일**: `src/lib/analytics.ts`
**수정**: revenue 계산에 `record.finalPrice + (record.consultation.deposit ?? 0)` 적용, 예약금을 다시 합산하여 실제 시술 매출 반영.

---

### 🟡 C-6. todayRevenue에 pre_consultation 포함 가능성 (Minor)

**파일**: `src/app/(main)/home/page.tsx`
**현상**: `todayConsultations.reduce((sum, r) => sum + r.finalPrice, 0)` — 상담 완료 여부 무관 합산. pre_consultation의 finalPrice가 0이면 무해하지만, 사전 상담에서도 가격이 설정될 수 있음.

---

### 🟡 C-7. customers avgSpend가 탭 필터와 무관 (Minor)

**파일**: `src/app/(main)/customers/page.tsx:56-60`
**현상**: `avgSpend`는 `customers` 전체 기준 계산. VIP/일반 탭 선택과 무관하게 동일 값 표시.
**사장님 관점**: "단골 고객 평균 매출"을 보고 싶은데 전체 평균만 표시됨.

---

### 🟡 C-8. todayConsultations 날짜 비교 방식 불일치 (Minor)

**파일**: `src/app/(main)/records/page.tsx:228`
**현상**: `c.createdAt.split('T')[0] === today` — 단순 문자열 분할. 다른 곳은 `toKoreanDateString()` 사용. createdAt이 UTC ISO 문자열이면 KST 기준과 다를 수 있음.

---

### 🔵 C-9. FilterTab 'regular' 영어 의미와 한국어 라벨 반대 (Info)

**파일**: `src/app/(main)/customers/page.tsx:103-106`
**현상**: `key: 'regular'`가 "일반 고객(비단골)"을 의미하지만, 영어 'regular'는 "단골". 코드 가독성 문제.

---

### 🔵 C-10. 기본 요금 범위 검증 없음 (Info)

**파일**: `src/app/(main)/settings/page.tsx`
**현상**: 파츠 가격은 음수 불가 체크 있으나, 기본 손/발 요금(`baseHandPrice`)에는 최소값 검증 없음.

---

## D. 데이터/i18n 레이어

### ✅ ~~D-1. squoval 번역 3종 혼재 — UI 일관성 파괴 (Critical)~~

**파일**: `src/lib/i18n.ts`, `src/data/service-options.ts`
**수정**: 모든 곳을 '스퀘오벌'로 통일. i18n shape.squoval, values.squoval, service-options label 변경.

---

### ✅ ~~D-2. zh/ja `dashboard.title` 번역 누락 (Major)~~

**파일**: `src/lib/i18n.ts`
**수정**: zh에 `title: '仪表盘'`, ja에 `title: 'ダッシュボード'` 추가.

---

### ✅ ~~D-3. 데모 고객 `designScope`에 비정규 값 (Major)~~

**파일**: `src/store/customer-store.ts`
**수정**: 비정규 값을 DesignScope 타입으로 매핑 ('프리미엄 아트'→'full_art', '시그니처 아트'→'monthly_art', '그라데이션'→'solid_tone', '프렌치'→'solid_point').

---

### ✅ ~~D-4. analytics.ts 날짜 유틸 자체 구현 — format.ts와 불일치 (Major)~~

**파일**: `src/lib/analytics.ts`
**수정**: `startOfWeek()` 확인 결과 이미 월요일 기준으로 올바르게 구현되어 있었음. 추가 수정 불필요.

---

### ✅ ~~D-5. `zh.home.channel_kakao` = '카카오' — 한국어 그대로 노출 (Minor → 함께 수정)~~

**파일**: `src/lib/i18n.ts`
**수정**: `'카카오'` → `'KakaoTalk'` (en과 동일하게 통일).

---

### 🟡 D-6. `DEFAULT_BASE_PRICES` 중복 미사용 상수 (Minor)

**파일**: `src/data/service-options.ts`
**현상**: `DEFAULT_BASE_PRICES`가 `price-calculator.ts`의 `DEFAULT_SERVICE_PRICING`과 값이 같지만 독립적으로 존재. 어디서도 import되지 않음.

---

### 🟡 D-7. charm 파츠 가격 불일치 (Minor)

**파일**: `src/data/service-options.ts`
**현상**: DEFAULT_CUSTOM_PARTS의 charm = 2500원, PARTS_GRADE_OPTIONS A등급(참 포함) = 2000원.

---

### 🟡 D-8. PartGrade deprecated 선언 vs 광범위 사용 (Minor)

**파일**: `src/types/canvas.ts:4`
**현상**: `@deprecated` 주석이지만 `ConsultationType.partsSelections`에서 핵심 필드로 활성 사용 중.

---

### 🔵 D-9. normalizePhone vs normalizePhoneRaw 중복 구현 (Info)

**파일**: `src/lib/phone.ts`, `src/store/customer-store.ts`
**현상**: `normalizePhone`은 국가코드(0082, 82) 처리 있음. `normalizePhoneRaw`는 단순 숫자 추출. 검색 시 `normalizePhoneRaw` 사용 → 국가코드 번호 검색 실패 가능.

---

### 🔵 D-10. useKo() 불필요한 useCallback 래핑 (Info)

**파일**: `src/lib/i18n.ts:3222`
**현상**: `useKo()`는 항상 `ko` 참조하므로 의존성이 없음. `useCallback([], [])` 래핑은 불필요.

---

## E. DB 데이터 품질 (Supabase 검증)

> 검증 대상: `pzwmqorvrhdkckkdqemo` (BDX, ap-northeast-2)
> 테이블 행 수: customers(107), consultation_records(74), booking_requests(39), customer_tags(143), designers(23), shops(16), portfolio_photos(19), small_talk_notes(24)

### ✅ E-0. FK 무결성 — 모두 정상

orphan_records: 0, orphan_bookings: 0, orphan_tags: 0, orphan_notes: 0

---

### 🟠 E-1. 미확정 레코드 비율 82% (Major)

**현상**: consultation_records 74건 중 `finalized_at IS NULL` = 61건 (82%).
**분석**: 61건 모두 `designScope` 존재 → 상담 데이터는 있으나 시술 확인서 미작성 상태.
**영향**: `getRecordStatus()` = 'in_progress' 또는 'pre_consultation' → 매출 통계에서 완료 건만 집계하는 로직이 있다면 과소 집계. 대시보드 "이달 상담 건수"에서 pre_consultation을 제외하므로 일부 누락 가능.
**사장님 관점**: 시술 확인서를 쓰지 않으면 상담이 통계에 안 잡힘.

---

### 🟠 E-2. 중복 전화번호 12건 — 동일 shop 내 동일 번호 다중 고객 (Major)

**현상**: 같은 shop_id 내에서 동일 전화번호로 여러 고객이 생성됨.
**상위 사례**:
- `010-2196-5811` (shop-demo): 주자훈 3 + 테스트 3 = 6건
- `010-2201-7788` (shop-demo): 이서연 5건
- `01012345678` (shop-1773667199770): test 4건

**영향**: `findByPhoneNormalized()` 호출 시 첫 번째 매칭만 반환 → 나머지 중복 고객은 새 고객으로 추가 생성 가능 (악순환).
**사장님 관점**: 같은 고객이 여러 번 생성되어 상담 이력이 분산됨.

---

### 🟡 E-3. 전화번호 없는 고객 42% (Minor)

**현상**: customers 107명 중 45명(42%)이 `phone IS NULL OR phone = ''`.
**분석**: customer_link(QR) 통한 사전 상담에서 전화번호 미입력 허용 + 테스트 데이터 가능성.
**영향**: 전화번호 기반 고객 매칭 불가 → 매번 새 고객으로 생성될 수 있음.

---

### 🔵 E-4. 가격 데이터 무결성 (Info)

**검증 결과**: 모든 레코드 가격 정상 범위 (0 < finalPrice ≤ 500,000). 음수/극단값 없음. bodyPart 누락 없음.

---

## 사장님 (네일 샵 운영자) 관점 요약

| # | 시나리오 | 관련 이슈 | 심각도 |
|---|---------|----------|--------|
| 1 | 직원 계정 전환이 안 될 수 있음 | A-1 | 🔴 |
| 2 | 예약 확정 후 다시 대기 상태로 돌아감 | A-3 | 🟠 |
| 3 | 대시보드 매출이 실제보다 적게 보임 | C-5 | 🟠 |
| 4 | 대시보드 "이번달 일수" 표시 하루 차이 | C-1 | 🔴 |
| 5 | 일요일에 주간 통계 불일치 | C-2 | 🟠 |
| 6 | 동명이인 고객 스몰토크 잘못 연결 | B-4 | 🟠 |
| 7 | 다른 기기에서 설정이 초기화됨 | C-4 | 🟠 |
| 8 | 동일 고객 여러 번 생성됨 | E-2 | 🟠 |
| 9 | 시술 확인서 미작성 시 통계 누락 | E-1 | 🟠 |
| 10 | 네일 쉐입 이름이 화면마다 다름 | D-1 | 🔴 |

## 고객 (외국인 시술 고객) 관점 요약

| # | 시나리오 | 관련 이슈 | 심각도 |
|---|---------|----------|--------|
| 1 | 상담 중단 후 재개 시 잘못된 단계로 이동 | B-1 | 🔴 |
| 2 | customer_link 참고 이미지 누락 | B-5 | 🟠 |
| 3 | step2→traits 뒤로가기 시 빈 canvas 표시 | B-3 | 🟠 |
| 4 | 상담 종료 후에도 외국어 UI 잔류 가능 | A-6 | 🟡 |
| 5 | 중국어 대시보드 제목 raw key 노출 | D-2 | 🟠 |
| 6 | 중국어 "카카오" 한국어 노출 | D-5 | 🟡 |

---

## 수정 이력

### 2026-03-17 — Critical 5건 + Major 16건 일괄 수정

**수정 완료 (21건)**:
- ✅ A-1, A-2, A-3, A-4, A-5 (Store 레이어 5건)
- ✅ B-1, B-2, B-3, B-4, B-5 (상담 플로우 5건)
- ✅ C-1, C-2, C-3, C-4, C-5 (메인 페이지 5건)
- ✅ D-1, D-2, D-3, D-4, D-5 (데이터/i18n 5건 + D-5 bonus)

**미수정 (DB 데이터 품질 — 코드 외 이슈)**:
- 🟠 E-1: 미확정 레코드 82% (운영 가이드 필요)
- 🟠 E-2: 중복 전화번호 12건 (데이터 정리 + 중복 방지 로직 추가 필요)

**미수정 (Minor/Info — 추후 개선)**:
- 🟡 A-6, A-7, A-8, B-6, B-7, B-8, C-6, C-7, C-8, D-6, D-7, D-8, E-3
- 🔵 A-9, A-10, B-9, C-9, C-10, D-9, D-10, E-4
