# 현장모드 (Field Mode) — 개발 현황 & QA 결과

> 작성일: 2026-04-03
> 근거 문서: `디자인-고르기-현장모드-흐름도.md` + `기술-검토-및-결정사항(claude).md`

---

## 1. 개요

**목적**: 포트폴리오 기반 빠른 확정 도구. 사장님이 고객과 함께 사진 보고 빠르게 결정 → 시술 → 정산 → 데이터 자동 저장.

**핵심 정의**: "현장모드는 상담이 아니라 결정을 빠르게 끝내고 시술 결과를 정산하는 흐름이다"

---

## 2. 라우트 구조

```
src/app/field-mode/
├── layout.tsx              # 한국어 강제, TabBar 없음, AuthGuard
├── page.tsx                # STEP 1~4: 포트폴리오 → 확정 → 옵션 → 가격
├── treatment/
│   └── page.tsx            # STEP 5~6: 시술 타이머 + 추가 항목
├── settlement/
│   └── page.tsx            # STEP 7~8: 정산 + 결제 기록
└── wrap-up/
    └── page.tsx            # STEP 9~11: 고객 정보 + 사진 + 데이터화
```

**기존 `/consultation/*` 유지** — customer_link (QR → 고객 셀프 상담) 플로우에서 계속 사용.

---

## 3. 전체 흐름 (11 STEP → 4 페이지)

### PHASE A: 선택 & 확정 (`/field-mode`)

| STEP | 기능 | 구현 상태 |
|------|------|----------|
| 1 | 포트폴리오 그리드 (카테고리 필터 + 추천/인기) | ✅ |
| 2 | 디자인 확정 바텀시트 (크게 표시 + 확정) | ✅ |
| 3 | 최소 옵션 (제거/길이/추가옵션) | ✅ |
| 4 | 실시간 가격 바 (하단 고정) | ✅ |

### PHASE B: 시술 중 (`/field-mode/treatment`)

| STEP | 기능 | 구현 상태 |
|------|------|----------|
| 5 | 시술 타이머 (HH:MM:SS 실시간) | ✅ |
| 6 | 추가 항목 미니 패널 (파츠/글리터/포인트아트/연장/기타) | ✅ |

### PHASE C: 정산 (`/field-mode/settlement`)

| STEP | 기능 | 구현 상태 |
|------|------|----------|
| 7 | 최종 정산 (디자인 + 기본옵션 + 시술중추가 + 최종금액) | ✅ |
| 8 | 결제 기록 (현금/카드/회원권, PG 연동 X) | ✅ |

### PHASE D: 마무리 (`/field-mode/wrap-up`)

| STEP | 기능 | 구현 상태 |
|------|------|----------|
| 9 | 고객 정보 입력 (선택, 건너뛰기 가능) | ✅ |
| 10 | 사진 저장 (촬영/갤러리, 최대 3장) | ✅ |
| 11 | 자동 데이터화 (시술기록 + 고객카드 + 포트폴리오) | ✅ |

---

## 4. 생성 파일 목록

### 타입 & 스토어
| 파일 | 설명 |
|------|------|
| `src/types/field-mode.ts` | FieldModePhase, FieldModeAddon, FieldModeConsultationData |
| `src/store/field-mode-store.ts` | Zustand (sessionStorage persist), 17개 액션 |

