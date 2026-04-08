# 시술 후 결제 UX — QA 결과 + Flow 정리

> 작성일: 2026-04-03
> 대상: STEP 6~11 (시술 중 추가 → 결제 → 고객등록 → 사진저장 → 포트폴리오 연결)

---

## 1. 구현된 화면 흐름

```
treatment-sheet (시술 확인서)
  ├─ [Quick Add Chips] 시술 중 추가: 파츠 / 글리터 / 포인트 / 연장 추가 / 기타
  ├─ [가격 확정] → isPriceFinalized
  └─ [결제하기 · ₩68,000] → /payment?recordId=xxx

/payment?recordId=xxx (결제 페이지 — 5섹션 순차 스크롤)
  ├─ Section 1: 오늘 시술 정리 (read-only)
  │   - "오늘 시술 내용이에요 😊"
  │   - 디자인 뱃지 + 오프 뱃지 + 소요시간 뱃지
  │   - PaymentSummary: 기본/추가/할인/예약금/최종금액
  │   - "추가된 내용까지 반영된 최종 금액이에요 😊"
  │
  ├─ Section 2: 결제수단 선택
  │   - 현금 💵 / 카드 💳 / 회원권 🎫
  │   - [결제하기] 버튼 (결제수단 미선택 시 disabled)
  │   - 회원권: 잔여 횟수 뱃지 표시, 0이면 disabled
  │   → 결제 완료 시: paymentMethod 저장 + 고객 통계 갱신
  │   → 기존 고객이면 Section 4로, 워크인 신규면 Section 3으로
  │
  ├─ Section 3: 고객정보 입력 (조건부 — 워크인 신규만)
  │   - "다음 방문 때 편하게 도와드리려고 간단히 등록할게요 😊"
  │   - 이름 (필수) + 전화번호 (선택)
  │   - [등록하기] / [나중에 하기]
  │   - 3단계 매칭: 전화번호 → 이름 → 신규 생성
  │
  ├─ Section 4: 사진 저장
  │   - "시술 사진을 저장해볼까요? 😊"
  │   - "오늘 시술 기록으로 남겨둘게요 😊"
  │   - [📷 카메라 촬영] / [🖼 갤러리에서 선택]
  │   - 2열 미리보기 그리드 + 삭제 버튼
  │   - [사진 저장하기] / [건너뛰기]
  │   → portfolioStore.addPhoto(kind='treatment', isPublic=false)
  │   → record.imageUrls + customer.treatmentHistory.imageUrls 업데이트
  │
  └─ Section 5: 완료
      - ✅ 체크마크 + "결제가 완료되었어요!"
      - (사진 저장 시) "포트폴리오에 자동 저장됐어요"
      - [홈으로 가기] (primary) / [기록 보기] (outline)
      - consultation store reset()
```

---

## 2. 프로덕션 문서 대비 검증 결과

### 시술후-결제-UX-설계.md 대비

| # | 요구사항 | 결과 | 비고 |
|---|---------|------|------|
| 1 | "오늘 시술 내용이에요 😊" | ✅ PASS | L275 정확 일치 |
| 2 | "추가된 내용까지 반영된 최종 금액이에요 😊" | ✅ PASS | L292 정확 일치 |
| 3 | 디자인/기본선택/추가옵션/소요시간/최종금액 표시 | ✅ PASS | PaymentSummary + 뱃지 |
| 4 | "계산 화면이 아닌 정리 화면" 철학 | ✅ PASS | 항목별 내역 + 정리 문구 |
| 5 | 워크인 등록 문구 | ✅ PASS | L326 정확 일치 |
| 6 | "시술 사진을 저장해볼까요? 😊" | ✅ PASS | L376 정확 일치 |
| 7 | "오늘 시술 기록으로 남겨둘게요 😊" | ✅ PASS | 수정 완료 (이모지 추가) |
| 8 | "포트폴리오에 자동 저장돼요" | ⚠️ | "됐어요"로 과거시제 사용 — 맥락상 정확 |

### 디자인-고르기-현장모드-흐름도.md 대비

| # | STEP | 요구사항 | 결과 | 비고 |
|---|------|---------|------|------|
| 9 | 6 | Quick Add: 파츠/글리터/포인트/연장추가/기타 | ✅ PASS | 수정 완료 ("포인트 아트" → "포인트") |
| 10 | 8 | [결제하기] 버튼 | ✅ PASS | 수정 완료 ("결제 완료" → "결제하기") |
| 11 | 9 | 고객정보 입력 — 선택적, 강제 없음 | ✅ PASS | "나중에 하기" 존재 |
| 12 | 10 | 사진 저장 — [촬영하기]/[저장] | ⚠️ | "카메라 촬영"/"사진 저장하기" — 갤러리 선택 추가는 실용적 확장 |
| 13 | 11 | 자동 데이터화 — 포트폴리오 연결 | ✅ PASS | portfolioStore + treatmentHistory 연결 |

