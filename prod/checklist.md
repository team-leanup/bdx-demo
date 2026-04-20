# 📋 BDX 프로덕션 수정 체크리스트

> 출처: `prod/fix-note.md` (2026-04-17 클라이언트 미팅 회의록)
> 목표: 2026-04-22까지 파일럿 사용 가능 수준 구현 → 5월 10~15일 피드백 미팅 → **5월 25일 공식 론칭**

## 🗓 타임라인

| 날짜 | 마일스톤 |
|------|----------|
| ~ 2026-04-22 | 파일럿 영업 전 "진짜 사용 가능" 수준 구현 (회의록 요청 기준) |
| 2026-04-23 ~ 05-09 | 2주간 파일럿 샵 실사용 + 피드백 수집 (주 10건 상담 목표) |
| 2026-05-10 ~ 15 | 피드백 정리 미팅 + 최종 다듬기 |
| 2026-05-25 ~ 29 | **공식 앱 론칭** |

다음 미팅: **2026-04-20 (월) 오후 1시** — 비대면

---

## 🎯 우선순위 요약

| 우선 | 항목 | 상태 | 예상 소요 |
|------|------|------|-----------|
| 🔴 P0 | [01] 사전 상담 → 시술 직행 (home 경로) | ✅ **완료** (2026-04-19) | 30분 |
| 🔴 P0 | [06] 회원권 관리 (등록 UI 설정탭, 정산 잔여표시) | ✅ **완료** (2026-04-19) | 3~4시간 |
| 🔴 P0 | [03] 가이드북 비주얼 요소 추가 | ✅ **완료** (2026-04-19) | 2~3시간 |
| 🟡 P1 | [05] 포트폴리오 디자인 메뉴 연동 (데모 시연용) | ✅ **완료** (2026-04-20) | 1~2시간 |
| 🟡 P1 | [08] 네이버/카카오 예약 채널 링크 UI 제거 | ✅ **완료** (검증 2026-04-19) | 30분 |
| 🟡 P1 | [07] QR 2종 이미지 클라이언트 전달 | ✅ **완료** (2026-04-19) | 15분 |
| 🟢 P2 | [02] 연락처 하이픈 자동 입력 | ✅ 이미 구현 | 검증만 |
| 🟢 P2 | [04] 공유 링크 URL 표시 제거 | ✅ 이미 구현 | 검증만 |
| ⏸️ 보류 | [09] 'New' 예약 표시 | ⏸️ 파일럿 피드백 후 결정 | - |
| 📧 업무 | [10] 회의록·스크립트 이메일 전송 | ✅ **완료** (2026-04-19) | 10분 |

**범례**: 🔴 P0 필수 · 🟡 P1 권장 · 🟢 P2 검증 · ⏸️ 보류

---

## [01] 🔴 사전 상담 → 시술 직행 (홈 경로)

**회의 원문**: "사전 상담을 제출한 고객의 경우, 불필요한 단계를 건너뛰고 바로 시술 시작 화면으로 전환하세요. 시술 시간이 즉시 표시되도록 조정하세요."

### 현재 상태
- ✅ `records` 페이지에서는 **구현 완료**
  - `src/app/(main)/records/page.tsx:450-458` — `hasPreConsult = !!booking.preConsultationCompletedAt && !!raw?.designCategory` 분기 → `startTreatment()` + `/field-mode/treatment` 로 직행
- ❌ `home` 페이지 `TodayReservationCard`에서 상담 시작 누르면 **여전히 `/field-mode`** (포트폴리오 선택 단계)로 이동
  - `src/app/(main)/home/page.tsx:177-214` `handleStartConsultation` — `hydrateFromBooking` 후 `router.push('/field-mode')` (line 213)
  - `preConsultationCompletedAt` 체크 없음

### 수정 지점
**파일**: `src/app/(main)/home/page.tsx:177-214`

**수정 방향**: `records/page.tsx:450-458` 로직을 home에 동일하게 이식.

