# BDX (Beauty Decision eXperience)

네일 샵 상담 플로우 앱. 사장님이 외국인 고객과 상담할 때 다국어 UI를 제공.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 (`@theme` 블록, CSS 변수 기반) |
| State | Zustand 5 |
| Animation | framer-motion 11 |
| Package Manager | **pnpm** (npm/yarn 절대 금지) |
| Deployment | Vercel |

## Commands

```bash
pnpm dev              # 개발 서버 (turbopack)
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint
npx tsc --noEmit      # 타입 체크
npx vercel --prod     # Vercel 프로덕션 배포
```

## Directory Structure

```
src/
├── app/
│   ├── (main)/              # 사장님 전용 (항상 한국어)
│   │   ├── home/            # 홈 대시보드
│   │   ├── records/         # 예약/상담 기록
│   │   ├── customers/       # 고객 관리
│   │   ├── dashboard/       # 통계
│   │   └── settings/        # 설정
│   ├── consultation/        # 상담 플로우 (다국어 ko/en/zh/ja)
│   │   ├── customer/        # Step 1: 고객 정보
│   │   ├── step1~3/         # 시술 옵션 선택
│   │   ├── canvas/          # 네일 디자인 캔버스
│   │   └── summary/         # 최종 확인
│   └── globals.css          # Tailwind v4 테마
├── components/
│   ├── ui/                  # 공용 UI 컴포넌트
│   ├── layout/              # AppShell, TabBar, StatusBar
│   ├── consultation/        # 상담 전용 컴포넌트
│   └── canvas/              # 캔버스 컴포넌트
├── store/                   # Zustand 스토어
├── lib/
│   └── i18n.ts              # 다국어 시스템
├── types/                   # TypeScript 타입 정의
└── data/                    # 목업 데이터
```

## Code Standards

### TypeScript
- `strict: true` 필수
- `as any`, `@ts-ignore`, `@ts-expect-error` 절대 금지
- 내보내는 함수는 명시적 반환 타입 작성
- `unknown` + 타입 가드 패턴 선호

### React / Next.js
- Server Components 기본 (클라이언트 필요시만 `'use client'`)
- 컴포넌트 파일명: PascalCase (Button.tsx)
- Props interface는 컴포넌트 바로 위에 정의
- JSX 내 인라인 함수 최소화

### Tailwind CSS v4
- `@theme` 블록에서 CSS 변수 정의
- `--color-primary`, `--color-text` 등 → `bg-primary`, `text-text` 유틸리티 자동 생성
- 인라인 스타일 금지, Tailwind 유틸리티만 사용
- 반응형: mobile-first (`sm:`, `md:`, `lg:`)

### Zustand Store
```tsx
// 타입 정의 패턴
interface StoreState {
  items: Item[];
  addItem: (item: Item) => void;
}

export const useStore = create<StoreState>((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}));
```

## i18n System (Critical!)

### 지원 언어
`ko` (한국어) | `en` (영어) | `zh` (중국어) | `ja` (일본어)

### 3가지 i18n 훅
| Hook | Purpose |
|------|---------|
| `useT()` → `t('namespace.key')` | 현재 선택 언어로 번역 (함수 직접 반환) |
| `useKo()` → `tKo('namespace.key')` | 항상 한국어 (함수 직접 반환) |
| `useLocale()` | 현재 언어 코드 반환 |

### 번역 키 구조
중첩 구조 사용: `t('common.next')`, `t('consultation.step1.title')`

### Dual Language Display Pattern
상담 페이지에서 외국어 + 한국어 보조 표시:

```tsx
const t = useT();       // 함수 직접 반환 (NOT destructuring)
const tKo = useKo();    // 함수 직접 반환
const locale = useLocale();

<span className="text-lg font-black">{t('common.next')}</span>
{locale !== 'ko' && (
  <span className="text-xs text-text-muted opacity-60">{tKo('common.next')}</span>
)}
```

