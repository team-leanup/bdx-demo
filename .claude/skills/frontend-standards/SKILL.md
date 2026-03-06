---
name: frontend-standards
description: Next.js 15 + TypeScript + Tailwind v4 프론트엔드 개발 표준. React 컴포넌트 작성, 상태 관리, 스타일링 작업시 자동 적용.
---

# Frontend Development Standards

이 스킬은 프론트엔드 코드 작성시 프로젝트 표준을 준수하도록 가이드합니다.

## Component Architecture

### Server vs Client Components

```tsx
// 기본: Server Component (no directive)
export function StaticCard({ title }: { title: string }) {
  return <div>{title}</div>;
}

// 상태/이벤트 필요시만: Client Component
'use client';

import { useState } from 'react';

export function InteractiveCard() {
  const [open, setOpen] = useState(false);
  return <div onClick={() => setOpen(!open)}>...</div>;
}
```

**규칙:**
- `useState`, `useEffect`, `onClick` 등 → `'use client'` 필수
- 데이터 fetch만 하는 컴포넌트 → Server Component 유지
- `'use client'`는 파일 최상단에 작성

### Props & Types

```tsx
// Props는 컴포넌트 바로 위에 interface로 정의
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ 
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
}: ButtonProps) {
  // ...
}
```

**금지 패턴:**
```tsx
// ❌ any 사용 금지
const handleClick = (e: any) => { }

// ❌ @ts-ignore 금지  
// @ts-ignore
const value = someUnknownType.property;

// ✅ unknown + type guard 사용
const handleData = (data: unknown) => {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    // 타입 안전하게 사용
  }
};
```

## Styling with Tailwind v4

### CSS Variables Theme

이 프로젝트는 `globals.css`의 `@theme` 블록에서 CSS 변수를 정의:

```css
@theme {
  --color-primary: oklch(0.65 0.15 15);
  --color-primary-dark: oklch(0.55 0.15 15);
  --color-text: oklch(0.2 0.02 30);
  --color-text-muted: oklch(0.5 0.02 30);
}
```

→ 자동으로 `bg-primary`, `text-text-muted` 등 유틸리티 생성

### Tailwind 패턴

```tsx
// ✅ 올바른 패턴
<div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
  <span className="text-lg font-bold text-text">{title}</span>
</div>

// ❌ 인라인 스타일 금지
<div style={{ display: 'flex', padding: '16px' }}>

// ❌ CSS 모듈 금지 (Tailwind만 사용)
import styles from './Card.module.css';
```

### Responsive Design

Mobile-first 접근:

```tsx
// 기본 = 모바일, sm/md/lg = 점진적 확대
<div className="
  p-4          // 모바일: 16px
  sm:p-6       // 640px+: 24px  
  lg:p-8       // 1024px+: 32px
  
  grid 
  grid-cols-1  // 모바일: 1열
  md:grid-cols-2  // 768px+: 2열
  lg:grid-cols-3  // 1024px+: 3열
">
```

## State Management (Zustand)

### Store 정의 패턴

```tsx
// src/store/example-store.ts
import { create } from 'zustand';

interface ExampleState {
  items: Item[];
  selectedId: string | null;
  
  // Actions
  addItem: (item: Item) => void;
  selectItem: (id: string) => void;
  reset: () => void;
}

const initialState = {
  items: [],
  selectedId: null,
};

export const useExampleStore = create<ExampleState>((set) => ({
  ...initialState,
  
  addItem: (item) => set((s) => ({ 
    items: [...s.items, item] 
  })),
  
  selectItem: (id) => set({ selectedId: id }),
  
  reset: () => set(initialState),
}));
```

### Store 사용 패턴

```tsx
'use client';

import { useExampleStore } from '@/store/example-store';

export function ItemList() {
  // 필요한 상태만 선택 (리렌더 최적화)
  const items = useExampleStore((s) => s.items);
  const addItem = useExampleStore((s) => s.addItem);
  
  // ❌ 전체 스토어 가져오기 금지 (불필요한 리렌더)
  // const store = useExampleStore();
  
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

## Animation (Framer Motion)

### 기본 패턴

```tsx
'use client';

import { motion } from 'framer-motion';

export function AnimatedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      Content
    </motion.div>
  );
}
```

### Page Transition

```tsx
// layout.tsx에서 AnimatePresence 래핑
<AnimatePresence mode="wait">
  {children}
</AnimatePresence>

// page.tsx에서 motion 적용
<motion.main
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
```

## File Organization

| Type | Location | Naming |
|------|----------|--------|
| Page | `src/app/**/page.tsx` | lowercase folder |
| Layout | `src/app/**/layout.tsx` | lowercase folder |
| UI Component | `src/components/ui/` | PascalCase.tsx |
| Feature Component | `src/components/{feature}/` | PascalCase.tsx |
| Store | `src/store/` | kebab-case.ts |
| Types | `src/types/` | kebab-case.ts |
| Utils | `src/lib/` | camelCase.ts |

## Performance Checklist

- [ ] Server Component 가능하면 Server Component 사용
- [ ] 큰 리스트는 가상화 고려 (`react-window`)
- [ ] 이미지는 `next/image` 사용
- [ ] 동적 import로 코드 분할 (`next/dynamic`)
- [ ] Zustand selector로 불필요한 리렌더 방지
- [ ] `useMemo`, `useCallback`은 측정 후에만 적용
