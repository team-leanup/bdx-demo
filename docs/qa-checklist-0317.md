# BDX 전체 플랫폼 심층 QA 체크리스트

> **날짜**: 2026-03-17
> **분석 방법**: 4명 병렬 코드 분석 (페이지/라우팅, UI/UX, 데이터/로직, E2E 플로우) + Playwright 검증
> **상태 범례**: ⬜ 미검증 · ✅ 정상 · ❌ 버그 확인 · ⚠️ 경미한 이슈 · 🔧 수정 완료

---

## 🔴 Critical (즉시 수정 필요)

### C-01. 상담 완료 후 고객 데이터 잔류 — reset() 미호출
- **파일**: `src/app/consultation/summary/page.tsx`
- **현상**: `handleSave()` 완료 후 treatment-sheet로 이동 시 `reset()` 미호출. treatment-sheet에서만 reset 됨
- **영향**: 사용자가 treatment-sheet를 거치지 않고 홈으로 이동하면 이전 고객 이름/전화번호가 다음 상담에 노출
- **QA**: 상담 완료 → summary 저장 → 브라우저 뒤로가기 → 홈 → 새 상담 시작 → 이전 고객 데이터 잔류 확인
- **상태**: ⬜ (Playwright로 직접 테스트 어려움 — 상담 완료 후 수동 뒤로가기 필요)

### C-02. STEP_ORDER에 STEP3_OPTIONS/CANVAS 누락
- **파일**: `src/store/consultation-store.ts:85-101`
- **현상**: `STEP_ORDER`에 `STEP3_OPTIONS`, `CANVAS`가 없어서 step3/canvas에서 `goPrev()`/`goNext()` 메서드가 -1 인덱스로 동작 불능
- **영향**: step3/canvas에서 스토어 기반 네비게이션 완전 실패
- **QA**: step2 → "상세 옵션" → step3 → 뒤로가기 → 정상 이동 확인
- **상태**: ⬜

### C-03. locale-store가 현재 언어를 persist하지 않음
- **파일**: `src/store/locale-store.ts:43`
- **현상**: `partialize`에서 `locale` 제외 → 새로고침 시 항상 'ko'로 리셋
- **영향**: 상담 중 새로고침하면 언어가 한국어로 돌아감. customer_link 외국인 플로우 치명적
- **QA**: 영어 선택 → 브라우저 새로고침 → 언어가 한국어로 바뀌는지 확인
- **상태**: ❌ **버그 확인** — Playwright: English 선택 → 새로고침 → 한국어로 리셋됨

### C-04. useConsultationGuard 가드 조건 취약
- **파일**: `src/lib/use-consultation-guard.ts`
- **현상**: `!entryPoint` 하나만 체크. 상담 완료 후 reset() 전에 URL 직접 접근으로 중복 저장 가능
- **영향**: 상담 데이터 중복 저장, 보안 취약
- **QA**: 상담 완료 후 `/consultation/traits` 직접 접근 → 가드 차단 여부
- **상태**: ⬜

### C-05. save-complete: consultationId 기본값 'record-001'
- **파일**: `src/app/consultation/save-complete/page.tsx:14`
- **현상**: 쿼리 파라미터 없이 접근 시 존재하지 않을 수 있는 'record-001' ID 사용
- **영향**: 체크리스트, 시술확인서 링크가 잘못된 ID를 가리킴
- **QA**: `/consultation/save-complete` 직접 접근 → 링크 동작 확인
- **상태**: ❌ **버그 확인** — Playwright: "기록을 찾을 수 없습니다" 표시, record-001 존재하지 않음

### C-06. Modal.tsx — 접근성 치명적 결함
- **파일**: `src/components/ui/Modal.tsx`
- **현상**: `role="dialog"` 없음, `aria-modal="true"` 없음, 포커스 트랩 없음, ESC 키 핸들러 없음
- **영향**: 스크린리더 미지원, 키보드 사용자 모달 닫기 불가, 포커스 이탈
- **QA**: 모달 열기 → Tab 포커스 이동 → ESC 키 닫기 → 포커스 트랩 확인
- **상태**: ❌ **버그 확인** — Playwright: KPI 바텀시트, QR 모달, 미리보기 모달 3종 모두 ESC 키 무반응. role="dialog" 누락

