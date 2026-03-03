# BDX QA Checklist

> 2026-03-03 기준 전체 QA 결과

## 범례
- [x] 통과
- [ ] 미통과 (수정 필요)
- [~] 부분 통과 (Minor 이슈 존재)

---

## 1. 빌드 & 타입

- [x] `npx tsc --noEmit` — 타입 에러 없음
- [x] `pnpm build` — 프로덕션 빌드 성공
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
- [x] 예약 카드 — 상태/채널 표시 정상
- [~] "상담 완료" 하드코딩 (Minor, ko 고정이므로)
- [~] 역할 표시 "원장"/"선생님" 하드코딩 (i18n 키 존재하나 미사용)

### 3.2 대시보드 (`/dashboard`)
- [x] KPI 카드 6종 — 상담 중심 구조 (상담 건수, 인기 디자인, 옵션 선택, 재방문율, 단골, 예약)
- [x] KPI 드릴다운 바텀시트 — 상세 데이터 정상
- [ ] WeeklySummary 날짜 하드코딩 (`2026-02-23~26`) — 현재 항상 0 표시
- [~] HourlyBookings Cell fill 데드코드 (양쪽 동일값)
- [~] KPI 단골 고객 리스트 vs mock-customers 데이터 불일치

### 3.3 고객 관리 (`/customers`)
- [x] 검색, 필터 탭, VIP 필터
- [x] 고객 상세 — 프로필 카드, 스탯, 선호도
- [x] VIP 토글 — 별 버튼 직관적 UI (개선 완료)
- [~] VIP 필터 기준 이중 정의 (`isRegular || visitCount >= 5` vs `isRegular`)
- [~] 스몰토크 작성자 `designer-001` 하드코딩

### 3.4 기록 (`/records`)
- [x] 캘린더 + 타임그리드 + 리스트 뷰
- [x] 예약 관리 CRUD
- [~] `confirm()` 사용 (iOS 호환성)
- [~] 예약 모달 `channel` 원시값 노출

### 3.5 설정 (`/settings`)
- [x] 매장/서비스/테마/앱 탭 — i18n 키 사용
- [x] 파츠 관리, 가격표 편집
- [x] 테마 변경 실시간 반영

---

## 4. 코드 품질

### 4.1 TypeScript
- [x] `npx tsc --noEmit` 에러 없음
- [ ] `as any` BookingStatus 우회 (`summary/page.tsx:66`)
- [~] 동적 i18n 키 (`t('shape.' + value)`) 폴백 없음

### 4.2 React 패턴
- [~] `calculatePrice` / `estimateTime` 중복 호출 (useMemo 미사용)
- [~] `useEffect([], ...)` 빈 의존성 배열 (ESLint 경고 가능)
- [~] `VALUE_I18N_MAP` 컴포넌트 내부 상수 (렌더링마다 재생성)

### 4.3 데이터 일관성
- [ ] `mock-customers` visitCount vs treatmentHistory 불일치 (박서연: 7 vs 2건, 한소희: 10 vs 2건)
- [ ] `mock-customers` totalSpend 산술 불일치
- [~] `MOCK_CUSTOMERS` 배열 직접 변이 (persist 불가)

### 4.4 보안/호환성
- [~] `color-mix()` CSS — Chrome 111+ / Safari 16.2+ 필요
- [x] XSS/주입 취약점 — 발견 안됨
- [x] 사용자 입력 검증 — 기본 수준 적용

---

## 5. 반응형 / 접근성

- [x] 모바일 레이아웃 (375px~)
- [x] 태블릿 레이아웃 (768px~)
- [x] iOS safe-area 처리 (`env(safe-area-inset-bottom)`)
- [~] `aria-label` 일부 누락 (갤러리, 태그 편집 버튼)
- [x] Tailwind CSS v4 테마 변수 일관 사용

---

## 수정 필요 항목 요약

| # | 심각도 | 내용 | 파일 |
|---|--------|------|------|
| 1 | Critical | AnnotationCard `selection.note` 한국어 노출 | `HandIllustration.tsx` |
| 2 | High | WeeklySummary 날짜 하드코딩 → 항상 0 | `WeeklySummary.tsx` |
| 3 | Major | PARTS_GRADE description/examples 한국어 | `PartsSelector.tsx`, `PartsPalette.tsx` |
| 4 | Major | PartsPalette 퀵칩 한국어 | `PartsPalette.tsx` |
| 5 | Major | "Special Design of the Month" 영어 고정 | `DesignScopeSelector.tsx` |
| 6 | Major | step 헤더 설명문 한국어 하드코딩 | `step1~3/page.tsx`, `customer/page.tsx` |
| 7 | Major | summary 안내문구 한국어 하드코딩 | `summary/page.tsx` |
| 8 | Major | "Point" 뱃지 영어 하드코딩 | `FingerSummary.tsx` |
| 9 | Medium | mock-customers 데이터 불일치 | `mock-customers.ts` |
| 10 | Medium | `as any` BookingStatus | `summary/page.tsx` |
| 11 | Minor | HourlyBookings fill 데드코드 | `HourlyBookings.tsx` |
| 12 | Minor | VALUE_I18N_MAP 컴포넌트 내 상수 | `ConsultationSummaryCard.tsx` |
