# Consultation Toss Code Review + Remediation Plan (Consultation-only PR)

## TL;DR
> **Summary**: Produce a consultation-only PR by transplanting consultation paths into a clean branch, then fix remaining Toss-style violations (colored shadow + inline styles) and restore full consultation i18n dual-language coverage for special pages (error/loading/save-complete/treatment-sheet).
> **Deliverables**:
> - Clean consultation-only branch/PR diff (allowlisted paths only)
> - Consultation i18n compliance (no user-visible hardcoded Korean strings)
> - Remove `shadow-primary/*` in consultation scope
> - Remove inline style props in consultation scope (except one documented dynamic-width exception)
> **Effort**: Medium
> **Parallel**: YES - 3 waves
> **Critical Path**: Clean branch transplant → i18n fixes (treatment-sheet/save-complete/error) → inline-style removal → verification gates

## Context
### Original Request
- "코드 검토" for the Toss-style consultation redesign.

### Interview Summary
- Decision: consultation-only PR scope (exclude unrelated auth/fonts/(main) changes).

### Metis Review (gaps addressed)
- Locale/i18n is client-only (`src/lib/i18n.ts` is `'use client'` and reads Zustand locale store); server `loading.tsx` cannot reliably render correct non-ko copy on first paint without a server-aware locale mechanism (out of scope).
- Default decision: make `src/app/consultation/loading.tsx` spinner-only (no text) to avoid wrong-language copy while staying server-safe.
- Guardrails added: do not introduce translatable text inside SVG `<text>` nodes; keep gradient SVGs only as domain previews (Expression/Design scope), not as decorative page backgrounds.

## Work Objectives
### Core Objective
- Ship a consultation-only PR with:
  - Consistent Toss-style tokens (no gradients as decorative UI, no colored shadows, surface-based cards)
  - Full consultation i18n dual-language policy adherence on all user-visible strings
  - Tailwind-first styling (remove inline styles used for colors/backgrounds/borders)

### Deliverables
- Consultation-only diff limited to allowlisted paths:
  - `src/app/consultation/**`
  - `src/components/consultation/**`
  - `src/lib/i18n.ts` (translation keys for consultation pages)
- Updated i18n keys for ko/en/zh/ja.
- Verification evidence artifacts for key tasks.

### Definition of Done (verifiable)
- Base ref used for all comparisons:
  - `BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')`
  - `BASE_REF="origin/${BASE_BRANCH}"`
- Allowlist check returns empty:
  - `git diff --name-only "${BASE_REF}"...HEAD | grep -vE '^(src/app/consultation/|src/components/consultation/|src/lib/i18n\.ts$)'` returns no lines.
- Consultation scope has no colored shadow token:
  - `rg -n "shadow-primary/" src/app/consultation src/components/consultation` returns no matches.
- Consultation scope has no inline style props except the single explicitly allowed case:
  - `rg -n "style=\{\{" src/app/consultation src/components/consultation` returns exactly 1 match in `src/components/consultation/ConsultationSummaryCard.tsx` (dynamic width only).
- i18n validation (practical):
  - `rg -n "[가-힣]" src/app/consultation src/components/consultation` returns only comment-only Hangul or non-user-visible constants (document exceptions inline); all user-visible JSX strings are `t(...)` (with Korean helper when `locale !== 'ko'`).
- Build gates:
  - `pnpm lint`
  - `npx tsc --noEmit`
  - `pnpm build`

### Must Have
- Consultation-only PR scope.
- Fix i18n regressions in consultation special pages:
  - `src/app/consultation/error.tsx`
  - `src/app/consultation/save-complete/page.tsx`
  - `src/app/consultation/treatment-sheet/page.tsx`
  - `src/app/consultation/traits/page.tsx` (helper string)
  - `src/app/consultation/summary/page.tsx` (designer fallback)
- Remove `shadow-primary/30` in `src/app/consultation/traits/page.tsx`.
- Remove inline styles in:
  - `src/app/consultation/save-complete/page.tsx`
  - `src/app/consultation/treatment-sheet/page.tsx`
  - `src/components/consultation/DailyChecklist.tsx`
  - `src/components/consultation/ConsultationSummaryCard.tsx` (keep dynamic-width-only exception only)

