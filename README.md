# BDX — Beauty Decision eXperience

네일샵 현장 상담 & 고객 관리 플랫폼 데모

## 개요

BDX는 네일샵에서 고객 상담부터 가격 산출, 시술 기록, 고객 관리까지 전체 워크플로우를 태블릿에서 처리할 수 있는 플랫폼입니다. 이 데모는 **Mock 데이터 기반 인터랙티브 프로토타입**으로, 전체 서비스 흐름을 체험할 수 있습니다.

- **데모**: https://bdx-demo.vercel.app

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
스플래시 → 기능소개(2슬라이드) → 로그인(Mock) → 온보딩 7단계
  ├── 매장 정보
  ├── 시술 카테고리
  ├── 기본 가격
  ├── 추가금 설정
  ├── 소요시간
  ├── 테마 선택 (9종)
  └── 완료 → 홈
```

### 2. 상담 흐름
```
상담 시작(디자이너 선택) → 고객 정보 → 기본 조건(부위/오프/연장/쉐입)
→ 디자인 범위 → 추가 옵션(표현기법/파츠/컬러)
→ 네일 캔버스(손가락별 선택) → 최종 요약(저장)
```
- 실시간 가격 계산 (하단 바에 지속 표시)
- 4개 국어 지원 (한국어/영어/중국어/일본어)

### 3. 메인 탭
| 탭 | 경로 | 기능 |
|---|---|---|
| 홈 | `/home` | 오늘 요약, 최근 상담, 새 상담 CTA |
| 기록 | `/records` | 예약 타임그리드 + 상담 기록 검색/필터 |
| 고객 | `/customers` | 고객 목록, 상세(태그/스몰토크/이력/선호도/멤버십) |
| 대시보드 | `/dashboard` | KPI, 매출 차트, 서비스/고객/디자이너 분석 (사장님 전용) |
| 설정 | `/settings` | 매장정보, 서비스, 테마, 앱 설정 |

### 4. 테마 시스템
9종 프리셋 테마 (CSS 변수 + `data-theme` 속성):
- 웜 코랄 / 로즈 핑크 (기본) / 모카 브라운 / 퓨어 아이보리
- 올리브 그린 / 파스텔 블루 / 파스텔 라일락 / 화이트 크리스탈 / 클린 블랙

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── auth/               # 인증 (splash, intro, login, lock)
│   ├── onboarding/         # 온보딩 7단계
│   ├── (main)/             # 메인 탭 (탭바 공유)
│   │   ├── home/
│   │   ├── records/
│   │   ├── customers/
│   │   ├── dashboard/
│   │   └── settings/
│   └── consultation/       # 상담 흐름 (탭바 숨김)
├── components/
│   ├── ui/                 # 공용 UI (Button, Card, Modal 등)
│   ├── layout/             # AppShell, TabBar, StatusBar
│   ├── consultation/       # 상담 컴포넌트
│   ├── canvas/             # 캔버스 컴포넌트
│   ├── dashboard/          # 차트 컴포넌트
│   └── theme/              # ThemeSelector, ThemeProvider
├── store/                  # Zustand 스토어
├── lib/                    # 유틸리티
├── data/                   # Mock 데이터
├── types/                  # TypeScript 타입
└── config/                 # 테마 프리셋
```

## 스크립트

```bash
pnpm dev        # 개발 서버 (Turbopack)
pnpm build      # 프로덕션 빌드
pnpm lint       # ESLint
pnpm typecheck  # 타입 체크
```

## 관련 문서

| 파일 | 내용 |
|------|------|
| [`docs/BDX-데모-소개.docx`](docs/BDX-데모-소개.docx) | 플랫폼 소개 (Word) |
| [`docs/prd.md`](docs/prd.md) | PRD v2.0 |
| [`docs/BDS 기능명세서 v3.0.xlsx`](docs/BDS%20기능명세서%20v3.0.xlsx) | 기능명세서 |
| [`docs/BDS 최종 UX 흐름도`](docs/BDS%20최종%20UX%20흐름도%20(마이페이지,온보딩%20포함).pdf) | UX 흐름도 |
| [`docs/BDS 네일 용어 가이드북`](docs/BDS%20네일%20용어%20가이드북%20(네일%20쉐입%20이미지%20포함).pdf) | 네일 용어 가이드북 |
