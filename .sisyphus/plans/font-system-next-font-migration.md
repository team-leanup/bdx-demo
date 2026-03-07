# Font System: Next/font Migration + Consistency Fixes

## TL;DR
> **Summary**: Replace manual `@font-face` loading with `next/font/local` for Pretendard Variable to get automatic preload + CLS mitigation, while keeping the existing Tailwind v4 CSS-variable interface (`--font-pretendard`, `font-pretendard`).
> **Deliverables**:
> - Pretendard loaded via `next/font/local` (single source of truth)
> - No manual `@font-face` for Pretendard in `src/app/globals.css`
> - Root layout wires font variable globally
> - Remove the one inline `fontFamily` override
> - Fix manifest icon reference
> **Effort**: Short
> **Parallel**: YES - 2 waves
> **Critical Path**: Add `next/font/local` + move font asset → wire `layout.tsx` → remove legacy `@font-face` → verification

## Context
### Original Request
- "현재의 구조를 파악하고, 수정해야할 부분은 Task 만들어주세요." (현재 폰트 설정/구조 기반)

### Interview Summary
- No further preferences provided; proceed with the repo-aligned, Next.js-recommended default.

### Metis Review (gaps addressed)
- Avoid variable-name collision by namespacing `next/font` variable (use `--next-font-pretendard`) then map existing `--font-pretendard` to it.
- Ensure preload actually happens by applying `localFont()` in `src/app/layout.tsx` (root) and verifying `link[rel="preload"][as="font"]` exists.
- Keep manifest fix minimal (no multi-size PNG generation).

## Work Objectives
### Core Objective
- Make font loading deterministic, optimized, and consistent across routes without changing typography.

### Deliverables
- `next/font/local` integration for Pretendard Variable, applied globally.
- Tailwind v4 font token `--font-pretendard` continues to exist and be used.
- Legacy `@font-face` removed to prevent double-loading.
- `public/manifest.json` icon reference no longer points to missing `/favicon.ico`.
- `src/app/intro-demo/page.tsx` no longer hardcodes `fontFamily` inline.

### Definition of Done (verifiable)
- `pnpm lint` passes.
- `npx tsc --noEmit` passes.
- `pnpm build` passes.
- Home HTML includes a font preload tag injected by Next/font (or equivalent evidence via Playwright).
- `getComputedStyle(document.body).fontFamily` contains Pretendard on key routes.
- `public/manifest.json` icon URL(s) all return HTTP 200.

### Must Have
- Preserve existing CSS-variable interface: `--font-pretendard` and utility usage should keep working.
- Remove duplicate Pretendard loading (no `@font-face` for Pretendard after migration).

### Must NOT Have
- No new fonts added.
- No typography refactors (sizes/line-height/tracking).
- No full PWA icon generation or maskable icon work.
- No broad removal of inline styles; only the `fontFamily` override targeted.

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: tests-after (repo has no test runner); rely on lint + typecheck + build + Playwright/HTTP assertions.
- Evidence files written by executor:
  - `.sisyphus/evidence/task-1-font-preload.html`
  - `.sisyphus/evidence/task-1-font-computed.json`
  - `.sisyphus/evidence/task-3-no-font-face.txt`
  - `.sisyphus/evidence/task-5-manifest-icons.txt`

## Execution Strategy
### Parallel Execution Waves
Wave 1 (font foundation + independent fixes)
- T1: Move font asset + add `next/font/local` definition
- T4: Remove inline `fontFamily` override (depends on `font-pretendard` still existing; safe after T1-T3, but can be implemented in parallel and verified after)
- T5: Fix manifest icon reference

Wave 2 (wire + cleanup + verification)
- T2: Wire font variable in root `layout.tsx`
- T3: Remove legacy `@font-face` and map theme variable to `--next-font-pretendard`
- T6: Verification sweep (preload + computed font + headers)

### Dependency Matrix (full)
- T1 blocks T2, T3, T6
- T2 blocks T6
- T3 blocks T6
- T4 independent but validated in T6
- T5 independent but validated in T6

### Agent Dispatch Summary
- Wave 1: 3 tasks (quick/unspecified-low)
- Wave 2: 3 tasks (quick/unspecified-low)

## TODOs
> Implementation + Test = ONE task.
> EVERY task MUST include QA scenarios.

