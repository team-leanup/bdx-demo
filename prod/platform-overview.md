# 📐 BDX 플랫폼 전체 구조 참고

> 2026-04-19 현재 기준 상세 레퍼런스. 수정 작업 중 참조용.

## 🏗 기술 스택

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 strict |
| Styling | Tailwind CSS v4 (`@theme` 블록) |
| State | Zustand 5 |
| Animation | framer-motion 11 |
| Package Manager | **pnpm** only |
| Deployment | Vercel (`bdx-demo.vercel.app`) |
| Domain | `beauty-decision.com` |
| DB | Supabase (project `pzwmqorvrhdkckkdqemo`, ap-northeast-2) |

---

## 🗺 라우트/페이지 맵

### `src/app/(main)/` — 사장님 관리 화면 (항상 한국어)

| 경로 | 역할 |
|------|------|
| `home/page.tsx` | 홈 대시보드. TodayReservationCard + HeroCTA + ShareLinkCard + RecentConsultationCard |
| `records/page.tsx` | 예약 타임그리드 + 상담 기록. MonthCalendar / WeekCalendar / DayReservationList 전환 |
| `records/[id]/page.tsx` | 개별 상담 기록 상세 |
| `records/day/page.tsx` | 일별 예약 리스트 |
| `records/preconsult/[bookingId]/page.tsx` | 사전 상담 완료 내용 리뷰 |
| `customers/page.tsx` | 고객 목록 (태그 필터, 검색) |
| `customers/[id]/page.tsx` | 고객 상세 (MembershipCard + TreatmentPhotoCarousel + PreferenceEditor) |
| `dashboard/page.tsx` | KPI + 매출 차트 + 고객 분석 + 디자이너 퍼포먼스 |
| `settings/page.tsx` | 매장 정보, 서비스·요금, 테마, 디자이너 관리 |
| `payment/page.tsx` | 결제 처리 (→ records 리다이렉트) |
| `quick-sale/page.tsx` | 즉시 매출 등록 |
| `portfolio/page.tsx` | 포트폴리오 목록 |
| `portfolio/[id]/page.tsx` | 포트폴리오 단건 상세 + InstagramHashtags |
| `portfolio/upload/page.tsx` | 포트폴리오 사진 업로드 |

### `src/app/(auth)/` — 인증
| 경로 | 역할 |
|------|------|
| `splash/page.tsx` | 앱 시작 스플래시 + 자동 로그인 |
| `intro/page.tsx` | BDX 소개 슬라이드 |
| `login/page.tsx` | 이메일 + Google + 데모 로그인 |
| `signup/page.tsx` | 이메일 회원가입 |
| `signup/google/page.tsx` | Google OAuth 후속 프로필 |
| `terms/page.tsx` · `privacy/page.tsx` | 약관 / 개인정보 |

### `src/app/consultation/` — 현장 상담 (다국어 dual-language)
**STEP_ORDER**: `START → STEP1_BASIC → STEP2_DESIGN → CUSTOMER_INFO → SUMMARY`

| 경로 | 역할 |
|------|------|
| `page.tsx` | 진입점. 디자이너 선택 + 언어 선택 후 step1 |
| `step1/page.tsx` | 포트폴리오 선택 + 부위/오프/연장/쉐입 |
| `step2/page.tsx` | 시술 유형 (원컬러/그라데이션/마그네틱/아트) |
| `customer/page.tsx` | 고객 이름·전화 입력. CustomerInfoForm |
| `summary/page.tsx` | 최종 요약 + 저장 |
| `traits/page.tsx` | 고객 특성 태그 선택 (보조) |
| `canvas/page.tsx` | 손 일러스트 FingerCanvas (보조) |
| `treatment-sheet/page.tsx` | 시술 시트 뷰 |
| `save-complete/page.tsx` | 저장 완료 |