### C-07. StatusBar 언어 변경 버튼 터치 타겟 32px
- **파일**: `src/components/layout/StatusBar.tsx:43`
- **현상**: `w-8 h-8` (32×32px) — WCAG 최소 44px 미달
- **영향**: 모바일 사용자 언어 선택기 탭 실패 빈번
- **QA**: iPhone 390px 뷰포트에서 언어 버튼 탭 정확도 확인
- **상태**: ⬜

### C-08. ConsultationPreviewModal 닫기 버튼 터치 타겟 + 접근성
- **파일**: `src/components/records/ConsultationPreviewModal.tsx:75`
- **현상**: 닫기 버튼 `h-8 w-8` (32px) + `aria-label` 없음
- **영향**: 모바일 모달 닫기 어려움, 스크린리더 미지원
- **QA**: 기록 → 미리보기 → 닫기 버튼 탭 + 접근성 확인
- **상태**: ⬜

---

## 🟠 Major (개선 권장)

### M-01. canvas handleNext에서 setStep(TRAITS) 누락
- **파일**: `src/app/consultation/canvas/page.tsx:113-118`
- **현상**: `router.push('/consultation/traits')` 시 `setStep()` 누락
- **영향**: store는 CANVAS인데 실제 UI는 TRAITS. 새로고침 시 CANVAS로 되돌아감
- **QA**: canvas → 다음 → traits → 새로고침 → 어느 단계로 복원되는지 확인
- **상태**: ⬜

### M-02. step3 handleNext — setStep에 잘못된 enum 값
- **파일**: `src/app/consultation/step3/page.tsx:24-27`
- **현상**: `setStep(ConsultationStep.STEP3_OPTIONS)` 후 traits로 이동. TRAITS를 설정해야 함
- **영향**: resume dialog 오작동, step3 단계로 복원됨
- **QA**: step3 → 다음 → traits → 새로고침 → resume dialog 동작 확인
- **상태**: ⬜

### M-03. step3 진행 표시기 totalSteps 불일치
- **파일**: `src/app/consultation/step3/page.tsx:34`
- **현상**: `totalSteps={6}` — 다른 모든 페이지는 totalSteps=5
- **영향**: "4/6" 표시 후 다음 페이지에서 "5/5"로 변경되어 혼란
- **QA**: step2 → 상세 옵션 → step3 → 헤더 진행 표시기 숫자 확인
- **상태**: ⬜

### M-04. traits 페이지 backHref 항상 /consultation/canvas
- **파일**: `src/app/consultation/traits/page.tsx:43`
- **현상**: `backHref="/consultation/canvas"` 하드코딩 — canvas를 거치지 않은 경우에도 canvas로 이동
- **영향**: step2 → traits 경로 진입 시 뒤로가기로 canvas로 이동 후 리다이렉트
- **QA**: step2 → 다음 → traits → 뒤로가기 → 올바른 페이지로 이동하는지 확인
- **상태**: ⬜

### M-05. computeUpsellMetrics가 DEFAULT_SERVICE_PRICING 사용
- **파일**: `src/lib/analytics.ts:370`
- **현상**: 샵 설정 가격 무시, 하드코딩 기본 가격으로 업셀 매출 계산
- **영향**: 대시보드 업셀 리포트가 실제 가격 미반영
- **QA**: 샵 설정 가격 변경 후 대시보드 업셀 매출 확인
- **상태**: ⬜

### M-06. DEFAULT_SERVICE_PRICING vs surcharges 기본값 불일치
- **파일**: `src/lib/price-calculator.ts:6-27` vs `src/store/app-store.ts:65-82`
- **현상**: solidPoint: 10000 vs 20000, fullArt: 20000 vs 40000, monthlyArt: 25000 vs 80000
- **영향**: 설정 미완료 시 analytics와 price-calculator 결과 불일치
- **QA**: 새 계정 풀아트 상담 → 대시보드 업셀 금액 vs 상담 저장 금액 비교
- **상태**: ⬜

