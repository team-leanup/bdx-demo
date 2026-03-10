# 기록 화면 개선 체크리스트

## R-1. 비주얼 피드 (썸네일)
- **상태**: 🟢 완료
- **현재**: `ConsultationListItem` 좌측에 40x40 썸네일. `portfolioStore.getByRecordId()` 첫 번째 사진 사용. 없으면 이니셜 아이콘
- **구현**: `src/components/records/ConsultationListItem.tsx` — `usePortfolioStore` 추가, flex items-start gap-3 레이아웃으로 변경

## R-2. 세이프티 배지
- **상태**: 🟢 완료
- **현재**: `ConsultationListItem` 하단에 세이프티 태그 행 추가. `getPinnedTags`로 high/medium 레벨 태그만 xs 사이즈로 표시
- **구현**: `src/components/records/ConsultationListItem.tsx` — `useCustomerStore`, `getSafetyTagMeta` 추가, SafetyTag 렌더링

## R-3. 상담 이력 퀵 프리뷰
- **상태**: 🟢 완료
- **현재**: 리스트 항목 우측에 '미리보기' 버튼. 클릭 시 `ConsultationPreviewModal` 바텀시트로 사진+메모+가격 표시. 상세보기 버튼으로 페이지 이동
- **구현**:
  - `src/components/records/ConsultationPreviewModal.tsx` (신규) — AnimatePresence 모달
  - `src/components/records/ConsultationList.tsx` — `onRecordPreview` prop 추가
  - `src/components/records/ConsultationListItem.tsx` — `onPreview` prop 추가
  - `src/components/records/index.ts` — ConsultationPreviewModal export
  - `src/app/(main)/records/page.tsx` — previewRecord state + ConsultationPreviewModal 연결

## R-4. 국기 아이콘 + 언어 표시
- **상태**: 🟢 완료
- **현재**: `ConsultationRecord`에 `language` 필드 추가. 상담 저장 시 연결된 예약의 language 값 포함. 리스트에 FlagIcon 표시
- **구현**:
  - `src/types/consultation.ts` — `ConsultationRecord.language` 추가
  - `src/app/consultation/summary/page.tsx` — 저장 시 bookingLanguage 포함
  - `src/components/records/ConsultationListItem.tsx` — FlagIcon 조건부 렌더링

## R-5. 필터 고도화 (성향 태그)
- **상태**: 🟢 완료
- **현재**: 검색창 아래 스크롤 가능한 태그 필터 칩 추가. '전체', '외국인', TAG_PRESETS etc 카테고리 옵션. 선택 시 해당 태그를 보유한 고객의 상담 기록만 필터링
- **구현**: `src/app/(main)/records/page.tsx` — `tagFilter` state, 태그 칩 UI, listFiltered 로직 확장

---

## 진행 요약

| 상태 | 수 |
|------|-----|
| ⬜ 미착수 | 0 |
| 🟡 진행중 | 0 |
| 🟢 완료 | 5 |
| **합계** | **5** |
