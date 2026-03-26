# BDX 로직 점검 결과 (2026-03-26)

전체 플랫폼 코드를 조사해서 발견한 문제들입니다.
체크박스로 처리 상태를 관리합니다.

> 상태: `[ ]` 미처리 · `[x]` 완료 · `[-]` 안 하기로 함

---

## 1. 돈 계산이 틀릴 수 있는 것들

매출, 가격, 통계 관련 — 실제 숫자가 잘못 나올 수 있어서 가장 중요합니다.

- [x] **퀵세일 더블탭하면 매출이 2번 기록됨**
  - ~~매출 등록 버튼을 빠르게 두 번 누르면 같은 예약에 레코드 2개가 만들어짐~~
  - `submittingRef` 가드 추가로 중복 제출 방지
  - `quick-sale/page.tsx`

- [x] **기록 삭제해도 고객 총매출이 안 줄어듦**
  - ~~잘못 입력한 매출을 삭제해도, 고객 카드의 "총 사용 금액"은 그대로~~
  - `removeRecord`에서 삭제 전 record 조회 → 삭제 후 customer totalSpend/visitCount 롤백
  - `records-store.ts`

- [x] **기록 상세에서 금액 수정해도 고객 총매출에 반영 안 됨**
  - ~~기록 상세 화면에서 최종 금액을 고치면 기록은 바뀌지만 고객 카드 총매출은 그대로~~
  - `handleSaveFinalPrice`에서 diff 계산 후 customer totalSpend 갱신
  - `records/[id]/page.tsx`

- [x] **결제 페이지가 매장 가격이 아닌 기본 가격표를 씀**
  - ~~설정에서 가격을 바꿔도 결제 화면에서는 기본값으로 계산됨~~
  - `useAppStore` + `buildServicePricingFromShopSettings`로 매장 가격 적용
  - `payment/page.tsx`

- [x] **홈 화면 "오늘 매출"과 대시보드 "오늘 매출"이 다를 수 있음**
  - ~~홈은 createdAt 기준, 대시보드는 finalizedAt 기준~~
  - 둘 다 `finalizedAt === today` 기준으로 통일
  - `home/page.tsx`

- [x] **퀵세일의 시술 종류 매핑이 틀림**
  - 조사 결과 DesignScope 타입이 `solid_tone/solid_point/full_art/monthly_art`만 허용
  - 기존 매핑이 타입 범위 내에서 올바름 — 변경 불필요
  - `records-store.ts`

- [x] **분석 지표 계산에서도 기본 가격표 사용**
  - ~~업셀 매출 같은 지표가 매장 설정 가격이 아닌 기본값으로 계산됨~~
  - `computeUpsellMetrics`에 `shopPricing?` 파라미터 추가, dashboard에서 전달
  - `analytics.ts`, `dashboard/page.tsx`

---

## 2. 피벗(상담→스케줄) 후 안 맞는 것들

"기존 고객은 상담 안 해도 된다"로 방향을 바꿨는데, 아직 옛날 로직이 남아 있는 곳들입니다.

- [ ] **"재방문 예약" 버튼이 아직 있음** ⚠️ 의사결정 필요
  - 상담 시작 화면에 "재방문 예약" 버튼 → 기존 고객도 상담 플로우 진입 가능
  - 피벗 방향: 기존 고객은 고객카드 + 매출등록으로 끝
  - 이 버튼을 없앨지, 외국인 재방문용으로 남길지 결정 필요
  - `consultation/page.tsx:625-636`

- [x] **포트폴리오에서 "이 디자인으로 상담 시작" 버튼**
  - ~~기존 고객의 포트폴리오에서도 전체 상담 플로우로 들어감~~
  - 기존 고객(customerId 있음) → "고객 카드 보기"로 변경, 신규만 상담 시작
  - `PortfolioOverlay.tsx`

- [ ] **"고객 추가" 버튼이 상담 플로우를 강제함** ⚠️ 의사결정 필요
  - 고객 목록에서 "고객 추가" 클릭 → 상담 전체 과정을 거쳐야 고객 등록 가능
  - CRM에 이름+전화번호만 넣고 싶어도 5단계 상담을 해야 함
  - 간단한 고객 등록 폼이 필요한지 결정 필요
  - `customers/page.tsx:109`

- [x] **"상담"이라는 말이 너무 많이 남아 있음**
  - ~~"최근 상담" → 실제로는 "최근 시술 기록"~~
  - i18n 키 업데이트: `section_recentConsultation` → "최근 시술", `stat_consultation` → "오늘 시술" (4개 언어)
  - `i18n.ts`

- [x] **"이번 주 상담" 통계가 사실 예약 수를 보여줌**
  - ~~레이블은 "상담"인데 실제로는 아직 안 한 예약까지 포함~~
  - 라벨을 "이번 주 예약"으로 변경
  - `records/page.tsx`

---