```tsx
const hasPreConsult = !!booking.preConsultationCompletedAt && !!(raw?.designCategory);
if (hasPreConsult) {
  useFieldModeStore.getState().startTreatment();
  sessionStorage.setItem('field-mode:from-pre-consult', booking.id);
  router.push('/field-mode/treatment');
} else {
  router.push('/field-mode');
}
```

### 검증
- [ ] 사전 상담 완료된 예약 클릭 → 바로 타이머 화면 진입
- [ ] treatment 페이지에서 "사전 상담에서 받은 정보를 불러왔어요" 배너 표시 확인 (`src/app/field-mode/treatment/page.tsx:83-154`)
- [ ] 사전 상담 없는 일반 예약은 기존처럼 `/field-mode` 포트폴리오 선택으로 진입

---

## [02] 🟢 연락처 하이픈 자동 입력

**회의 원문**: "연락처 입력 시 자동으로 하이픈이 추가되도록 기능을 구현하세요. 연락처 표기가 가독성 좋게 구분되도록 만드세요."

### 현재 상태 — **이미 구현됨**
- `src/lib/phone.ts:32-51` — `formatPhoneInput(raw)` 실시간 하이픈 삽입
  - `010` → `010` / `01012` → `010-12` / `01012345678` → `010-1234-5678`
  - 서울 `02`, 3자리 지역번호 `031` 등 모두 대응
- 적용 지점:
  - `src/components/home/ReservationForm.tsx:235` ✅
  - `src/components/consultation/CustomerInfoForm.tsx:141` ✅
  - `src/app/pre-consult/[shopId]/confirm/page.tsx:627` ✅

### 검증
- [ ] 홈 예약 등록 모달에서 `01012341234` 입력 → 실시간 `010-1234-1234`로 표시
- [ ] 사전 상담 `/confirm` 페이지 고객 입력 필드 동일 동작
- [ ] 기타 전화번호 입력 UI 누락 여부 확인 (Quick Sale, 고객 추가 모달 등)

---

## [03] 🔴 가이드북 비주얼 요소 추가

**회의 원문**: "가이드북 콘텐츠에 시스템 이해를 돕기 위해 비주얼 요소와 이미지를 첨부하세요. … 온보딩 화면이 나오고, 현장 모드 화면이 나오고."

### 현재 상태
- `public/guide.html` (정적 HTML, rewrite `/guide` → `/guide.html` 설정됨, `next.config.ts:21-23`)
- `public/images/guide/` 폴더 — **존재는 함, 이미지 유무 확인 필요**
- 텍스트 기반 가이드 페이지 업데이트는 2026-03-26 완료 (MEMORY)

### 수정 방향
1. **스크린샷 촬영** (개발 서버 실행 후 크롬 DevTools 모바일 뷰로):
   - 홈 대시보드 (`/home`)
   - 오늘의 예약 카드
   - 공유 상담 링크 카드
   - 현장 모드 (`/field-mode` 포트폴리오 그리드)
   - 시술 중 타이머 화면 (`/field-mode/treatment`)
   - 정산 화면 (`/field-mode/settlement`)
   - 고객 카드 (`/customers/[id]`)
   - 온보딩 2~3 컷
2. **저장**: `public/images/guide/` 하위에 PNG로 저장 (예: `home-dashboard.png`)
3. **`public/guide.html` 편집**: 핵심 개념 섹션별로 `<figure><img src="/images/guide/xxx.png" alt="..."><figcaption>...</figcaption></figure>` 삽입
4. **반응형 CSS**: `max-width: 600px; height: auto; border-radius: 16px;` 정도로 모바일 친화적 스타일
5. **데모 영상 GIF도 고려** — 핵심 인터랙션 (공유 링크 복사, 사전 상담 제출 → 알림) GIF 1~2개면 충분

### 검증
- [ ] `/guide` 접속 시 이미지 정상 로드 (모바일 사이즈 포함)
- [ ] 목차 ↔ 섹션 점프 정상 작동
- [ ] 고령 사용자 친화적 — 글자 크기 16px 이상, 이미지-텍스트 대비 명확

---

## [04] 🟢 공유 상담 링크 URL 표시 제거

