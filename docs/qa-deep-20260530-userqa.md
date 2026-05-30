# 사용자 관점 심층 QA — 2026-05-30 (Round: User-Journey)

Chrome 실측(모바일 ~500px 뷰포트) end-to-end 테스트 + 18 에이전트 9축 코드추적(적대적 검증)
병행. 사용자가 지정한 핵심 여정(사전상담 링크 생성→제출→사장님 확인→시술→매출→대시보드→스케줄)을
실제로 걸어보며 논리오류·모순·어색함·반응형·i18n 을 조사.

## 방법
- **Chrome 실측**: 데모 샵 `클로드 테스트 네일`(shop-6658ea47…)으로 사전상담 링크 복사 → 고객(anon)
  관점으로 직접 제출(날짜/시간/디자인/네일상태/제거/랩핑/길이/쉐입/분위기/키워드/파츠/메모/연락처) →
  사장님 화면에서 확인 → field-mode 시술 → 정산(할인+예약금+현금) → 대시보드 반영까지 전 구간.
  Supabase MCP로 DB 저장값 교차검증.
- **코드추적**: 9축(링크생성/사전상담제출/사전상담확인/포트폴리오/파츠·가격/매출/대시보드/스케줄/반응형·i18n)
  병렬 조사 + 축별 HIGH/CRITICAL 적대적 재검증(거짓양성 6건 기각).
- **검증**: `npx tsc --noEmit` 통과 · `pnpm lint` 에러 0(경고만) · `pnpm build` exit 0. 수정 후
  Chrome 재실측(BUG-A·SL-04 라이브 확인).

## 정상 동작 확인 (회귀 없음)
- 슬롯 off-by-one 수정 정상(토 14 / 평일 18, 마감 슬롯 포함)
- 사전상담 제출 → DB `booking_requests.pre_consultation_data` 에 **모든 입력값 정확 저장**
- 사장님 사전상담 상세에 **모든 정보 빠짐없이 표시**(이름·연락처·일시·디자인·네일상태·제거·랩핑·길이·
  쉐입·분위기·스타일·키워드·파츠+단가·메모·선택 디자인 사진)
- 매출 등록: consultation_records 생성 + booking→completed + 고객 전화매칭 링크 + 대시보드 오늘매출 반영
- 할인(%)·예약금 차감 금액 계산 정확
- 알림센터(벨 카운트·읽음 처리) 정상

---

## 수정 완료 (이번 세션, 빌드/타입/린트 통과)

### 사전상담 고객 플로우 (다국어, 고객 대면)
| # | 심각도 | 내용 | 검증 |
|---|--------|------|------|
| A | HIGH | DesignGallery 카드 `<button>` 안에 확대 `<button>` 중첩 → React hydration 에러 반복. `<div role=button>`+형제 확대버튼으로 재구성(키보드 접근성 유지) | ✅ Chrome 콘솔 에러 소멸 확인 |
| B | HIGH | 요약 화면 디자인 라벨에 번역 안 된 raw 키 `consultation.designLabel` 노출 → `preConsult.designLabel`(4개 언어) | 코드+빌드 |
| SL-04 | HIGH | SlotPicker 날짜 칩 요일이 en/zh/ja에서도 항상 한국어(월/화) → locale별 요일(Sun/月/日…)+카운트 단위(open/个/枠) | ✅ 영어 Sat/Mon/Tue·"open" 확인 |
| — | HIGH | ConsultReview 8개 라벨(현재네일/길이/모양/랩핑/분위기/스타일/키워드/추가옵션) 하드코딩 → i18n 키 4개 언어 | 코드+빌드 |
| — | MED | DesignGallery 안내문구·ReferenceUpload 에러/포맷 힌트 하드코딩 → i18n 키 4개 언어 | 코드+빌드 |