- [x] 1. Add Pretendard via `next/font/local` and relocate font asset

  **What to do**:
  - Move the font asset into the app source tree so `next/font/local` can bundle + preload it:
    - `mkdir -p src/assets/fonts`
    - `git mv public/fonts/PretendardVariable.woff2 src/assets/fonts/PretendardVariable.woff2`
  - Create `src/lib/fonts.ts` with this exact content:

  ```ts
  import localFont from 'next/font/local';

  export const pretendard = localFont({
    src: '../assets/fonts/PretendardVariable.woff2',
    display: 'swap',
    variable: '--next-font-pretendard',
  });
  ```

  - Do NOT add manual `<link rel="preload">` tags; Next/font should inject them automatically once wired in `src/app/layout.tsx`.

  **Must NOT do**:
  - Do not leave a second Pretendard `@font-face` active after migration.
  - Do not introduce additional font families or subsets.

  **Recommended Agent Profile**:
  - Category: `quick` — small, contained file moves + one new module
  - Skills: `[]`
  - Omitted: `playwright` — not needed for implementation; verification handled later

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T2,T3,T6 | Blocked By: none

  **References**:
  - Current font asset: `public/fonts/PretendardVariable.woff2`
  - Current font-face declaration: `src/app/globals.css:4`
  - Next.js docs: https://nextjs.org/docs/app/api-reference/components/font

  **Acceptance Criteria**:
  - [x] `src/lib/fonts.ts` exists and exports a Pretendard font object with `.variable`.
  - [x] Font file exists at `src/assets/fonts/PretendardVariable.woff2`.
  - [x] `public/fonts/PretendardVariable.woff2` is removed (or no longer referenced anywhere).

  **QA Scenarios**:
  ```
  Scenario: Font asset path is updated
    Tool: Bash
    Steps: Run:
      node -e "const fs=require('fs');const path=require('path');if(!fs.existsSync('src/assets/fonts/PretendardVariable.woff2')){console.error('missing font file');process.exit(1)};const walk=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);const files=walk('src').filter(f=>/\.(ts|tsx|css|json|md)$/.test(f));const needle=\"url('/fonts/PretendardVariable.woff2')\";const hits=files.filter(f=>fs.readFileSync(f,'utf8').includes(needle));if(hits.length){console.error('Found legacy font URL in:');hits.forEach(h=>console.error(h));process.exit(1)};console.log('OK')"
    Expected: Script exits 0; no matches for the old public URL.
    Evidence: .sisyphus/evidence/task-1-font-asset-check.txt

  Scenario: Build-time import is valid
    Tool: Bash
    Steps: Run `pnpm build`.
    Expected: Build succeeds (exit code 0).
    Evidence: .sisyphus/evidence/task-1-build.txt
  ```

  **Commit**: YES | Message: `refactor(font): migrate Pretendard to next/font/local` | Files: `src/lib/fonts.ts`, `src/assets/fonts/PretendardVariable.woff2`, (remove) `public/fonts/PretendardVariable.woff2`

