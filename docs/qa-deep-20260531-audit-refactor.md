# QA 심층 감사 + 리팩토링 — 0531 회의 반영 검증 (2026-05-31)

> 0531 클라이언트 회의(파일럿 직전 최종 점검) 요구사항을 코드에 반영한 뒤,
> 멀티에이전트 워크플로우(47 에이전트)로 ① 요구사항 구현 검증 ② 버그/에러 ③ 논리 모순
> ④ ui-ux-pro-max 준수 ⑤ 샵원장 페르소나 전체 flow 를 심층 감사한 결과와 후속 수정·리팩토링 기록.

## 1. 회의 요구사항 16건 구현 현황

| ID | 요구사항 | 상태 | 비고 |
|----|----------|------|------|
| R1 | 사전상담 후 파츠 추가 선택 불가 버그 | 🟢 완료 | |
| R2 | 포트폴리오 자동 이름 → 메뉴명 | 🟢 완료 | 메뉴 미연결 엣지케이스만 raw key 가능(영향 경미) |
| R3 | 캘린더 날짜 클릭 시 화면 고정 | 🟢 완료 | |
| R4 | 대시보드 매출 항목 상단 노출 | 🟢 완료 | |
| R5 | 회원권 횟수 → 금액 차감 전환 | 🟢 완료(보완) | 회차 카운터 잔재 제거(Phase A). 타입 필드 정리는 Phase B |
| R6 | 가격 입력 '손가락당' 단위 표기 | 🟢 완료(보완) | 설정 + **사전상담 confirm 화면**에 단위 병기 추가, i18n 4언어 `perFinger` |
| R7 | 매장 로고 온보딩 + 첫 화면 노출 | 🟢 완료(보완) | **사전상담 링크 첫 화면 로고 렌더 추가**(누락분) |
| R8 | 메뉴 카테고리명 한국어+영어 병기 | 🟢 완료(보완) | 포맷 `심플 (Simple)` 공백 교정 + zh/ja 커스텀 카테고리 현지어 병기 |
| R9 | 시술시간 메뉴 숨김, 확인 단계만 표시 | 🟢 완료 | |
| R10 | 사전상담 추가비용·시간 공지 문구 | 🟢 완료 | |
| R11 | 추가금 항목 수량 스테퍼(− N +) | 🟢 완료(보완) | **표준 추가금(랩핑·제거 등)도 커스텀 파츠와 동일 스테퍼 UI로 통일** |
| R12 | 현장 워크인 QR 상담 | ⬜ 보류 | **회의에서 시간충돌 우려로 명시 보류** — 진입점 미연결(의도) |
| R13 | 1인샵 '미지정' → 원장 이름 | 🟢 완료 | |
| R14 | 포트폴리오 사진 시술기록 갤러리 통합 | 🟢 완료(보완) | 온보딩 reference 포함 + **카테고리별 그룹핑 렌더 추가** |
| R15 | 사전상담 링크 날짜·시간 지정 입력 | 🔵 부분 | bookingId 기반 시간지정 링크는 동작. **독립 링크 CRUD UI(SL-01)는 제품 결정 보류** |
| R16 | 모바일(사파리·삼성) 최적화 지속 | 🟢 완료(보완) | `pt-safe-top` 미정의 수정, 설정 화면 소폰트(10~11px)→12px |

**요약:** 완전구현 11 + 보완완료 / 보류 2(R12·R15 — 둘 다 사전 합의된 보류 항목).

## 2. Phase A — 정합성·버그·요구사항 보완·접근성 (커밋 1)

멀티에이전트 감사 70건 → 적대적 검증 후 확정. 6개 에이전트 파일 분할 병렬 수정.