### 파츠·가격 연동 (사용자 핵심 관심)
| # | 심각도 | 내용 |
|---|--------|------|
| PRICE-1 | CRITICAL | `solidPoint`/`fullArt` 설정가가 견적에 미반영(저장 누락) → 설정 저장 시 `surcharges.pointArt/fullArt` 동기화 + 설정 화면도 동일 값 표시(SSOT 단일화) |
| PRICE-2 | HIGH | 설정의 **랩핑 추가금**이 price-calculator에 완전 누락 → `ServicePricing.wrapping` + `buildServicePricingFromShopSettings` + `calculatePrice` 가산(미설정 시 0이라 기존 회귀 없음) |
| PRICE-3 | HIGH | **손님 견적(110,000) ≠ 계산대(105,000)** 모순(₩5,000): 근본원인 = pre-consult-price 가 랩핑 미설정 시 `?? 5000` 폴백으로 5,000 청구하나 field-mode/정산은 미청구. pre-consult도 `?? 0`으로 통일 → **견적=계산대 일치** |
| — | MED | app-store 기본값(`baseSolidPointPrice` 3000/`baseFullArtPrice` 10000)이 계산값(20000/40000)과 불일치 → 정합 |

### 대시보드/통계
| # | 심각도 | 내용 |
|---|--------|------|
| DASH-1 | HIGH | 골든타임 '최근 시술' 라벨이 `treatmentHistory[0]`(가장 오래된) → `[length-1]`(최신) |
| DASH-2 | MED | 인기 시술 TOP5가 디자인 카테고리+표현기법(기본/그라데이션) 혼합 집계 → 카테고리만 |
| DASH-3 | MED | 업셀링 리포트가 미결제 상담까지 포함 → `finalizedAt` 필터 |
| DASH-4 | HIGH | 이달 상담 건수 KPI 뱃지 / 차트 / 바텀시트 3곳 기준 불일치 → `computeMonthlyConsultations` SSOT 통일(차트에 preconsult 예약 반영) |
| DASH-5 | MED | 오늘 매출 KPI 변화율 레이블 '전월 대비' 오기(실제 어제 대비) → 레이블 분기 |
| DASH-6 | MED | 취소 예약이 Week/Month 캘린더 카운트·도트에 포함 → `cancelled` 제외 |

### 스케줄(기록) 탭
| # | 심각도 | 내용 |
|---|--------|------|
| SCHED-1 | HIGH | DragConfirmModal 확정 시 '미지정' 컬럼 designerId가 `'__unassigned__'` 문자열로 저장 → `undefined` 정규화(공용 헬퍼) |
| SCHED-2 | HIGH | moveValidation `'__unassigned__'` vs `'unassigned'` 불일치로 중복검사 누락 → 정규화 방어 |
| SCHED-3 | MED | 취소 예약이 일반 예약과 동일 색상 → 회색+취소선+opacity |
| SCHED-4 | MED | 빈 슬롯 모바일 롱프레스 불동작(touch 핸들러 미연결) → onTouchStart/End/Move 연결 |

### 포트폴리오
| # | 심각도 | 내용 |
|---|--------|------|
| PORT-1 | HIGH | MenuCard 가격·디자인타입 인라인 편집이 store-only(`updatePhoto`) → DB 미저장(새로고침 원복). `updatePhotoMetadata`로 영속화 |
| PORT-2 | HIGH | `dbInsertPortfolioPhoto`에 `is_staff_pick`/`is_popular` 누락 → 추가 |
| PORT-3 | MED | UploadPhotoForm `isPublic: addToMenu \|\| undefined` → 비공개 업로드도 DB 공개 저장. 명시 boolean으로 |
| PORT-4 | MED | category-mapping magnet → solid_tone 매핑으로 공유카드 무드 오표시 → PortfolioOverlay에서 magnet scope 직접 처리(MOOD_TITLE['magnet']='Magnetic Glow') |

---

## 미수정 — 후속 권장 (위험/설계 판단 필요 또는 DB 마이그레이션 필요)

### 🔴 field-mode 시술/매출 (고위험 — 가격·정산 모델, 신중 검토 후 수정 권장)
- **FM-1 [HIGH] 사전상담 add-on 이중청구**: field-mode 시술 화면에서 사전상담으로 선택된 add-on(예: 포인트아트)이
  '추가 항목' 토글에 **선택표시 안 됨** → 사장님이 누락된 줄 알고 다시 누르면 정산에 **포인트아트 2회(+40,000)** 계상.
  Chrome 재현. (carry add-on 표시/중복방지 설계 필요)