### Must NOT Have
- Do NOT include unrelated diffs (auth routes, fonts, `(main)` pages, global theme refactors) in this PR.
- Do NOT introduce server-aware locale (cookies/headers) as part of this PR.
- Do NOT remove domain-relevant SVG gradients used as *content previews* (e.g., Expression/Design scope previews) unless they are purely decorative; do not add new gradients for layout decoration.
- Do NOT add translated text inside SVG `<text>`.

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: tests-after (no dedicated test suite discovered for consultation UI); enforce lint/typecheck/build + deterministic grep gates.
- QA policy: every task includes executable QA scenarios.
- Evidence: write proofs to `.sisyphus/evidence/task-{N}-{slug}.txt` (command outputs) and `.sisyphus/evidence/task-{N}-{slug}.png` (screenshots via dev-browser if used).

## Execution Strategy
### Parallel Execution Waves
Wave 1 (repo hygiene + transplant): isolate consultation-only diff.
Wave 2 (content + styling fixes): i18n + inline-style removal + remaining shadow cleanup.
Wave 3 (verification + PR polish): grep gates, build gates, locale smoke.

### Dependency Matrix
- T1 blocks everything (clean branch + transplant).
- T2 depends on T1.
- i18n tasks (T3-T7) depend on T1.
- style/inline-style tasks (T8-T10) depend on T1; can run parallel with i18n tasks once on clean branch.
- Verification tasks (T11-T12) depend on completion of T3-T10.

### Agent Dispatch Summary
- Wave 1: 2 tasks (unspecified-high)
- Wave 2: 7 tasks (visual-engineering + writing/i18n)
- Wave 3: 2 tasks (unspecified-high)

## TODOs
> Implementation + verification = ONE task.

- [ ] 1. Create clean consultation-only branch and record baseline

  **What to do**:
  - Fetch base: `git fetch origin`.
  - On the CURRENT (messy) branch, record:
    - `MESSY_BRANCH=$(git branch --show-current)`
    - `BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')`
  - Write both values into `.sisyphus/evidence/task-1-branch-source.txt`.
  - Create clean branch from base:
    - `git switch -c consultation-toss-clean "origin/${BASE_BRANCH}"`

  **Must NOT do**:
  - Do not merge the messy branch.
  - Do not delete anything from messy branch.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: git hygiene + careful scope control.
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T2-T12 | Blocked By: -

  **References**:
  - Oracle recommendation: path-based transplant to avoid scope drift.

  **Acceptance Criteria**:
  - `git status --porcelain` is clean on new branch before transplant.
  - Evidence file exists: `.sisyphus/evidence/task-1-branch-source.txt`.

  **QA Scenarios**:
  ```
  Scenario: Clean branch created
    Tool: Bash
    Steps: git branch --show-current; git rev-parse --abbrev-ref --symbolic-full-name @{u} (if upstream exists)
    Expected: branch is consultation-toss-clean; HEAD matches BASE_REF
    Evidence: .sisyphus/evidence/task-1-branch-source.txt
  ```

  **Commit**: NO

- [ ] 2. Transplant allowlisted paths from messy branch into clean branch

  **What to do**:
  - From clean branch, checkout only allowlisted paths from the messy branch recorded in T1:
    - Always include:
      - `src/app/consultation/`
      - `src/components/consultation/`
      - `src/lib/i18n.ts`
  - After transplant, run allowlist check:
    - `BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')`
    - `git diff --name-only "origin/${BASE_BRANCH}"...HEAD`
    - Ensure only allowlisted paths appear.
  - If build later fails due to missing shared dependencies, expand allowlist *only to the minimal required files* based on compiler error paths (repeatable loop):
    1) read build error path
    2) transplant that exact file only
    3) re-run build

  **Must NOT do**:
  - Do not transplant deletions of `public/fonts/**` or auth routes.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: precise diff control.
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T3-T12 | Blocked By: T1

  **References**:
  - Allowlist: `src/app/consultation/**`, `src/components/consultation/**`, `src/lib/i18n.ts`.

  **Acceptance Criteria**:
  - `BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')`
  - `git diff --name-only "origin/${BASE_BRANCH}"...HEAD` contains no out-of-allowlist paths.
  - `git diff --name-status --diff-filter=D "origin/${BASE_BRANCH}"...HEAD` shows no deletions outside allowlist.

  **QA Scenarios**:
  ```
  Scenario: Allowlist enforced
    Tool: Bash
    Steps: BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'); git diff --name-only "origin/${BASE_BRANCH}"...HEAD
    Expected: only allowlisted paths
    Evidence: .sisyphus/evidence/task-2-allowlist.txt
  ```

  **Commit**: NO

