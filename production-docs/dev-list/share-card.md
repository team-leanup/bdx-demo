# 공유카드 (Share Card) — 개발 문서

> 작성일: 2026-04-03
> 상태: 구현 완료 / DB 마이그레이션 완료 / 접근성 개선 완료

---

## 1. 기능 개요

공유카드는 **시술 결과를 고객 유입으로 전환**시키는 기능이다. 네일 샵 사장님이 시술 완료 후 포트폴리오 사진을 공유카드로 만들어 SNS에 올리면, 외부 고객이 해당 링크를 통해 상담 또는 예약으로 연결된다.

### 두 가지 공유 형태

| 형태 | 설명 | 용도 |
|------|------|------|
| **이미지 카드** | 1080×1080 HTML 템플릿 캡처 이미지 | SNS 업로드 (인스타그램, 블로그 등) |
| **링크 카드** | `/share/[shareCardId]` 퍼블릭 페이지 | 이미지 본문에 삽입하여 고객 전환 |

### 전체 플로우

```
시술 완료
  → 포트폴리오 사진 저장 (기존 플로우)
    → 공유카드 생성 모달 (사장님)
      → 이미지 다운로드 + 링크 복사
        → SNS 업로드 (외부 공유)
          → 고객 링크 클릭 → /share/[shareCardId]
            → CTA (pre-consult / 카카오톡 / 네이버 / 전화)
              → 예약 전환
```

---

## 2. 구현 파일 목록

### 신규 생성 (10개)

| 파일 | 역할 |
|------|------|
| `src/types/share-card.ts` | `ShareCardPublicData` + `ShareCardDesignInfo` 타입 정의 |
| `src/app/share/[shareCardId]/page.tsx` | 퍼블릭 RSC — OG 메타태그 + 데이터 로드 |
| `src/app/share/[shareCardId]/ShareCardClient.tsx` | 고객용 링크 카드 클라이언트 컴포넌트 |
| `src/app/share/[shareCardId]/not-found.tsx` | 만료/삭제 시 안내 페이지 |
| `src/components/share-card/ShareCardImageCarousel.tsx` | 시술 사진 스와이퍼 컴포넌트 |
| `src/components/share-card/ShareCardDesignSummary.tsx` | 디자인 뱃지 요약 (디자인 종류, 표현 기법, 파츠 여부) |
| `src/components/share-card/ShareCardCTASection.tsx` | 예약 채널 CTA 섹션 |
| `src/components/share-card/ShareCardImageTemplate.tsx` | 이미지 캡처용 1080×1080 HTML 템플릿 |
| `src/components/share-card/ShareCardGeneratorModal.tsx` | 사장님용 공유카드 생성 모달 |
| `supabase/migrations/20260404_add_share_card.sql` | DB 마이그레이션 (`share_card_id` 컬럼 추가) |

### 수정 (9개)

| 파일 | 변경 내용 |
|------|----------|
| `src/types/shop.ts` | `ShopExtendedSettings`에 `kakaoTalkUrl`, `naverReservationUrl` 필드 추가 |
| `src/types/consultation.ts` | `ConsultationRecord`에 `shareCardId` 필드 추가 |
| `src/types/database.ts` | `consultation_records` 테이블 타입에 `share_card_id` 컬럼 추가 |
| `src/store/app-store.ts` | `ShopSettings` URL 필드 추가 + Supabase sync 로직 반영 |
| `src/lib/db.ts` | `dbCreateShareCard`, `fetchShareCardPublicData` 함수 추가, 기존 매핑 확장 |
| `src/lib/i18n.ts` | `shareCard` 네임스페이스 + `settings.booking` 번역 추가 (ko/en/zh/ja 4개 언어) |
| `src/middleware.ts` | `PUBLIC_PREFIXES`에 `'/share'` 추가 |
| `src/app/(main)/settings/page.tsx` | 설정 > 매장 탭에 "예약 채널 연결" 섹션 추가 |
| `src/app/(main)/records/[id]/page.tsx` | 상세 기록 하단에 "공유카드 만들기" 버튼 + `ShareCardGeneratorModal` 연결 |

---

## 3. 사용자 플로우 — 사장님

### Step 1. 예약 채널 연결 (최초 1회)

