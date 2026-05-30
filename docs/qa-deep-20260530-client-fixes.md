# 클라이언트 피드백 수정 + E2E 검증 (2026-05-30, 3차)

사용자 카톡/스크린샷 피드백 6건 + E2E 사전상담 전수 검증 중 발견한 가격 버그 1건.

## 검증: 새 사전상담 E2E (Chrome 실측)
손님 사전상담 제출 → 슬롯 차단 → 원장 시술 시작 → 정산 → wrap-up 전 구간 직접 실행.

| 단계 | 결과 |
|------|------|
| 슬롯 6/1 16:30 선택 → 디자인(프렌치)·옵션(타샵제거·랩핑·아몬드·스톤·큐빅×2)·요청사항 | ✅ |
| 제출 → **POST 201, RLS 에러 없음** → /complete | ✅ |
| DB 영속화: 모든 옵션 + 요청사항 + `selectedCategory→designCategory` 매핑 | ✅ |
| 슬롯 차단: 제출 슬롯(16:30·17:00·17:30, 시술 90분) `disabled`+취소선 | ✅ |
| 원장 시술시작: 사전상담 내용(요청사항 포함) 표시 | ✅ |
| 정산 합계 = 사전상담 견적 = **79,000원** | ✅ (버그 수정 후) |
| wrap-up: 전화 일치 고객 **자동 "고객 카드 연결됨"**(저장 버튼 없이) | ✅ |
| records/[id] 가격 항목별 내역 표시 | ✅ |

## 수정 항목

### 1. 카테고리 라벨 SSOT 통일 (#38, #34~36)
- 증상: field-mode 탭은 "자석"·"심플" 단축형, 메뉴/사전상담은 "자석 / 마그넷"·"심플 / 원컬러" 풀라벨 — 화면마다 불일치.
- 원인: 라벨 소스 4분산 (labels.ts `CATEGORY_LABELS` / category-resolver `BUILTIN_KO` / i18n `fieldMode.category*` / PreConsultDetailView `PRE_CATEGORY_LABEL`).
- 수정: `CATEGORY_LABELS`(labels.ts)를 단일 SSOT로. `resolveCategoryLabelKo`→`resolveMenuCategoryLabel` 위임(rename override 반영 + 풀라벨). `BUILTIN_KO`=`CATEGORY_LABELS`. field-mode 탭(page.tsx·PortfolioGrid)·no-photo 버튼·PRE_CATEGORY_LABEL·ConsultationListItem·settings 토글('마그네틱'→'자석 / 마그넷') 모두 정렬. PreConsultDetailView에 `categoryLabels` prop 추가(rename 전파).
- 파일: category-resolver.ts, PreConsultDetailView.tsx(+호출 4곳), PortfolioGrid.tsx, field-mode/page.tsx, ConsultationListItem.tsx, settings/page.tsx.

### 2. 시술 기록 태그/선호 필터칩 제거 (#37)
- "외국인 / 폴아트선호 / 단색선호 …" 태그 필터칩 행 제거. `tagFilter` state·필터 로직·`TAG_PRESETS`·`TagIconSvg` import 제거. 기간 필터(전체/오늘/이번주/이번달)·검색창 유지.
- 파일: records/page.tsx.

### 3. 시술 상세 가격 항목별 내역 (#33)
- 증상: records/[id] 가격 상세가 "시술 금액 ₩X" 단일 합산만 표시.
- 수정: 정산 시점에 항목별 `lineItems`(카테고리+오프+옵션+파츠+시술중추가) 생성→`pricingAdjustments.lineItems`(jsonb)에 보존. records/[id]가 lineItems 표시(합계=storedGross 보장). 구 레코드는 카테고리 base + 나머지 2행 근사. 가산모델(calculatePrice) 재계산은 카테고리모델 총액과 불일치하므로 미사용.
- 파일: types/consultation.ts, records-store.ts, settlement/page.tsx, records/[id]/page.tsx.