- **FM-2 [HIGH] 매출 레코드 데이터 손실**: field-mode→`consultation_records.consultation` 매핑에서
  `offType=none`(타샵제거 청구했는데), `partsSelections=[]`·`hasParts=false`(큐빅·스와 청구했는데),
  `nailShape=round`(손님 아몬드 선택) 로 저장. final_price는 맞지만 **항목/이력 왜곡** →
  대시보드 '파츠 추가 0개'·'인기 쉐입 라운드'로 전파. (DB 실측 확인)
- **SALES-1 [CRITICAL] 즉시매출 회원권 결제**: 회원권 선택 시 실제 잔액 차감·`membershipApplied` 저장 누락(quick-sale/page).
- **SALES-2 [HIGH] 예약금 차감 후 totalSpend** 가 시술가치 아닌 수취액으로 집계.
- **SALES-3 [HIGH] wrap-up 고객 변경** 시 이전 고객 통계 롤백·신규 고객 갱신 누락.
- **SALES-4 [HIGH] records/[id]** 가격 breakdown이 deposit/discount 미반영 → 표시금액 불일치.
- **SALES-5 [MED]** consultation_records `pricing_adjustments=null`·`total_price=final_price` → 할인/예약금/총액 내역 손실(감사 불가).
- **SALES-6 [MED]** `manualDeductMembership` 금액권(totalSessions=0) 차감 안 됨.

### 사전상담 링크 생성
- **SL-01 [CRITICAL] 링크 설정 UI 부재**: 홈 ShareLinkCard는 `/pre-consult/[shopId]` 만 복사. 기간/디자이너/
  시술시간/슬롯간격을 지정하는 `consultation_links` 생성·관리 UI가 코드 전체에 없음(함수는 db.ts에 정의만).
  → 제품 의도 확인 필요(단순화 의도면 OK).
- **SL-02 [HIGH]** Zustand persist `consultationLinkId` 오염(같은 shopId 재방문 시 미리셋).
- **SL-03 [HIGH]** shopId 경로 슬롯 동시예약 레이스 — `uq_booking_link_slot` 부분 인덱스가 `consultation_link_id IS NOT NULL`
  조건이라 샵 링크(null) 미보호. **DB 마이그레이션 필요**.
- **SL-07 [MED]** 슬롯 충돌 감지가 시작시간만 비교, 시술 duration 겹침 미감지.
- complete 페이지에 '홈으로/다시' 탈출 버튼 없음.

### 파츠/가격 (잔여)
- customPart `customPartId`=한글 name vs CustomPart.id 슬러그 미스매치 → 사장님 등록 단가 대신 grade fallback.
- summary/ConsultationSummaryCard/PriceSummaryBar/treatment-sheet 의 `calculatePrice` 호출부가 customParts 미전달.
- 통화 환율 하드코딩(format.ts).

### 포트폴리오 (잔여)
- `partsMemo`: DB에 `parts_memo` 컬럼 부재 → 영속화하려면 **마이그레이션 필요**.
- PortfolioBrowser(consultation/step1)가 `fetchPortfolioPhotos`(비필터)로 비공개 사진 노출.
- 카테고리 삭제 시 해당 사진 orphan.

### 사전상담 확인(사장님)
- 레거시 경로(C) booking `reservation_time='미정'` 노출 + 타임그리드 누락.
- `pre_consult_done` stage 하단 CTA에 '사전 상담 보기' 누락(상단 영역만 노출).

### 반응형/i18n (잔여, 횡단)
- consultation/summary `pb-32`가 노치 iPhone 고정 푸터에 가려짐.
- ConsultationLocaleButton vs ConsultationHeader 닫기 버튼 우상단 시각 충돌.
- BottomTabBar 레이블 10px / consultation 뒤로가기 36px / step flow 보조레이블 7px → 터치·폰트 기준 미달.
- consultation/customer `nameError`가 `tKo()` → 외국인 고객에게 한국어 에러.
- root `<html lang="ko">` 고정(외국어 고객 SEO/스크린리더 오선언).
- (main) layout `useLayoutEffect` locale deps가 home의 `restoreLocale` 무력화.

### DB 마이그레이션 필요(미적용)
- SL-03: 샵 링크(consultation_link_id NULL) 슬롯 중복방지 제약.
- partsMemo: `ALTER TABLE portfolio_photos ADD COLUMN parts_memo text`.

