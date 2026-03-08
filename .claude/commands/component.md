---
description: React 컴포넌트 생성 (프로젝트 표준 준수)
---

# Create Component

## Arguments

$ARGUMENTS 형식: `ComponentName [--path=경로] [--client]`

예시:
- `Button` → `src/components/ui/Button.tsx`
- `CustomerCard --path=customers` → `src/components/customers/CustomerCard.tsx`
- `PriceDisplay --client` → 클라이언트 컴포넌트로 생성

## Template

```tsx
// 'use client' 추가 (--client 옵션시)

interface ComponentNameProps {
  // props 정의
}

export function ComponentName({ }: ComponentNameProps) {
  return (
    <div>
      {/* 구현 */}
    </div>
  );
}
```

## Rules

1. **파일명**: PascalCase (`Button.tsx`)
2. **export**: named export 사용 (`export function`)
3. **Props**: 컴포넌트 바로 위에 interface 정의
4. **Styling**: Tailwind 유틸리티만 사용 (인라인 스타일 금지)
5. **Client**: 상태/이벤트 필요시에만 `'use client'`
6. **i18n**: 텍스트가 있으면 `useT()` 훅 사용

## After Creation

1. 생성된 파일 경로 출력
2. 기본 구조 설명
3. 필요시 추가 props 제안