### 4. 랩핑 가격 불일치 버그 (E2E 발견 — CRITICAL)
- 증상: 사전상담 확인 견적 **79,000** vs 현장 정산 **74,000** (5,000 차이).
- 원인: `calculatePreConsultPrice`가 랩핑 미설정 시 `surcharges.wrapping ?? 0`. 그러나 SurchargeSettings 주석·설정 UI·`getAddOnAmount`는 모두 "미설정 시 기본 5,000"(`?? ADDON_FIXED_PRICES.wrapping`). 함수만 0을 써서 정산에서 랩핑 누락.
- 수정: `calculatePreConsultPrice` 2곳(addOn 'wrapping' / wrappingPreference) + settlement breakdown builder를 `?? ADDON_FIXED_PRICES.wrapping`(5,000)로 통일. 명시적 0은 `0 ?? 5000=0`으로 정상 유지.
- 결과: 정산 = 확인 견적 = 79,000 일치 확인.
- 파일: pre-consult-price.ts, settlement/page.tsx.

### 5. 대시보드 검수 (analytics)
- HIGH-1: `computeHourlyDistribution` 시간대 하드코딩 [10~18] → baseline 10~19 + 실제 예약시각 동적 확장(19·20시 누락 방지).
- HIGH-2: `computeDesignScopeBreakdown` 분모를 records.length → 분류된 레코드 합(비율 합계 100% 보장).
- HIGH-3: `computeGoldenTimeTargets` `today`에 TZ suffix `+09:00` 추가.
- MED-1: DesignerPerformance "예약 배정률" → "예약 점유율"(실제 계산=점유율).
- MED-2: dashboard/page 미사용 `regularVisitRate` 제거.
- LOW-1: KPICards 바텀시트 "오늘 예약"에 시간 정규식 필터 추가(KPI 카운트와 일치).
- LOW-2: RevenueChart `aggregateWeekly` key에 연도 포함(연말 collision 방지).
- 파일: analytics.ts, dashboard/page.tsx, DesignerPerformance.tsx, KPICards.tsx, RevenueChart.tsx.

### 6. 시술 종류 라벨 손실 매핑 수정 (후속)
- 증상: 시술 상세 "시술 리포트" 등에서 프렌치 레코드가 **"단색+포인트"** 로 표시.
- 원인: quick-sale 레코드 저장 시 `designScope = designCategoryToScope(category)` (french→solid_point 손실 매핑). 표시 측이 `DESIGN_SCOPE_LABEL[designScope]` 를 쓰면 원본 카테고리(프렌치)를 잃음.
- 수정: 공용 헬퍼 `resolveRecordCategoryLabelKo(consultation, shopSettings)` 신설 — `designCategory` 우선(풀라벨/custom/rename), 없을 때만 designScope fallback. 적용: records/[id] 시술 리포트, 홈 RecentConsultationCard, 고객 상세 시술 이력, ConsultationPreviewModal. (records 목록 ConsultationListItem·field-mode·타임그리드 DesignerDayGridCalendar는 이미 카테고리/serviceLabel 기반.) `TimeGridCalendar`(미렌더 데드)·payment(records 리다이렉트)는 제외.
- 검증: 프렌치 레코드 시술상세 "핸드 프렌치", 고객 이력 "프렌치" 확인(이전 "단색+포인트" 사라짐).
- 파일: category-resolver.ts, records/[id]/page.tsx, RecentConsultationCard.tsx, customers/[id]/page.tsx, ConsultationPreviewModal.tsx.

## 검증
- `npx tsc --noEmit` 통과, `pnpm lint` 경고만(기존 패턴, 신규 에러 0).
- Chrome 실측: field-mode 탭("자석 / 마그넷")·필터칩 제거·정산 79,000·wrap-up 자동연결·가격 내역·대시보드 렌더 전부 확인.
