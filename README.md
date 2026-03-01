# BDX — Beauty Decision eXperience

네일샵 현장 상담 & 고객 관리 플랫폼 데모

## 개요

BDX는 네일샵에서 고객 상담부터 가격 산출, 시술 기록, 고객 관리까지 전체 워크플로우를 태블릿에서 처리할 수 있는 플랫폼입니다. 이 데모는 **Mock 데이터 기반 인터랙티브 프로토타입**으로, 전체 서비스 흐름을 체험할 수 있습니다.

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 15 (App Router) | 프레임워크 |
| React | 19 | UI |
| TypeScript | 5 | 타입 안전성 |
| Tailwind CSS | 4 | 스타일링 (CSS 변수 기반 테마) |
| Zustand | 5 | 상태 관리 (7개 store) |
| Framer Motion | 11 | 페이지 전환 애니메이션 |
| Recharts | 2.15 | 대시보드 차트 |
| Pretendard | Variable | 한국어 폰트 (self-hosted) |

## 실행 방법

```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

## 주요 플로우

### 1. 인증 & 온보딩
```
스플래시 → 기능소개(2슬라이드) → 로그인(Mock) → 온보딩 8단계
  ├── 매장 정보
  ├── 가격 설정
  ├── 서비스 설정
  ├── 추가금 설정
  ├── 시간 설정
  ├── 테마 선택 (8종)
  └── 완료 → 홈
```

### 2. 상담 흐름 (A-1 ~ A-8)
```
상담 시작(디자이너 선택) → 고객 정보 → 기본 조건(부위/오프/연장/쉐입)
→ 디자인 범위 → 추가 옵션(표현기법/파츠/컬러)
→ Pro 모드(전체 옵션 한눈에) → 캔버스(손가락별 선택) → 최종 확인(저장)
```
- 실시간 가격 계산 (하단 바에 지속 표시)
- 가격 = 기본가 + 오프 + 연장 + 디자인 + 표현기법 + 파츠 + 컬러 - 할인 - 예약금

### 3. 메인 탭
| 탭 | 경로 | 기능 |
|---|---|---|
| 홈 | `/home` | 오늘 요약, 최근 상담, 새 상담 CTA |
| 기록 | `/records` | 상담 기록 검색/필터, 상세 보기 |
| 고객 | `/customers` | 고객 목록, 상세(태그/스몰토크/갤러리/이력/선호도) |
| 대시보드 | `/dashboard` | KPI, 매출 차트, 서비스/고객/디자이너 분석 |
| 설정 | `/settings` | 매장정보, 선생님, 서비스, 테마 변경 |

### 4. 테마 시스템
8종 프리셋 테마 (CSS 변수 + `data-theme` 속성):
- 로즈 핑크 (기본) / 소프트 아이보리 / 웜 베이지 / 모던 블랙
- 라벤더 퍼플 / 민트 그린 / 코랄 오렌지 / 올리브 그린

설정 → 테마 변경에서 실시간 전환 가능

## 전체 라우트 (29개)

### 인증
| 경로 | 화면 |
|------|------|
| `/` | 루트 (리다이렉트) |
| `/auth/splash` | 스플래시 |
| `/auth/intro` | 기능 소개 |
| `/auth/login` | 로그인 (Mock) |
| `/auth/lock` | 화면 잠금 |

### 온보딩
| 경로 | 화면 |
|------|------|
| `/onboarding` | 시작 |
| `/onboarding/shop-info` | 매장 정보 |
| `/onboarding/pricing` | 가격 설정 |
| `/onboarding/services` | 서비스 설정 |
| `/onboarding/surcharges` | 추가금 설정 |
| `/onboarding/time` | 시간 설정 |
| `/onboarding/theme` | 테마 선택 |
| `/onboarding/guide` | 사용 가이드 |
| `/onboarding/complete` | 완료 |

### 상담
| 경로 | 화면 |
|------|------|
| `/consultation` | A-1 상담 시작 |
| `/consultation/customer` | A-2 고객 정보 |
| `/consultation/step1` | A-3 기본 조건 |
| `/consultation/step2` | A-4 디자인 범위 |
| `/consultation/step3` | A-5 추가 옵션 |
| `/consultation/pro` | A-6 Pro 모드 |
| `/consultation/canvas` | A-7 캔버스 |
| `/consultation/summary` | A-8 최종 확인 |

### 메인
| 경로 | 화면 |
|------|------|
| `/home` | 홈 |
| `/records` | 기록 목록 |
| `/records/[id]` | 기록 상세 |
| `/customers` | 고객 목록 |
| `/customers/[id]` | 고객 상세 |
| `/dashboard` | 대시보드 |
| `/settings` | 설정 |

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── auth/               # 인증 (splash, intro, login)
│   ├── onboarding/         # 온보딩 8단계
│   ├── (main)/             # 메인 탭 (탭바 공유)
│   │   ├── home/
│   │   ├── records/
│   │   ├── customers/
│   │   ├── dashboard/
│   │   └── settings/
│   └── consultation/       # 상담 흐름 (탭바 숨김)
├── components/
│   ├── ui/                 # 공용 UI (Button, Card, Modal 등 13개)
│   ├── layout/             # AppShell, TabBar, StatusBar
│   ├── consultation/       # 상담 컴포넌트 15개
│   ├── canvas/             # 캔버스 컴포넌트 7개
│   ├── dashboard/          # 차트 컴포넌트 5개
│   └── theme/              # ThemeSelector, ThemeProvider
├── store/                  # Zustand 7개 (consultation, theme, app, auth, reservation, parts, locale)
├── lib/                    # 유틸 (cn, format, i18n, labels, price-calculator, time-calculator)
├── data/                   # Mock 데이터 7개
├── types/                  # TypeScript 타입 8개
└── config/                 # 테마 프리셋
```

## 상태 관리

| Store | 영속성 | 용도 |
|-------|--------|------|
| `consultation-store` | sessionStorage | 진행 중 상담 데이터, 현재 스텝 |
| `theme-store` | localStorage | 선택된 테마 ID |
| `app-store` | localStorage | 온보딩 완료 여부, 매장 설정 |
| `auth-store` | — | 인증 상태 |
| `reservation-store` | — | 예약 관리 |
| `parts-store` | — | 파츠 관리 |
| `locale-store` | localStorage | 다국어 설정 |

## Mock 데이터

| 파일 | 내용 |
|------|------|
| `mock-customers.ts` | 고객 5명+ (이름, 전화, 선호도, 이력) |
| `mock-consultations.ts` | 상담 기록 10건+ |
| `mock-shop.ts` | 매장 "네일숲" + 디자이너 3명 |
| `mock-dashboard.ts` | KPI, 일별 매출 30일, 서비스 통계 |
| `mock-reservations.ts` | 예약 데이터 |
| `service-options.ts` | 쉐입 7종, 디자인 4종, 기법, 파츠, 가격 |
| `tag-presets.ts` | 성향 태그 7카테고리 |

## 스크립트

```bash
pnpm dev        # 개발 서버 (Turbopack)
pnpm build      # 프로덕션 빌드
pnpm start      # 프로덕션 서버
pnpm lint       # ESLint
```

## 현재 상태

**Phase 1 데모 완료** — 125개 소스 파일, 29개 라우트, 빌드 성공

Phase 2 개선 과제는 [`TODO.md`](./TODO.md) 참조.

## 관련 문서

| 파일 | 내용 |
|------|------|
| `prd.md` | PRD v2.0 |
| `TODO.md` | Phase 2 개선 과제 (우선순위별) |
| `analysis-report.md` | 4명 분석가 종합 보고서 |