- [ ] 3. Fix consultation error page i18n + dual-language

  **What to do**:
  - Update `src/app/consultation/error.tsx`:
    - Import `useT`, `useKo`, `useLocale` from `@/lib/i18n`.
    - Replace Korean literals with keys:
      - `consultation.errorTitle`
      - `consultation.errorDesc`
      - `consultation.errorRetry`
      - `consultation.errorHome`
    - Render Korean helper text when `locale !== 'ko'` using existing dual-language pattern.
  - Add translations in `src/lib/i18n.ts` for ko/en/zh/ja.

  **Must NOT do**:
  - Do not change routing behavior (`href="/home"`) or reset behavior.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: i18n copy + multi-locale strings.
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T11-T12 | Blocked By: T2

  **References**:
  - i18n hooks: `src/lib/i18n.ts` (useT/useKo/useLocale exports).
  - Dual-language pattern: `src/app/consultation/CLAUDE.md`.

  **Translation Table (must copy verbatim into src/lib/i18n.ts)**:
  - `consultation.errorTitle`:
    - ko: 상담 중 오류가 발생했어요
    - en: Something went wrong during consultation
    - zh: 咨询过程中发生了错误
    - ja: 相談中にエラーが発生しました
  - `consultation.errorDesc`:
    - ko: 입력한 내용은 자동 저장되었어요
    - en: Your input has been saved automatically.
    - zh: 您输入的内容已自动保存。
    - ja: 入力内容は自動で保存されました。
  - `consultation.errorRetry`:
    - ko: 다시 시도
    - en: Try again
    - zh: 重试
    - ja: もう一度
  - `consultation.errorHome`:
    - ko: 홈으로
    - en: Go to Home
    - zh: 返回首页
    - ja: ホームへ

  **Acceptance Criteria**:
  - No Korean literals remain in JSX text nodes in `src/app/consultation/error.tsx`.
  - Keys exist in all 4 locales in `src/lib/i18n.ts`.

  **QA Scenarios**:
  ```
  Scenario: Error page shows dual-language copy
    Tool: dev-browser
    Steps: Navigate to /consultation/error (or trigger error boundary), toggle locale to en/zh/ja, observe title/body/button labels
    Expected: primary language text visible; Korean helper visible when locale != ko
    Evidence: .sisyphus/evidence/task-3-error-i18n.png
  ```

  **Commit**: YES | Message: `i18n(consultation): localize error boundary copy` | Files: `src/app/consultation/error.tsx`, `src/lib/i18n.ts`

- [ ] 4. Make consultation loading fallback spinner-only (no text)

  **What to do**:
  - Update `src/app/consultation/loading.tsx`:
    - Remove the user-visible Korean loading string entirely.
    - Keep purely visual spinner.
    - Optional: add `aria-label` or `sr-only` text ONLY if it can be language-neutral (e.g., omit text rather than hardcoding).
  - Rationale: loading.tsx is server fallback; locale is client-only.

  **Must NOT do**:
  - Do not convert loading.tsx into a client component just for i18n.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: small, surgical edit.
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T11-T12 | Blocked By: T2

  **References**:
  - Metis guidance: avoid wrong-language server fallback text.

  **Acceptance Criteria**:
  - `rg -n "[가-힣]" src/app/consultation/loading.tsx` returns no matches.

  **QA Scenarios**:
  ```
  Scenario: Loading shows no language-specific text
    Tool: dev-browser
    Steps: Navigate within /consultation flow and observe loading fallback during transitions
    Expected: spinner appears; no visible Korean-only loading label
    Evidence: .sisyphus/evidence/task-4-loading.png
  ```

  **Commit**: YES | Message: `ui(consultation): make loading fallback language-neutral` | Files: `src/app/consultation/loading.tsx`