**회의 원문**: "사전 상담 링크 옆에 표시되던 URL 주소 표시를 제거하세요. 해당 자리에 링크 복사 버튼만을 남겨 UI를 개선하세요."

### 현재 상태 — **이미 구현됨**
- `src/components/home/ShareLinkCard.tsx:21-90`
- URL은 `useState`에 저장(line 23)되어 **복사 기능용으로만 사용**, 화면 표시 없음
- 카드 UI: "손님 공유용" 라벨 + "상담 링크" 제목 + 설명 + **"상담 링크 복사" 버튼만** 표시

### 검증
- [ ] 홈 화면 ShareLinkCard에 URL 문자열 미표시 확인
- [ ] 버튼 클릭 시 클립보드에 `{origin}/pre-consult/{shopId}` 복사 + "복사됨" 피드백

---

## [05] 🟡 포트폴리오 디자인 메뉴 연동 (데모 시연)

**회의 원문**: "등록된 디자인이 메뉴처럼 포트폴리오에 연결되도록 예시 항목을 연동하여 데모에 활용하세요."

### 현재 상태
- 포트폴리오 페이지 구조: `/portfolio` 목록, `/portfolio/[id]` 상세, `/portfolio/upload` 업로드
- 사전 상담 디자인 선택 (`pre-consult/[shopId]/design`)에서 `DesignGallery` 컴포넌트가 포트폴리오를 **갤러리처럼** 표시함
- Mock 이미지: `public/images/mock/nail/nail-1.jpg ~ nail-8.jpg` (8장)
- **문제**: 샵-demo 계정에 포트폴리오 사진이 메뉴 형태로 잘 연결된 데모 데이터 부족

### 수정 방향
1. **`src/data/mock-demo-data.ts`** 확인 → 포트폴리오 mock 데이터 보강
   - 각 mock 이미지에 `style_category` (예: `solid_tone`, `french`, `gradient`, `art`), `price`, `estimated_minutes`, `design_type` 메타데이터 부여
   - `tags: ['오피스룩', '심플', '봄']` 등 예시 태그
2. **스타일 카테고리별 필터** 확인: `/portfolio` 에 탭/필터가 있는지, 사전 상담 `DesignGallery`에서 카테고리별 필터링 동작하는지
3. **시연 시나리오 준비**:
   - 사장님 홈 → 공유 링크 복사
   - 고객 링크 접속 → 디자인 선택에서 포트폴리오가 "메뉴판처럼" 가격과 함께 표시
   - 디자인 선택 후 상담 완료

### 검증
- [ ] `/pre-consult/[shopId]/design` 에서 포트폴리오 이미지 8장 표시
- [ ] 카테고리 탭 전환 시 필터링 정상
- [ ] 각 이미지에 가격, 제목 노출
- [ ] 클라이언트 시연 데모 데이터 샵 (shop-demo) 로그인 시 기본 표시

---

## [06] 🔴 회원권 관리 시스템

**회의 원문**: "설정 탭 및 고객 카드에 회원권 등록 기능을 추가하세요. 고객 결제 시 자동으로 회원권 횟수 차감이 이루어지도록 로직을 구현하세요."

### 현재 상태 — **부분 구현됨**

#### ✅ 이미 있는 것
- **DB**:
  - `customers.membership JSONB` — `{ id, totalSessions, usedSessions, remainingSessions, purchaseAmount, purchaseDate, expiryDate, status }`
  - `membership_transactions` 테이블 — type('purchase'|'use'|'refund'|'adjust'), sessions_delta (현재 rows=0)
- **고객 카드 (`src/app/(main)/customers/[id]/page.tsx:978-1004, 1316-1398`)** — 회원권 섹션 존재. 등록 모달 (구매금액/총횟수/만료일) 있음
- **정산 자동 차감 (`src/app/field-mode/settlement/page.tsx:201-204`)**:
  ```tsx
  if (paymentMethod === 'membership' && customerId) {
    useCustomerStore.getState().useMembershipSession(customerId, recordId);
  }
  ```
