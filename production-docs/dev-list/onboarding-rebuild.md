# 온보딩 리빌드 — 개발 기록

> 기준 문서: `production-docs/온보딩-최종-흐름도.md`
> 작업일: 2026-03-31

---

## 플로우 구조

```
START → STEP1(기본정보) → STEP2(포트폴리오업로드) → STEP3(포트폴리오정리)
→ STEP4(가격&시간) → STEP5(추가비용) → STEP6(고객안내문구) → END(완료)
```

| 스텝 | 라우트 | 상태 | 설명 |
|------|--------|------|------|
| START | `/onboarding` | ✅ 완료 | 3분 완료 안내 + 6단계 프리뷰 + CTA |
| STEP 1 | `/onboarding/shop-info` | ✅ 완료 | 샵 이름 + 연락처 (간소화) |
| STEP 2 | `/onboarding/portfolio-upload` | ✅ 완료 | 사진 가이드 + 멀티 업로드 + 격려 문구 |
| STEP 3 | `/onboarding/portfolio-classify` | ✅ 완료 | 카드 분류 + 대표 디자인 선택 |
| STEP 4 | `/onboarding/pricing` | ✅ 완료 | 카테고리별 가격/시간 (심플/프렌치/자석/아트) |
| STEP 5 | `/onboarding/surcharges` | ✅ 완료 | 제거/연장/추가옵션 3섹션 |
| STEP 6 | `/onboarding/notice` | ✅ 완료 | 고객 안내 문구 + 미리보기 |
| END | `/onboarding/complete` | ✅ 완료 | 완료 카드 3개 + CTA 2개 |

---

## 변경 파일 목록

### 신규 생성
| 파일 | 설명 |
|------|------|
| `src/app/onboarding/portfolio-upload/page.tsx` | STEP 2 — 포트폴리오 업로드 |
| `src/app/onboarding/portfolio-classify/page.tsx` | STEP 3 — 포트폴리오 정리 + 대표 선택 |
| `src/app/onboarding/notice/page.tsx` | STEP 6 — 고객 안내 문구 |
| `src/store/onboarding-photo-store.ts` | 온보딩 사진 메모리 스토어 (Zustand) |

### 수정
| 파일 | 변경 내용 |
|------|----------|
| `src/app/onboarding/layout.tsx` | STEPS 배열 8라우트로 교체 |
| `src/app/onboarding/page.tsx` | START 리디자인 |
| `src/app/onboarding/shop-info/page.tsx` | 주소/영업시간 제거, 간소화 |
| `src/app/onboarding/pricing/page.tsx` | 카테고리별 가격/시간 재설계 |
| `src/app/onboarding/surcharges/page.tsx` | 3섹션 간소화 |
| `src/app/onboarding/complete/page.tsx` | 포트폴리오 중심 완료 화면 + DB 배치 커밋 |
| `src/types/portfolio.ts` | StyleCategory + isFeatured 추가 |
| `src/types/shop.ts` | CategoryPricingSettings + customerNotice 추가 |
| `src/types/database.ts` | portfolio_photos 테이블 새 컬럼 반영 |
| `src/store/app-store.ts` | categoryPricing, customerNotice DB 연동 |
| `src/lib/db.ts` | toPortfolioPhoto + dbBatchInsertPortfolioPhotos |
| `src/app/intro-demo/page.tsx` | 구 라우트 참조 업데이트 |
| `docs/user-flow.md` | 온보딩 플로우 테이블 업데이트 |

### 삭제
| 파일 | 사유 |
|------|------|
| `src/app/onboarding/services/` | 서비스 선택 스텝 제거 |
| `src/app/onboarding/time/` | 시술 시간 스텝 → pricing에 통합 |
| `src/app/onboarding/theme/` | 테마 선택 → 설정으로 이동 |

---

## 백엔드 / API

### DB 마이그레이션
```sql
ALTER TABLE portfolio_photos
  ADD COLUMN style_category text CHECK (style_category IN ('simple','french','magnet','art')),
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
```

### 데이터 저장 흐름
| 데이터 | 저장 위치 | 시점 |
|--------|----------|------|
| 샵 이름, 연락처 | `shops` 테이블 | 완료 페이지 커밋 |
| 카테고리별 가격/시간 | `shops.settings` JSON | 완료 페이지 커밋 |
| 추가 비용 설정 | `shops.settings` JSON | 완료 페이지 커밋 |
| 고객 안내 문구 | `shops.settings` JSON | 완료 페이지 커밋 |
| 포트폴리오 사진 | Supabase Storage + `portfolio_photos` | 완료 페이지 배치 업로드 |
| onboardingCompletedAt | `shops` 테이블 | 완료 페이지 커밋 |

### 신규 DB 함수
- `dbBatchInsertPortfolioPhotos(photos, onProgress?)` — 순차 업로드 + 진행 콜백

---

## QA 체크리스트

| # | 항목 | 결과 |
|---|------|------|
| 1 | START → shop-info 라우팅 | ✅ |
| 2 | shop-info 간소화 (이름+연락처만) | ✅ |
| 3 | shop-info → portfolio-upload 라우팅 | ✅ |
| 4 | 사진 업로드 (멀티, 최대 20장) | ✅ |
| 5 | 사진 X 삭제 버튼 (모바일 표시) | ✅ |
| 6 | 격려 문구 단계별 변경 | ✅ |
| 7 | 3장 미만 시 "다음" 비활성화 | ✅ |
| 8 | portfolio-classify 사진 표시 | ✅ |
| 9 | 카드 분류 UI (4버튼 + 건너뛰기) | ✅ |
| 10 | 대표 디자인 선택 (3~5개) | ✅ |
| 11 | 가격&시간 카테고리별 기본값 | ✅ |
| 12 | 추가비용 3섹션 (제거/연장/옵션) | ✅ |
| 13 | 고객 안내 문구 미리보기 | ✅ |
| 14 | 글자 수 카운터 (120자) | ✅ |
| 15 | 완료 페이지 3개 카드 | ✅ |
| 16 | "고객 화면 보기" CTA | ✅ |
| 17 | "현장모드 시작" CTA | ✅ |
| 18 | 프로그레스 바 7세그먼트 | ✅ |
| 19 | 뒤로가기 네비게이션 | ✅ |
| 20 | 빌드 통과 (tsc + build) | ✅ |

---

## 심리 UX 적용 현황

| 스텝 | 심리 원칙 | 적용 문구 |
|------|----------|----------|
| START | 부담 제거 | "3분만에 준비하고 바로 시작해볼게요" |
| STEP 1 | 의미 부여 | "고객과 연결되는 기본 정보예요" |
| STEP 2 | Goal Gradient | 0장→"사진이 많을수록..." / 10+→"완벽해요!" |
| STEP 3 | 부담 제거 | "대략적으로만 선택해도 괜찮아요" |
| STEP 4 | Anchoring | "시작 기준이에요, 상황에 따라 달라질 수 있어요" |
| STEP 5 | Cognitive Load 최소화 | "간단하게만 설정해도 충분해요" |
| STEP 6 | 신뢰 형성 | "이 문구는 설정에서 언제든 수정할 수 있어요" |
| END | Peak-End Rule | "이제 상담이 훨씬 쉬워질 거예요" |