### Page Language Policy
- `(main)/*` → **항상 한국어** (layout.tsx에서 `setLocale('ko')` 강제)
- `consultation/*` → **선택 언어 + 한국어 보조**

### setLocale vs setConsultationLocale
- `setLocale(locale)`: 직접 설정 (백업 없음)
- `setConsultationLocale(locale)`: 이전 언어 백업 → 상담 종료 시 복원

## 피드백 & 개발 추적 프로세스 (필수 — 자동화)

### 문서 구조
| 파일 | 용도 |
|------|------|
| `docs/checklist.md` | 개발 체크리스트 — "지금 상태 → 할 일"이 항목별로 정리됨 |
| `docs/detail.md` | 기능 상세 명세 — 개요, 인터뷰 근거, 기술 설계, 히스토리 |

### 체크리스트 자동 업데이트 (Claude Code 필수 규칙)

**개발 작업 시 checklist.md를 반드시 함께 업데이트한다.**

1. **작업 시작 시**: 해당 항목 상태를 `🟡 진행중`으로 변경
2. **작업 완료 시** (커밋 직전): 아래 3가지를 반드시 수행
   - `docs/checklist.md` — 해당 항목 상태를 `🟢 완료`로 변경, "지금/할 일" 내용을 완료 내용으로 갱신
   - `docs/checklist.md` — 하단 **진행 요약** 테이블 숫자 갱신
   - `docs/detail.md` — 해당 기능 **히스토리 테이블**에 날짜 + 변경 내용 추가
3. **이슈 발생 시**: 상태를 `🔴 블로커`로 변경, 항목 아래에 이슈 내용 추가
4. **부분 완료 시**: 상태를 `🔵 부분완료`로 변경, 남은 작업 명시

### 체크리스트 상태 범례
`⬜ 미착수` · `🟡 진행중` · `🔵 부분완료` · `🟢 완료` · `🔴 블로커`

### 새 피드백 추가 시
1. `docs/checklist.md`에 해당 카테고리에 항목 추가 (번호 부여)
2. `docs/detail.md`에 상세 섹션 추가
3. 진행 요약 테이블 갱신

### Production QA 트래킹 (필수!)

**버그 수정 또는 기능 변경 시 `docs/qa-production.md`를 반드시 함께 업데이트한다.**

1. **버그 수정 시**: 해당 BUG-# 항목에 ~~취소선~~ + `✅ 수정됨 (커밋 xxx)` 추가
2. **테스트 항목 상태 변경 시**: 해당 항목의 `상태` 컬럼 업데이트 (⬜→✅ 또는 ⚠️→✅)
3. **진행 요약 테이블** 숫자 갱신
4. **새 이슈 발견 시**: 버그 요약 섹션에 BUG-# 추가, 해당 테스트 항목 상태 변경

## Known Issues & Solutions

### .next 캐시 손상
```bash
pkill -f "next" && rm -rf .next && pnpm dev
```

### SVG 내 텍스트 다국어
SVG `<text>`는 동적 크기 불가 → HTML 오버레이 뱃지 사용 (OffSelector 참고)

### 빌드 전 체크
```bash
pnpm lint && npx tsc --noEmit && pnpm build
```

## DO NOT

- npm/yarn 사용 (pnpm만 사용)
- `as any` 타입 단언
- 빈 catch 블록 `catch(e) {}`
- 테스트 삭제로 "통과" 처리
- `.env` 파일 커밋
- 인라인 스타일 (Tailwind 사용)
- 버그 수정 중 리팩토링

## File Naming Convention

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `Button.tsx`, `CustomerCard.tsx` |
| Hook | camelCase, use prefix | `useAuth.ts`, `useConsultation.ts` |
| Utility | camelCase | `formatPrice.ts`, `i18n.ts` |
| Store | kebab-case | `auth-store.ts`, `consultation-store.ts` |
| Type | kebab-case | `customer-types.ts` |