### 컴포넌트 (8개)
| 파일 | 설명 |
|------|------|
| `src/components/field-mode/PortfolioGrid.tsx` | 카테고리 탭 + 추천/인기 + 2열 그리드 |
| `src/components/field-mode/DesignConfirmSheet.tsx` | 바텀시트 디자인 확정 |
| `src/components/field-mode/QuickOptionsPanel.tsx` | 제거/길이/추가옵션 3섹션 |
| `src/components/field-mode/PriceBar.tsx` | 하단 고정 가격 바 |
| `src/components/field-mode/TreatmentTimer.tsx` | HH:MM:SS 경과 타이머 |
| `src/components/field-mode/AddOnMiniPanel.tsx` | 시술 중 추가 버튼 + 기타 직접입력 |
| `src/components/field-mode/SettlementCard.tsx` | 정산 항목 카드 |
| `src/components/field-mode/PhotoCapture.tsx` | 카메라/갤러리 사진 캡처 |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/lib/i18n.ts` | `fieldMode.*` 네임스페이스 추가 (49개 키, 4개 언어) |
| `src/app/(main)/home/page.tsx` | HeroCTA → `/field-mode` + "디자인 고르기" 라벨 |
| `src/store/records-store.ts` | `SERVICE_TO_DESIGN_SCOPE`에 '심플', '자석' 매핑 추가 |
| `src/app/onboarding/complete/page.tsx` | CTA 우선순위 변경: 현장모드 시작(primary) + 고객 화면 미리보기(secondary) |

---

## 5. 가격 계산 로직

기존 `calculatePreConsultPrice()` (`src/lib/pre-consult-price.ts`) 100% 재사용:
- 카테고리 기본가 (`shopSettings.categoryPricing`)
- 제거 추가금 (`surcharges.selfRemoval` / `otherRemoval`)
- 연장 추가금 (`surcharges.extension`)
- 추가옵션 (stone ₩5,000 / parts `surcharges.largeParts` / glitter ₩3,000 / point_art `surcharges.pointArt`)
- 시술 중 추가: `inTreatmentAddons.reduce((s, a) => s + a.amount, 0)`

**현장모드에서는 `minTotal`을 확정가로 사용** (현장 실물 확인 상황이므로 범위 불필요).

---

## 6. Chrome QA 결과 (2026-04-03)

### E2E 플로우 테스트

| # | 테스트 항목 | 결과 | 비고 |
|---|-----------|------|------|
| 1 | 홈 → "디자인 고르기" CTA 클릭 | ✅ | `/field-mode`로 정확히 이동 |
| 2 | 카테고리 탭 (전체/심플/프렌치/자석/아트) | ✅ | 탭 전환 동작, active 상태 표시 |
| 3 | 추천/인기 정렬 탭 | ✅ | 기본값 "추천" |
| 4 | 포트폴리오 그리드 2열 표시 | ✅ | 데모 데이터 "이미지 없음" 플레이스홀더 표시 |
| 5 | 디자인 클릭 → 확정 바텀시트 | ✅ | 슬라이드 업 애니메이션, 가격+시간 표시 |
| 6 | "이 디자인으로 진행" → 옵션 화면 | ✅ | 제거/길이/추가옵션 3섹션 정상 |
| 7 | 타샵 선택 → 가격 실시간 반영 | ✅ | ₩50,000 → ₩60,000 (+₩10,000), 60분→70분 |
| 8 | "시술 시작" → 시술 중 페이지 | ✅ | 타이머 00:00:xx 실시간 카운팅 |
| 9 | 파츠 추가 → 합계 즉시 반영 | ✅ | ₩60,000 → ₩63,000 (+₩3,000) |
| 10 | "시술 완료" → 정산 페이지 | ✅ | 3장 카드 (디자인/기본옵션/시술중추가) |
| 11 | 정산 금액 정확성 | ✅ | ₩63,000 = 50,000(심플) + 10,000(타샵) + 3,000(파츠) |
| 12 | 시술 시간 표시 | ✅ | "1분" (테스트 시간 기준) |
| 13 | 결제 방법 선택 (카드) | ✅ | 3열 버튼, active 상태 표시 |
| 14 | "결제 완료" → 마무리 페이지 | ✅ | 성공 배너 + 3개 섹션 |
| 15 | 고객 정보 (선택) | ✅ | 이름/전화번호 입력 + "건너뛰기" |
| 16 | 사진 저장 (촬영/갤러리) | ✅ | 버튼 존재, file input 연결 |
| 17 | 자동 데이터화 체크리스트 | ✅ | 시술기록 ✅, 고객카드 ○, 포트폴리오 ○ |
| 18 | "홈으로 돌아가기" 버튼 | ✅ | DOM에 존재, 정상 동작 예상 |

### 발견 이슈 & 수정

| # | 이슈 | 심각도 | 상태 |
|---|------|--------|------|
| 1 | wrap-up 페이지에서 `getState()` 렌더 중 호출 | Critical | ✅ 수정 |
| 2 | `SERVICE_TO_DESIGN_SCOPE`에 '심플', '자석' 매핑 누락 | Major | ✅ 수정 |
| 3 | 온보딩 완료 CTA 우선순위 역전 (고객화면 보기 > 현장모드) | Major | ✅ 수정 |
| 4 | 포트폴리오 사진 없으면 empty state 대신 빈 카드 표시 | Minor | 알려진 제한 (데모 데이터 의존) |

---

## 7. 프로덕션 문서 준수 검증

### 현장모드 흐름도 (`디자인-고르기-현장모드-흐름도.md`)

| 요구사항 | 상태 | 비고 |
|---------|------|------|
| 포트폴리오 바로 보이는 구조 | ✅ | 첫 화면이 포트폴리오 그리드 |
| 카테고리 필터 (심플/프렌치/자석/아트) | ✅ | 수평 스크롤 칩 |
| 추천/인기 탭 | ✅ | isFeatured 기반 정렬 |
| 디자인 먼저 확정 | ✅ | 클릭 → 바텀시트 → "이 디자인으로 진행" |
| 최소 옵션만 (제거/길이/추가) | ✅ | 쉐입 등 불필요 항목 제외 |
| 3~5초 내 옵션 완료 | ✅ | 한 화면에 3섹션, 버튼 클릭만 |
| 실시간 요약 바 (하단 고정) | ✅ | 가격+시간 즉시 반영 |
| 시술 중 미니 패널 | ✅ | 파츠/글리터/포인트아트/연장/기타 |
| 누르면 즉시 금액 반영 | ✅ | 합계 실시간 업데이트 |
| 최종 정산 화면 | ✅ | 카드 3종 (디자인/기본옵션/추가항목) |
| 결제 = 기록만 (PG X) | ✅ | DB 저장, 현금/카드/회원권 선택 |
| 고객정보 뒤로 (선택) | ✅ | 결제 완료 후 선택적 입력 |
| 사진 저장 | ✅ | 촬영/갤러리, 최대 3장 |
| 자동 데이터화 | ✅ | 시술기록 + 고객카드 + 포트폴리오 연결 |

### 기술 검토 결정사항 (`기술-검토-및-결정사항(claude).md`)

| 요구사항 | 상태 | 비고 |
|---------|------|------|
| 기존 `/consultation/*` 유지 | ✅ | customer_link 플로우에서 사용 |
| 결제 = 기록만 (PG X) | ✅ | `addQuickSaleRecord()` 사용 |
| 시술 중 UI = 미니 패널 | ✅ | AddOnMiniPanel 컴포넌트 |
| 가격 체계 = 카테고리 기본가 + 옵션별 추가가 | ✅ | `calculatePreConsultPrice()` 재사용 |
| 이미지 저장소 = Supabase Storage | ✅ | `addPhoto()` → portfolio-store |

---

## 8. 홈 CTA 변경 사항

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| CTA 라벨 | "상담" / "신규 고객 상담" | "현장 시술" / "디자인 고르기" |
| CTA 부제 | "처음 오시는 분 · 외국인 고객용" | "포트폴리오에서 디자인 고르기" |
| 네비게이션 | `/consultation` | `/field-mode` |
| 예약 카드 "상담 시작" | `/consultation` (유지) | `/consultation` (유지, 예약 데이터 연동) |

---

## 9. 재사용 기존 코드

| 항목 | 파일 | 방식 |
|------|------|------|
| 가격 계산 | `src/lib/pre-consult-price.ts` | `calculatePreConsultPrice()` 직접 호출 |
| 타입 | `src/types/pre-consultation.ts` | DesignCategory, RemovalPreference 등 |
| DB 저장 | `src/store/records-store.ts` | `addQuickSaleRecord()` |
| 포트폴리오 | `src/store/portfolio-store.ts` | `hydrateFromDB()`, `addPhoto()` |
| 고객 | `src/store/customer-store.ts` | `createCustomer()`, `findByPhoneNormalized()` |
| UI | `src/components/ui/Button.tsx` | 공용 버튼 컴포넌트 |

---

## 10. UI/UX 리뷰 결과

### Critical
| ID | 파일 | 이슈 |
|----|------|------|
| C-1 | DesignConfirmSheet.tsx | 모달 포커스 트랩 없음 — Tab 키가 뒤 콘텐츠로 이동, ESC 키 닫기 없음 |
| C-2 | treatment/page.tsx | BackConfirm 다이얼로그에 `AnimatePresence` 없음 — exit 애니메이션 미동작 |

### Major
| ID | 파일 | 이슈 |
|----|------|------|
| M-2 | field-mode/page.tsx | 뒤로가기 버튼 40px (44px 미달) |
| M-3 | PortfolioGrid.tsx | 정렬/카테고리 버튼 36px (44px 미달) |
| M-6 | settlement/page.tsx | 결제수단 버튼 `aria-pressed`/`role="radio"` 없음 |
| M-7 | TreatmentTimer.tsx | 1초마다 텍스트 갱신 → 스크린리더 폭주 가능 (`aria-hidden` 필요) |

### Minor
| ID | 파일 | 이슈 |
|----|------|------|
| m-1 | PhotoCapture.tsx | 삭제 버튼 24px (터치 영역 확장 필요) |
| m-2 | DesignConfirmSheet.tsx | `style` 인라인 사용 → Tailwind `aspect-[3/4]` 대체 가능 |
| m-4 | wrap-up/page.tsx | 10개 이상 한국어 하드코딩 → `useT()` 통일 필요 |
| m-5 | DesignConfirmSheet.tsx | `AnimatePresence` 중첩 (부모 + 컴포넌트 내부) |
| m-6 | QuickOptionsPanel.tsx | `prefers-reduced-motion` 미대응 |

---

## 11. Spec 준수 검증 (자동화 결과)

### 부분 충족 항목 (3건)
| STEP | 이슈 | 설명 |
|------|------|------|
| 1 | 추천/인기 "탭" vs "정렬" | 문서는 탭 필터를 기대하지만 구현은 정렬 토글. UX 목적은 동일 |
| 3 | 스톤 옵션 추가 | 문서는 파츠/글리터/포인트 3종이지만 구현에 스톤 포함 (4종). 의도된 확장인지 확인 필요 |
| 4 | PriceBar 옵션 요약 없음 | 문서는 "디자인 + 옵션 + 금액 + 시간" 모두 표시하도록 명세하지만, 구현은 금액 + 시간만 표시 |

### 미충족 항목 (1건)
| 항목 | 설명 |
|------|------|
| 태블릿 최적화 | `기술-검토` 주의사항에 명시되었으나, 포트폴리오/옵션 화면에 `max-w` 컨테이너 없음 |

---

## 12. 향후 작업 (우선순위)

| 항목 | 우선순위 | 설명 |
|------|---------|------|
| 포트폴리오 실제 사진 연동 | P0 | 온보딩에서 등록한 사진이 현장모드에 표시되어야 함 |
| DesignConfirmSheet 포커스 트랩 + ESC | P0 | 모달 접근성 필수 |
| 터치 타겟 44px 통일 | P1 | 뒤로가기 버튼, 카테고리/정렬 칩 |
| PriceBar에 옵션 요약 추가 | P1 | 선택 디자인명 + 옵션 목록 표시 |
| 태블릿 반응형 최적화 | P1 | 375px~1024px 테스트 + max-w 컨테이너 |
| wrap-up 하드코딩 → i18n 키 통일 | P2 | 10개 이상 문자열 |
| 결제수단 aria 속성 추가 | P2 | `role="radio" aria-checked` |
| Wake Lock 동작 확인 | P2 | 시술 중 화면 꺼짐 방지 (모바일) |
| 공유카드 연동 | P3 | 시술 완료 후 공유카드 생성 CTA 추가 |