### 기능/데이터 검증

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 14 | recordId 없으면 /home 리다이렉트 | ✅ PASS | |
| 15 | 미확정 record → /home 리다이렉트 | ✅ PASS | |
| 16 | Section 잠금 (순차 진행) | ✅ PASS | |
| 17 | 회원권 결제 시 useMembershipSession | ✅ PASS | |
| 18 | 고객 매칭 3단계 (전화→이름→생성) | ✅ PASS | |
| 19 | 고객 통계 갱신 5필드 | ✅ PASS | |
| 20 | addPhoto(kind='treatment', isPublic=false) | ✅ PASS | |
| 21 | record.imageUrls 업데이트 | ✅ PASS | |
| 22 | consultation store reset | ✅ PASS | |

---

## 3. QA 중 발견 → 수정 완료된 이슈

| # | 이슈 | 수정 내용 |
|---|------|----------|
| 1 | "결제 완료" 버튼 라벨 — 문서 STEP 8 "[결제하기]" 불일치 | → "결제하기"로 변경 |
| 2 | `extraItems={[]}` 하드코딩 — 추가 옵션 미표시 | → `extraItems` prop 제거 (breakdown.items에 이미 포함) |
| 3 | Quick Add "포인트 아트" — 문서 "포인트" 불일치 | → "포인트"로 변경 |
| 4 | 사진 저장 sub 이모지 누락 | → 😊 추가 |
| 5 | handleSavePhotos try/catch 없음 | → try/catch/finally 추가 |
| 6 | label-input 접근성 미연결 | → htmlFor + id 추가 |
| 7 | "저장하기" 라벨 모호 | → "사진 저장하기"로 구체화 |

---

## 4. 잔여 Minor 이슈 → 전체 수정 완료

| # | 이슈 | 수정 내용 |
|---|------|----------|
| 1 | PaymentMethodSelector radio group 접근성 | ✅ `role="radiogroup"` + `role="radio"` + `aria-checked` + 이모지 `aria-hidden` 추가 |
| 2 | PaymentSummary 색상 대비 | ✅ `text-white/70` → `/90`, `text-white/50` → `/70`, inline gradient → Tailwind `bg-gradient-to-br` |
| 3 | 업로드 중 카메라/갤러리 미비활성 | ✅ `disabled={isUploading}` + `disabled:opacity-40 disabled:pointer-events-none` 추가 |
| 4 | Section 건너뛰기 복구 불가 | ✅ 완료 화면에 "시술 사진 추가하기" 링크 추가 (사진 미저장 시만 표시) |
| 5 | opacity 전환 dead code | ✅ 조건부 렌더링 + `animate-in fade-in duration-300`으로 통일 |
| 6 | inline style 위반 | ✅ 모든 `style={{ background: var(--color-*) }}` → Tailwind 클래스 (`bg-primary`, `bg-success`) |
| + | `hover:border-gray-300` 하드코딩 | ✅ → `hover:border-text-muted/40` |
| + | disabled 시 cursor 미변경 | ✅ `pointer-events-none` → `cursor-not-allowed` |
| + | SVG/이모지 aria-hidden 누락 | ✅ 체크마크 SVG + 카메라/갤러리 이모지에 `aria-hidden="true"` 추가 |

---

## 5. 수정된 파일 목록

| 파일 | 변경 |
|------|------|
| `src/app/(main)/payment/page.tsx` | "결제하기" 라벨, extraItems 수정, 이모지, try/catch, htmlFor, "사진 저장하기", inline style 제거, animate-in, 업로드 중 버튼 disabled, 사진 추가 복구 링크, aria-hidden |
| `src/components/payment/PaymentMethodSelector.tsx` | radiogroup 접근성, hover 색상, cursor-not-allowed, aria-hidden |
| `src/components/payment/PaymentSummary.tsx` | 색상 대비 개선, inline gradient → Tailwind |
| `src/app/consultation/treatment-sheet/page.tsx` | "포인트 아트" → "포인트" |
| `src/lib/price-utils.ts` | 변경 없음 (정상) |
| `docs/checklist.md` | 23. 시술 후 결제 UX 6항목 🟢 |
| `docs/detail.md` | 23번 상세 섹션 추가 |
| `production-docs/dev-list/payment-ux-qa.md` | QA 결과 + 플로우 정리 |
