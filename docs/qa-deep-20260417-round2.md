# BDX 전수조사 (Round 2) — 2026-04-17

> 4개 병렬 에이전트 동시 조사. Round 1(66건) + Round 2(77건) = **총 133건 발견**.
> 이 문서는 Round 2에서 **새로 발견된 논리 모순·엣지케이스·권한·i18n 문제 77건**.

---

# 🔴 추가 CRITICAL 발견

## C-New-1. `create_shop_account` RPC에 `p_user_id` 파라미터 주입 가능 — 타인 계정으로 샵 생성
**파일**: `src/lib/db.ts:224~229`, DB RPC `create_shop_account` (4인자 버전)

```sql
v_user_id := COALESCE(p_user_id, auth.uid()::text);
```

클라이언트가 임의 `p_user_id`를 전달하면 **다른 사용자의 ID로 샵 + owner designer를 생성 가능**. `auth.users` 존재만 확인하고 그 user에 shop이 없으면 통과. 타인 계정 탈취 경로.

**조치**: 4인자 RPC 삭제 → 3인자만 유지. 클라이언트에서 `p_user_id` 제거.

## C-New-2. `complete_preconsultation_for_booking` RPC에 shop_id 검증 없음
**파일**: DB RPC

```sql
UPDATE booking_requests SET ... WHERE id = target_booking_id;  -- shop_id 조건 없음
```

익명 사용자가 타 샵의 bookingId를 넣어 **다른 샵 예약의 `pre_consultation_data` · `customer_id`를 임의 조작 가능**.

**조치**: WHERE 절에 shop_id 조건 추가.

## C-New-3. Storage 버킷 3개 모두 경로 소유권 검증 없음
**파일**: DB storage policies

`portfolio-images`, `designer-profile-images`, `pre-consult-refs` 세 버킷 모두 `bucket_id = '...'` 만 체크 → 인증된 누구든 **타 샵 경로에 파일 업로드·삭제 가능**.

**조치**: `(storage.foldername(name))[1] = get_my_shop_id()` 조건 추가.

## C-New-4. 로그아웃 시 `consultation_customer_memo` sessionStorage 미삭제
**파일**: `src/store/auth-store.ts:411~418`

로그아웃 시 `bdx-consultation`, `bdx-field-mode`는 삭제하지만 `consultation_customer_memo`(고객 스몰토크 메모)는 남음. 다른 계정 로그인 후 상담 진행하면 **이전 계정의 고객 메모가 새 상담에 표시됨**. 개인정보 누수.

## C-New-5. 세션 만료(JWT 1시간) 시 상담 저장 RLS 401 에러 사용자 알림 없음
**파일**: `src/components/SupabaseProvider.tsx:24~29`

`SIGNED_OUT`/`SIGNED_IN`만 처리, `TOKEN_REFRESHED` 누락. 1시간 이상 상담 중 저장 시도하면 클라이언트만 저장 성공으로 보이고 **DB에는 없는 유령 레코드 상태**가 됨.

---

# 🟠 HIGH 추가 (주요 18건)

## H-New-1. field-mode settlement에서 할인·예약금 **데이터 손실**
**파일**: `src/app/field-mode/settlement/page.tsx:173~191`
`finalPrice = subtotal - discount - deposit` 계산 후 최종값만 저장. `discountPercent`, `depositApplied` 값이 `consultation_records`에 기록되지 않아 나중에 **"왜 이 가격이었는지" 역산 불가**.

## H-New-2. field-mode wrap-up에서 고객 나중 연결 시 visit_count 증가 누락
`addQuickSaleRecord`가 customerId 없이 실행되면 통계 업데이트 스킵. 이후 wrap-up에서 고객 연결해도 `updateRecord(customerId)`만 호출하고 `recordTreatmentCompletion`은 호출 안 함 → **방문·매출 통계가 이 고객에 반영되지 않음**.

## H-New-3. records/page "결제 완료" 버튼이 payment page 건너뜀
**파일**: `src/app/(main)/records/page.tsx:1168~1191`
`updateRecord({ finalizedAt })` + `recordTreatmentCompletion()`만 호출. `paymentMethod` 미기록, 포트폴리오 사진 미추가, 멤버십 미차감.

## H-New-4. switchToDesigner 후 이전 상담이 **잘못된 디자이너로 저장**
**파일**: `src/store/auth-store.ts:432~436`
auth-store의 `activeDesignerId`만 바뀌고 `consultation-store.designerId`는 이전 값 유지. summary 저장 시 `consultation.designerId`가 우선되어 **이전 디자이너 이름으로 레코드 기록**.

## H-New-5. `extraColorPerUnit` 설정값이 항상 무시됨
**파일**: `src/lib/price-calculator.ts:63`
샵 설정에 별도 저장돼도 `buildServicePricingFromShopSettings`가 하드코딩 `3000원`을 사용. 커스텀 컬러 단가 설정이 **상담 가격 계산에 영원히 반영 안 됨**.

