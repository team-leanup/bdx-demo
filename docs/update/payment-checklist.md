# 결제 화면 체크리스트

## P-1. 결제창 자동 불러오기
- **상태**: 🟢 완료
- **현재**: `src/app/(main)/payment/page.tsx` 신규. URL `/payment?recordId=xxx` 또는 `?bookingId=xxx`. `records-store`에서 상담 기록 로드 → `calculatePrice()`로 자동 합산 → `PaymentSummary` 카드 표시. "결제 완료" 버튼 클릭 시 `updateRecord` 호출 후 `/records`로 이동.
- **구현**: `payment/page.tsx`, `PaymentSummary.tsx` 신규

## P-2. 추가금/할인 수정
- **상태**: 🟢 완료
- **현재**: 결제 화면에 추가 항목 인라인 편집 (라벨+금액). 프리셋 할인 버튼 (첫 방문 10%, 지인 할인 5,000원, 재방문 3,000원). 정액/퍼센트 할인 직접 입력.
- **구현**: `extraItems` 상태, `discount` 상태, 프리셋 버튼

## P-3. 예약금 자동 차감
- **상태**: 🟢 완료
- **현재**: `useReservationStore`에서 linked reservation의 deposit 자동 로드. `calculatePrice()` 결과의 depositAmount 포함. "시술 총액 - 예약금 = 결제 금액" 명확 표시.
- **구현**: `linkedReservation` 조회, `PaymentSummary`에서 예약금 차감 표시

---

## 진행 요약

| 상태 | 수 |
|------|-----|
| ⬜ 미착수 | 0 |
| 🟡 진행중 | 0 |
| 🟢 완료 | 3 |
| **합계** | **3** |