- **store 액션** (`src/store/customer-store.ts:492-524`): `useMembershipSession` — `remainingSessions - 1`, `0` 되면 `status: 'used_up'` 자동 전환, 트랜잭션 INSERT

#### ❌ 아직 없거나 개선 필요
1. **설정 탭에 회원권 상품 등록 UI 없음** — `src/app/(main)/settings/page.tsx`에 "회원권" 섹션 자체가 없음. 회의에서는 "설정 탭에 반영"으로 합의됨
   - 현재: 고객 카드 내에서 개별 고객에게 회원권 부여
   - 필요: 설정에서 "10만원 5회", "20만원 10회" 같은 **회원권 상품 (플랜) 등록** → 고객에게 상품 선택으로 부여
2. **정산 화면 잔여 횟수 표시 없음** — 정산 결제 수단 선택에서 회원권 버튼 누를 때 잔여 `3/5` 같은 표시 없음 (`settlement/page.tsx:459-483` 3개 버튼 단순 선택)
3. **customerId 없을 때 경고** — 회원권 결제 선택했는데 고객 연결 안 된 경우 (워크인 등) 차감 불가. UI 피드백 필요
4. **고객 카드 회원권 섹션**은 이미 있으나 **"회원권 없음" 상태에서 추가 버튼이 눈에 잘 띄는지** 점검

### 수정 방향

