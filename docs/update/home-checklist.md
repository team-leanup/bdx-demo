# 홈 화면 개선 체크리스트

## H-1. 예약 리스트 세이프티 컬러 태그
- **상태**: 🟢 완료
- **현재**: `TodayReservationCard`에서 pinnedTags 중 safety level high/medium인 태그를 `SafetyTag` 컴포넌트(xs size)로 표시. safetyTags 있으면 primaryTags 대신 세이프티 태그 우선 표시
- **구현**: `src/components/home/TodayReservationCard.tsx` — `getSafetyTagMeta`로 level 필터링 후 SafetyTag 렌더링

## H-2. 비주얼 히스토리 썸네일
- **상태**: 🟢 완료
- **현재**: 예약 행 우측에 `portfolioStore.getByCustomerId()` 최근 사진 원형 썸네일(32x32) 표시. 사진 없으면 '신규' 텍스트 아이콘
- **구현**: `src/components/home/TodayReservationCard.tsx` — `usePortfolioStore` 추가, `Image` next/image 사용

## H-3. 상담 준비도 상태
- **상태**: 🟢 완료
- **현재**: `preConsultationCompletedAt` 있으면 배지가 클릭 가능. 클릭 시 사전상담 참고이미지+요청메모 바텀시트 팝업 표시
- **구현**: `src/components/home/TodayReservationCard.tsx` — `previewBooking` state + AnimatePresence 모달

## H-4. 글로벌 예약 대기판 (외국인 카운트)
- **상태**: 🟢 완료
- **현재**: TodayStatsCard 4번째 컬럼에 외국인 예약 수 표시(🌏). 예약 행 이름 옆 FlagIcon 표시
- **구현**:
  - `src/components/home/TodayStatsCard.tsx` — grid-cols-4로 변경, foreignCount prop 추가
  - `src/components/home/TodayReservationCard.tsx` — FlagIcon 렌더링
  - `src/app/(main)/home/page.tsx` — foreignCount 계산 후 TodayStatsCard에 전달

## H-5. 재방문 골든타임 알림
- **상태**: 🟢 완료
- **현재**: `RevisitReminderCard` 신규 컴포넌트. lastVisitDate 4주(28일) 경과 고객 최대 5명 표시. 메시지 복사 버튼. QuickActions 위에 배치
- **구현**:
  - `src/components/home/RevisitReminderCard.tsx` (신규)
  - `src/components/home/index.ts` — export 추가
  - `src/app/(main)/home/page.tsx` — QuickActions 위에 추가

---

## 진행 요약

| 상태 | 수 |
|------|-----|
| ⬜ 미착수 | 0 |
| 🟡 진행중 | 0 |
| 🟢 완료 | 5 |
| **합계** | **5** |
