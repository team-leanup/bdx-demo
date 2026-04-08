# 미리 정하기 (Pre-Consult) — 개발 리스트 & QA 결과

> 작성일: 2026-04-03
> 기준 문서: `production-docs/미리-정하기-UX-흐름도.md`

---

## 1. 구현 완료 항목 (30개 태스크)

### Phase 1: 타입 + DB

| 태스크 | 파일 | 상태 |
|--------|------|------|
| T-01 타입 정의 | `src/types/pre-consultation.ts` | ✅ |
| T-02 BookingChannel 확장 | `src/types/consultation.ts` | ✅ |
| T-03 DB 마이그레이션 | `supabase/migrations/20260403_create_pre_consultations.sql` | ✅ (수동 적용 필요) |
| T-04 Storage 버킷 | `pre-consult-refs` | ✅ (수동 생성 필요) |

### Phase 2: 스토어 + 가격 계산

| 태스크 | 파일 | 상태 |
|--------|------|------|
| T-05 Zustand 스토어 | `src/store/pre-consult-store.ts` | ✅ |
| T-06 가격 계산 | `src/lib/pre-consult-price.ts` | ✅ |
| T-07 DB 함수 | `src/lib/db.ts` (6개 함수 추가) | ✅ |

### Phase 3: i18n

| 태스크 | 파일 | 상태 |
|--------|------|------|
| T-08 한국어 | `src/lib/i18n.ts` preConsult 네임스페이스 | ✅ |
| T-09 en/zh/ja | 동일 파일 3개 언어 | ✅ |

### Phase 4: 레이아웃 + STEP 0

| 태스크 | 파일 | 상태 |
|--------|------|------|
| T-10 Layout | `src/app/pre-consult/[shopId]/layout.tsx` + `PreConsultClientLayout.tsx` | ✅ |
| T-11 ProgressBar | `src/components/pre-consult/PreConsultProgressBar.tsx` | ✅ |
| T-12 시작 페이지 | `src/app/pre-consult/[shopId]/page.tsx` | ✅ |
| T-13 Not Found | `src/app/pre-consult/[shopId]/not-found.tsx` | ✅ |

### Phase 5: STEP 1 디자인 선택

| 태스크 | 파일 | 상태 |
|--------|------|------|
| T-14 CategoryPicker | `src/components/pre-consult/CategoryPicker.tsx` | ✅ |
| T-15 DesignGallery | `src/components/pre-consult/DesignGallery.tsx` | ✅ |
| T-16 PriceRangeHint | `src/components/pre-consult/PriceRangeHint.tsx` | ✅ |
| T-17 design/page | `src/app/pre-consult/[shopId]/design/page.tsx` | ✅ |

### Phase 6: STEP 2 스마트 상담

| 태스크 | 파일 | 상태 |
|--------|------|------|
| T-18 ReferenceUpload | `src/components/pre-consult/ReferenceUpload.tsx` | ✅ |
| T-19 NailStatusSelector | `src/components/pre-consult/NailStatusSelector.tsx` | ✅ |
| T-20 LengthSelector | `src/components/pre-consult/LengthSelector.tsx` | ✅ |
| T-21 ShapePickerSimple | `src/components/pre-consult/ShapePickerSimple.tsx` | ✅ |
| T-22 VibeSelector | `src/components/pre-consult/VibeSelector.tsx` | ✅ |
| T-23 StyleSelector | `src/components/pre-consult/StyleSelector.tsx` | ✅ |
| T-24 AdditionalOptions | `src/components/pre-consult/AdditionalOptions.tsx` | ✅ |
| T-25 ConsultReview | `src/components/pre-consult/ConsultReview.tsx` | ✅ |
| T-26 consult/page | `src/app/pre-consult/[shopId]/consult/page.tsx` | ✅ |

### Phase 7-8: STEP 3-4

| 태스크 | 파일 | 상태 |
|--------|------|------|
| T-27 confirm/page | `src/app/pre-consult/[shopId]/confirm/page.tsx` | ✅ |
| T-28 complete/page | `src/app/pre-consult/[shopId]/complete/page.tsx` | ✅ |

### Phase 9: QA + 문서

| 태스크 | 상태 |
|--------|------|
| T-29 전체 플로우 QA | ✅ |
| T-30 문서 업데이트 | ✅ |

---

## 2. UX 흐름도 대조 검증 결과

### ✅ 일치 항목 (21개)

