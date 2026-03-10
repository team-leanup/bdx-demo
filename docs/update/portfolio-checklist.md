# 포트폴리오 개선 체크리스트

## PF-1. 타이핑 제로 등록
- **상태**: 🟢 완료
- **현재**: `UploadPhotoForm`에서 태그/컬러 텍스트 입력을 칩 UI로 전환. 프리셋 칩 (12개 태그, 10개 컬러). "지난번이랑 똑같이" 버튼으로 이전 레시피 복사. 직접 입력도 가능.
- **구현**: `selectedTags`, `selectedColors` 상태, `PRESET_TAGS`, `PRESET_COLORS`, `recentCustomerPhoto` useMemo

## PF-2. 필터 시스템 고도화
- **상태**: 🟢 완료
- **현재**: 분위기 필터 칩 (#심플 #화려 #웨딩 #키치 #글리터 #내추럴) 가로 스크롤 추가. "글로벌 베스트" 버튼 (외국인 고객 포트폴리오 필터). `useReservationStore`에서 foreignCustomerIds 집합 계산.
- **구현**: `moodFilter`, `globalBestFilter` 상태, `foreignCustomerIds` useMemo

## PF-3. 시각적 레시피 (오버레이)
- **상태**: 🟢 완료
- **현재**: 그리드 클릭 시 별도 페이지 대신 `PortfolioOverlay` 모달 오버레이. 사진 위 Price/Time/Color 반투명 레이어. 이전/다음 네비게이션. "이 디자인으로 상담 시작" CTA.
- **구현**: `PortfolioOverlay.tsx` 신규 컴포넌트, `overlayPhotoId` 상태

## PF-4. 인스타 해시태그 생성
- **상태**: 🟢 완료
- **현재**: `InstagramHashtags.tsx` 신규 컴포넌트. tags + colorLabels + serviceType + designType + 가격대 → #해시태그 자동 생성. "복사하기" 버튼. 포트폴리오 오버레이와 상세 페이지에 배치.
- **구현**: `InstagramHashtags.tsx`, 포트폴리오 오버레이/상세 페이지에 통합

---

## 진행 요약

| 상태 | 수 |
|------|-----|
| ⬜ 미착수 | 0 |
| 🟡 진행중 | 0 |
| 🟢 완료 | 4 |
| **합계** | **4** |