- [ ] 5. Localize save-complete page + remove inline styles

  **What to do**:
  - Update `src/app/consultation/save-complete/page.tsx`:
    - Import `useT`, `useKo`, `useLocale`.
    - Replace option arrays (`primaryOptions`, `secondaryOptions`) to store i18n keys instead of hardcoded Korean strings.
    - Add new `saveComplete.*` keys in `src/lib/i18n.ts` (all locales ko/en/zh/ja):
      - `saveComplete.heroTitle` (ko: 저장 완료)
      - `saveComplete.heroSubtitle` (ko: 30초만 더 정리하면 재방문 때 훨씬 편해져요)
      - `saveComplete.primaryChecklistTitle` (ko: 당일 시술 체크리스트 작성)
      - `saveComplete.primaryChecklistBadge` (ko: 30초)
      - `saveComplete.primaryChecklistSubtitle` (ko: 쉐입, 길이, 두께감을 기록해요)
      - `saveComplete.primaryTreatmentSheetTitle` (ko: 시술 확인서 보기)
      - `saveComplete.primaryTreatmentSheetSubtitle` (ko: 네일 디자인 요약과 금액을 확인해요)
      - `saveComplete.secondaryPreferenceTitle` (ko: 고객 선호 프로필 저장)
      - `saveComplete.secondaryPreferenceSubtitle` (ko: 다음 방문에 자동으로 불러와요)
      - `saveComplete.secondaryHomeTitle` (ko: 홈으로 돌아가기)
      - `saveComplete.secondaryHomeSubtitle` (ko: 나중에 기록 탭에서 정리할 수 있어요)
    - Render dual-language for each title/subtitle (Korean helper when locale != ko).
    - Remove inline styles:
      - Replace success circle `color-mix(...)` with `bg-success/10`.
      - Replace svg color style with `text-success`.
      - Replace secondary card background/border/icon bg/arrow color styles with Tailwind tokens: `bg-surface`, `border-border`, `bg-surface-alt`, `text-text-muted`.

  **Must NOT do**:
  - Do not change href routing logic and query param usage.
  - Do not remove framer-motion animations.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: UI + i18n + style refactor.
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T11-T12 | Blocked By: T2

  **References**:
  - i18n keys already present: `consultation.saveComplete`, `checklist.title`.
  - Tokens: `bg-surface`, `bg-surface-alt`, `border-border`, `bg-success`, `text-success`.

  **Translation Table (must copy verbatim into src/lib/i18n.ts)**:
  - `saveComplete.*` (English / Chinese / Japanese):
    - heroTitle: `Saved` / `已保存` / `保存完了`
    - heroSubtitle: `Finish a quick 30-second wrap-up to make the next visit much easier.` / `再整理30秒，下次来店会更顺畅。` / `あと30秒だけ整理すると、次回の来店がもっとスムーズになります。`
    - primaryChecklistTitle: `Fill out today's checklist` / `填写当日施术清单` / `当日チェックリストを記入`
    - primaryChecklistBadge: `30 sec` / `30秒` / `30秒`
    - primaryChecklistSubtitle: `Record shape, length, and thickness.` / `记录形状、长度和厚度感。` / `形・長さ・厚みを記録します。`
    - primaryTreatmentSheetTitle: `View treatment sheet` / `查看施术确认单` / `施術確認書を見る`
    - primaryTreatmentSheetSubtitle: `Review nail design summary and pricing.` / `查看设计摘要与金额。` / `デザイン要約と金額を確認します。`
    - secondaryPreferenceTitle: `Save preference profile` / `保存客户偏好档案` / `好みプロファイルを保存`
    - secondaryPreferenceSubtitle: `Auto-load it on the next visit.` / `下次来店自动加载。` / `次回の来店時に自動で読み込みます。`
    - secondaryHomeTitle: `Back to Home` / `返回首页` / `ホームに戻る`
    - secondaryHomeSubtitle: `You can整理 it later in Records.` / `稍后可在记录页整理。` / `あとで記録タブで整理できます。`

  **Acceptance Criteria**:
  - `rg -n "style=\{\{" src/app/consultation/save-complete/page.tsx` returns no matches.
  - No user-visible Korean literals remain in JSX; all via `t(...)`.
  - New keys exist for all locales in `src/lib/i18n.ts`.

  **QA Scenarios**:
  ```
  Scenario: Save-complete page dual-language
    Tool: dev-browser
    Steps: Navigate to /consultation/save-complete?consultationId=record-001&customerId=cust-001, switch locale ko/en/zh/ja
    Expected: title/subtitle and option copy render in locale; Korean helper appears when locale != ko
    Evidence: .sisyphus/evidence/task-5-save-complete-i18n.png

  Scenario: Save-complete has no inline styles
    Tool: Bash
    Steps: rg -n "style=\{\{" src/app/consultation/save-complete/page.tsx
    Expected: no matches
    Evidence: .sisyphus/evidence/task-5-save-complete-style.txt
  ```

  **Commit**: YES | Message: `i18n(consultation): localize save-complete and remove inline styles` | Files: `src/app/consultation/save-complete/page.tsx`, `src/lib/i18n.ts`