### HIGH (배포 전 필수)
1. **hydrateFromBooking 가격 누락 (캘린더)** — `DayReservationList`에 `wrappingPreference·customPartSelections·selectedPhotoPrice·nailShape` 4필드 추가. 타임그리드에서 예약 시작 시 견적=계산대 일치.
2. **hydrateFromBooking 가격 누락 (홈)** — `home/page.tsx`에 `selectedPhotoPrice·nailShape` 추가 + `customPartSelections ?? {}` 보완.
3. **정산 예약금 기본값** — `depositApplied` 초기값 `0` → `presetDeposit`. 예약금 있는 예약은 자동 차감 상태로 진입(없으면 0이라 기존 동작 유지).
4. **온보딩 추가금 라벨 오인** — `parts`→`partsExcessPer`(초과 개당), `glitter`→`largeParts`(큰 파츠) 매핑 확인 후 라벨을 실제 의미로 교정 + helper 텍스트. 변수 재바인딩은 하지 않음(가격 버그 회피).
5. **iOS 노치 침범** — `field-mode/treatment`가 쓰는 `pt-safe-top` 클래스가 globals.css에 미정의 → 클래스 정의 추가.

### MED/LOW (버그·논리)
- 정산 `addOnLabelSet` — `wrappingPreference==='yes'`면 랩핑 라벨을 중복 차단 set에 추가(이중청구 방지) + 커스텀 파츠 빠른추가는 store 원본 액션 직접 호출로 라벨 우연일치 차단 회피.
- 회원권 `useMembershipSession` 회차 카운터 감소 로직 제거(금액제 일원화).
- 회원권 `manualDeductMembership` — 비active(expired/used_up) 차감 차단(getEffectiveStatus 가드).
- `MembershipCard.formatDate` — 빈 문자열/Invalid Date → `'—'` 방어.
- `wrap-up` after-photo null 가드, `GreetingHeader` 빈 shopName fallback.
- 데모 회원권 데이터 금액제 정렬(회차 0, 금액 필드 유지).

### ui-ux-pro-max / 접근성
- `PortfolioOverlay` — `role=dialog`/`aria-modal`/`aria-labelledby` + ESC 닫기, 액션 버튼·도트·메모 버튼 터치타겟 44px, optional chaining 크래시 방어.
- `ShareCardGeneratorModal` — `aria-labelledby` 연결.
- `StatusBar` 언어 드롭다운 — `aria-expanded`/`aria-haspopup`/`role=listbox`/`option` + ESC 닫기·포커스 복귀.
- `MembershipPlansSection` 버튼 44px.
- 설정 화면 `text-[10px]/[11px]` 22곳 → `text-xs`(12px).

### 요구사항 보완 (기능 완성)
- R6 `perFinger` i18n(ko/en/zh/ja) + confirm 화면 단위 병기.
- R7 사전상담 첫 화면 로고 렌더(`getShopLogoPublicUrl`).
- R8 병기 포맷 공백 + zh/ja 현지어 병기.
- R11 표준 추가금 수량 스테퍼(store 구조 무변경, 표시 단계 label group).
- R14 시술기록 갤러리 카테고리 그룹핑.
- 페르소나: 슬롯 없는 사전상담 완료 문구를 '예약 완료'→'사전상담 완료/예약은 매장 별도' 로 4언어 교정(예약 오인 방지).

**검증:** `npx tsc --noEmit` 통과, `pnpm lint` 에러 0(기존 경고만).

## 3. Phase B — 리팩토링 (커밋 2) — *진행 예정, 아래 갱신*

## 4. 보류/후속 (오너 결정 필요)
- **R12 QR 상담** — 회의 합의대로 보류 유지(컴포넌트는 존재, 진입점 미연결).
- **R15 사전상담 링크 CRUD(SL-01)** — 날짜·디자이너·슬롯간격 지정 독립 링크 관리 UI. 제품 결정 보류 상태. bookingId 기반 시간지정 공유는 동작 중.
- medium 리스크 리팩토링(settings/customers/db 대형 파일 분리)은 안전성 확인 후 단계적.