## 3. 데이터가 꼬일 수 있는 것들

저장되는 데이터의 정합성 문제입니다.

- [x] **퀵세일에서 고객 안 고르면 빈 문자열이 저장됨**
  - ~~`customerId`가 `""` (빈 글자)로 저장~~
  - `data.customerId || undefined`로 변경 — 빈 문자열 대신 undefined 저장
  - `quick-sale/page.tsx`

- [x] **로그인 안 된 상태에서 퀵세일하면 가짜 ID가 저장됨**
  - ~~`shopId: 'shop-1'`, `designerId: 'designer-1'` 하드코딩~~
  - 폴백을 빈 문자열로 변경 (데모 ID 제거)
  - `quick-sale/page.tsx`

- [x] **고객 총매출이 실시간 계산이 아닌 저장된 숫자**
  - ~~기록 삭제/수정 시 반영 안 됨~~
  - 레코드 삭제 시 rollback + 금액 수정 시 diff 적용으로 정합성 보장
  - `records-store.ts`, `records/[id]/page.tsx`

- [ ] **시술 이력이 두 군데서 관리됨** ⚠️ 의사결정 필요
  - 고객 카드에 직접 저장된 이력 + 상담 기록에서 뽑아낸 이력
  - 현재 merge 로직으로 보정 중이지만 구조적 리팩토링 필요 여부 결정
  - `customers/[id]/page.tsx:154-172`

- [x] **고객 연결 시 언어/담당 디자이너 정보 누락**
  - ~~예약에 언어/디자이너 있는데 고객 생성 시 반영 안 됨~~
  - `LinkCustomerModal`에 `reservationLanguage`/`reservationDesignerId` props 추가, 호출 사이트 업데이트
  - `LinkCustomerModal.tsx`, `DayReservationList.tsx`, `TodayReservationCard.tsx`

- [x] **상담 링크 "새 탭에서 열기" 하면 발송 기록이 안 남음**
  - ~~"새 탭에서 열기" 버튼은 기록 안 됨~~
  - `handleOpen`에서도 `consultationLinkSentAt` 기록 추가
  - `ConsultationLinkModal.tsx`

- [x] **Booking→Record 매칭이 같은 날 같은 고객이면 잘못될 수 있음**
  - ~~날짜 기반 OR 폴백으로 잘못된 레코드 매칭 가능~~
  - bookingId 매칭만 사용하도록 변경 (날짜 폴백 제거)
  - `records/page.tsx`

---

## 4. 화면 이동이 이상한 것들

누르면 엉뚱한 곳으로 가거나, 뒤로가기가 안 맞는 문제입니다.

- [x] **퀵세일 완료 후 잘못된 탭으로 이동**
  - ~~`?tab=consultations` → records 페이지가 인식 못함~~
  - `?view=list`로 변경 (records 페이지가 인식하는 파라미터)
  - `quick-sale/page.tsx`

- [x] **상담 중 캔버스/요약 화면에서 뒤로가기가 불안정**
  - ~~`router.back()` → 엉뚱한 곳으로 이동 가능~~
  - canvas: hasParts 기반으로 step3 또는 step2로 명시적 이동
  - summary: entryPoint별 명시적 경로 (traits/customer)
  - `canvas/page.tsx`, `summary/page.tsx`

- [x] **기록 상세에서 "같은 상담 시작" 하면 언어 설정 안 됨**
  - ~~외국인 고객 상담 재시작 시 한국어로 시작됨~~
  - `handleStartSameConsultation`에서 `setConsultationLocale` 호출 추가
  - `records/[id]/page.tsx`

- [x] **상담 중 새로고침하면 선택한 언어가 초기화됨**
  - ~~`locale`이 persist 안 됨~~
  - `locale-store.ts`의 `partialize`에 `locale` 필드 추가
  - `locale-store.ts`

- [x] **고객 목록 "고객 추가"가 상담 가드에 막힘**
  - ~~상담 시작 화면을 건너뛰고 바로 고객 입력으로 가서 가드에 막힘~~
  - `/consultation` (시작 화면)으로 라우팅 변경하여 entryPoint 정상 설정
  - `customers/page.tsx`

- [x] **상담 가드의 단계 순서가 실제 상담 순서와 다름**
  - ~~가드: ...특성→캔버스→요약 / 실제: ...캔버스→특성→요약~~
  - consultation-store의 STEP_ORDER를 export하고 가드에서 import (하드코딩 제거)
  - `use-consultation-guard.ts`, `consultation-store.ts`

---

## 5. 결정이 필요한 것들

코드 문제가 아니라 "어떻게 할 건지" 정해야 하는 것들입니다.

- [ ] **`finalizedAt`이 뭘 뜻하는지 정리**
  - 지금: 상담 저장 = 결제 완료 (같은 시점)
  - 원래 의도: 상담 저장 ≠ 결제 완료 (따로)
  - "결제 전" 뱃지가 절대 안 보이는 이유
  - 상담 저장 시점에 `finalizedAt`을 안 넣고, 결제 완료 시 넣을 건지?