- [ ] 6. Localize treatment-sheet page (core) + remove inline styles + locale-aware date

  **What to do**:
  - Update `src/app/consultation/treatment-sheet/page.tsx`:
    - Add i18n hooks: `useT`, `useKo`, `useLocale`.
    - Replace hardcoded label maps:
      - Remove `SHAPE_LABELS`, `LENGTH_LABELS`, `THICKNESS_LABELS`, `CUTICLE_LABELS` Korean literals.
      - Use existing keys where possible:
        - Shapes: `shape.round`, ...
        - Design scope: `design.solidTone`, ...
        - Body part: `bodyPart.hand`, `bodyPart.foot`
        - Off labels: `consultation.selfRemoval`, `consultation.otherRemoval`
        - Daily checklist sections/options: `checklist.*`
        - Reference: `consultation.referenceTitle`
        - Canvas: `consultation.nailDesign` or `consultation.canvasTitle` as appropriate
        - Price: `consultation.totalPrice`, `consultation.estimatedTime`, `consultation.discount`, `consultation.deposit`
    - Add new `treatmentSheet.*` keys in `src/lib/i18n.ts` (all locales ko/en/zh/ja):
      - `treatmentSheet.title` (ko: 시술 확인서)
      - `treatmentSheet.customerFallbackName` (ko: 고객)
      - `treatmentSheet.checklistSummaryTitle` (ko: 체크리스트)
      - `treatmentSheet.dailyChecklistHint` (ko: 시술 시작 전 고객 상태를 확인해주세요)
      - `treatmentSheet.checklistMemoPlaceholder` (ko: 특이사항 메모 (ex. 손톱이 얇음, 큐티클 주의))
      - `treatmentSheet.treatmentDetailsTitle` (ko: 시술 내역)
      - `treatmentSheet.priceFinalizeTitle` (ko: 가격 확정)
      - `treatmentSheet.priceFinalizedChip` (ko: 확정됨)
      - `treatmentSheet.basePriceLabel` (ko: 기본 금액)
      - `treatmentSheet.extrasLabel` (ko: 추가 항목)
      - `treatmentSheet.extrasAddButton` (ko: 추가 항목 추가)
      - `treatmentSheet.extrasHint` (ko: 추가 비용이나 할인을 입력하세요 (할인은 음수로 입력))
      - `treatmentSheet.extrasItemPlaceholder` (ko: 항목명)
      - `treatmentSheet.confirmedPriceLabel` (ko: 확정 금액)
      - `treatmentSheet.finalizeButton` (ko: 가격 확정)
      - `treatmentSheet.finalizingButton` (ko: 확정 중...)
      - `treatmentSheet.finalizedToast` (ko: 가격이 확정되었습니다)
      - `treatmentSheet.customerMemoTitle` (ko: 고객 메모)
      - `treatmentSheet.customerMemoDesc` (ko: 고객과 나눈 이야기를 기록해두면 다음 방문 때 활용할 수 있어요)
      - `treatmentSheet.customerMemoSaved` (ko: 저장됐어요)
      - `treatmentSheet.customerMemoPlaceholder` (ko: 고객과 나눈 이야기를 메모해두세요 (취미, 관심사 등))
      - `treatmentSheet.customerMemoSaveButton` (ko: 메모 저장)
      - `treatmentSheet.savingButton` (ko: 저장 중...)
    - Implement dual-language rendering:
      - For each header/label: render `t(key)`; if `locale !== 'ko'` render helper `tKo(key)` under/next to it.
      - For SegmentControl buttons: update SegmentControl to accept `labels: Record<T, { label: string; koLabel: string }>` and render stacked label + small koLabel when locale != ko.
    - Fix date formatting:
      - Replace `toLocaleDateString('ko-KR', ...)` with mapping based on `locale`:
        - ko → `ko-KR`, en → `en-US`, zh → `zh-CN`, ja → `ja-JP`.
    - Remove inline styles in this page:
      - Convert any `style={{ color: ... }}` to `text-error`/`text-primary`.
      - Convert any `style={{ background: ... }}` to `bg-primary`/`bg-success/10`/`bg-surface-alt`.
      - Replace safe-area padding style with Tailwind arbitrary value class: `pb-[max(1rem,env(safe-area-inset-bottom))]`.

  **Must NOT do**:
  - Do not change store logic (save/updateRecord/reset/navigation).
  - Do not change data wiring for HandIllustration selections.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: large page refactor with i18n + styling constraints.
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T11-T12 | Blocked By: T2

  **References**:
  - Existing keys: `src/lib/i18n.ts` (shape/design/bodyPart/off/checklist/consultation.*).
  - Dual-language policy: `src/app/consultation/CLAUDE.md`.

  **Acceptance Criteria**:
  - `rg -n "style=\{\{" src/app/consultation/treatment-sheet/page.tsx` returns no matches.
  - No user-visible Korean literals remain in JSX (titles/labels/buttons/placeholders all via `t(...)`).
  - Date formatting uses `locale` mapping.
  - New `treatmentSheet.*` keys exist for ko/en/zh/ja.

  **QA Scenarios**:
  ```
  Scenario: Treatment-sheet renders in all locales
    Tool: dev-browser
    Steps: Navigate to /consultation/treatment-sheet?consultationId=record-001&customerId=cust-001; switch locale ko/en/zh/ja
    Expected: all headings/labels are translated; Korean helper appears when locale != ko; no clipped layout
    Evidence: .sisyphus/evidence/task-6-treatment-sheet-i18n.png

  Scenario: No inline styles remain
    Tool: Bash
    Steps: rg -n "style=\{\{" src/app/consultation/treatment-sheet/page.tsx
    Expected: no matches
    Evidence: .sisyphus/evidence/task-6-treatment-sheet-style.txt
  ```

  **Commit**: YES | Message: `i18n(consultation): localize treatment sheet and remove inline styles` | Files: `src/app/consultation/treatment-sheet/page.tsx`, `src/lib/i18n.ts`

  **Translation Table (must copy verbatim into src/lib/i18n.ts)**:
  - `treatmentSheet.*` (English / Chinese / Japanese):
    - title: `Treatment Sheet` / `施术确认单` / `施術確認書`
    - customerFallbackName: `Customer` / `客户` / `お客様`
    - checklistSummaryTitle: `Checklist` / `清单` / `チェックリスト`
    - dailyChecklistHint: `Check the customer's condition before starting.` / `开始施术前请确认客户状态。` / `施術開始前にお客様の状態を確認してください。`
    - checklistMemoPlaceholder: `Notes (e.g., thin nails, be careful around cuticles)` / `备注（例如：指甲较薄、注意甘皮）` / `メモ（例：爪が薄い、甘皮に注意）`
    - treatmentDetailsTitle: `Treatment Details` / `施术明细` / `施術内容`
    - priceFinalizeTitle: `Finalize Price` / `确定价格` / `価格確定`
    - priceFinalizedChip: `Finalized` / `已确定` / `確定済み`
    - basePriceLabel: `Base price` / `基础金额` / `基本料金`
    - extrasLabel: `Adjustments` / `调整项` / `調整項目`
    - extrasAddButton: `Add adjustment` / `添加调整项` / `調整項目を追加`
    - extrasHint: `Enter extra charges or discounts (use negative for discounts).` / `请输入追加费用或折扣（折扣用负数）。` / `追加料金や割引を入力してください（割引はマイナス）。`
    - extrasItemPlaceholder: `Item name` / `项目名` / `項目名`
    - confirmedPriceLabel: `Confirmed total` / `确定金额` / `確定金額`
    - finalizeButton: `Finalize price` / `确定价格` / `価格を確定`
    - finalizingButton: `Finalizing...` / `确定中...` / `確定中...`
    - finalizedToast: `Price has been finalized.` / `价格已确定。` / `価格を確定しました。`
    - customerMemoTitle: `Customer notes` / `客户备注` / `お客様メモ`
    - customerMemoDesc: `Write down what you talked about to use next time.` / `记录聊天内容，方便下次来店参考。` / `会話内容を残すと次回来店時に活用できます。`
    - customerMemoSaved: `Saved` / `已保存` / `保存しました`
    - customerMemoPlaceholder: `Add notes (hobbies, interests, etc.)` / `记录兴趣爱好等（如：爱好、关注点）` / `メモ（趣味・関心ごとなど）`
    - customerMemoSaveButton: `Save notes` / `保存备注` / `メモを保存`
    - savingButton: `Saving...` / `保存中...` / `保存中...`