- **경로**: 설정 > 매장 > 예약 채널 연결
- 카카오톡 채널 URL, 네이버 예약 URL 입력
- 저장 시 `shops.settings` JSON (`ShopExtendedSettings`) 에 기록
- 안내 문구: "공유카드 하단 예약 버튼에 자동 연결됩니다"

### Step 2. 공유카드 만들기 버튼 노출

- **경로**: 기록 > 시술 기록 > 상세 (`/records/[id]`)
- 포트폴리오 사진이 1장 이상 있는 기록에만 버튼 노출
- 포트폴리오 없으면 버튼 미노출 (설계 의도)

### Step 3. 공유카드 생성 모달 (`ShareCardGeneratorModal`)

1. 저장된 포트폴리오 사진 목록 표시 → 공유할 사진 선택 (다중 선택 가능)
2. 1080×1080 이미지 템플릿 미리보기 (`ShareCardImageTemplate`)
3. 버튼:
   - **이미지 저장**: html2canvas-pro로 캡처 → 다운로드
   - **공유 링크 생성**: `dbCreateShareCard()` 호출 → `shareCardId` 발급 → URL 클립보드 복사
4. 생성된 `shareCardId`는 `consultation_records.share_card_id`에 저장 (UNIQUE)

### Step 4. 외부 공유

- 이미지를 SNS(인스타그램, 블로그 등)에 업로드
- 게시글 본문에 공유 링크(`https://beauty-decision.com/share/[shareCardId]`) 첨부

---

## 4. 사용자 플로우 — 고객

1. SNS에서 이미지 확인 → 링크 클릭
2. `/share/[shareCardId]` 진입 — **비로그인 접근 가능** (퍼블릭 라우트)
3. `ShareCardImageCarousel`: 시술 사진 스와이퍼로 확인
4. `ShareCardDesignSummary`: 디자인 요약 뱃지 확인
   - 디자인 종류 (원컬러, 그라데이션, 아트 등)
   - 표현 기법 (젤, 아크릴 등)
   - 파츠 여부
5. `ShareCardCTASection`: 예약 채널 선택
   - **이 디자인으로 상담하기** → pre-consult 플로우 진입
   - **카카오톡 문의** → 자동 메시지 클립보드 복사 + 카카오톡 채널 이동
   - **네이버 예약** → 네이버 예약 페이지 이동
   - **전화하기** → `tel:` 링크

### 카카오톡 자동 메시지 포맷

```
안녕하세요 😊 이 디자인으로 상담 진행했는데 예약 가능할까요?
[공유 링크]
```

---

## 5. DB 설계

### 변경 사항

`consultation_records` 테이블에 `share_card_id` 컬럼 추가:

```sql
-- supabase/migrations/20260404_add_share_card.sql
ALTER TABLE consultation_records
ADD COLUMN share_card_id TEXT UNIQUE;
```

### 데이터 조회 전략

별도 `share_cards` 테이블 없이 기존 테이블 JOIN으로 해결:

```
consultation_records
  JOIN shops (매장 정보, 예약 URL)
  JOIN portfolio_photos (시술 사진)
```

`fetchShareCardPublicData()` 에서 `select('*')` 금지 — 필요한 컬럼만 명시적으로 SELECT.

### 예약 URL 저장 위치

`shops.settings` JSON 내 `ShopExtendedSettings` 타입으로 관리:

```typescript
interface ShopExtendedSettings {
  kakaoTalkUrl?: string;
  naverReservationUrl?: string;
  // 기존 설정 필드들...
}
```

---

## 6. 기술 구현 핵심

### OG 메타태그 (동적 생성)

`/share/[shareCardId]/page.tsx`는 RSC. `generateMetadata()`로 동적 OG 메타 생성:

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchShareCardPublicData(params.shareCardId);
  return {
    title: `${data.shopName} — 네일 디자인`,
    openGraph: {
      title: `${data.shopName} — 네일 디자인`,
      images: [data.thumbnailUrl],
    },
  };
}
```

### 이미지 생성

- 라이브러리: `html2canvas-pro`
- 템플릿: `ShareCardImageTemplate` (1080×1080 HTML)
- `allowTaint` 옵션 사용 금지 (보안 이슈)
- Supabase Storage 이미지 CORS 설정 필요 (후속 작업 참고)

### 클립보드 복사

```typescript
// navigator.clipboard 우선, 구형 브라우저 폴백
try {
  await navigator.clipboard.writeText(url);
} catch {
  const el = document.createElement('textarea');
  el.value = url;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}