## 검증 로그
- `npx tsc --noEmit` → 0
- `pnpm lint` → 에러 0(img/exhaustive-deps 경고만)
- `pnpm build` → exit 0, 전 라우트 컴파일
- Chrome 재실측: BUG-A 콘솔 에러 소멸, SL-04 영어 요일(Sat/Mon/Tue·open) 확인, 사전상담 페이지 정상 로드
- 테스트 잔여물 정리: 생성한 예약(bk-1d9da0e7)·매출레코드(fm-ac9ab8b7) 삭제 + 고객 '이손님' 통계 원복(방문1·매출98,000·이력1)

---

## 2차 수정 — 후속 24건 (SL-01 제품결정 제외 전부 착수)

> 사용자 지시("SL-01 빼고 다 수정"). 도메인별 디스조인트 6 에이전트 병렬 + DB 마이그레이션 2건. `tsc/lint/build` 통과, 핵심은 Chrome 재실측.

### DB 마이그레이션 적용 (`20260530_userqa_fixes`)
- `portfolio_photos.parts_memo` text 컬럼 추가(파츠 메모 영속화)
- `uq_shoplink_slot` 부분 UNIQUE 인덱스(샵 링크 pre_consult 슬롯 중복예약 방지, 취소/미정/워크인 제외)

### 매출/정산
| # | 결과 |
|---|------|
| FM-1 사전상담 add-on 이중청구 | 🟢 **수정·라이브검증**. `AddOnMiniPanel`에 `carriedAddOns` 전달 → 사전상담 반영 add-on(포인트아트 등) 퀵버튼을 "· 사전상담 반영됨"으로 비활성화. Chrome 실측: 토글 비활성 확인, 중복 제거 시 105,000 복원 |
| FM-2 매출레코드 데이터 손실 | 🔵 **부분수정**. offType `none→other_shop` 🟢(DB확인). **nailShape(round 유지)·partsSelections([] 유지)는 미해결** — field-mode 스토어에 nailShape 필드 자체가 없고, 파츠가 inTreatmentAddons(label/amount)로만 들어가 partsSelections로 환원 불가. final_price는 정확. 추가 데이터모델 작업 필요 |
| SALES-1 즉시매출 회원권 미차감 | 🟢 quick-sale에서 회원권 결제 시 잔액 차감 + membershipApplied 저장 + useMembershipSession 호출 |
| SALES-2 예약금차감 totalSpend | 🟢 totalServicePrice = finalPrice + membershipApplied + deposit (롤백도 동일) |
| SALES-3 wrap-up 고객변경 통계 | 🟢 변경 시 이전 고객 롤백 + 신규 고객 recordTreatmentCompletion |
| SALES-4 records/[id] breakdown | 🟢 할인/예약금/회원권/결제수단 행 표시 → finalPrice와 일치 |
| SALES-5 pricing_adjustments 미저장 | 🟢 gross/할인/예약금 pricingAdjustments 저장 |
| SALES-6 금액권 차감 | 🟢 totalSessions=0 금액권 직접 차감 분기 |

### 가격 일치 (Chrome 실측으로 근본원인 정정)
- **PRICE-3 손님 견적 ≠ 계산대** 재규명: "포인트 아트 +25,000"은 addOnSurcharge 집계(point_art 20,000 + **랩핑 5,000**)를 한 줄로 표시한 것. 이 샵 `surcharges.wrapping`이 기본값 5,000으로 주입돼 손님 confirm만 랩핑을 청구(110,000), 원장상세·field-mode 정산은 미청구(105,000)였음. 🟢 `pre-consult-price.ts`에서 wrappingPreference→금액 가산 제거 → **3경로 모두 105,000 일치**(시술시간은 유지)
- #14 customPartId(name→id) · #15 calculatePrice customParts 전달(4개 호출부) · #16 환율 ≈ 근사표시 → 🟢
- #22 summary 고정 푸터 가림 pb-32→pb-52 · #13 complete 탈출 버튼 → 🟢