### M-07. computeDesignScopeBreakdown 등 사전상담 미필터
- **파일**: `src/lib/analytics.ts:258, 275`
- **현상**: `computeDesignScopeBreakdown`, `computeExpressionBreakdown`, `computePopularTreatments`에 사전상담 필터 없음
- **영향**: 인기 디자인/표현 기법 통계에 사전상담 미완료 건 포함
- **QA**: 사전상담 포함 여부에 따른 통계 차이 확인
- **상태**: ⬜

### M-08. reservation-store getByWeek 날짜 파싱 timezone 이슈
- **파일**: `src/store/reservation-store.ts:113-127`
- **현상**: `new Date('2026-03-17')` — UTC 자정으로 파싱, 한국 시간과 불일치 가능
- **영향**: 월요일 예약이 잘못된 주에 분류될 수 있음
- **QA**: 월요일 자정 근처 예약 주간 조회 정상 여부 확인
- **상태**: ⬜

### M-09. records-store에 referenceImages(base64) 전체 persist
- **파일**: `src/store/records-store.ts`
- **현상**: partialize 없이 전체 records를 localStorage에 저장. base64 이미지 포함 시 수백KB/건
- **영향**: 상담 기록 누적 → localStorage(5-10MB) 초과 → persist 실패
- **QA**: 참고 이미지 포함 상담 10건+ 저장 후 localStorage 사용량 확인
- **상태**: ⬜

### M-10. addRecord DB 실패 시 로컬 상태 롤백 없음
- **파일**: `src/store/records-store.ts:38-45`
- **현상**: 로컬에 먼저 추가 후 DB 호출. DB 실패 시 로컬에만 존재하는 레코드 발생
- **영향**: 네트워크 오류 시 로컬 레코드 → 새로고침 후 소실
- **QA**: 네트워크 차단 → 상담 저장 → 새로고침 → 레코드 소실 확인
- **상태**: ⬜

### M-11. 골든타임 데모 고객 날짜 만료
- **파일**: `src/store/customer-store.ts:88-224`
- **현상**: 데모 고객 lastVisitDate가 2월 초~중순 → +28일 기준 3월 중순 이전에 만료
- **영향**: 대시보드 골든타임 기능 데모 체험 불가 (항상 "0명")
- **QA**: 데모 로그인 → 대시보드 → 골든타임 섹션 고객 표시 확인
- **상태**: ⬜

### M-12. not-found.tsx 전혀 없음
- **파일**: 없음
- **현상**: 존재하지 않는 URL → Next.js 기본 404 페이지 표시
- **영향**: 브랜드 일관성 깨짐
- **QA**: `/nonexistent-route` 접근 → 응답 확인
- **상태**: ❌ **버그 확인** — Playwright: Next.js 기본 "404: This page could not be found." 영어 페이지 표시

### M-13. 온보딩 단계 순서 우회 가능
- **파일**: `src/app/onboarding/layout.tsx`
- **현상**: 단계 순서 검증 없음 → `/onboarding/complete` 직접 접근 가능
- **영향**: 미완료 상태에서 완료 처리 가능성
- **QA**: 로그인 후 `/onboarding/complete` 직접 접근 → 완료 화면 표시 여부
- **상태**: ⬜

### M-14. PortfolioOverlay — 진행 중 상담 덮어쓰기
- **파일**: `src/components/portfolio/PortfolioOverlay.tsx:212-220`
- **현상**: `hydrateConsultation()`이 기존 상담 전체를 초기화
- **영향**: 상담 중 포트폴리오 참고하다 "이 디자인으로 상담 시작" 클릭 시 기존 상담 소실
- **QA**: 상담 진행 중 → 포트폴리오 → "이 디자인으로 상담 시작" → 기존 상담 보존 여부
- **상태**: ⬜

### M-15. CustomerInfoForm — 하드코딩 bg-white
- **파일**: `src/components/consultation/CustomerInfoForm.tsx:158, 186, 236`
- **현상**: `bg-white` 하드코딩 (테마 변수 `bg-surface` 아님)
- **영향**: 다크 테마/커스텀 테마 적용 시 흰색 배경 깨짐
- **QA**: 다크 테마 적용 → 상담 고객 정보 폼 배경색 확인
- **상태**: ⬜