### `src/app/pre-consult/[shopId]/` — 고객 공유 링크 사전 상담
| 경로 | 역할 |
|------|------|
| `page.tsx` | 진입 랜딩. shopId로 샵 데이터 로드. ?bookingId / ?linkId 파라미터 처리 |
| `design/page.tsx` | Step 1: BodyPartToggle + CategoryPicker + DesignGallery |
| `consult/page.tsx` | Step 2: ReferenceUpload + NailStatusSelector + LengthSelector + ShapePickerSimple + VibeSelector + StyleSelector + AdditionalOptions |
| `confirm/page.tsx` | Step 3: 고객 이름·전화 + dbCompletePreConsultation 저장 → `/complete` |
| `complete/page.tsx` | "사전 상담 완료" 안내 |

### `src/app/field-mode/` — 현장 시술
| 경로 | 역할 |
|------|------|
| `page.tsx` | 포트폴리오 그리드 (카테고리 탭 + 정렬). 디자인 선택 → DesignConfirmSheet → treatment |
| `treatment/page.tsx` | 시술 타이머 + AddOnMiniPanel + 사전 상담 배너. 완료 → settlement |
| `settlement/page.tsx` | 결제 확인. calculatePreConsultPrice로 최종 금액 → 레코드 저장 |
| `wrap-up/page.tsx` | 시술 후 사진 촬영 + 기록 마무리 |

### 기타
| 경로 | 역할 |
|------|------|
| `app/page.tsx` | 루트 → /splash 리디렉트 |
| `qr/page.tsx` | QR 코드 생성 (qrcode.react + 로고) |
| `share/[shareCardId]/page.tsx` | 시술 결과 공유 카드 (서버 컴포넌트 + OG 메타) |
| `intro-demo/page.tsx` | 데모 소개 슬라이드 |
| `onboarding/*` | 신규 사장님 온보딩 (shop-info, pricing, portfolio-upload, surcharges, guide, notice, complete) |

---

## 🧩 주요 컴포넌트

### `src/components/home/`
| 파일 | 역할 |
|------|------|
| `ShareLinkCard.tsx` | `/pre-consult/{shopId}` URL 클립보드 복사 버튼 카드 (URL 미표시) |
| `HeroCTA.tsx` | "현장 시술 / 새 예약 / 즉시 매출" 3개 CTA |
| `TodayReservationCard.tsx` | 오늘 예약 목록 + 상담 시작 버튼 |
| `ReservationForm.tsx` | 예약 등록 모달 (날짜/시간/채널/메모) |
| `PreConsultationNotificationCenter.tsx` | 사전 상담 완료 알림 센터 |
| `QRGeneratorModal.tsx` | 모달 내 QR 생성 (/pre-consult 링크용) |
| `RevisitReminderCard.tsx` | 재방문 리마인더 |
| `RecentConsultationCard.tsx` | 최근 상담 기록 요약 |
| `TodayStatsCard.tsx` | 오늘 매출/상담 통계 |
| `QuickActions.tsx` | 빠른 접근 액션 |
| `ConsultationAlertBanner.tsx` | 상단 사전 상담 도착 배너 |
| `GreetingHeader.tsx` | 인사말 헤더 |

### `src/components/consultation/`
- `CustomerInfoForm.tsx` — 이름·전화 입력 (dual-language)
- `PriceSummaryBar.tsx` — 실시간 가격 계산 하단 바
- `ConsultationSummaryCard.tsx` — 최종 확인 카드

### `src/components/layout/`
- `AppShell.tsx` — StatusBar + BottomTabBar(mobile) + SideNav(lg) + 최대폭 래퍼
- `BottomTabBar.tsx` — 5탭 (홈/기록/고객/대시보드/설정)
- `StatusBar.tsx` — 상단 매장명 + 알림 벨 + 프로필 전환

### `src/components/share-card/`
- `ShareCardGeneratorModal.tsx` — 시술 결과 공유 카드 생성
- `ShareCardImageTemplate.tsx` — 카드 이미지 렌더링

