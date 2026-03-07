# Main Pages (사장님 전용)

사장님이 사용하는 관리 페이지. **항상 한국어**.

## Language Policy

이 라우트 그룹은 `layout.tsx`에서 `setLocale('ko')` 강제.
번역 훅 불필요 - 한국어 텍스트 직접 사용 가능.

```tsx
// 번역 훅 없이 바로 한국어 사용 OK
<h1>오늘의 예약</h1>
<Button>새 상담 시작</Button>
```

## Pages

| 경로 | 용도 |
|------|------|
| `/home` | 홈 대시보드 (오늘 요약, 최근 상담) |
| `/records` | 예약 타임그리드 + 상담 기록 |
| `/customers` | 고객 목록/상세 (태그, 이력, 선호도) |
| `/dashboard` | KPI, 매출 차트, 분석 |
| `/settings` | 매장 정보, 서비스, 테마 설정 |

## Shared Layout

- `TabBar`: 하단 탭 네비게이션 (5개 탭)
- `StatusBar`: 상단 상태 표시
- `AppShell`: 공통 레이아웃 래퍼

## State

- 인증: `useAuthStore`
- 앱 설정: `useAppStore`
- 고객 데이터: `useCustomerStore`

## UI Patterns

```tsx
// 카드 스타일 통일
<div className="bg-surface rounded-2xl p-4 shadow-sm">
  <h3 className="text-lg font-bold text-text">제목</h3>
  <p className="text-text-muted">설명</p>
</div>
```