- [x] 2. Wire Pretendard variable into root layout

  **What to do**:
  - Update `src/app/layout.tsx` to import Pretendard from `src/lib/fonts.ts`.
  - Apply the `.variable` class to `<html>` so the CSS variable is defined globally.
  - Exact change (keep everything else the same):

  ```tsx
  // add near other imports
  import { pretendard } from '@/lib/fonts';

  // change <html ...> opening tag
  <html lang="ko" suppressHydrationWarning className={pretendard.variable}>
  ```

  - Keep existing `<head>` theme script intact.

  **Must NOT do**:
  - Do not move the font wiring into a route-group layout; apply at root to preload on all routes.

  **Recommended Agent Profile**:
  - Category: `quick` — single-file change
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6 | Blocked By: T1

  **References**:
  - Root layout: `src/app/layout.tsx:30`
  - Body currently uses `font-pretendard`: `src/app/layout.tsx:39`
  - Next.js preload rules: https://nextjs.org/docs/app/api-reference/components/font#preloading

  **Acceptance Criteria**:
  - [x] `<html>` has the Pretendard `.variable` class applied.
  - [ ] App renders without hydration warnings beyond the existing `suppressHydrationWarning` intent.

  **QA Scenarios**:
  ```
  Scenario: Root layout is wired to Pretendard variable
    Tool: Bash
    Steps: Run:
      node -e "const fs=require('fs');const s=fs.readFileSync('src/app/layout.tsx','utf8');if(!s.includes(\"import { pretendard } from '@/lib/fonts'\")) {console.error('missing pretendard import');process.exit(1)};if(!s.includes('className={pretendard.variable}')) {console.error('missing html className wiring');process.exit(1)};console.log('OK')"
    Expected: Script exits 0.
    Evidence: .sisyphus/evidence/task-2-layout-wiring.txt

  Scenario: No runtime error from layout changes
    Tool: Bash
    Steps: Run `pnpm build`.
    Expected: Build succeeds.
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES | Message: `refactor(font): apply next/font variable in root layout` | Files: `src/app/layout.tsx`

- [x] 3. Remove legacy Pretendard `@font-face` and map Tailwind token

  **What to do**:
  - In `src/app/globals.css`, remove the Pretendard `@font-face` block.
  - Keep the Tailwind v4 `@theme` token `--font-pretendard`, but set it to this exact value so existing `font-pretendard` utility and `body { font-family: var(--font-pretendard); }` keep working:

  ```css
  --font-pretendard: var(--next-font-pretendard), Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  ```

  - Ensure `body` still ends up using Pretendard.

  **Must NOT do**:
  - Do not remove unrelated theme variables.
  - Do not change colors/themes.

  **Recommended Agent Profile**:
  - Category: `quick` — small CSS edit
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6 | Blocked By: T1

  **References**:
  - Pretendard font-face currently: `src/app/globals.css:4`
  - Tailwind theme token currently: `src/app/globals.css:42`
  - Body font usage currently: `src/app/globals.css:339`

  **Acceptance Criteria**:
  - [x] `src/app/globals.css` no longer contains `@font-face` for Pretendard.
  - [x] `--font-pretendard` resolves to `--next-font-pretendard`.
  - [x] `pnpm build` succeeds.

  **QA Scenarios**:
  ```
  Scenario: Legacy public font URL removed
    Tool: Bash
    Steps: Run grep for `url('/fonts/PretendardVariable.woff2')` across `src/`.
    Expected: No matches.
    Evidence: .sisyphus/evidence/task-3-no-font-face.txt

  Scenario: Computed font-family uses Pretendard
    Tool: Playwright
    Steps: Navigate to `/` and evaluate `getComputedStyle(document.body).fontFamily`.
    Expected: Returned string contains `Pretendard`.
    Evidence: .sisyphus/evidence/task-3-font-computed.json
  ```

  **Commit**: YES | Message: `refactor(font): remove legacy @font-face and map Tailwind token` | Files: `src/app/globals.css`

- [x] 4. Remove inline `fontFamily` override in intro demo page

  **What to do**:
  - In `src/app/intro-demo/page.tsx`, remove the inline `fontFamily: ...` from the root container style object.
  - Add `className="font-pretendard"` on that root container (keep other inline styles unchanged to avoid scope creep).

  **Must NOT do**:
  - Do not refactor other inline styles in this page.

  **Recommended Agent Profile**:
  - Category: `quick` — single-file targeted edit
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: none | Blocked By: none

  **References**:
  - Inline fontFamily instance: `src/app/intro-demo/page.tsx:439`
  - Tailwind font token pattern: `src/app/globals.css:42`

  **Acceptance Criteria**:
  - [x] `src/app/intro-demo/page.tsx` no longer contains the string `Pretendard Variable`.
  - [x] Root container uses `className` containing `font-pretendard`.

  **QA Scenarios**:
  ```
  Scenario: Pretendard inline fontFamily removed
    Tool: Bash
    Steps: Run:
      node -e "const fs=require('fs');const s=fs.readFileSync('src/app/intro-demo/page.tsx','utf8');if(s.includes('Pretendard Variable')){console.error('still contains Pretendard Variable string');process.exit(1)};if(!s.includes('font-pretendard')){console.error('missing font-pretendard class usage');process.exit(1)};console.log('OK')"
    Expected: Script exits 0 (other `fontFamily:` keys in this file may still exist).
    Evidence: .sisyphus/evidence/task-4-no-inline-fontfamily.txt

  Scenario: Page still renders
    Tool: Playwright
    Steps: Navigate to `/intro-demo`.
    Expected: Page loads (no console errors) and text is visible.
    Evidence: .sisyphus/evidence/task-4-intro-demo.png
  ```

  **Commit**: YES | Message: `chore(font): remove intro demo inline fontFamily` | Files: `src/app/intro-demo/page.tsx`

- [x] 5. Fix manifest icon reference (minimal)

  **What to do**:
  - Update `public/manifest.json` to reference existing `public/favicon.svg` instead of missing `/favicon.ico`.
  - Use `type: 'image/svg+xml'` and `sizes: 'any'`.
  - Exact replacement for the `icons` array:

  ```json
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
  ```

  **Must NOT do**:
  - Do not generate PNG icon sets or maskable icons.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: none | Blocked By: none

  **References**:
  - Manifest icon currently: `public/manifest.json:12`
  - Existing favicon: `public/favicon.svg`

  **Acceptance Criteria**:
  - [x] `public/manifest.json` no longer references `/favicon.ico`.
  - [ ] `curl -I http://localhost:3000/favicon.svg` returns 200 when dev server is running.

  **QA Scenarios**:
  ```
  Scenario: Manifest icons resolve
    Tool: Bash
    Steps: Start `pnpm dev` (port 3000). Then run:
      node -e "const base='http://localhost:3000';fetch(base+'/manifest.json').then(r=>{if(!r.ok) throw new Error('manifest '+r.status);return r.json()}).then(async m=>{const icons=(m.icons||[]).map(i=>i.src);if(!icons.length) throw new Error('no icons');for(const src of icons){const res=await fetch(base+src);if(!res.ok) throw new Error(src+' '+res.status)};console.log('OK')}).catch(e=>{console.error(e);process.exit(1)})"
    Expected: Script prints OK and exits 0.
    Evidence: .sisyphus/evidence/task-5-manifest-icons.txt

  Scenario: No 404s for favicon.ico from manifest
    Tool: Bash
    Steps: Run:
      node -e "fetch('http://localhost:3000/manifest.json').then(r=>r.text()).then(t=>{if(t.includes('favicon.ico')) process.exit(1); console.log('OK')}).catch(()=>process.exit(1))"
    Expected: Assertion passes.
    Evidence: .sisyphus/evidence/task-5-no-favicon-ico.txt
  ```

  **Commit**: YES | Message: `fix(pwa): correct manifest icon path` | Files: `public/manifest.json`