---

## 🗄 Zustand 스토어 (16개)

| 파일 | 역할 |
|------|------|
| `auth-store.ts` | Supabase 인증, currentShopId, role, activeDesignerId. PBKDF2 PIN 해싱 |
| `consultation-store.ts` | 현장 상담 상태 (step, 옵션, 고객, 할인, 이미지). sessionStorage persist |
| `pre-consult-store.ts` | 고객 사전 상담 3단계 데이터 (shopId, design, consult, booking) |
| `field-mode-store.ts` | 현장 시술 phase 상태머신 (디자인→옵션→시술→정산→기록) |
| `reservation-store.ts` | 예약 목록 CRUD. hydrateFromDB(Supabase). 30초 폴링 |
| `records-store.ts` | 상담 기록 CRUD + 통계 집계 |
| `customer-store.ts` | 고객 CRUD + 태그/선호도 + **useMembershipSession** |
| `shop-store.ts` | 매장 정보 + 디자이너 CRUD |
| `app-store.ts` | shopSettings (서비스 가격표, 기타 설정) |
| `locale-store.ts` | 현재 locale. setConsultationLocale / restoreLocale |
| `consultation-link-store.ts` | 상담 링크 생성/관리 (슬롯 설정) |
| `portfolio-store.ts` | 포트폴리오 사진 CRUD + 업로드 |
| `parts-store.ts` | 캔버스 손 부위 선택 |
| `onboarding-store.ts` | 온보딩 단계 진행 |
| `onboarding-photo-store.ts` | 온보딩 중 사진 임시 저장 |
| `theme-store.ts` | 다크/라이트/커스텀 테마 |

---

## 🧰 핵심 라이브러리 (`src/lib/`)

| 파일 | 핵심 함수 |
|------|-----------|
| `phone.ts` | `normalizePhone` (정규화) / `formatPhoneInput` (실시간 하이픈 삽입) |
| `i18n.ts` | `useT()` / `useKo()` / `useLocale()` 훅 |
| `booking-stage.ts` | `getBookingStage`: 6단계 (just_registered → link_sent → pre_consult_done → in_treatment → completed) |
| `pre-consult-price.ts` | `calculatePreConsultPrice`: 디자인/제거/연장/addOn 가격 계산 |
| `reservation-readiness.ts` | 예약 준비 완료 판별 (ReadinessBadge) |
| `db.ts` | 모든 Supabase 조작 집결 (27K+ 토큰) |
| `consultation-link-slots.ts` | 상담 링크 가용 슬롯 계산 |
| `supabase.ts` | 브라우저 Supabase 클라이언트 |
| `supabase-server.ts` | 서버 Supabase 클라이언트 (Route Handler용) |

---

## 🗃 DB 스키마 (Supabase)

### 테이블 (11개)

**shops** — 매장. id, owner_id, name, phone, address, theme_id, business_hours(jsonb), base_hand_price, base_foot_price, logo_url, settings(jsonb), onboarding_completed_at

**designers** — 스태프. id, shop_id, name, role('owner'|'staff'), pin, is_active, phone

**customers** — 고객 마스터. id, shop_id, name, phone, assigned_designer_id, first_visit_date, last_visit_date, visit_count, total_spend, **membership(jsonb)**, preference(jsonb), treatment_history(jsonb), is_regular, preferred_language

**customer_tags** — 고객 태그. id, customer_id, shop_id, category, value, is_custom, pinned, accent, sort_order

**booking_requests** — 예약 요청. id, shop_id, customer_id, designer_id, customer_name, phone, reservation_date, reservation_time, channel(kakao/naver/phone/walk_in/pre_consult), status(pending/confirmed/completed/cancelled), deposit, **consultation_link_id**, consultation_link_sent_at, pre_consultation_data(jsonb), pre_consultation_completed_at, language, service_label, reference_image_urls