## H-New-6. `monthlyTargetRevenue` DB 저장 안 됨
**파일**: `src/store/app-store.ts`, `src/lib/db.ts:959`
`setShopSettings`가 DB에 쓸 때 `ShopExtendedSettings` 타입에 이 필드가 없어 **localStorage에만 저장**. 시크릿/새 기기에서 사라짐.

## H-New-7. 데모 쿠키 직접 설정으로 전체 인증 우회
**파일**: `src/middleware.ts:52~55`
DevTools에서 `document.cookie='bdx-demo=true'` 설정만으로 미들웨어·auth-store 모두 통과 → **Supabase 인증 없이 owner 권한으로 shop-demo 전체 쓰기 가능**.

## H-New-8. staff RLS 허점 — 다른 디자이너 레코드 수정·삭제 가능
`consultation_records_shop_isolation` 정책이 `shop_id = get_my_shop_id()`만 체크. **staff A가 staff B의 상담 기록 수정·삭제 가능**.

## H-New-9. staff RLS — 디자이너 추가/삭제 API 차단 없음
`designers` 정책도 shop_id만 체크. staff가 DB 직접 호출로 디자이너 생성·삭제 가능.

## H-New-10. consultation-store/field-mode-store sessionStorage 탭 종료 시 동시 소실 → **고아 레코드**
field-mode settlement 직후 wrap-up 전 탭이 닫히면 `recordId`를 담은 sessionStorage가 사라짐. records-store(localStorage)에는 레코드가 있지만 **고객/사진 연결 영원히 불가**.

## H-New-11. 태그 upsert의 backup restore 실패 시 **전체 태그 소실**
**파일**: `src/lib/db.ts:843~891`
delete → insert 실패 → retry 실패 → restore 시도도 같은 네트워크 환경이라 실패 → 고객 태그 전부 삭제.

## H-New-12. summary Toast 에러 메시지 10건 한국어 하드코딩
**파일**: `src/app/consultation/summary/page.tsx:112, 118, 125, ...`
`'상담 저장에 실패했어요. 다시 시도해주세요'` 등 10개 Toast가 i18n 없이 하드코딩. **customer_link 외국인 고객 경로에도 한국어 노출**.

## H-New-13. ConsultReview.tsx 8개 라벨 한국어 하드코딩
**파일**: `src/components/pre-consult/ConsultReview.tsx:221,228,...`
`label="현재 네일"`, `"길이"`, `"모양"`, `"랩핑"`, `"분위기"`, `"스타일"`, `"키워드"`, `"추가 옵션"` 모두 i18n 미적용. pre-consult → review 외국인 고객 화면.

## H-New-14. EmptyState/ErrorState/OfflineState 기본값 한국어 하드코딩
**파일**: `src/components/ui/EmptyState.tsx:181~211`
`'오류가 발생했습니다'`, `'다시 시도'`, `'인터넷 연결 없음'` 하드코딩. consultation 플로우에서 렌더 시 외국인에게 한국어 노출.

## H-New-15. pre-consult 레이아웃 safe-area inset 누락
**파일**: `src/app/pre-consult/[shopId]/PreConsultClientLayout.tsx:52~66`
iPhone notch/Dynamic Island에서 UI 잘림. `treatment-sheet`는 올바르게 처리했으나 pre-consult는 안 됨.

## H-New-16. 전화번호 중복 고객 생성 방지 **LocalStore 검색만**, DB UNIQUE 없음
`customers.phone`에 UNIQUE constraint 없음. 여러 경로에서 고객 생성되며 walk-in 자동 생성 시 이름 기반 매칭으로 **동명이인 잘못 연결** 위험.

## H-New-17. 저장 완료 후 뒤로가기로 summary 재접근 시 **이중 저장**
**파일**: `src/app/consultation/summary/page.tsx:391~401`
`setTimeout(reset, 0)` 지연 중 뒤로가기 → store 그대로 → 저장 버튼 재클릭 가능 → 동일 상담 레코드 2개.

## H-New-18. 사전상담 confirm 버튼 연타 방지 **불완전**
**파일**: `src/app/pre-consult/[shopId]/confirm/page.tsx:194~208`
`isSubmitted` 만 체크, `isSubmitting` 체크 누락. 빠른 더블탭 시 **중복 INSERT**.
→ **이번 수정에서 해결됨** ✅

---

# 🟡 MED 추가 (주요 15건 요약)

