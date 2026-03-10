# 상담 기능 개편 체크리스트

## C-1. 진입로 설정 (상담 링크/QR)
- **상태**: 🟢 완료
- **완료 내용**:
  - `src/components/home/QRGeneratorModal.tsx` (신규) — QR 생성 모달 구현 (canvas 기반 QR 패턴 + 링크 복사)
  - `src/components/home/HeroCTA.tsx` — `onGenerateQR` prop + QR 버튼 추가 (점선 테두리 풀너비 버튼)
  - `src/app/(main)/home/page.tsx` — `showQRModal` state + HeroCTA에 QR props 연결
  - i18n: `home.generateQR`, `home.qrTitle`, `home.qrSubtitle`, `home.qrCopy`, `home.qrCopied` (4개 언어)

## C-2. Step 1: 사진 업로드 최상단 배치
- **상태**: 🟢 완료
- **완료 내용**:
  - `customer/page.tsx` — `prefillEntry === 'customer_link'`일 때 큰 사진 업로드 섹션 최상단 표시
  - `MoodTagSelector`, `PortfolioBrowser` 컴포넌트 customer_link 모드에서 상단 배치
  - staff 모드의 기존 참고이미지 섹션은 조건부 렌더링으로 분리

## C-3. Step 2: 포트폴리오 보기 + 무드 태그
- **상태**: 🟢 완료
- **완료 내용**:
  - `src/components/consultation/MoodTagSelector.tsx` (신규) — 10개 분위기 태그 선택 UI (다국어)
  - `src/components/consultation/PortfolioBrowser.tsx` (신규) — 포트폴리오 3열 그리드 브라우저
  - `src/types/consultation.ts` — `moodTags?: string[]` 필드 추가
  - `src/store/consultation-store.ts` — `setMoodTags`, `toggleMoodTag` 액션 추가

## C-4. Step 3: 타샵 제거/연장 강조
- **상태**: 🟢 완료
- **완료 내용**:
  - `src/components/consultation/OffSelector.tsx` — `offType === 'other_shop'` 선택 시 amber 경고 박스 표시
  - `src/components/consultation/ExtensionSelector.tsx` — `extensionType === 'extension'` 선택 시 파란 안내 박스 표시
  - i18n: `consultation.otherShopWarning`, `consultation.otherShopWarningTime`, `consultation.extensionWarning` (4개 언어)

## C-5. Step 4: 세이프티 아이콘 체크
- **상태**: 🟢 완료
- **완료 내용**:
  - `src/app/consultation/traits/page.tsx` — `flex flex-wrap` 태그 → `grid grid-cols-2` + `TraitIcon` 컴포넌트 사용
  - `TraitIcon` 컴포넌트: `selected`/`onClick` props로 인터랙션 처리
  - `cn` 미사용 import 제거

## C-6. Step 5: 개인정보 마지막 (customer_link 전용 순서 변경)
- **상태**: 🟢 완료
- **완료 내용**:
  - `src/store/consultation-store.ts` — `CUSTOMER_LINK_STEP_ORDER` 추가, `goNext`/`goPrev` entryPoint 기반 분기
  - `src/app/consultation/traits/page.tsx` — `customer_link`일 때 `/consultation/customer`로 이동, stepNumber=3
  - `src/app/consultation/customer/page.tsx` — `customer_link`일 때 stepNumber=4, backHref=/consultation/traits, handleNext는 SUMMARY로

## C-7. Step 6: 완료 요약 카드
- **상태**: 🟢 완료
- **완료 내용**:
  - `src/app/consultation/save-complete/page.tsx` — preconsultation 모드에 `ConsultationSummaryCard` 추가
  - "매장 도착 후 이 화면을 보여주시면" 안내 박스 추가

## C-8. 원장님 확인창 + 알림
- **상태**: 🟢 완료
- **완료 내용**:
  - `src/components/home/ConsultationAlertBanner.tsx` (신규) — 미확인 사전상담 알림 배너 (localStorage 기반 해제)
  - `src/app/(main)/home/page.tsx` — `<ConsultationAlertBanner />` 삽입 (TodayReservationCard 위)
  - i18n: `home.alertBannerSuffix`, `home.alertBannerView`, `home.alertBannerDismiss` (4개 언어)

## C-9. 정산 연동
- **상태**: 🟢 완료
- **완료 내용**:
  - `src/app/consultation/treatment-sheet/page.tsx` — `isPriceFinalized` 시 "결제하기 · {금액}" 녹색 버튼 표시 (footer 상단)

---

## 진행 요약

| 상태 | 수 |
|------|-----|
| ⬜ 미착수 | 0 |
| 🟡 진행중 | 0 |
| 🟢 완료 | 9 |
| **합계** | **9** |