### M-16. DailyChecklist — 혼란스러운 자동저장 UX
- **파일**: `src/components/consultation/DailyChecklist.tsx:95-98`
- **현상**: 옵션 버튼 클릭 시 즉시 `doSave()` → "저장됨" 상태로 2초간 비활성화
- **영향**: 옵션만 바꿔도 저장 완료 표시 → 사용자 혼란
- **QA**: DailyChecklist → 옵션 클릭 → 저장 버튼 상태 관찰
- **상태**: ⬜

### M-17. NotificationBellButton 터치 타겟 미달
- **파일**: `src/components/layout/NotificationBellButton.tsx:58-61`
- **현상**: 기본 `w-8 h-8` (32px), compact `h-6 w-6` (24px)
- **영향**: 알림 버튼 탭 실패 빈번
- **QA**: 모바일 홈 → 벨 아이콘 탭 성공률 확인
- **상태**: ⬜

### M-18. DesignerPerformance / RecentConsultationCard 빈 상태 없음
- **파일**: `src/components/dashboard/DesignerPerformance.tsx`, `src/components/home/RecentConsultationCard.tsx`
- **현상**: 데이터 0건일 때 안내 문구 없는 빈 카드만 표시
- **영향**: 신규 사용자 첫 화면에서 빈 박스 노출
- **QA**: 디자이너 0명/상담 0건 상태에서 대시보드/홈 확인
- **상태**: ⬜

### M-19. PortfolioOverlay — AnimatePresence exit 애니메이션 비작동
- **파일**: `src/components/portfolio/PortfolioOverlay.tsx:79`
- **현상**: AnimatePresence 내부에 조건부 렌더링 없이 항상 렌더링 → exit 트리거 안 됨
- **영향**: 오버레이 닫을 때 애니메이션 없이 즉시 사라짐
- **QA**: 포트폴리오 사진 클릭 → 닫기 → 애니메이션 여부 확인
- **상태**: ⬜

### M-20. FingerCanvas — 색상 없이 파츠만 선택 불가
- **파일**: `src/components/canvas/FingerCanvas.tsx:381`
- **현상**: Apply 버튼이 `disabled={!modal.draftColor}` — 색상 없이 파츠만 저장 불가
- **영향**: 파츠 위치만 기록하고 싶은 경우 UX 막힘
- **QA**: 캔버스 → 손가락 탭 → 파츠만 선택 → 적용 버튼 활성화 여부
- **상태**: ⬜

### M-21. summary 에러 토스트 한국어 하드코딩 (다국어 페이지)
- **파일**: `src/app/consultation/summary/page.tsx:87-88, 105-106`
- **현상**: 에러 메시지 한국어 고정 — 외국인 고객에게 한국어 에러 노출
- **QA**: 영어 설정 → summary 에러 유도 → 에러 메시지 언어 확인
- **상태**: ⬜

### M-22. customer_link 스플래시 이중 로직
- **파일**: `src/app/consultation/page.tsx:207-225`, `src/app/consultation/customer/page.tsx:157-175`
- **현상**: consultation/page.tsx와 customer/page.tsx 모두에 splash 로직 존재
- **영향**: customer_link 첫 진입 시 splash 중복 처리 가능성
- **QA**: `?entry=customer-link` 접근 → splash 한 번만 표시되는지 확인
- **상태**: ⬜

### M-23. isVip state 초기값 stale closure
- **파일**: `src/app/(main)/customers/[id]/page.tsx`
- **현상**: `useState(() => getById(id)?.isRegular)` — store 업데이트 시 자동 갱신 안 됨
- **영향**: 별 토글 후 다른 고객 보고 돌아오면 이전 상태 표시
- **QA**: 단골 토글 → 다른 고객 → 돌아오기 → 상태 확인
- **상태**: ⬜

### M-24. 태그 편집 취소 시 localTags 미동기화
- **파일**: `src/app/(main)/customers/[id]/page.tsx`
- **현상**: localTags가 마운트 시점 값으로 고정, store 업데이트 미반영
- **영향**: 다른 경로로 태그 변경 시 페이지 새로고침 필요
- **QA**: 태그 편집 → 저장 → 취소 → 다시 편집 → 원래 목록 확인
- **상태**: ⬜