- [ ] 7. Fix traits helper i18n + remove colored shadow

  **What to do**:
  - Update `src/app/consultation/traits/page.tsx`:
    - Replace helper Korean literal "선택하지 않아도..." with `t('consultation.traitsOptionalHint')` + Korean helper `tKo(...)`.
    - Remove `shadow-primary/30` and replace with neutral `shadow-sm` or `shadow-lg`.

  **Must NOT do**:
  - Do not change trait selection logic or navigation.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: small targeted fix.
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T11-T12 | Blocked By: T2

  **References**:
  - Shadow token violation: `shadow-primary/30` at `src/app/consultation/traits/page.tsx`.

  **Translation Table (must copy verbatim into src/lib/i18n.ts)**:
  - `consultation.traitsOptionalHint`:
    - ko: 선택하지 않아도 다음 단계로 진행할 수 있습니다
    - en: You can continue without selecting anything.
    - zh: 即使不选择也可以继续下一步。
    - ja: 選択しなくても次のステップに進めます。

  **Acceptance Criteria**:
  - `rg -n "shadow-primary/" src/app/consultation/traits/page.tsx` returns no matches.
  - Helper text uses i18n key in all locales.

  **QA Scenarios**:
  ```
  Scenario: Traits page helper renders bilingual
    Tool: dev-browser
    Steps: Navigate to /consultation/traits; switch locale to en
    Expected: helper text translated; Korean helper shown
    Evidence: .sisyphus/evidence/task-7-traits.png
  ```

  **Commit**: YES | Message: `fix(consultation): remove colored shadow and localize traits helper` | Files: `src/app/consultation/traits/page.tsx`, `src/lib/i18n.ts`