#### 6-1. 설정 탭 회원권 상품 관리
**신규 DB 필요**: `membership_plans` 테이블
```sql
CREATE TABLE membership_plans (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,            -- 예: "10만원권"
  price INT NOT NULL,            -- 판매 금액
  total_sessions INT NOT NULL,   -- 차감 횟수
  valid_days INT,                -- 유효기간 (일, nullable = 무기한)
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI**: `src/app/(main)/settings/page.tsx`에 "회원권 상품" 섹션 추가
- 상품 리스트 + "상품 추가" 버튼 → 모달 (이름, 가격, 횟수, 유효기간)
- 상품 활성/비활성 토글

#### 6-2. 고객 회원권 등록 플로우 개선
- 고객 카드 (`customers/[id]/page.tsx`) 회원권 등록 모달에 **"상품 선택" 드롭다운** 추가
- 상품 선택 시 금액/횟수 자동 채워짐 (커스텀 수동 입력도 유지)

#### 6-3. 정산 화면 회원권 UI 보강
**파일**: `src/app/field-mode/settlement/page.tsx:459-483`
```tsx
// 회원권 버튼 영역에 잔여 표시
{customer?.membership?.status === 'active' && (
  <span className="text-xs text-primary">
    잔여 {customer.membership.remainingSessions}/{customer.membership.totalSessions}회
  </span>
)}
// customerId 없으면 회원권 버튼 비활성화 + 안내 툴팁
```

#### 6-4. 고객 카드 회원권 이력 표시
- `membership_transactions` 쿼리 → 사용 이력 리스트 (날짜 / 차감 수 / 시술 기록 링크)

### 검증
- [ ] 설정 탭에서 회원권 상품 추가 가능
- [ ] 고객 카드에서 상품 선택 → 회원권 부여
- [ ] 정산 시 회원권 버튼에 잔여 횟수 표시
- [ ] 회원권 결제 → 고객 카드 잔여 횟수 자동 감소
- [ ] 잔여 0이 되면 다음 방문 시 회원권 버튼 비활성화
- [ ] 회원권 연결 안 된 고객일 때 경고 표시

---

## [07] 🟡 QR 코드 생성 및 전달

**회의 원문**: "BDX 가이드 페이지 링크용 QR 코드와 BDX 앱 바로가기용 QR 코드 2개를 생성하세요."

### 현재 상태 — **코드 완료, 이미지 전달 필요**
- `src/app/qr/page.tsx`
- `qrcode.react` 의 `QRCodeCanvas` 사용 + 로고 중앙 삽입 완료 (`/bdx-logo/bdx-symbol.svg`, line 91-96)
- 2개 QR 아이템:
  - `beauty-decision.com` — BDX 앱 바로가기
  - `beauty-decision.com/guide` — 가이드 페이지
- PNG 다운로드 기능 구현됨 (line 28-37)

### 할 일
1. `/qr` 접속 → 2개 QR PNG 다운로드
2. 클라이언트 (Jee)에게 카카오/이메일로 전달
3. 디자인 검토 — 로고 크기 적절한지, 인쇄 해상도 충분한지 (300dpi 기준 1024px 이상 권장 — 현재 설정 확인)

### 검증
- [ ] PNG 해상도 인쇄용 충분 (1024×1024 이상)
- [ ] 모바일 카메라로 스캔 테스트 (2종 모두)
- [ ] 클라이언트 전달 완료

---

## [08] 🟡 네이버/카카오 예약 채널 링크 UI 제거

**회의 원문**: "이제는 저희가 공유 카드로 아예 그냥 자체적으로 예약을 받아버리는 거니까 네이버·카카오 링크 추가하는게 필요할지 고민이 되더라고요. … 없애는 걸로 하고 혹시 모르니까 **코드 자체는 살려** 두긴 할게요."

### 현재 상태
- **채널 구분값으로만 존재** — `src/components/home/ReservationForm.tsx:28-29`
  ```tsx
  { value: 'kakao', label: '카카오톡' },
  { value: 'naver', label: '네이버' },
  ```
- `naverMode` prop — ReservationForm에 "네이버 예약 등록" 전용 진입점 UI 있음 (line 47, 71, 81, 184-188)
- 별도 "외부 예약 채널 링크 버튼"은 **없음** (2026-04-17 작업에서 이미 제거 완료 — MEMORY 기록 참고)

### 확인 필요 지점
1. 홈 첫 화면에서 "매장 정보" 스크롤 없이 보이는 영역에 네이버/카카오 링크가 노출되는지 (회의 문맥: "첫 화면이니까 스크롤 내지 않는 딱 첫 화면인데 불필요한 정보일 수도")
2. `ReservationForm`의 `naverMode` prop이 사용되는 호출부 검색 → 실제로 진입되는 UI 지점이 어디인지
3. 기록 페이지 예약 카드의 "네이버" 뱃지 자체는 **유지** (채널 구분은 남기고, 링크만 제거)

### 수정 방향
- 홈 페이지 (`src/app/(main)/home/page.tsx`) 렌더링 트리에서 "네이버 예약 외부 링크" 버튼이 있는지 직접 확인 → 있으면 UI만 제거 (코드는 주석 처리로 유지)
- 설정 페이지 `src/app/(main)/settings/page.tsx` 의 "예약 채널 연결" 섹션 — kakaoTalkUrl/naverUrl 입력 필드가 있는지 확인, 회의에서는 "설정 첫 화면에 보이면 불필요"
  - 유지 옵션: 설정 탭 안쪽 "외부 연동" 섹션으로 이동 (제거하지 말고 숨기기)

### 검증
- [ ] 홈 첫 화면에 네이버/카카오 외부 링크 버튼 없음
- [ ] 설정 첫 진입 화면에 해당 입력 필드 없음 (스크롤 시 접근 가능 OR 제거)
- [ ] 예약 뱃지 표시(`CHANNEL_BADGE`)는 유지 — 기록 페이지/홈 카드에서 기존 동작 확인

---

## [09] ⏸️ 'New' 예약 표시 (보류)

**회의 결정**: "일단 지금 이대로 진행해 주시고, 다음 주 파일럿 샵들한테 피드백 받으면 그때 수정해 보는 걸로."

### 참고 정보 (추후 구현 시)
- 대상: 사전 상담 공유 링크로 들어온 예약만 (`booking_requests.channel = 'pre_consult'` 또는 `consultation_link_id != null`)
- 표시 기준 후보:
  - 생성 후 N시간 이내 (예: 24시간)
  - 사장님이 한 번도 열어보지 않은 예약 (`opened_at IS NULL` — 필드 신설 필요)
  - 현장 모드 시술 시작 시 자동 제거
- UI 위치: 홈 `TodayReservationCard` 의 customerName 옆 또는 ReadinessBadge 근처

---

## [10] 📧 회의록·스크립트 이메일 전송

**회의 원문**: "Jee의 입력 이메일로 회의 스크립트와 요약본을 전송하세요."

- Jee 이메일: 채팅으로 제공받음 (확인 필요)
- 회의록: 이 `prod/fix-note.md` 파일 기반
- 구글 캘린더: 다음 주 월요일 (2026-04-20) 1시 미팅 초대 발송 — 이후 자동 회의록 공유

---

## 📐 플랫폼 구조 참고

상세 구조는 `prod/platform-overview.md` 참고.

### 핵심 디렉토리
```
src/
├── app/
│   ├── (main)/          사장님 관리 화면 (항상 한국어)
│   ├── (auth)/          인증 플로우
│   ├── consultation/    현장 상담 (다국어 dual-language)
│   ├── pre-consult/     고객 공유 링크 사전 상담
│   ├── field-mode/      현장 시술 모드 (treatment/settlement/wrap-up)
│   ├── qr/              QR 생성 페이지
│   ├── share/           시술 결과 공유 카드
│   └── onboarding/      신규 사장님 온보딩 플로우
├── components/
│   ├── home/            ShareLinkCard, HeroCTA, TodayReservationCard …
│   ├── consultation/    CustomerInfoForm, PriceSummaryBar …
│   ├── share-card/      시술 결과 공유 카드
│   └── layout/          AppShell, TabBar, StatusBar
├── store/               Zustand 스토어 (16개)
├── lib/                 phone, i18n, booking-stage, db, …
└── types/               DB 타입 정의 (database.ts 포함)
```

### DB (Supabase)
- **프로젝트**: `pzwmqorvrhdkckkdqemo` (ap-northeast-2, PostgreSQL 17.6)
- **테이블 11개**: shops, designers, customers, customer_tags, consultation_records, booking_requests, pre_consultations, consultation_links, portfolio_photos, membership_transactions, small_talk_notes
- **RPC 9개**: create_shop_account, get_my_shop_id, get_consultation_link_public, get_shop_pre_consult_data, complete_preconsultation_for_booking, increment_consultation_link_booking 등
- **현재 rows**: shops 22 / customers 143 / consultation_records 103 / booking_requests 79 / portfolio_photos 39

### 보안/성능 이슈 (참고)
- **보안 WARN 5건**: Storage public listing 3개 버킷, `touch_consultation_links_updated_at` search_path, Leaked Password Protection 미활성화
- **성능 WARN 199건**: `multiple_permissive_policies` 174건 (RLS 정책 중복), `auth_rls_initplan` 10건 (row-by-row `auth.uid()` 재평가), FK 인덱스 누락 10건
- **→ 파일럿 전 시급한 것**: `auth_rls_initplan` 10건 (`(SELECT auth.uid())`로 감싸기)

---

## 📝 진행 상황 트래킹

| # | 항목 | 담당 | 상태 | 완료일 |
|---|------|------|------|--------|
| 01 | 사전 상담 → 시술 직행 (홈) | Claude | 🟢 완료 | 2026-04-19 |
| 02 | 연락처 하이픈 자동 | - | 🟢 검증만 | - |
| 03 | 가이드북 비주얼 추가 | Claude | 🟢 완료 | 2026-04-19 |
| 04 | 공유 링크 URL 제거 | - | 🟢 검증만 | - |
| 05 | 포트폴리오 디자인 연동 | Claude | 🟢 완료 | 2026-04-20 |
| 06 | 회원권 관리 시스템 | Claude | 🟢 완료 | 2026-04-19 |
| 07 | QR 이미지 전달 | 사용자 | 🟢 완료 | 2026-04-19 |
| 08 | 네이버/카카오 링크 UI 제거 | Claude | 🟢 완료 | 2026-04-19 |
| 09 | 'New' 예약 표시 | - | ⏸️ | - |
| 10 | 이메일 전송 | 사용자 | 🟢 완료 | 2026-04-19 |

**범례**: ⬜ 미착수 · 🟡 진행중 · 🔵 부분완료 · 🟢 완료/검증만 · 🔴 블로커 · ⏸️ 보류
