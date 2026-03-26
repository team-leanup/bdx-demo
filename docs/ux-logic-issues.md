# BDX UX 로직 이슈 분석

> 코드 기반 심층 분석 + 클라이언트 피드백 (2026-03-25)
> 분석일: 2026-03-25

---

## 목차

1. [사용자 플로우 이슈 (클라이언트 피드백)](#사용자-플로우-이슈--클라이언트-피드백)
2. [Critical — 즉시 수정 필요](#critical--즉시-수정-필요)
3. [High — 주요 로직 결함](#high--주요-로직-결함)
4. [Medium — 개선 필요](#medium--개선-필요)
5. [Low — 개선 권장](#low--개선-권장)
6. [이슈 요약 테이블](#이슈-요약-테이블)

---

## 사용자 플로우 이슈 — 클라이언트 피드백

> 클라이언트(네일샵 원장님)가 직접 테스트하며 보고한 UX 흐름 문제.
> 기술적 버그가 아니라 **실제 운영 시나리오와 앱 설계의 괴리**가 핵심.

---

### UF-1. 🔴 단골 고객에게 상담 플로우 강제 — 핵심 설계 문제

> "이미 고객 정보, 성향 다 등록되어 있는 단골은 굳이 '상담' 시작해서 전에 입력해놓은걸 다시 넣을 필요가 없다"

**클라이언트가 말하는 실제 운영 플로우 (대부분의 고객):**
```
네이버/카톡으로 예약 → 스케줄표에 등록 → 특이사항·요청사항 고객 카드에 정리
→ 손님 맞이 → 시술 → 매출 등록 (얼마 했는지만 기록)
```

**현재 BDX가 강제하는 플로우:**
```
예약 → "상담 시작" 클릭 → 5스텝 전체 진행 (고객정보 재입력, 시술옵션 재선택)
→ 저장 → 그래야 매출 기록이 남음
```

**근본 원인**: 앱이 모든 고객을 "상담이 필요한 고객"으로 취급함. 실제로 **상담이 필요한 타겟은 두 층뿐**:
1. 고객 정보가 아예 없는 **신규 고객**
2. 언어 장벽이 있는 **외국인 고객**

**코드 레벨 문제:**
- `records/page.tsx:1046-1077` — 예약 상세에 "상담 시작" 버튼만 존재. **"매출 등록"이나 "시술 완료" 같은 대안 경로 없음**
- `quick-sale/page.tsx` — 매출 등록 페이지가 존재하지만 **예약과 연결되지 않음** (bookingId 없이 독립 레코드 생성)
- QuickSale로 매출을 등록해도 예약 카드의 `status`가 `completed`로 바뀌지 않음 — 예약이 영원히 "대기" 상태로 남음

**수정 방향:**
- 예약 상세에 "시술 완료 + 매출 등록" 버튼 추가 (상담 없이 바로 매출 기록)
- 해당 경로로 등록 시 예약 status → completed, 고객 통계 갱신, records에 기록
- "상담 시작"은 신규/외국인에게 더 강조, 단골에게는 보조 옵션으로

---

### UF-2. 🔴 매출 등록이 고객 카드와 전혀 연동 안 됨

> "매출 등록 올려놓으면 기록을 찾기 어렵고, 같은 고객인데 한쪽은 저장이 안되어있고 한쪽은 저장이 되어있어서 정돈이 안 된 느낌"

**스크린샷에서 확인된 문제:**
- 매출 등록 화면에서 "이서연" 검색 → 기존 고객과 **실제 연결되지 않음**
- 고객 상세에서 이서연: **0회 방문, 평균 단가 –, 총 이용금액 –** (데이터 공백)
- 매출 등록 후 어디에 저장됐는지 확인 불가 (성공 피드백 없이 /records로 이동)

**코드 레벨 원인 5가지:**

| # | 원인 | 파일 |
|---|------|------|
| 1 | **고객 검색이 장식용** — `QuickSaleForm.tsx`에 `useCustomerStore` import 자체가 없음. 검색 input은 단순 텍스트로, 실제 고객 매칭/자동완성 없음 | `QuickSaleForm.tsx` 전체 |
| 2 | **customerId가 항상 빈 문자열** — `quick-sale/page.tsx:handleSubmit`에서 `data.customerId ?? ''`만 전달. URL param으로 미리 안 들어오면 항상 '' | `quick-sale/page.tsx:28-38` |
| 3 | **customerName 미저장** — `addQuickSaleRecord`가 생성하는 record의 `consultation` 객체에 `customerName`, `customerPhone` 필드가 없음 → records 목록에서 이름 빈칸 | `records-store.ts:64-75` |
| 4 | **serviceType 미저장** — 시술 종류를 선택해도 record에 반영 안 됨. 항상 기본값 `solid_tone`으로 저장 | `records-store.ts:69` |
| 5 | **고객 통계 미갱신** — `addQuickSaleRecord`에 customer-store 접근 코드 없음 → visitCount, totalSpend, treatmentHistory 전부 0 유지 | `records-store.ts:57-92` |

**데이터 흐름 (현재 — 끊어진 상태):**
```
매출 등록 화면
  고객 검색 "이서연" 입력 → (아무 일 안 일어남, customer-store 미접근)
  ↓
  매출 등록 버튼 → addQuickSaleRecord({
                     customerId: '',         ← 항상 빈 문자열
                     // customerName: 없음
                     // serviceType: 없음
                   })
  ↓
  customer.visitCount/totalSpend ← 갱신 안 됨
  ↓
  router.push('/records') ← 성공 피드백 없이 이동

고객 상세 (이서연)
  visitCount: 0       ← createCustomer 초기값 그대로
  averageSpend: 0     → UI에서 '–' 표시
  totalSpend: 0       → UI에서 '–' 표시
  treatmentHistory: [] → "시술 기록 없음"
```

---

### UF-3. 🔴 "고객 연결 필요" 메시지가 당황스러움

> "신규 고객을 입력했는데 고객 연결을 하라고 하니 당황할거같은 느낌"

**스크린샷**: 홈 화면 예약 카드에서 "김나나" 아래 빨간 글씨 **"고객 연결 필요"** 표시

**표시 조건:** `booking.customerId`가 null이면 무조건 표시
- `TodayReservationCard.tsx:263-273`
- `DayReservationList.tsx:371-378`

**왜 이렇게 되는가:**

경로 1 — 예약 폼에서 이름만 입력한 경우:
- `ReservationForm.tsx:148-167` — "고객 검색" 란(선택사항)을 건너뛰고 "고객명" 란에 이름만 타이핑
- `customerId: selectedCustomerId || undefined` → undefined로 예약 생성
- 결과: "고객 연결 필요" 표시

경로 2 — 기록 페이지의 빠른 예약 추가:
- `DayReservationList.tsx:94-107` — **고객 검색 UI 자체가 없음**
- 이름, 전화번호, 시간, 채널만 입력 → customerId 없이 생성
- 결과: 이 경로로 추가된 **모든 예약**이 "고객 연결 필요"

**사용자 관점 문제:**
- "고객 연결"이라는 용어가 직관적이지 않음 — 방금 이름을 입력했는데 왜 또 연결?
- 실제 네일샵에서는 고객명과 전화번호만 있으면 충분. "고객 카드 연결"은 선택적이어야 함
- 현재는 연결하지 않으면 경고처럼 빨간색으로 계속 보임 → 압박감

**수정 방향:**
- 예약 생성 시 이름/전화번호로 기존 고객 자동 매칭 시도
- 매칭 안 되면 자동으로 신규 고객 생성 + customerId 연결
- "고객 연결 필요" 대신 부드러운 표현 ("고객 카드 만들기" 등) 또는 자동 해결

---

### UF-4. 🔴 고객 카드 데이터가 쌓이지 않음

> "고객 정보 한번 정리가 되면 고객카드 고도화 시키는 개념으로 나만의 고객관리 데이터를 만들어가는 흐름이 되어야 할 것 같아요"

**스크린샷 확인 — 이서연 고객 상세:**
- 단골(☆) 뱃지가 있음
- 예약도 있음 (네이버 채널, 14:30~15:30)
- 주의사항 4개 등록됨 (큐티클민감, 손톱약함, 손톱잘부러짐, 리페어자주함)
- **그런데**: 0회 방문, 평균 단가 –, 총 이용금액 –, 시술 기록 없음

**데이터가 채워지는 유일한 경로: 상담 완료(handleSave)**

| 데이터 | 상담 완료 시 | 매출 등록 시 | 예약만 있을 때 |
|--------|------------|------------|-------------|
| visitCount | ✅ +1 | ❌ 미갱신 | ❌ 미갱신 |
| totalSpend | ✅ 갱신 | ❌ 미갱신 | ❌ 미갱신 |
| averageSpend | ✅ 갱신 | ❌ 미갱신 | ❌ 미갱신 |
| lastVisitDate | ✅ 갱신 | ❌ 미갱신 | ❌ 미갱신 |
| treatmentHistory | ✅ 추가 | ❌ 미추가 | ❌ 미추가 |
| tags (시술 성향) | ✅ 자동 추가 | ❌ | ❌ |
| preference (선호도) | ❌ 미저장 | ❌ | ❌ |

**핵심 문제**: 상담 5스텝을 완료해야만 고객 데이터가 쌓이는 구조. 단골 고객은 상담을 안 하므로 **고객 카드가 영원히 비어있음**.

**추가 문제 — 시술 이력 소스:**
- 고객 상세의 "시술 기록" 섹션: `customer.treatmentHistory` 배열만 참조 (`customers/[id]/page.tsx:1031`)
- records-store를 **전혀 조회하지 않음**
- quick-sale 레코드는 treatmentHistory에 추가 안 되므로 여기서도 안 보임

---

### UF-5. 🟡 예약과 매출의 연결 고리 부재

> "매출 등록되면 매출 등록된 기록이나 이런게 같이 연동이 되어야 할 텐데"

**현재 구조의 단절:**

```
예약 (reservation-store)    ←── 연결 없음 ──→    매출 기록 (records-store)
     │                                                │
     │ customerId (optional)                           │ customerId (optional)
     ↓                                                 ↓
고객 (customer-store)        ←── 부분 연결 ──→    고객 통계 (상담 완료 시만)
```

**구체적 단절 포인트:**

1. **예약 → 매출**: QuickSale에 `bookingId` 파라미터 없음. 매출을 등록해도 예약 상태가 변하지 않음
2. **매출 → 고객**: QuickSale에서 고객 검색해도 `customerId`가 연결 안 됨
3. **고객 → 이력**: 매출 등록으로 생긴 레코드가 고객의 treatmentHistory에 미반영
4. **대시보드 → 매출**: QuickSale 레코드의 `designerId`가 하드코딩이라 디자이너별 매출 집계 불가

**이상적 흐름:**
```
예약 등록 (이서연, 네이버, 14:30)
  ↓
시술 완료 → "매출 등록" (예약 상세에서 바로)
  ↓
  ├── 예약 status → completed
  ├── 금액 → records-store에 기록 (bookingId 연결)
  ├── customer.visitCount +1
  ├── customer.totalSpend 갱신
  ├── customer.treatmentHistory 추가
  └── 고객 상세에서 모든 데이터 확인 가능
```

---

### UF-6. 🟡 예약 생성 시 기존 고객 자동 매칭 부재

**현재**: 예약 폼에서 고객 검색은 "선택사항". 이름만 입력하면 customerId 없이 생성됨.

**DayReservationList 빠른 추가 폼** (`DayReservationList.tsx:81-108`): 고객 검색 UI 자체가 없음. 이름/전화만 입력 → 100% "고객 연결 필요" 발생.

**결과**:
- 같은 고객이 여러 경로로 중복 생성될 수 있음
- 예약에 이름이 있어도 고객 카드와 연결 안 됨
- 사장님이 매번 "고객 연결" 작업을 수동으로 해야 함

---

### UF-7. 🟡 매출 등록 후 성공 피드백 없음

**현재 흐름:**
```
매출 등록 버튼 클릭 → (저장) → router.push('/records') → 기록 탭으로 이동
```

- 토스트/알림 없이 조용히 페이지 전환
- 등록된 매출이 records 목록에서 어디 있는지 찾기 어려움 (customerName이 저장 안 되므로 빈칸)
- 사용자는 "등록이 된 건지 안 된 건지" 확신 불가

---

### UF-8. 🟡 "시술 전 확인사항" 모달은 좋지만, 상담 5스텝과 강제 연결됨

**스크린샷 확인**: 이서연 예약 → "상담 시작" 클릭 → "시술 전 확인사항" 모달 (큐티클민감, 손톱약함 등 4개 주의사항 표시)

이 모달 자체는 유용한 기능이지만, "확인하고 시작" 클릭 시 상담 5스텝이 시작됨. 단골에게는 이 확인사항만 보고 바로 시술에 들어가는 게 자연스러움.

**수정 방향**: "확인사항 보기" + "시술 시작 (상담 없이)" 옵션 분리

---

### 사용자 플로우 이슈 요약

| # | 심각도 | 이슈 | 핵심 원인 |
|---|--------|------|----------|
| UF-1 | 🔴 Critical | 단골에게 상담 5스텝 강제 | 예약 상세에 "매출 등록" 대안 경로 없음 |
| UF-2 | 🔴 Critical | 매출 등록 ↔ 고객 카드 연동 0% | QuickSaleForm에 customer-store 미연동 |
| UF-3 | 🔴 Critical | "고객 연결 필요" 메시지 당황 | 예약 생성 시 고객 자동 매칭 없음 |
| UF-4 | 🔴 Critical | 고객 카드 데이터 안 쌓임 | 상담 완료만이 데이터 채우는 유일 경로 |
| UF-5 | 🟡 High | 예약 ↔ 매출 연결 고리 부재 | bookingId 없이 독립 레코드 생성 |
| UF-6 | 🟡 High | 예약 시 기존 고객 자동 매칭 없음 | 빠른 추가 폼에 고객 검색 UI 없음 |
| UF-7 | 🟡 High | 매출 등록 후 성공 피드백 없음 | 토스트 없이 조용히 페이지 전환 |
| UF-8 | 🟡 High | 시술 전 확인사항 → 상담 강제 연결 | "상담 없이 시술 시작" 옵션 없음 |

---

## Critical — 즉시 수정 필요

### C-1. 외부 customer_link 플로우에서 상담 기록 누락

**파일**: `src/app/consultation/summary/page.tsx:150-174`

`isExternalCustomerLinkFlow` (= `isCustomerLinkFlow && !currentShopId`) 분기에서 `dbCompletePreconsultationBooking`만 호출하고 `addRecord()`를 호출하지 않음.

**영향**:
- 로컬 records-store에 레코드가 저장되지 않음
- 대시보드 매출 집계에서 해당 상담 매출 누락
- 고객 이력 타임라인에서도 누락

---

### C-2. quick-sale 고객 검색이 완전히 장식용

**파일**: `src/components/payment/QuickSaleForm.tsx` 전체

`useCustomerStore` import 자체가 없음. 고객 검색 input은 단순 `<input type="text">`로:
- 자동완성/드롭다운 없음
- 검색 결과 선택 시 customerId 세팅 로직 없음
- `customerQuery`는 `handleSubmit`에서 아예 사용되지 않음
- `customerId`는 URL param으로 미리 안 들어오면 항상 `''` (빈 문자열)

---

### C-3. quick-sale 디자이너 하드코딩

**파일**: `src/components/payment/QuickSaleForm.tsx:46-50`

```tsx
const DESIGNER_OPTIONS = [
  { id: 'designer-1', name: '김디자이너' },
  { id: 'designer-2', name: '이디자이너' },
  { id: 'designer-3', name: '박디자이너' },
];
```

실제 `useShopStore.designers`를 사용하지 않음. DB에 존재하지 않는 designerId 저장.

---

### C-4. quick-sale 시 고객 통계 전혀 미갱신

**파일**: `src/store/records-store.ts:57-92`

`addQuickSaleRecord`가 레코드만 추가하고 customer-store를 전혀 건드리지 않음.

미갱신 항목: `visitCount`, `totalSpend`, `averageSpend`, `lastVisitDate`, `treatmentHistory`

---

### C-5. quick-sale 레코드에 customerName/serviceType 미저장

**파일**: `src/store/records-store.ts:64-75`

`addQuickSaleRecord`가 생성하는 record의 `consultation` 객체:
- `customerName`: 없음 → records 목록에서 이름 빈칸
- `customerPhone`: 없음 → 검색 불가
- `serviceType`: 없음 → 항상 기본값 `solid_tone`

---

## High — 주요 로직 결함

### H-1. return_visit 플로우 실질적 비활성화

**파일**: `src/app/consultation/customer/page.tsx:245-246`

`RETURN_VISIT_STEP_ORDER = [START, CUSTOMER_INFO, SUMMARY]` 단축 플로우가 정의되어 있지만, `customer/page.tsx`의 `handleNext`가 entryPoint를 확인하지 않고 항상 `setStep(STEP1_BASIC)` + `/consultation/step1`로 이동.

**영향**: 재방문 예약 고객도 전체 5스텝을 거쳐야 함. 단축 플로우 의미 없음.

---

### H-2. STEP3_OPTIONS가 STEP_ORDER에서 누락

**파일**: `src/store/consultation-store.ts:85-101`, `src/app/consultation/step3/page.tsx:24-27`

step3의 `handleNext`가 `setStep(ConsultationStep.STEP3_OPTIONS)`를 호출하지만, 이 값이 두 STEP_ORDER 배열 어디에도 없음.

**영향**: `goNext()`/`goPrev()`에서 `indexOf`가 -1 반환 → 네비게이션 무력화.

---

### H-3. 캔버스 → traits 이동 시 setStep 누락

**파일**: `src/app/consultation/canvas/page.tsx:104-106`

`router.push('/consultation/traits')` 만 호출하고 `setStep` 미호출.

**영향**: store의 currentStep이 canvas 상태로 남아 resume 시 잘못된 위치로 복귀.

---

### H-4. 캔버스 데이터 복원 불가

**파일**: `src/app/consultation/canvas/page.tsx`

- `FingerCanvas`에 `initialSelections` prop을 넘기지 않음
- `canvasData → CanvasSelections` 역변환 로직 자체가 존재하지 않음

**영향**: 상담 이어하기(resume) 시 캔버스 데이터 유실.

---

### H-5. 재상담 시 이전 bookingId 승계

**파일**: `src/app/(main)/records/[id]/page.tsx:77-86`

`hydrateConsultation({...c, ...})`의 스프레드로 이전 bookingId가 따라옴. 저장 시 이전 예약을 다시 completed 처리하고 preConsultationData를 덮어씀.

---

### H-6. addRecord 후 DB 실패 시 롤백 없음

**파일**: `src/app/consultation/summary/page.tsx:191-204`

로컬 store에 먼저 추가한 후 DB 호출 실패 시 return하지만, 로컬 레코드는 이미 남아있음.

---

### H-7. payment 페이지 finalPrice 변경 시 totalSpend 미갱신

**파일**: `src/app/(main)/payment/page.tsx:130-138`

`updateRecord`로 finalPrice를 수정하지만 `customer.totalSpend`는 갱신하지 않음. `records/[id]`에서 직접 금액 수정 시에도 동일.

---

### H-8. 예약→상담 hydrate 시 designerId 누락 가능

**파일**: `src/app/(main)/home/page.tsx:188-197`, `src/app/(main)/records/page.tsx:329-338`

`preConsultationData`에 designerId가 포함되지 않은 예약에서 상담 시작 시 담당 디자이너가 빈 상태.

---

### H-9. 예약 상세에서 "상담 시작" 외 대안 경로 없음

**파일**: `src/app/(main)/records/page.tsx:1046-1077`

예약 상세 시트 하단 버튼: "상담 시작" / "수정" / "닫기" / "삭제"

**"매출 등록" 또는 "시술 완료" 버튼이 없음.** 단골 고객이 상담 없이 매출만 기록하려면 별도로 `/quick-sale`에 가야 하는데, 그 경로는 예약과 연결 안 됨.

---

### H-10. DayReservationList 빠른 추가 폼에 고객 검색 없음

**파일**: `src/components/calendar/DayReservationList.tsx:81-108`

기록 페이지의 빠른 예약 추가 폼에 고객 검색 UI 자체가 없음. 이름/전화/시간/채널만 입력.

**영향**: 이 경로로 추가된 **모든 예약**에 "고객 연결 필요" 표시.

---

### H-11. "신규" 뱃지가 포트폴리오 사진 유무로 판단됨

**파일**: `src/components/home/TodayReservationCard.tsx:303-318`

```tsx
const recentPhoto = customerPhotos.find((photo) => isRenderableImageSrc(photo.imageDataUrl));
// recentPhoto 없으면 "신규" 표시
```

포트폴리오 사진이 없으면 단골도 "신규"로 표시됨. 실제 방문 횟수나 고객 존재 여부와 무관.

---

## Medium — 개선 필요

### M-1. isLoggedIn()/isOwner() 함수 참조 구독 문제

**파일**: `src/components/auth/AuthGuard.tsx:11`, `src/app/(main)/dashboard/page.tsx:37`, `src/app/(main)/layout.tsx:16`

Zustand에서 함수 참조는 변하지 않으므로 `role`/`currentShopId` 변경 시 셀렉터가 재실행되지 않음.

**영향**: 로그아웃 직후 AuthGuard가 즉시 반응하지 않음.

---

### M-2. locale 비정상 종료 시 오염

**파일**: `src/store/locale-store.ts:42`

summary 저장 없이 `/records`로 직접 이탈 → `restoreLocale()` 미호출 → `previousLocale`이 localStorage에 영구 잔류.

---

### M-3. ConsultationGuard가 entryPoint만 체크

**파일**: `src/lib/use-consultation-guard.ts:11-19`

entryPoint만 존재하면 어떤 스텝이든 URL 직접 접근 허용. Step 1을 건너뛰고 `/consultation/summary`에 직접 접근 가능.

---

### M-4. 온보딩 중간 스텝 직접 URL 접근 가능

**파일**: `src/app/onboarding/complete/page.tsx:55-84`

`/onboarding/complete`에 직접 접근하면 빈 데이터로 온보딩 완료 처리 가능.

---

### M-5. additionalCharge가 PriceSummaryBar에 미반영

**파일**: `src/app/consultation/summary/page.tsx:47,54`

사장님이 추가금액을 입력해도 헤더 가격 바에는 반영되지 않음.

---

### M-6. 이중 30초 폴링 + race condition

**파일**: `src/app/(main)/home/page.tsx:114-128`, `src/components/layout/NotificationBellButton.tsx:48-62`

두 곳에서 독립적으로 `hydrateFromDB()` 30초 폴링 실행.

---

### M-7. Blob URL 이미지 새로고침 시 깨짐

**파일**: `src/app/consultation/customer/page.tsx:53`

Blob URL이 sessionStorage에 저장됨. 새로고침 후 무효화.

---

### M-8. useMembershipSession 이중 트랜잭션

**파일**: `src/store/customer-store.ts:452-498`

두 `Date.now()` 호출 시각 차이로 id가 달라져 중복 기록 가능.

---

### M-9. _initDone 모듈 레벨 변수 — 로그아웃 후 재로그인 문제

**파일**: `src/store/auth-store.ts:134-135`

로그아웃 시 `false`로 리셋 안 됨 → 재로그인 시 `initializeAuth()` 스킵.

---

### M-10. shopId URL 파라미터 서버 검증 없음

**파일**: `src/app/consultation/page.tsx:152`

임의의 shopId를 URL에 삽입 가능.

---

### M-11. ReservationReadinessBadge가 단골/신규를 구분하지 않음

**파일**: `src/lib/reservation-readiness.ts:30-38`

오직 사전 상담(QR 링크 입력) 완료 여부만 판단. 단골이든 신규든 사전 상담이 없으면 무조건 "현장 상담 필요"로 표시.

실제로는 단골은 현장 상담이 불필요한 경우가 대부분.

---

## Low — 개선 권장

### L-1. step3의 totalSteps=6 하드코딩

**파일**: `src/app/consultation/step3/page.tsx:33`

다른 모든 페이지는 `totalSteps={5}`인데 step3만 `totalSteps={6}`.

---

### L-2. traits의 backHref가 항상 step2 고정

**파일**: `src/app/consultation/traits/page.tsx:43`

step3 경유 시 뒤로가기가 step3이 아닌 step2로 이동.

---

### L-3. summary의 뒤로가기가 항상 traits 고정

**파일**: `src/app/consultation/summary/page.tsx:339-341`

return_visit 플로우(CUSTOMER_INFO → SUMMARY)에서도 traits로 이동.

---

### L-4. QR origin 지연 세팅

**파일**: `src/components/home/QRGeneratorModal.tsx:20-24`

첫 렌더 시 origin이 빈 문자열. 불완전한 URL의 QR이 순간 렌더됨.

---

### L-5. CUSTOMER_LINK_STEP_ORDER와 STEP_ORDER가 동일

**파일**: `src/store/consultation-store.ts:94-101`

두 배열이 완전히 동일. 별도 분리 의미 없음.

---

### L-6. repairCount undefined 시 강제 폴백

**파일**: `src/lib/price-calculator.ts:96`

`extensionType === 'repair'`일 때 `repairCount`가 undefined이면 `?? 1`로 폴백.

---

### L-7. percent 할인 시 subtotal 초과 가능

**파일**: `src/lib/price-calculator.ts:204-206`

items 배열에 실제 subtotal보다 큰 할인 금액이 표시될 수 있음.

---

### L-8. pricingAdjustments에 discountAmount 미저장

**파일**: `src/app/(main)/payment/page.tsx:130-138`

할인 금액을 별도 저장하지 않아 역산 불가.

---

## 이슈 요약 테이블

### 사용자 플로우 이슈 (클라이언트 피드백)

| # | 심각도 | 이슈 | 상태 |
|---|--------|------|------|
| UF-1 | 🔴 Critical | 단골에게 상담 5스텝 강제 | ✅ 수정됨 — 예약 상세에 "매출 등록" 버튼 추가, /quick-sale?bookingId 연동 |
| UF-2 | 🔴 Critical | 매출 등록 ↔ 고객 카드 연동 0% | ✅ 수정됨 — QuickSaleForm에 customer-store 자동완성 드롭다운 구현 |
| UF-3 | 🔴 Critical | "고객 연결 필요" 메시지 당황 | ✅ 수정됨 — "고객 카드 연결"로 변경 + primary 색상 |
| UF-4 | 🔴 Critical | 고객 카드 데이터 안 쌓임 | ✅ 수정됨 — quick-sale에서 고객 통계 갱신 + 시술 기록 records-store 병합 |
| UF-5 | 🟡 High | 예약 ↔ 매출 연결 고리 부재 | ✅ 수정됨 — bookingId URL param으로 예약↔매출 연동 |
| UF-6 | 🟡 High | 예약 시 기존 고객 자동 매칭 없음 | ✅ 수정됨 — DayReservationList 빠른 추가에 고객 검색 드롭다운 |
| UF-7 | 🟡 High | 매출 등록 후 성공 피드백 없음 | ✅ 수정됨 — 성공/실패 토스트 알림 추가 |
| UF-8 | 🟡 High | 시술 전 확인사항 → 상담 강제 연결 | ✅ 수정됨 — "확인 완료 (매출만 등록)" 버튼 추가 |

### 기술 이슈

| # | 심각도 | 이슈 | 상태 |
|---|--------|------|------|
| C-1 | Critical | 외부 customer_link 상담 기록 누락 | ✅ 수정됨 — isExternalCustomerLinkFlow 분기에 addRecord 추가 |
| C-2 | Critical | quick-sale 고객 검색 장식용 | ✅ 수정됨 — useCustomerStore 연동 자동완성 구현 |
| C-3 | Critical | quick-sale 디자이너 하드코딩 | ✅ 수정됨 — useShopStore.designers 동적 렌더링 |
| C-4 | Critical | quick-sale 고객 통계 미갱신 | ✅ 수정됨 — addQuickSaleRecord에서 updateCustomer 호출 |
| C-5 | Critical | quick-sale customerName/serviceType 미저장 | ✅ 수정됨 — consultation 객체에 필드 추가 |
| H-1 | High | return_visit 단축 플로우 비활성 | ✅ 수정됨 — entryPoint 확인 후 summary 직행 |
| H-2 | High | STEP3_OPTIONS STEP_ORDER 누락 | ✅ 수정됨 — setStep(TRAITS)로 변경 |
| H-3 | High | 캔버스→traits setStep 누락 | ✅ 수정됨 — setStep(TRAITS) 추가 |
| H-4 | High | 캔버스 데이터 복원 불가 | ✅ 수정됨 — canvasData→CanvasSelections 역변환 + initialSelections 전달 |
| H-5 | High | 재상담 bookingId 승계 | ✅ 수정됨 — bookingId: undefined 명시 |
| H-6 | High | addRecord DB 실패 시 롤백 없음 | ✅ 수정됨 — removeRecord 롤백 추가 |
| H-7 | High | payment finalPrice 변경 시 totalSpend 미갱신 | ✅ 수정됨 — 차이만큼 totalSpend/averageSpend 조정 |
| H-8 | High | 예약→상담 designerId 누락 | ✅ 수정됨 — consultationSnapshot에 designerId 명시 포함 |
| H-9 | High | 예약 상세에 "매출 등록" 경로 없음 | ✅ 수정됨 — "매출 등록" 버튼 추가 |
| H-10 | High | 빠른 추가 폼 고객 검색 없음 | ✅ 수정됨 — 고객 검색 드롭다운 추가 |
| H-11 | High | "신규" 뱃지가 사진 유무로 판단 | ✅ 수정됨 — !booking.customerId 조건으로 변경 |
| M-1 | Medium | isLoggedIn 함수 참조 구독 | ✅ 수정됨 — role/currentShopId 직접 구독 |
| M-2 | Medium | locale 비정상 종료 시 오염 | ✅ 수정됨 — previousLocale 덮어쓰기 방지 |
| M-3 | Medium | Guard entryPoint만 체크 | ✅ 수정됨 — requiredStep 파라미터 + stepOrder 검증 |
| M-4 | Medium | 온보딩 스텝 직접 URL 접근 | ✅ 수정됨 — shopName 없으면 /onboarding 리다이렉트 |
| M-5 | Medium | additionalCharge 가격바 미반영 | ✅ 수정됨 — sessionStorage 보존/복원 |
| M-6 | Medium | 이중 폴링 + race condition | ✅ 수정됨 — /home이면 NotificationBell 폴링 스킵 |
| M-7 | Medium | Blob URL 새로고침 시 깨짐 | ✅ 수정됨 — FileReader.readAsDataURL base64 변환 |
| M-8 | Medium | 멤버십 이중 트랜잭션 | ✅ 수정됨 — txnId 한 번만 생성하여 재사용 |
| M-9 | Medium | _initDone 로그아웃 미리셋 | ✅ 수정됨 — logout()에 _initDone = false |
| M-10 | Medium | shopId URL 검증 없음 | ✅ 수정됨 — trim + 길이 검증 추가 |
| M-11 | Medium | ReadinessBadge 단골/신규 미구분 | ✅ 수정됨 — regular_ready 상태 + "시술 준비" 표시 |
| L-1 | Low | step3 totalSteps=6 하드코딩 | ✅ 수정됨 — totalSteps={5} |
| L-2 | Low | traits backHref step2 고정 | ✅ 수정됨 — step3 경유 여부로 동적 처리 |
| L-3 | Low | summary 뒤로가기 traits 고정 | ✅ 수정됨 — return_visit이면 customer로 이동 |
| L-4 | Low | QR origin 지연 세팅 | ✅ 수정됨 — useState 초기값에서 즉시 설정 |
| L-5 | Low | CUSTOMER_LINK_STEP_ORDER 동일 | ✅ 수정됨 — STEP_ORDER로 통합 |
| L-6 | Low | repairCount undefined 폴백 | ✅ 수정됨 — 폴백 코멘트 추가 |
| L-7 | Low | percent 할인 subtotal 초과 | ✅ 수정됨 — Math.min(discountAmount, subtotal) cap |
| L-8 | Low | discountAmount 미저장 | ✅ 수정됨 — pricingAdjustments에 discountAmount 필드 추가 |

---

### 진행 요약

| 카테고리 | 전체 | 완료 | 완료율 |
|----------|------|------|--------|
| 사용자 플로우 (Critical) | 4 | 4 | 100% |
| 사용자 플로우 (High) | 4 | 4 | 100% |
| 기술 Critical | 5 | 5 | 100% |
| 기술 High | 11 | 11 | 100% |
| 기술 Medium | 11 | 11 | 100% |
| 기술 Low | 8 | 8 | 100% |
| **합계** | **43** | **43** | **100%** |

> 수정일: 2026-03-25
> 빌드 검증: `tsc --noEmit` ✅ | `pnpm lint` ✅ | `pnpm build` ✅
