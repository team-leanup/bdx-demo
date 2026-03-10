# 고객 화면 개선 체크리스트

## CU-1. 세이프티 태그 이름 옆 상단 고정
- **상태**: 🟢 완료
- **현재**: pinnedTags 중 safety level 'high'/'medium'인 태그를 고객 이름 아래에 SafetyTag 컴포넌트로 표시. Section 1.5 기존 특이사항 카드는 유지.
- **구현**: `getSafetyTagMeta` 활용, 이름 옆 인라인 배치

## CU-2. 비주얼 히스토리 상단 배치
- **상태**: 🟢 완료
- **현재**: Section 1 아래 Section 1.5 위에 최근 시술 사진 3장 미니 갤러리 (가로 스크롤). 클릭 시 Modal 팝업으로 날짜+상세.
- **구현**: `treatmentPhotos.slice(0, 3)`, `setPhotoPopupId` 상태로 Modal 연결

## CU-3. 고객 성향 아이콘화
- **상태**: 🟢 완료
- **현재**: CustomerTagChip에 `icon?: string` prop 추가. TAG_PRESETS options의 icon 필드를 useMemo 맵으로 조회해 Section 5 태그에 아이콘 표시.
- **구현**: `CustomerTagChip` 컴포넌트 수정, tagIconMap useMemo 추가

## CU-4. 다국어 상담 기록 숏컷
- **상태**: 🟢 완료
- **현재**: `Customer` 타입에 `preferredLanguage?: 'ko' | 'en' | 'zh' | 'ja'` 추가. `useReservationStore`에서 해당 고객의 외국어 예약 감지. FlagIcon 이름 옆 표시. "번역된 상담 이력 보기" 버튼으로 `/records?customerId=` 이동.
- **구현**: detectedLanguage useMemo, FlagIcon, 버튼 추가

## CU-5. 사용 제품 칩 UI
- **상태**: 🟢 완료
- **현재**: `TreatmentHistory` 타입에 `colorLabels?: string[]`, `partsUsed?: string[]` 추가. Section 4 타임라인 항목에 rose 칩(colorLabels), success Badge(partsUsed) 표시.
- **구현**: 타입 수정 + 렌더링 추가

---

## 진행 요약

| 상태 | 수 |
|------|-----|
| ⬜ 미착수 | 0 |
| 🟡 진행중 | 0 |
| 🟢 완료 | 5 |
| **합계** | **5** |