### M-25. SideNav.tsx — `<img>` 네이티브 태그 사용 (next/image 미사용)
- **파일**: `src/components/layout/SideNav.tsx:104`
- **현상**: Next.js `<Image>` 아닌 네이티브 img 태그 → 이미지 최적화 없음, CLS 가능
- **QA**: DevTools Network → 사이드바 로고 로딩 확인
- **상태**: ⬜

### M-26. QRGeneratorModal QR 코드 깜빡임
- **파일**: `src/components/home/QRGeneratorModal.tsx:81`
- **현상**: QR 코드값이 서버에서 빈 문자열 → 클라이언트에서 URL로 변경 (useEffect)
- **영향**: QR 모달 열릴 때 QR 코드 잠깐 깜빡임
- **QA**: 홈 → QR 버튼 → QR 코드 최초 렌더링 관찰
- **상태**: ⬜

### M-27. TourOverlay 배경 클릭으로 투어 강제 진행
- **파일**: `src/components/onboarding/TourOverlay.tsx:188`
- **현상**: 배경 클릭 시 `handleNext()` 호출 → 의도치 않은 투어 진행
- **영향**: 투어 내용 읽지 못하고 넘어감
- **QA**: 온보딩 투어 → 배경 탭 → 단계 변화 관찰
- **상태**: ⬜

### M-28. Modal.tsx 데스크톱 위치 계산 하드코딩
- **파일**: `src/components/ui/Modal.tsx:46`
- **현상**: `lg:left-[calc(100px+50%)]` — 사이드바 너비 가정 고정
- **영향**: 데스크톱에서 모달 완전 중앙 정렬 안 됨
- **QA**: 1440px 화면 모달 열기 → 정중앙 정렬 확인
- **상태**: ⬜

### M-29. KPICards switch case 한국어 리터럴 하드코딩 의존
- **파일**: `src/components/dashboard/KPICards.tsx`
- **현상**: `switch (label) { case '이달 상담 건수': ...}` — 레이블 변경 시 switch case 연동 실패
- **영향**: KPI 레이블 변경 시 바텀시트 빈 화면
- **QA**: KPI 카드 클릭 → 바텀시트 정상 표시 확인
- **상태**: ✅ **정상** — Playwright: 이달 상담 건수 클릭 → 바텀시트 정상 표시 (완료 3건, 미확정 13건, 사전상담 4건)

### M-30. computeGoldenTimeTargets 주간 경계 timezone 이슈
- **파일**: `src/lib/analytics.ts:465-504`
- **현상**: `startOfWeek(today)` 로컬 시간대 의존
- **영향**: UTC 기준 환경에서 주간 경계가 달라짐
- **QA**: 한국 시간 월요일 오전에서 주간 필터 경계 확인
- **상태**: ⬜

---

## 🟡 Minor (선택 개선)

### m-01. 루트 페이지(/) 초기화 중 빈 화면
- **파일**: `src/app/page.tsx:31`
- **현상**: `return null` — 로딩 상태 없음
- **QA**: 새 탭 `/` 접근 → 흰 화면 깜빡임 확인
- **상태**: ⬜

### m-02. treatment-sheet reset() 타이밍
- **파일**: `src/app/consultation/treatment-sheet/page.tsx:322-326`
- **현상**: `router.replace('/home')` 후 `setTimeout(() => reset(), 0)`
- **QA**: treatment-sheet → 홈 → 상태 초기화 타이밍 확인
- **상태**: ⬜

### m-03. consultation 레이아웃 AuthGuard 없음
- **파일**: `src/app/consultation/layout.tsx`
- **현상**: 미인증 사용자 상담 플로우 진입 가능 (데모 허용 의도일 수 있음)
- **상태**: ⬜

### m-04. intro-demo 페이지 라우팅 비연결
- **파일**: `src/app/intro-demo/page.tsx`
- **현상**: 어디에서도 링크되지 않는 고아 페이지
- **상태**: ⬜

### m-05. LanguageSelector 터치 타겟 경계선
- **파일**: `src/components/ui/LanguageSelector.tsx:25`
- **현상**: `py-1.5` 기준 버튼 높이 약 36px — 44px 미달 가능
- **상태**: ⬜