| 스펙 항목 | 구현 상태 |
|-----------|-----------|
| STEP 0: 시작 버튼 "시작하기" | 정확히 일치 |
| STEP 0: 샵 이름 + "에서 보내드렸어요" | 일치 |
| STEP 0: 언어 선택 (ko/en/zh/ja) | 일치 |
| STEP 1: 4개 카테고리 (심플/프렌치/자석/아트) | 정확히 일치 |
| STEP 1: 디자인 선택 후 안심 문구 3종 | 일치 (emoji 추가 완료) |
| STEP 1: "이 디자인으로 할게요" 버튼 | 정확히 일치 |
| STEP 1: 예상 가격 범위 표시 (확정가 아님) | 일치 |
| STEP 2: 순차 reveal (한 번에 다 안 보임) | 일치 |
| STEP 2: 분기 구조 (네일 상태 → 제거, 연장 → 길이) | 일치 |
| STEP 2: "기존 네일이 있으시군요 😊" 전환 문구 | 일치 (수정 완료) |
| STEP 2: 느낌 4종 (자연/프렌치/트렌디/화려) | 정확히 일치 |
| STEP 2: 스타일 단일→복수 선택 구조 | 일치 |
| STEP 2: 추가 옵션 선택 시에만 가격 표시 | 일치 |
| STEP 2: 피로 관리 문구 30%/60%/80% | 근사 일치 |
| STEP 2: "선택하신 내용이에요" + 수정/진행 버튼 | 정확히 일치 |
| STEP 3: "오늘 디자인이 정리되었어요 😊" | 일치 |
| STEP 3: 확정 가격 + "추가금 없이" 안심 | 일치 |
| STEP 3: 동의 체크박스 없음 | 준수 |
| STEP 3: 이름/연락처 + "이대로 예약하기" | 정확히 일치 |
| STEP 4: "예약이 완료되었어요 😊" | 일치 |
| STEP 4: 자동 저장 안내 문구 | 정확히 일치 |

### ⚠️ 수정 완료 항목 (9개)

| 이슈 | 스펙 | 수정 내용 |
|------|------|-----------|
| heroTitle 불일치 | "방문 전에 미리 선택하시면..." | 스펙 문구로 교체 (4개 언어) |
| heroSub 불일치 | "편하게 선택해주시면 되고..." | 스펙 문구로 교체 (4개 언어) |
| designSub 불일치 | "선택하신 기준으로 상담과 금액이 안내돼요" | 스펙 문구로 교체 |
| 전환 문구 누락 | "기존 네일이 있으시군요 😊" | NailStatusSelector에 추가 |
| ConsultReview 하드코딩 | "수정" 등 한국어 하드코딩 | i18n 키로 교체 |
| priceDisclaimer | "손톱 상태에 따라..." | 스펙 문구로 교체 |
| 이모지 누락 | 15개 안심 문구에 😊 없음 | 모두 추가 |
| midMsg 톤 불일치 | 응원 톤 → 부담 해소 톤 | 스펙 예시로 교체 |
| reassurance3 불일치 | "요즘 많이 하세요 😊" | 스펙 문구로 교체 |

---

## 3. 브라우저 QA 결과

**테스트 환경**: localhost:3000, shop-demo, Chrome

| 단계 | 테스트 항목 | 결과 | 비고 |
|------|------------|------|------|
| STEP 0 | 시작 페이지 렌더링 | ✅ PASS | 샵 이름, 히어로 문구, 언어 선택, 시작 버튼 |
| STEP 0 | 언어 전환 (English) | ✅ PASS | 전체 텍스트 영어로 즉시 전환 |
| STEP 1 | 카테고리 선택 | ✅ PASS | 4개 카드 정상 렌더링 |
| STEP 1 | 포트폴리오 없을 때 | ✅ PASS (수정) | skip 버튼 추가하여 진행 가능 |
| STEP 2 | 순차 reveal | ✅ PASS | 8개 섹션 순차 노출 + 자동 스크롤 |
| STEP 2 | 분기 구조 | ✅ PASS | 네일 상태/연장 분기 정상 |
| STEP 2 | 피로 관리 문구 | ✅ PASS | 3개 지점에서 표시 |
| STEP 3 | 가격 표시 | ✅ PASS | breakdown + 총액 정상 |
| STEP 3 | 네일 모양 라벨 | ✅ PASS (수정) | raw enum → 번역된 라벨 |
| STEP 3 | 예약 폼 | ✅ PASS | 이름/연락처 입력 + 제출 |
| STEP 4 | 완료 애니메이션 | ✅ PASS | 체크마크 + 문구 표시 |
| 404 | 잘못된 shopId | ✅ PASS | 404 페이지 정상 표시 |
| 스크롤 | 라우트 전환 시 리셋 | ✅ PASS (수정) | contentRef.scrollTo(0,0) 추가 |

### 수정한 QA 버그 3건

