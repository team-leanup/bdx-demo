# Consultation Flow (상담 플로우)

외국인 고객과의 상담을 위한 다국어 인터페이스.

## Language Policy

**Dual Language Display 필수!**

모든 사용자 노출 텍스트는 선택 언어 + 한국어 보조 표시:

```tsx
const t = useT();       // 함수 직접 반환 (NOT destructuring!)
const tKo = useKo();    // 함수 직접 반환
const locale = useLocale();

<span className="text-lg font-black">{t('namespace.key')}</span>
{locale !== 'ko' && (
  <span className="text-xs text-text-muted opacity-60">{tKo('namespace.key')}</span>
)}
```

## Page Flow (3단계 — 2026-03-27 회의 결정)

```
/consultation          # 진입 화면 (디자이너 선택 / customer_link 스플래시)
├── /step1             # Step 1/3: 포트폴리오 + 기본 조건 (부위/오프/연장/쉐입)
├── /step2             # Step 2/3: 시술 유형 (원컬러/그라데이션/마그네틱/아트)
├── /customer          # Step 3/3: 고객 정보 입력 (마지막)
├── /summary           # 최종 요약 및 저장
├── /canvas            # (보조 도구 — 메인 플로우 외)
└── /traits            # (보조 도구 — 메인 플로우 외)
```

STEP_ORDER: `START → STEP1_BASIC → STEP2_DESIGN → CUSTOMER_INFO → SUMMARY`

## State Management

- 상담 데이터: `useConsultationStore`
- 가격 계산: 하단 바에 실시간 표시
- 상담 종료시: `restoreLocale()` 호출하여 언어 복원

## Component Patterns

### Option Selector

```tsx
// 옵션 선택 UI는 항상 dual language
// 주의: const t = useT(); const tKo = useKo(); (함수 직접 반환)
<OptionCard
  label={t('consultation.option.gel')}
  subLabel={locale !== 'ko' ? tKo('consultation.option.gel') : undefined}
  selected={selected}
  onSelect={onSelect}
/>
```

### Price Display

```tsx
// 가격은 항상 한국어 포맷
<PriceBar total={calculateTotal()} />  // "50,000원"
```

## Known Issues

- SVG `<text>`는 동적 크기 불가 → HTML 오버레이 사용
- 중국어/일본어 폰트: Pretendard가 CJK 지원