| # | 내용 | 파일 |
|---|------|------|
| M-N1 | 사전상담 완료 시 customer.preference 자동 매핑이 customer_link flow에서 **스킵** | consultation/summary/page.tsx:367 |
| M-N2 | customer_link + bookingId에서 **selectedTraitValues 태그 저장 누락** | consultation/summary/page.tsx:184 |
| M-N3 | finalizedAt 있으나 booking.status='pending' **UI/DB 불일치** | booking-stage.ts:22 |
| M-N4 | `isRegular` 판정 기준 이원화 (수동 vs visitCount>=5) | analytics.ts:211 |
| M-N5 | 디자이너 비활성화 후 합계 **전체 매출 ≠ 디자이너별 매출 합** | analytics.ts:308 |
| M-N6 | 상담 저장 중 페이지 이탈 시 booking RPC 실패해도 **record DB에 남음** | summary/page.tsx:198 |
| M-N7 | 공유카드 모달 재오픈 시 `shareCardId` **race로 중복 생성** 가능 | ShareCardGeneratorModal.tsx:137 |
| M-N8 | 사진 0장 레코드에서도 **공유카드 URL 생성됨** | ShareCardGeneratorModal.tsx:136 |
| M-N9 | `reservation_time='미정'` 정렬 시 localeCompare로 **한글이 맨 끝** | reservation-store.ts:143 |
| M-N10 | 포트폴리오 업로드 연타 ref 뮤텍스 없어 **중복 업로드** | UploadPhotoForm.tsx:222 |
| M-N11 | 여러 탭 동시 저장 시 localStorage persist **덮어쓰기** | records-store.ts:243 |
| M-N12 | `customerId=''`일 때 storage path **이중 슬래시** | wrap-up/page.tsx:198 |
| M-N13 | `designerId=''` 빈 문자열 상담 저장 가능 | summary/page.tsx:117 |
| M-N14 | Monthly 매출(finalizedAt) vs 상담 건수(createdAt) **기준 불일치** | analytics.ts |
| M-N15 | ReferenceUpload 배치 업로드 중간 실패 시 **부분 저장** | ReferenceUpload.tsx:49 |

---

# 🟢 LOW 추가 (i18n 위주 25건)

| # | 내용 | 위치 |
|---|------|------|
| L-N1~12 | pre-consult/design, confirm, consult 섹션의 "예약 일시", "기본", "예약 정보를 확인해주세요" 등 **한국어 하드코딩 12개** | pre-consult/* |
| L-N13~16 | ShareCardClient의 "인스타그램 업로드용", INSTA_SCOPE_LABEL, hex 색상 토큰 | ShareCardClient.tsx |
| L-N17~18 | consultation/step1 `aria-label="이미지 삭제"`, ReferenceUpload `aria-label="확대/삭제"` 한국어 | step1, ReferenceUpload |
| L-N19~22 | Button 컴포넌트 미사용 (summary, treatment-sheet, save-complete) | 각 페이지 |
| L-N23 | canvas 페이지 dual language 미적용 | consultation/canvas |
| L-N24 | treatment-sheet dailyCheckDesc, customerMemoDesc dual language 누락 | treatment-sheet |
| L-N25 | DesignPresetPicker EXPRESSION_KO/SCOPE_KO 하드코딩 중복 | DesignPresetPicker.tsx |

---

# 📋 Round 1 + Round 2 통합 우선순위

## 즉시 (이번 주)
| 항목 | Round | 조치 |
|------|-------|------|
| Supabase `shops_anon_select` 정책 삭제 | R1 C-1 | DROP POLICY |
| Supabase `pre_consultations_limited_select` 제한 | R1 C-2 | DROP POLICY + 대안 |
| `create_shop_account` 4인자 → 3인자 | R2 C-N1 | DB 함수 삭제 재생성 |
| `complete_preconsultation_for_booking`에 shop_id 조건 | R2 C-N2 | DB 함수 수정 |
| Storage 3개 버킷 경로 검증 | R2 C-N3 | storage RLS 강화 |
| 약관 동의 DB 저장 | R1 HIGH | signup + db 추가 |
| 공유카드 예약 날짜 강제 문제 | R1 CRITICAL | **✅ 이번에 해결** (공유 상담 링크) |
| 외부 예약 CTA 제거 | R1 CRITICAL | **✅ 이번에 해결** |
| `consultation_customer_memo` 로그아웃 시 삭제 | R2 C-N4 | auth-store logout |
| `TOKEN_REFRESHED` 이벤트 처리 | R2 C-N5 | SupabaseProvider |

## 다음 스프린트
- 모든 HIGH 18건
- 필드 타입 누락 3건 (deposit, customer_tags.shop_id, pre_consultations.customer_id)
- database.ts 베이스라인 마이그레이션 생성
- prefers-reduced-motion 전역

## 다음 달
- 모든 MED 15건 + LOW 25건
- i18n 하드코딩 전수 청소
- 성능 advisor 194건 (multiple_permissive_policies + unindexed_fk + auth_rls_initplan)

---

## 📊 최종 통합 통계

| 카테고리 | Round 1 | Round 2 | 합계 |
|---------|---------|---------|------|
| CRITICAL | 9 | 5 | **14** |
| HIGH | 17 | 18 | **35** |
| MED | 34 | 15 | **49** |
| LOW | 6 | 25 | **35** |
| **합계** | **66** | **77** | **133** |
