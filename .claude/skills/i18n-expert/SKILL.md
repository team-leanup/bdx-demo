---
name: i18n-expert
description: BDX 프로젝트 다국어 시스템 전문가. 번역 키 추가, dual language 패턴, 언어별 UI 처리시 자동 적용.
---

# i18n Expert for BDX

이 프로젝트의 다국어 시스템(ko/en/zh/ja)을 정확히 구현하기 위한 전문 가이드.

## 핵심 개념

### 3가지 i18n 훅

```tsx
import { useT, useKo, useLocale } from '@/lib/i18n';

// 1. useT() - 현재 선택된 언어로 번역 (함수 직접 반환!)
const t = useT();
t('common.greeting');  // 영어 선택시: "Hello"

// 2. useKo() - 항상 한국어 (사장님 보조용, 함수 직접 반환!)
const tKo = useKo();
tKo('common.greeting');  // 항상: "안녕하세요"

// 3. useLocale() - 현재 언어 코드
const locale = useLocale();  // 'ko' | 'en' | 'zh' | 'ja'
```

**주의: `const { t } = useT()` 아님! 함수 직접 반환됨.**

### 번역 키 구조 (src/lib/i18n.ts)

중첩 구조 사용 — `translations[locale][namespace][key]` 형태:

```typescript
const translations = {
  ko: {
    common: {
      greeting: '안녕하세요',
      next: '다음',
      back: '이전',
    },
    consultation: {
      step1: {
        title: '기본 정보',
      },
    },
  },
  en: {
    common: {
      greeting: 'Hello',
      next: 'Next',
      back: 'Back',
    },
    consultation: {
      step1: {
        title: 'Basic Info',
      },
    },
  },
  // zh, ja도 동일 구조
};
```

## 페이지별 언어 정책

### (main)/* - 사장님 전용 (한국어만)

```tsx
// src/app/(main)/layout.tsx
'use client';

import { useEffect } from 'react';
import { setLocale } from '@/lib/i18n';

export default function MainLayout({ children }) {
  useEffect(() => {
    setLocale('ko');  // 강제 한국어
  }, []);
  
  return <>{children}</>;
}
```

**규칙:** 
- `(main)/*` 하위 페이지는 번역 불필요
- 그냥 한국어 텍스트 사용 가능
- `t()` 훅 사용해도 되지만 불필요

### consultation/* - 다국어 + 한국어 보조

**Dual Language Display Pattern (핵심!):**

```tsx
'use client';

import { useT, useKo, useLocale } from '@/lib/i18n';

export function ConsultationOption({ labelKey }: { labelKey: string }) {
  const t = useT();      // 함수 직접 반환 (NOT destructuring!)
  const tKo = useKo();   // 함수 직접 반환
  const locale = useLocale();
  
  return (
    <div className="flex flex-col">
      {/* 메인: 선택된 언어 */}
      <span className="text-lg font-black text-text">
        {t(labelKey)}
      </span>
      
      {/* 보조: 한국어 (ko가 아닐 때만) */}
      {locale !== 'ko' && (
        <span className="text-xs text-text-muted opacity-60">
          {tKo(labelKey)}
        </span>
      )}
    </div>
  );
}
```

**왜 이렇게?**
- 외국인 고객: 자기 언어로 선택지 확인
- 사장님: 한국어 보조 라벨로 어떤 옵션인지 파악

## 상담 언어 전환

### setLocale vs setConsultationLocale

```tsx
import { setLocale, setConsultationLocale, restoreLocale } from '@/lib/i18n';

// 직접 설정 (백업 없음)
setLocale('en');

// 상담용 설정 (이전 언어 백업)
setConsultationLocale('en');  // 이전 언어(ko) 저장

// 상담 종료 후 복원
restoreLocale();  // 다시 ko로
```

**사용 시나리오:**
1. 사장님이 홈에서 작업 중 (한국어)
2. 상담 시작 → `setConsultationLocale('en')` (영어로 전환, 한국어 백업)
3. 상담 진행 (영어 UI)
4. 상담 완료 → `restoreLocale()` (한국어로 복원)

## 새 번역 키 추가하기

### 1. i18n.ts에 키 추가

```typescript
// src/lib/i18n.ts
const translations = {
  // ... 기존 키들
  
  // 새 키 추가 (4개 언어 모두 필수!)
  'newFeature.title': {
    ko: '새로운 기능',
    en: 'New Feature',
    zh: '新功能',
    ja: '新機能',
  },
};
```

### 2. 컴포넌트에서 사용

```tsx
const t = useT();  // 함수 직접 반환!

<h1>{t('newFeature.title')}</h1>
```

## 특수 케이스

### 숫자/가격 포맷

```tsx
// 가격은 항상 한국어 포맷 (원화)
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
};

// 사용
<span>{formatPrice(50000)}</span>  // "50,000원"
```

### 날짜 포맷

```tsx
const formatDate = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};
```

### 복수형 처리

```tsx
// 간단한 경우: 언어별 분기
const getItemCount = (count: number, locale: string): string => {
  if (locale === 'ko') return `${count}개`;
  if (locale === 'ja') return `${count}個`;
  if (locale === 'zh') return `${count}个`;
  return `${count} items`;
};
```

### SVG 내 텍스트 (Known Issue)

SVG `<text>`는 동적 크기 조절 불가 → HTML 오버레이 사용:

```tsx
// ❌ SVG 내 다국어 텍스트 (크기 문제)
<svg>
  <text>{t('label')}</text>
</svg>

// ✅ HTML 오버레이 뱃지
<div className="relative">
  <svg>...</svg>
  <span className="absolute top-2 right-2 text-xs">
    {t('label')}
  </span>
</div>
```

## 체크리스트

새 페이지/컴포넌트 작성시:

- [ ] `(main)/*` 인가? → 한국어만 사용 OK
- [ ] `consultation/*` 인가? → Dual Language 패턴 필수
- [ ] `const t = useT()` 사용했나? (NOT `const { t } = useT()`)
- [ ] 모든 사용자 노출 텍스트에 `t()` 적용했나?
- [ ] 4개 언어 번역 모두 추가했나?
- [ ] 사장님 보조 라벨 필요한가? → `tKo()` + locale 체크