- [x] 6. Verification sweep (preload + computed font + build)

  **What to do**:
  - Run `pnpm lint`, `npx tsc --noEmit`, `pnpm build`.
  - Run Playwright checks to confirm:
    - `/` HTML includes a `link[rel="preload"][as="font"]` for Pretendard (Next/font injected).
    - `getComputedStyle(document.documentElement).getPropertyValue('--next-font-pretendard')` is non-empty.
    - `getComputedStyle(document.body).fontFamily` contains Pretendard on `/` and `/consultation/customer`.
  - Save captured HTML and computed-style JSON to `.sisyphus/evidence/`.

  **Must NOT do**:
  - Do not change code to “make the test pass” unless it’s a real regression from this font work.

  **Recommended Agent Profile**:
  - Category: `unspecified-low` — mixed Bash + Playwright verification
  - Skills: `["playwright"]` — reliable DOM + network assertions

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: none | Blocked By: T1,T2,T3

  **References**:
  - Root layout head currently has no preload: `src/app/layout.tsx:31`
  - Font token: `src/app/globals.css:42`
  - Consultation route group exists under `src/app/consultation/`

  **Acceptance Criteria**:
  - [ ] `pnpm lint` exits 0.
  - [ ] `npx tsc --noEmit` exits 0.
  - [ ] `pnpm build` exits 0.
  - [ ] Evidence shows a font preload link exists on `/`.
  - [ ] Evidence shows computed font-family contains Pretendard on the tested routes.

  **QA Scenarios**:
  ```
  Scenario: Preload tag exists for font
    Tool: Playwright
    Steps: Navigate to `/` and locate `link[rel="preload"][as="font"]`.
    Expected: At least one match; href includes `.woff2`.
    Evidence: .sisyphus/evidence/task-6-preload.html

  Scenario: Consultation route uses same font
    Tool: Playwright
    Steps: Navigate to `/consultation/customer` and read computed font-family.
    Expected: Contains `Pretendard`.
    Evidence: .sisyphus/evidence/task-6-consultation-font.json
  ```

  **Commit**: NO | Message: n/a | Files: n/a

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real QA Pass — unspecified-high (+ playwright)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy
- Prefer 1 commit per TODO marked `Commit: YES`.
- Do not amend; do not combine unrelated tasks.

## Success Criteria
- Font is loaded via `next/font/local` with automatic preload on all routes.
- No duplicate Pretendard `@font-face` remains.
- Visual typography remains effectively unchanged.
- `manifest.json` icon reference no longer points to a missing file.