| 버그 | 증상 | 수정 |
|------|------|------|
| BUG-1 | 포트폴리오 없으면 디자인 페이지에서 진행 불가 | DesignGallery에 `onSkip` prop 추가, 빈 상태에서 "다음으로" 버튼 표시 |
| BUG-2 | confirm 페이지 네일 모양이 "round"로 표시 | `labels.shape[nailShape]`로 번역된 라벨 사용 |
| BUG-3 | 클라이언트 네비게이션 시 스크롤 미리셋 | PreConsultClientLayout에 `usePathname` 기반 스크롤 리셋 추가 |

---

## 4. 진입점 현황 & 검토

### 현재 상태 (✅ 모두 연결 완료)

| 진입 경로 | URL 타겟 | 상태 |
|-----------|----------|------|
| 홈 "미리 정하기" QR 버튼 | `/pre-consult/[shopId]` | ✅ 연결 완료 |
| 홈 "링크 복사" 버튼 | `/pre-consult/[shopId]` | ✅ 연결 완료 |
| 예약 목록 "미리 정하기 링크" 모달 | `/pre-consult/[shopId]` | ✅ 연결 완료 |
| 직접 URL | `/pre-consult/[shopId]` | ✅ 정상 작동 |

### 변경 사항
- QR 모달: `/consultation?entry=customer-link` → `/pre-consult/[shopId]`
- HeroCTA 링크 복사: 동일 경로 변경
- ConsultationLinkModal: 동일 경로 변경 (shopId 없으면 기존 경로 폴백)
- 라벨: "QR 생성" → "미리 정하기" (4개 언어)
- 모달 제목: "상담 링크 QR" → "미리 정하기 QR"

### 기존 현장 상담 플로우
- `/consultation?entry=customer-link` 경로는 매장 내 태블릿 현장 상담용으로 계속 유지
- "현장 시술" 버튼(HeroCTA)은 `/field-mode`로 이동하며 변경 없음

---

## 5. 파일 목록

### 신규 생성 (23개)

```
src/types/pre-consultation.ts
src/store/pre-consult-store.ts
src/lib/pre-consult-price.ts
supabase/migrations/20260403_create_pre_consultations.sql

src/app/pre-consult/[shopId]/layout.tsx
src/app/pre-consult/[shopId]/PreConsultClientLayout.tsx
src/app/pre-consult/[shopId]/page.tsx
src/app/pre-consult/[shopId]/not-found.tsx
src/app/pre-consult/[shopId]/design/page.tsx
src/app/pre-consult/[shopId]/consult/page.tsx
src/app/pre-consult/[shopId]/confirm/page.tsx
src/app/pre-consult/[shopId]/complete/page.tsx

src/components/pre-consult/PreConsultProgressBar.tsx
src/components/pre-consult/CategoryPicker.tsx
src/components/pre-consult/DesignGallery.tsx
src/components/pre-consult/PriceRangeHint.tsx
src/components/pre-consult/ReferenceUpload.tsx
src/components/pre-consult/NailStatusSelector.tsx
src/components/pre-consult/LengthSelector.tsx
src/components/pre-consult/ShapePickerSimple.tsx
src/components/pre-consult/VibeSelector.tsx
src/components/pre-consult/StyleSelector.tsx
src/components/pre-consult/AdditionalOptions.tsx
src/components/pre-consult/ConsultReview.tsx
src/components/pre-consult/FatigueMessage.tsx
```

### 수정 (9개)

```
src/types/consultation.ts          — BookingChannel 확장
src/types/database.ts              — pre_consultations 테이블 타입
src/lib/db.ts                      — 6개 DB 함수 추가
src/lib/i18n.ts                    — preConsult 네임스페이스 + generateQR 라벨 변경
src/middleware.ts                   — /pre-consult 공개 라우트
src/components/home/QRGeneratorModal.tsx     — pre-consult 경로 + 라벨 변경
src/components/home/HeroCTA.tsx              — 링크 복사 경로 + 라벨 변경
src/components/reservations/ConsultationLinkModal.tsx — pre-consult 경로 연결
docs/checklist.md + docs/detail.md — 문서 업데이트
```

---

## 6. Supabase 수동 적용 필요 항목

### DB 마이그레이션
```sql
-- supabase/migrations/20260403_create_pre_consultations.sql 참조
-- Supabase Dashboard > SQL Editor에서 실행
```

### Storage 버킷
```
Supabase Dashboard > Storage > New bucket
이름: pre-consult-refs
공개: No (서명 URL 사용)
파일 크기 제한: 5MB
허용 MIME: image/jpeg, image/png, image/webp
```

---

## 7. 빌드 검증

| 검증 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 에러 없음 |
| `pnpm lint` | ✅ 신규 경고 없음 |
| `pnpm build` | ✅ 5개 라우트 모두 빌드 성공 |
| 브라우저 QA | ✅ 12개 항목 모두 PASS |