- [ ] 8. Fix summary designer fallback i18n

  **What to do**:
  - Update `src/app/consultation/summary/page.tsx`:
    - Replace fallback `'디자이너'` with i18n key `consultation.designerFallback`.
    - Ensure dual-language helper is shown if this fallback is user-visible.
  - Add translations for `consultation.designerFallback` to ko/en/zh/ja.

  **Must NOT do**:
  - Do not change save logic or store interactions.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: tiny i18n fix.
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T11-T12 | Blocked By: T2

  **Translation Table (must copy verbatim into src/lib/i18n.ts)**:
  - `consultation.designerFallback`:
    - ko: 디자이너
    - en: Designer
    - zh: 设计师
    - ja: デザイナー

  **Acceptance Criteria**:
  - No Korean literal fallback remains.

  **QA Scenarios**:
  ```
  Scenario: Summary fallback displays localized
    Tool: dev-browser
    Steps: Navigate to /consultation/summary with no assignedDesignerName in mock; switch locale to en
    Expected: fallback label is localized; Korean helper appears
    Evidence: .sisyphus/evidence/task-8-summary-fallback.png
  ```

  **Commit**: YES | Message: `i18n(consultation): localize summary designer fallback` | Files: `src/app/consultation/summary/page.tsx`, `src/lib/i18n.ts`

- [ ] 9. Remove inline style props from DailyChecklist component

  **What to do**:
  - Update `src/components/consultation/DailyChecklist.tsx`:
    - Replace container style `{ borderColor, background }` with classes: `border border-border bg-surface`.
    - Replace textarea style `{ background, borderColor }` with `bg-surface border-border`.
    - Replace save button inline background style with Tailwind token classes (decision):
      - saved: `bg-success text-white`
      - idle: `bg-primary text-white hover:bg-primary/90`

  **Must NOT do**:
  - Do not change checklist state logic or callbacks.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: component styling refactor.
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T11-T12 | Blocked By: T2

  **Acceptance Criteria**:
  - `rg -n "style=\{\{" src/components/consultation/DailyChecklist.tsx` returns no matches.

  **QA Scenarios**:
  ```
  Scenario: DailyChecklist styling works without inline styles
    Tool: dev-browser
    Steps: Open any screen that renders DailyChecklist (records tab checklist); click options; click save
    Expected: selected/unselected styles look correct; saved state turns success color; no console errors
    Evidence: .sisyphus/evidence/task-9-daily-checklist.png
  ```

  **Commit**: YES | Message: `style(consultation): remove inline styles from DailyChecklist` | Files: `src/components/consultation/DailyChecklist.tsx`