- [ ] **퀵세일을 "상담 건수"에 포함할 건지**
  - 지금: 포함됨 → "이달 상담 30건" 중 20건이 퀵세일일 수 있음
  - 분석 데이터(인기 시술, 평균 옵션 등)가 퀵세일의 가짜 데이터로 오염됨
  - `isQuickSale` 플래그가 이미 있는데 필터에 한 번도 안 쓰임

- [ ] **결제 페이지(`/payment`)를 쓸 건지 말 건지**
  - 현재 UI에서 결제 페이지로 가는 버튼이 없음 (URL 직접 입력해야 접근)
  - 퀵세일과 역할이 겹침
  - 없앨 건지, 기록 상세에서 "결제 수정" 버튼을 만들 건지?

- [ ] **워크인/전화 예약에 "사전상담 미발송" 배지 보여줄 건지**
  - 직접 온 손님이나 전화 예약은 링크를 보낼 일이 없음
  - 근데 항상 "미발송" 회색 점이 표시됨 → 뭔가 잘못된 것처럼 보임

- [ ] **Step3(상세 옵션)의 위치를 어떻게 할 건지**
  - 지금: Step2에서 기본 루트가 Step3을 건너뛰고 특성으로 감
  - Step3는 "상세 옵션" 링크로만 접근 가능한 숨겨진 단계
  - 캔버스와 특성이 둘 다 "Step 4"로 표시됨
  - 스텝 번호를 다시 정리할 건지?

- [ ] **멤버십 환불/조정 기능을 만들 건지**
  - 코드에 `refund`, `adjust` 타입이 정의되어 있지만 구현 안 됨
  - 만들 예정이면 놔두고, 아니면 정리

- [ ] **staff(디자이너) 역할 로그인을 만들 건지**
  - 코드 곳곳에 `role === 'staff'` 분기가 있지만 로그인 경로 없음
  - 항상 원장(owner)으로만 로그인됨
  - 구현 예정이면 놔두고, 아니면 정리

- [ ] **알림벨이 사전상담 완료만 알려주는 게 맞는지**
  - QR/사전상담 안 쓰는 매장은 알림이 영원히 0
  - 매출 미등록, 재방문 시기 등 다른 알림이 필요하진 않은지?

- [ ] **"재방문 예약" 버튼 존폐** (2번 항목에서 이동)
  - 상담 시작 화면의 "재방문 예약" → 기존 고객도 상담 진입 가능
  - 완전 제거할지, 외국인 재방문용으로 남길지?

- [ ] **경량 고객 등록 폼 필요 여부** (2번 항목에서 이동)
  - 현재 "고객 추가" → 상담 플로우 강제
  - CRM에 이름+전화번호만 넣는 간단 폼이 필요한지?

- [ ] **시술 이력 이중 관리 구조 정리** (3번 항목에서 이동)
  - 고객 카드 저장값 + 레코드에서 실시간 파생 — 두 소스 존재
  - 하나로 통합할 건지? (records 기반 실시간 계산 vs 저장)

---

## 6. 안 쓰는 코드 (정리 대상)

지금 아무 데서도 안 쓰이는 코드들입니다.

- [x] `RETURN_VISIT_STEP_ORDER` — export 키워드 제거 (내부에서만 사용)
- [x] `handleStart` 함수 (`consultation/page.tsx`) — 제거
- [x] `updateReservationLocally` (`reservation-store.ts`) — 제거
- [x] `setPinnedTraits` (`customer-store.ts`) — 제거
- [x] `app-store.isOnboardingComplete` — 제거 (auth-store꺼만 사용)
- [x] `computeReturnRate`의 `_records` 파라미터 — 제거
- [x] `toTimeGridEvents`의 consultations 파라미터 — 제거 (항상 빈 배열)
- [x] `customerDurationPreference` — 타입 필드 제거
- [x] `BookingStatus: 'confirmed'` / `'cancelled'` — 주석으로 "현재 UI에서 미사용" 표시
- [x] `PRO_MODE` — 조사 후 처리 (pro 페이지 존재 여부에 따라)

---

## 진행 요약

| 카테고리 | 전체 | 완료 | 의사결정 | 남은 버그 |
|---------|------|------|---------|----------|
| 돈 계산 | 7 | 7 | 0 | 0 |
| 피벗 정합성 | 5 | 3 | 2 | 0 |
| 데이터 정합성 | 7 | 6 | 1 | 0 |
| 화면 이동 | 6 | 6 | 0 | 0 |
| 결정 필요 | 11 | 0 | 11 | 0 |
| 안 쓰는 코드 | 10 | 10 | 0 | 0 |
| **합계** | **46** | **32** | **14** | **0** |
