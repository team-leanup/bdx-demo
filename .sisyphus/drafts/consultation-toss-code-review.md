# Draft: Consultation Toss Redesign Code Review

## Requirements (confirmed)
- Redesign consultation flow UI to Toss-style.
- No gradients; avoid `bg-primary/*` opacity backgrounds and `shadow-primary/*` colored shadows.
- Tailwind CSS-only styling (project standard: avoid inline `style={{...}}`).
- Preserve consultation functionality and i18n dual-language policy (selected locale + Korean helper when `locale !== 'ko'`).

## Technical Decisions
- Scope for review + remediation: consultation-only deliverable. Default allowlist:
  - `src/app/consultation/**`
  - `src/components/consultation/**`
  - Minimal shared dependencies only if required by consultation UI (e.g. `src/components/ui/**`, `src/app/globals.css`).
- Because the working tree is heavily contaminated (84 files changed incl. auth routes + fonts), do NOT attempt to review/fix everything in-place.
  - Strategy: create a clean branch from `origin/main` and transplant only allowlisted paths from the messy branch (path-based checkout/restore), then verify.

## Research Findings
- Scope drift:
  - `git status --porcelain` shows many unrelated changes (auth pages deleted, font removed, many `(main)` pages changed).
  - Risk: shipping consultation redesign bundled with routing/asset changes.
- i18n audit (explore agent `bg_51576a4d`):
  - Hook usage is OK: no `useT/useKo` destructuring detected in consultation area.
  - Major issues: several consultation pages still contain user-visible hardcoded Korean and/or lack `useT/useKo`:
    - `src/app/consultation/treatment-sheet/page.tsx`
    - `src/app/consultation/save-complete/page.tsx`
    - `src/app/consultation/loading.tsx`
    - `src/app/consultation/error.tsx`
    - Minor: fallback strings like `'디자이너'` in `src/app/consultation/summary/page.tsx`.
- Style scan (direct grep):
  - No gradients found in `src/app/consultation/**`.
  - Remaining colored shadow in consultation area:
    - `src/app/consultation/traits/page.tsx` has `shadow-primary/30` on a small badge.
  - Inline styles still present in consultation pages/components:
    - `src/app/consultation/treatment-sheet/page.tsx` (multiple)
    - `src/app/consultation/save-complete/page.tsx` (multiple)
    - `src/components/consultation/DailyChecklist.tsx` (multiple)
    - `src/components/consultation/ConsultationSummaryCard.tsx` (progress bar width)
  - Design token consistency:
    - `src/components/consultation/DesignPresetPicker.tsx` uses `bg-blue-50`, `bg-pink-50`, `bg-purple-50` for badges (solid but not neutral Toss; consider neutralizing).
  - Hardcoded user-visible Korean strings confirmed via grep in consultation pages:
    - `src/app/consultation/error.tsx` (title/body/buttons)
    - `src/app/consultation/loading.tsx` (loading label)
    - `src/app/consultation/save-complete/page.tsx` (option titles/subtitles + hero text)
    - `src/app/consultation/treatment-sheet/page.tsx` (section titles/labels/placeholders; also maps like SHAPE_LABELS)
    - `src/app/consultation/traits/page.tsx` (helper message)

## Open Questions
- Should the PR strictly include only consultation paths (recommended), or do you also want to intentionally include the unrelated auth/main/fonts changes that currently exist in the working tree?
  - Default assumption: consultation-only PR; everything else excluded.

## Scope Boundaries
- INCLUDE:
  - Consultation pages/components UI restyling to Toss (no gradients, neutral surfaces, consistent selected/unselected patterns).
  - Consultation i18n compliance fixes for hardcoded strings.
  - Minimal shared UI/token changes only if needed by consultation.
- EXCLUDE:
  - Auth route restructuring and deletions.
  - Font asset deletions/changes unless explicitly required.
  - `(main)` app page redesign unless explicitly requested.