- [ ] 10. Decide and enforce inline-style policy for ConsultationSummaryCard progress width

  **What to do**:
  - Update `src/components/consultation/ConsultationSummaryCard.tsx` (decision):
    - Keep the existing `style={{ width: ... }}` for dynamic width as the single allowed inline-style exception.
    - Add a short comment next to it: "Inline style allowed here for dynamic width only; do not use style props for colors/backgrounds".
    - Ensure there are no other `style={{...}}` props anywhere under `src/app/consultation/**` or `src/components/consultation/**`.

  **Must NOT do**:
  - Do not change the underlying percentage logic.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: careful UI implementation + standards.
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T11-T12 | Blocked By: T2

  **Acceptance Criteria**:
  - `rg -n "style=\{\{" src/app/consultation src/components/consultation` returns exactly 1 match in `src/components/consultation/ConsultationSummaryCard.tsx` for width.

  **QA Scenarios**:
  ```
  Scenario: Summary progress renders correctly
    Tool: dev-browser
    Steps: Navigate to /consultation/summary; observe progress indicator across different consultation completeness states
    Expected: progress bar accurately reflects percentage; styling matches Toss tokens
    Evidence: .sisyphus/evidence/task-10-summary-progress.png
  ```

  **Commit**: YES | Message: `style(consultation): align summary progress with no-inline-style rule` | Files: `src/components/consultation/ConsultationSummaryCard.tsx`

- [ ] 11. Run consultation-scope grep gates and fix any remaining violations

  **What to do**:
  - Run the following and ensure outputs meet DoD:
    - `rg -n "shadow-primary/" src/app/consultation src/components/consultation`
    - `rg -n "style=\{\{" src/app/consultation src/components/consultation`
    - `rg -n "[가-힣]" src/app/consultation src/components/consultation` (manual review to ensure only non-user-visible matches)
    - `BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')`; `git diff --name-only "origin/${BASE_BRANCH}"...HEAD | grep -vE '^(src/app/consultation/|src/components/consultation/|src/lib/i18n\.ts$)'`
  - Store outputs into `.sisyphus/evidence/task-11-gates.txt`.

  **Must NOT do**:
  - Do not expand PR scope to fix matches outside consultation allowlist.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: compliance checks.
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: T12 | Blocked By: T3-T10

  **Acceptance Criteria**:
  - Evidence file exists and all gates pass per DoD.

  **QA Scenarios**:
  ```
  Scenario: Compliance gates pass
    Tool: Bash
    Steps: run all gate commands
    Expected: no violations; allowlist holds
    Evidence: .sisyphus/evidence/task-11-gates.txt
  ```

  **Commit**: NO

- [ ] 12. Run build gates + locale smoke on consultation flow

  **What to do**:
  - Run build gates:
    - `pnpm lint && npx tsc --noEmit && pnpm build`
  - Locale smoke (agent-executed):
    - Visit `/consultation` start → customer → step1 → step2 → step3 → canvas → summary → save-complete → treatment-sheet
    - Switch locale to en/zh/ja in consultation UI and verify dual-language helper appears.

  **Must NOT do**:
  - Do not change business logic during QA.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: build + e2e smoke.
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: - | Blocked By: T11

  **Acceptance Criteria**:
  - Build gates succeed.
  - Locale smoke screenshots captured.

  **QA Scenarios**:
  ```
  Scenario: Build gates
    Tool: Bash
    Steps: pnpm lint && npx tsc --noEmit && pnpm build
    Expected: exit 0
    Evidence: .sisyphus/evidence/task-12-build.txt

  Scenario: Locale smoke
    Tool: dev-browser
    Steps: run full consultation path; toggle locale en/zh/ja
    Expected: no missing keys shown; Korean helper appears as designed
    Evidence: .sisyphus/evidence/task-12-locale-smoke.png
  ```

  **Commit**: NO

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ dev-browser)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Target: small, reviewable commits grouped by concern:
  - `i18n(consultation): localize error boundary copy`
  - `ui(consultation): make loading fallback language-neutral`
  - `i18n(consultation): localize save-complete and remove inline styles`
  - `i18n(consultation): localize treatment sheet and remove inline styles`
  - `fix(consultation): remove colored shadow and localize traits helper`
  - `style(consultation): remove inline styles from DailyChecklist`
  - `style(consultation): align summary progress with no-inline-style rule`

## Success Criteria
- Consultation-only diff with no unrelated deletions (auth/fonts unchanged).
- Consultation UI adheres to Toss-style constraints (no colored shadows; surface-based cards; no decorative gradients).
- Consultation special pages are fully localized with dual-language helper policy.
- Lint/typecheck/build pass.