### m-06. ConsultationListItem 한국어 상태 텍스트 하드코딩
- **파일**: `src/components/records/ConsultationListItem.tsx:92-96`
- **현상**: "사전상담", "미확정" 하드코딩 (i18n 키 미사용, (main) 페이지이므로 실용적 문제 없음)
- **상태**: ⬜

### m-07. PortfolioOverlay 네비게이션 버튼 터치 타겟 36px
- **파일**: `src/components/portfolio/PortfolioOverlay.tsx:120-139`
- **현상**: `h-9 w-9` (36px) — 44px 미달
- **상태**: ⬜

### m-08. TodayReservationCard "고객 연결 필요" 버튼 극소 터치 타겟
- **파일**: `src/components/home/TodayReservationCard.tsx:279`
- **현상**: `text-[10px]` 텍스트 버튼, 약 16px 높이
- **상태**: ⬜

### m-09. HandIllustration 오른손 SVG 텍스트 반전 처리
- **파일**: `src/components/canvas/HandIllustration.tsx:302-313`
- **현상**: `scaleX(-1)` SVG 내 text 역변환 — 일부 브라우저 텍스트 깨짐 가능
- **상태**: ⬜

### m-10. PortfolioOverlay 한국어 UI 텍스트 하드코딩
- **파일**: `src/components/portfolio/PortfolioOverlay.tsx:200-223`
- **현상**: 사장님 전용 페이지이므로 낮은 우선순위
- **상태**: ⬜

### m-11. UploadPhotoForm iOS Safari 파일 입력 호환성
- **파일**: `src/components/portfolio/UploadPhotoForm.tsx:253`
- **현상**: `fileInputRef.current?.click()` iOS Safari 간헐적 차단
- **상태**: ⬜

### m-12. blob URL sessionStorage 잔류
- **파일**: `src/app/consultation/customer/page.tsx`
- **현상**: `URL.createObjectURL()` blob URL이 persist → 새로고침 후 이미지 깨짐
- **상태**: ⬜

### m-13. sessionStorage 키 문자열 상수화 안 됨
- **파일**: `src/app/consultation/customer/page.tsx`, `src/app/(main)/home/page.tsx`
- **현상**: `'consultation_customer_memo'` 등 키를 리터럴로 직접 사용
- **상태**: ⬜

### m-14. DESIGN_SCOPE_ICON 매핑 키 불일치
- **파일**: `src/app/(main)/customers/[id]/page.tsx`
- **현상**: DESIGN_SCOPE_ICON 키가 DESIGN_SCOPE_LABEL 값과 불일치 → 아이콘 항상 undefined
- **상태**: ⬜

### m-15. formatRelativeDate 미래 날짜 처리 안 함
- **파일**: `src/lib/format.ts:313-322`
- **현상**: 미래 날짜 → `-N일 전` 음수 표시
- **상태**: ⬜

### m-16. setPinnedTraits가 tag.pinned 속성 미설정
- **파일**: `src/store/customer-store.ts:330-340`
- **현상**: 재정렬만 하고 `pinned = true` 미설정 → `getPinnedTags` 빈 배열 가능
- **상태**: ⬜

### m-17. 환율 하드코딩
- **파일**: `src/lib/format.ts:141-146`
- **현상**: USD=0.00072, CNY=0.0052, JPY=0.11 — 갱신 메커니즘 없음
- **상태**: ⬜

### m-18. computeChangeRate — 이전 달 0건 시 항상 0% 반환
- **파일**: `src/lib/analytics.ts:218-221`
- **현상**: 0→5 증가해도 0% 표시
- **상태**: ⬜

### m-19. customer-store migrate 함수 없음
- **파일**: `src/store/customer-store.ts:424`
- **현상**: `version: 1`만 선언, migrate 없음 → 스키마 변경 시 기존 데이터 변환 불가
- **상태**: ⬜

### m-20. ShapeSelector 버튼 높이 44px 경계
- **파일**: `src/components/consultation/ShapeSelector.tsx:149`
- **현상**: SVG 아이콘 h-14로 충분할 수 있으나 패딩만으로는 44px 미달 가능
- **상태**: ⬜