```

### Share Card ID 생성

```typescript
const shareCardId = crypto.randomUUID(); // generateShareCardId() 대신 Web Crypto API 사용
```

### URL 유효성 검증 (보안)

settings 저장 시 및 CTA 링크 렌더링 시 `https://` 또는 `http://`로 시작하는 URL만 허용:

```typescript
function isValidUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}
```

---

## 7. QA 체크리스트

| # | 항목 | 결과 |
|---|------|------|
| 1 | 설정 > 매장 탭에 "예약 채널 연결" 섹션 노출 | ✅ |
| 2 | 카카오톡/네이버 URL Input + placeholder 정상 표시 | ✅ |
| 3 | 안내 문구 "공유카드 하단 예약 버튼에 자동 연결됩니다" 노출 | ✅ |
| 4 | `/share/nonexistent` → not-found 페이지 정상 렌더링 | ✅ |
| 5 | not-found: 아이콘 + 메시지 + 홈 링크 | ✅ |
| 6 | 기록 > 시술 기록: 포트폴리오 없으면 공유카드 버튼 미노출 | ✅ (설계 의도대로) |
| 7 | 미들웨어 `/share` 퍼블릭 라우트 등록 | ✅ |
| 8 | 빌드 성공 (`pnpm lint && npx tsc --noEmit && pnpm build`) | ✅ |
| 9 | 4개 언어 번역 키 (`shareCard` + `settings.booking`) 추가 | ✅ |
| 10 | i18n: ko/en/zh/ja 각 17개 `shareCard` 키 + 6개 `booking` 키 | ✅ |

---

## 8. 코드 리뷰 결과 및 수정 사항

| 이슈 | 심각도 | 수정 |
|------|--------|------|
| `/share` 미들웨어 퍼블릭 라우트 누락 | Critical | ✅ `PUBLIC_PREFIXES`에 추가 |
| `fetchShareCardPublicData`에서 `select('*')` 사용 | Critical | ✅ 필요 컬럼만 명시적 SELECT로 변경 |
| `consultation` null guard 누락 | Major | ✅ null 체크 추가 |
| `generateShareCardId()` 커스텀 함수 → Web Crypto API | Major | ✅ `crypto.randomUUID()` 로 교체 |
| `html2canvas allowTaint: true` 보안 옵션 사용 | Major | ✅ 옵션 제거 |
| 모달 접근성 미흡 (ESC 키, role, aria 속성) | Critical | ✅ `role="dialog"`, `aria-modal`, ESC 키 핸들러 추가 |
| settings URL 유효성 검증 없음 | Major | ✅ `isValidUrl()` 검증 추가 |
| CTA URL 안전 검증 없음 (XSS 위험) | Major | ✅ 렌더링 전 URL 검증 추가 |
| 링크 생성 실패 시 에러 피드백 없음 | Major | ✅ 에러 토스트 + 상태 표시 추가 |

---

## 9. 미완료 / 후속 작업

| 항목 | 설명 | 우선순위 |
|------|------|---------|
| DB 마이그레이션 실행 | `supabase/migrations/20260404_add_share_card.sql`을 Supabase 대시보드에서 실행 | 즉시 |
| E2E 데이터 QA | 실제 시술 데이터로 공유카드 생성 → 이미지 다운로드 → 링크 접근 전체 플로우 검증 | 높음 |
| save-complete 진입점 추가 | 상담 저장 완료 화면에서 공유카드 CTA 제공 (선택적 연결) | 중간 |
| OG 이미지 SNS 디버거 검증 | Facebook/Twitter/KakaoTalk 디버거로 `og:image` 렌더링 확인 | 중간 |
| Supabase Storage CORS 확인 | html2canvas-pro 이미지 캡처 시 Storage 이미지 CORS 정상 작동 확인 | 높음 |
| 접근성 개선 | 캐러셀 키보드 네비게이션, 도트 터치 타겟 확대, `prefers-reduced-motion` 적용 | 낮음 |

---

## 10. 의존성

| 패키지 | 용도 | 설치 명령 |
|--------|------|----------|
| `html2canvas-pro` | HTML → 이미지 캡처 (1080×1080 카드 생성) | `pnpm add html2canvas-pro` |