### 사전상담/슬롯
- SL-02 consultationLinkId persist 오염(partialize 제외 + 진입 시 초기화) · SL-03 샵링크 23505 처리(+인덱스) · SL-07 슬롯 duration 겹침 차단 → 🟢
- #20 reservation_time='미정' 표시 가드(상세·알림센터) 🟢 / 저장은 NOT NULL 제약으로 '미정' 유지(보고)

### 포트폴리오/스케줄/대시보드/반응형 (1차에서 일부 + 2차 잔여)
- partsMemo 영속화(컬럼+db매핑+store+overlay) · PortfolioBrowser 공개사진만 · 카테고리 삭제 orphan→'simple' 재할당 → 🟢
- 스케줄 SCHED-1~4 · 대시보드 DASH-1~6 (1차 완료)
- 반응형 #23 로케일버튼 좌상단 분리 · #24 탭바 12px·뒤로가기 44px·스텝바 10px·nameError t()·html lang 동적(LocaleLangSync) · #25 (main) restoreLocale 무력화 → 🟢

### 여전히 미해결 (후속)
- **SL-01** 사전상담 링크 설정 UI 부재 — 제품 결정 보류(사용자 지시)
- **FM-2 잔여** field-mode 매출레코드의 nailShape·partsSelections 손실(데이터모델 작업 필요)
- **is_quick_sale=true** — field-mode 시술이 quick_sale로 플래그(설계 확인 필요, 통계 영향 경미)
- 환율 실시간 연동(근사 표시로 완화), customPart 모달 재열기 복원(부분)

## 3차 — FM-2 완결 + 클라이언트 실기기 피드백 3건

### FM-2 완전 해결 (🔵→🟢)
- field-mode 스토어에 `nailShape` 필드 추가 + `hydrateFromBooking`/preconsult 핸들러가 사전상담 nailShape 전달 → 레코드 nailShape 정합
- settlement에서 `inTreatmentAddons`를 `shopSettings.customParts`와 라벨 매칭해 `partsSelections`(customPartId 포함) 복원, `hasParts` 정정
- **라이브+DB 검증**: 레코드 offType=other_shop · nailShape=almond · hasParts=true · partsSelections=[큐빅, 스와로브스키] 확인. 대시보드 '파츠 추가 0개'·'쉐입 라운드' 전파 해소

### 클라이언트 실기기 피드백 3건
- **#1 [HIGH] 날짜·시간 선택 후 다른 날짜 선택 불가** 🟢 — SlotPicker useEffect가 `openDate`를 deps에 넣고 매번 `setOpenDate(selectedDate)`로 되돌려 시간 선택 후 날짜 전환이 튕기던 버그. 최초 1회만 초기화하도록 수정. **라이브 검증**: 6.2+14:00 후 6.3 클릭 → 정상 전환
- **#2 [MED] 메뉴↔사전상담 카테고리 이름 불일치** 🔵 — 원장 메뉴 기본 라벨("심플 / 원컬러", "자석 / 마그넷")과 사전상담 i18n("심플", "자석") 불일치. 사전상담 한국어 기본 라벨을 메뉴 기본값에 맞춤. **잔여**: 원장이 builtin 카테고리를 메뉴에서 rename하면 사전상담 전파 안 됨(menuCategories가 DB/shopData 미노출 — SSOT 후속 필요). 가격은 이미 메뉴 featured 최저가 연동됨
- **#3 [확인] '이대로 진행하기' 후 이름·전화 없이 즉시 확정** ✅ 현재 코드 정상 — `confirm/page.tsx` 예약 생성은 "이대로 예약하기"(Book Now, name/phone 입력 후)에서만. "이대로 진행하기"는 /confirm 이동만. **프로덕션(beauty-decision.com)이 구버전이라 재배포 시 해소**

### 2차 검증 로그
- `npx tsc --noEmit` → 0 · `pnpm lint` 에러 0 · `pnpm build` exit 0(전 라우트)
- Chrome 재실측: SL-04 영어 요일(Sat/Mon)·BUG-A 콘솔에러 소멸·FM-1 토글 비활성·가격 3경로 105,000 일치·매출 레코드 offType=other_shop 확인
- 테스트 잔여물 정리(QA자동/QA검증둘 예약·레코드·신규고객 삭제, 이손님 통계 원복). 기존 데이터(이손님 5/28 예약) 보존