**consultation_records** — 완료된 상담 기록. id, shop_id, designer_id, customer_id, consultation(jsonb), total_price, final_price, estimated_minutes, **payment_method('cash'|'card'|'membership')**, pricing_adjustments, notes, image_urls, checklist, finalized_at, is_quick_sale, share_card_id, language

**consultation_links** — 사전 상담 공유 링크. id, shop_id, designer_id, title, description, status, valid_from, valid_until, expires_at, slot_interval_min, estimated_duration_min, booking_count

**portfolio_photos** — 포트폴리오. id, shop_id, customer_id, record_id, kind, image_path, image_data_url, is_public, is_featured, style_category, design_type, service_type, color_labels, tags, price, taken_at

**pre_consultations** — 사전 상담 폼 응답. id, shop_id, booking_id, customer_id, language, status, data(jsonb), design_category, confirmed_price, estimated_minutes, reference_image_paths, customer_name, customer_phone, expires_at (30일)

**membership_transactions** — 회원권 이력 (현재 rows=0). id, shop_id, customer_id, record_id, date, type('purchase'|'use'|'refund'|'adjust'), sessions_delta, note

**small_talk_notes** — 스몰토크 메모. id, customer_id, consultation_record_id, note_text, created_by_designer_id, created_by_designer_name

### RPC 함수 (9개)

| 함수 | 시그니처 | 역할 |
|------|----------|------|
| `create_shop_account` | (p_shop_id, p_shop_name, p_owner_name, p_user_id?) | SECURITY DEFINER. 신규 가입 시 shops+designers 동시 생성 |
| `get_my_shop_id` | () → TEXT | 현재 인증 유저의 shop_id (RLS 헬퍼) |
| `get_consultation_link_public` | (p_link_id) → Json | 비인증 고객이 링크 진입 시 공개 데이터 조회 |
| `get_shop_pre_consult_data` | (p_shop_id) → Json | 링크 ID 없이 샵 ID만으로 진입 |
| `complete_preconsultation_for_booking` | (target_booking_id, payload, completed_at, linked_customer_id?) | booking_requests pre_consult 원자적 업데이트 |
| `increment_consultation_link_booking` | (p_link_id) | 예약 생성 시 booking_count +1 |
| `touch_consultation_links_updated_at` | - | trigger |
| `rls_auto_enable` | - | RLS 자동 활성화 |

### Storage 버킷
- `designer-profile-images`
- `portfolio-images`
- `pre-consult-refs`

**⚠️ 모두 public listing 허용 중** — 보안 advisor 경고 있음

---

## 🛠 주요 개발 커맨드

```bash
pnpm dev              # 개발 서버 (turbopack)
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint
npx tsc --noEmit      # 타입 체크
npx vercel --prod     # Vercel 프로덕션 배포
```

## 🚨 빌드 전 체크
```bash
pnpm lint && npx tsc --noEmit && pnpm build
```

## 🐛 알려진 이슈

### .next 캐시 손상
```bash
pkill -f "next" && rm -rf .next && pnpm dev
```

### SVG 내 텍스트 다국어
SVG `<text>`는 동적 크기 불가 → HTML 오버레이 뱃지 사용 (OffSelector 참고)

---

## 📚 관련 문서

| 문서 | 용도 |
|------|------|
| `docs/checklist.md` | 전체 개발 체크리스트 (BUG-#, 카테고리별) |
| `docs/detail.md` | 기능 상세 명세 + 히스토리 |
| `docs/prd.md` | 제품 요구사항 |
| `docs/user-flow.md` · `docs/ux-flow.md` | 사용자 플로우 |
| `docs/qa-production.md` | 프로덕션 QA 추적 |
| `docs/qa-deep-20260417.md` (+round2) | 2026-04-17 심층 QA 결과 (133건) |
| `CLAUDE.md` | Claude Code 작업 지침 |
