# BDX (Beauty Decision eXperience) — Claude Code 프로젝트 가이드

## 프로젝트 개요
네일 샵 상담 플로우 앱. 사장님이 외국인 고객과 상담할 때 다국어 UI를 제공.

## 기술 스택
- **프레임워크**: Next.js App Router + TypeScript
- **스타일**: Tailwind CSS v4 (`@theme` 블록, CSS 변수 기반)
- **상태 관리**: Zustand
- **애니메이션**: framer-motion
- **패키지 매니저**: `pnpm`
- **배포**: Vercel (`bdx-demo.vercel.app`)

## 주요 명령어
```bash
pnpm dev          # 개발 서버 (turbopack)
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint
npx tsc --noEmit  # 타입 체크
npx vercel --prod --yes  # Vercel 프로덕션 배포
```

## 디렉토리 구조
```
src/
├── app/
│   ├── (main)/          # 사장님 전용 (항상 한국어)
│   │   ├── layout.tsx   # setLocale('ko') 강제
│   │   ├── home/        # 홈 대시보드
│   │   ├── records/     # 예약/상담 기록
│   │   ├── customers/   # 고객 관리
│   │   ├── dashboard/   # 통계
│   │   └── settings/    # 설정
│   ├── consultation/    # 상담 플로우 (다국어 ko/en/zh/ja)
│   │   ├── customer/    # Step 1: 고객 정보
│   │   ├── step1/       # Step 2: 기본 조건 (부위/오프/연장/쉐입)
│   │   ├── step2/       # Step 3: 시술 범위
│   │   ├── step3/       # Step 4: 추가 옵션
│   │   ├── canvas/      # 네일 디자인 캔버스
│   │   └── summary/     # 최종 확인
│   └── globals.css      # Tailwind v4 테마 (핑크/오렌지/브라운 등)
├── components/          # UI 컴포넌트
├── store/               # Zustand 스토어
├── lib/
│   └── i18n.ts          # 다국어 시스템 (ko/en/zh/ja)
├── types/               # TypeScript 타입 정의
└── data/                # 목업 데이터, 서비스 옵션
```

## i18n 시스템 (중요!)

### 3개의 i18n 훅
| 훅 | 용도 |
|---|------|
| `useT()` → `t(key)` | 현재 선택 언어로 번역 |
| `useKo()` → `tKo(key)` | 항상 한국어 (보조 라벨용) |
| `useLocale()` | 현재 언어 코드 반환 |

### 이중 언어 표시 패턴 (상담 페이지)
```tsx
<span className="text-lg font-black">{t(key)}</span>
{locale !== 'ko' && (
  <span className="text-xs text-text-muted opacity-60">{tKo(key)}</span>
)}
```

### 페이지별 언어 정책
- `(main)/*` → **항상 한국어** (layout.tsx에서 강제)
- `consultation/*` → **선택 언어 + 한국어 보조**

### setLocale vs setConsultationLocale
- `setLocale(locale)`: 직접 설정 (이전 언어 백업 안 함)
- `setConsultationLocale(locale)`: 이전 언어 백업 후 설정 → 상담 종료 시 복원

## Tailwind CSS v4 참고
- `@theme` 블록에서 CSS 변수 기반 색상 정의
- `--color-primary`, `--color-primary-dark`, `--color-text` 등
- 자동으로 `bg-primary`, `bg-primary-dark`, `text-text` 등 유틸리티 생성

## 알려진 이슈 & 해결법

### .next 캐시 손상
```bash
pkill -f "next" && rm -rf .next && pnpm dev
```

### SVG 내 텍스트 다국어
SVG `<text>`는 동적 크기 불가 → HTML 오버레이 뱃지 사용 (OffSelector 참고)

### 에이전트 위임 시
`dontAsk` 모드 사용 (`bypassPermissions`는 Edit 도구 권한 문제 있음)