### m-21. PortfolioOverlay solid_point DESIGN_SCOPE_LABEL 누락
- **파일**: `src/components/portfolio/PortfolioOverlay.tsx` (DESIGN_SCOPE_LABEL)
- **현상**: `solid_point` 키 없음 → 해당 시술 사진 서비스 타입 undefined
- **상태**: ⬜

### m-22. QR 버튼 shopId 없을 때 비활성화 누락
- **파일**: `src/app/(main)/home/page.tsx`
- **현상**: shopId 없으면 콜백 undefined → 아무 반응 없음 (안내 메시지 없음)
- **상태**: ⬜

---

## 🔵 Playwright 추가 발견

### P-01. 고객 목록 방문 횟수·매출 전원 "0회, ₩0" 표시
- **파일**: `src/app/(main)/customers/page.tsx`
- **현상**: 고객 목록에서 45명 전원 "0회", "₩0" 표시. 대시보드 "단골 고객 TOP 5"에서는 QA 골든 김하나 5회/₩390,000 등 정상 집계
- **영향**: 고객 관리 기능의 핵심 정보가 무의미 → 사용자 혼란
- **상태**: ❌ **버그 확인**

### P-02. 포트폴리오 오버레이 고객명 "알 수 없음"
- **파일**: `src/components/portfolio/PortfolioOverlay.tsx:48`
- **현상**: customerMap에서 고객 매칭 실패 → 모든 사진에 "알 수 없음" 표시
- **영향**: 포트폴리오 사진의 고객 연계 정보 무의미
- **상태**: ❌ **버그 확인**

### P-03. PretendardVariable.woff2 폰트 로딩 실패
- **파일**: `src/app/globals.css`, `/public/fonts/`
- **현상**: 콘솔에 `Failed to load resource: the server responded with a status of 404` 반복
- **영향**: 폰트 fallback으로 시스템 폰트 사용 → 디자인 일관성 저하
- **상태**: ❌ **버그 확인**

### P-04. 투어 오버레이 매 페이지 진입 시 반복 표시
- **파일**: `src/components/onboarding/TourOverlay.tsx`
- **현상**: 대시보드, 기록 등 각 페이지 처음 방문 시 투어 오버레이가 포인터 이벤트를 차단하여 즉시 조작 불가
- **영향**: 사용자가 매 페이지마다 "확인했어요" 클릭 강제 → UX 마찰
- **상태**: ⚠️ **기능이지만 UX 개선 필요** (한번 전체 확인 후 다시 안 뜨게)

---

## 📊 진행 요약

| 심각도 | 항목 수 | 검증 완료 | 버그 확인 | 수정 완료 |
|--------|---------|----------|----------|----------|
| 🔴 Critical | 8 | 3 | 3 | 0 |
| 🟠 Major | 30 | 2 | 1 | 0 |
| 🟡 Minor | 22 | 0 | 0 | 0 |
| 🔵 Playwright 추가 | 4 | 4 | 3 | 0 |
| **합계** | **64** | **9** | **7** | **0** |

---

## Playwright 테스트 시나리오 (우선순위순)

### 1순위: Critical 검증
1. 상담 완료 → 브라우저 뒤로가기 → 홈 → 새 상담 → 이전 데이터 잔류 (C-01)
2. step3 뒤로가기 동작 (C-02)
3. 영어 선택 → 새로고침 → 언어 리셋 확인 (C-03)
4. 상담 완료 후 URL 직접 접근 → 가드 차단 (C-04)
5. /consultation/save-complete 직접 접근 → 링크 동작 (C-05)
6. 모달 ESC 키 + 포커스 트랩 (C-06)
7. 언어 버튼 터치 타겟 크기 (C-07)
8. 미리보기 모달 닫기 터치 타겟 (C-08)

### 2순위: Major 핵심 검증
9. canvas → traits → 새로고침 → 단계 복원 (M-01)
10. 404 페이지 존재 여부 (M-12)
11. KPI 카드 바텀시트 동작 (M-29)
12. 디자이너 0명/상담 0건 빈 상태 (M-18)
13. 포트폴리오 오버레이 닫기 애니메이션 (M-19)
14. 온보딩 완료 페이지 직접 접근 (M-13)
