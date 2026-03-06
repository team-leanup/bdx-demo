# BDX Pivot: CRM + Schedule + Portfolio (Local-First Demo)

## TL;DR
> **Summary**: Re-center BDX on customer CRM + treatment records + photo portfolio, with consultation as a lightweight input tool and post-treatment final price entry.
> **Deliverables**: schedule-first home (with customer trait chips), persistent customer store, portfolio tab + grid + detail, emphasized customer traits (pin/color), pre-treatment alerts, simplified consultation flow (canvas optional + no mid-step pricing), treatment completion pricing editor.
> **Effort**: Large
> **Parallel**: YES - 4 waves
> **Critical Path**: Customer identity/linking → Portfolio storage + UI → Home schedule cards → Consultation + treatment finalization

## Context
### Original Request
- Pivot from “consultation system” to **CRM + treatment record system**.
- Home: schedule is the primary surface; each reservation card shows customer name + treatment type + customer trait tags.
- Add **Portfolio**: photo grid + detail (date, customer info, consultation/record, treatment content, final price).
- Customer card: highlight traits (pin/top + color/emphasis).
- Pre-treatment alert: show key traits before starting.
- Consultation: simplify to minimal steps; canvas becomes optional; price entered at the end of treatment.
- Two input modes: send consultation link (pre-fill), and in-store tablet mode.

### Interview Summary
- Highest value is reducing in-session cognitive load: “remembering traits” + “finding past photos/prices.”
- Consultation is primarily a data capture tool feeding CRM/records.

### Metis Review (gaps addressed)
- Biggest blocker is **customer identity normalization**: reservations lack `customerId`.
- LocalStorage quotas are a hard risk; image storage must have **numeric budgets + eviction** and graceful failure.
- Avoid auto-merging customers by ambiguous name/phone; require explicit linking.
- Add explicit migration strategy for persisted stores.

## Work Objectives
### Core Objective
- Deliver a **local-first demo** where operators can: manage customers with emphasized traits, see a schedule-first home view with trait chips, save records, attach photos into a portfolio, and finalize price after treatment.

### Deliverables
- D1. Customer persistence store (seeded from mocks) + explicit customer identity.
- D2. Reservation → customer linking (`customerId`) + schedule cards show pinned traits.
- D3. Portfolio tab (replacing Dashboard tab) + photo grid + photo detail modal.
- D4. Customer card enhancements: pin/color/emphasis for traits + persistent photo gallery.
- D5. Pre-treatment alert surface (pinned traits modal) on start actions.
- D6. Consultation simplification: hide mid-step pricing, canvas optional branch, add trait capture step.
- D7. Treatment completion: final price entry editor that updates stored record.
- D8. Local demo consultation link/QR generation for "kiosk/self-input" simulation.

### Definition of Done (verifiable conditions with commands)
- `pnpm lint` succeeds.
- `pnpm typecheck` succeeds.
- `pnpm build` succeeds.
- Dev server route smoke:
  - `pnpm dev --port 3000` then:
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/home` returns `200`.
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/portfolio` returns `200`.
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/customers` returns `200`.

### Must Have
- Customer traits visible on schedule cards (pinned traits).
- Portfolio is reachable via main nav and shows photos tied to customer + record.
- Final price is editable after treatment and reflects in records + portfolio detail.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No server DB, no Vercel Blob/S3/Cloudinary.
- No heavy calendar libraries; reuse existing calendar components.
- No unbounded base64 persistence in localStorage; enforce caps + eviction + clear error UX.
- No silent customer auto-merge by ambiguous name/phone.

## Verification Strategy
> ZERO HUMAN INTERVENTION target — use agent-run commands and (where needed) Playwright via MCP.
- Test decision: **none** (no existing infra). Verification relies on lint/typecheck/build + route smoke + Playwright MCP UI smoke.
- Evidence: write screenshots/logs to `.sisyphus/evidence/task-{N}-{slug}.{ext}`.

## Execution Strategy
### Parallel Execution Waves
Wave 1 (Foundations): data model normalization + nav + storage constraints
Wave 2 (Portfolio + CRM UI): portfolio pages + customer trait UX + schedule card trait chips
Wave 3 (Flow changes): consultation simplification + trait capture + treatment final price + alerts
Wave 4 (Polish + hardening): quota UX + settings cleanup + regression QA

### Dependency Matrix (full, all tasks)
- 1 blocks 5–12,15
- 2 blocks 5,7
- 3 blocks 4–6,17
- 4 blocks 5,17
- 6 blocks 7,12
- 7 blocks 12,16
- 8 blocks 11
- 9 blocks 10
- 13 blocked by 9,10
- 15 blocks 12

### Agent Dispatch Summary
- visual-engineering: 5,6,7,10,11,12,14,15
- deep/unspecified-high: 1,3,4,8,9,13,17

## TODOs
> Implementation + verification = ONE task.

- [x] 1. Normalize Customer Identity + Add Customer Store (Local Persistence)

  **What to do**:
  - Create `src/store/customer-store.ts` persisted via zustand `persist` (localStorage key `bdx-customers`).
  - Seed initial customers from `src/data/mock-customers.ts` on first run; after seeding, use store as source of truth.
  - Implement persist migration strategy (decision-complete):
    - use zustand persist `version: 1`
    - in `merge` or `migrate`, if persisted customers missing/empty, seed from mocks
    - never overwrite an existing non-empty persisted list
  - Define helper APIs: `getById`, `findByPhoneNormalized`, `createCustomer`, `updateCustomer`, `updateTags`, `setPinnedTraits`.
  - Implement phone normalization utility (strip non-digits; handle `010xxxxxxxx` patterns) in `src/lib/phone.ts`.
  - Replace mock customer reads with store reads in these exact files:
    - `src/app/(main)/customers/page.tsx`
    - `src/app/(main)/customers/[id]/page.tsx`
    - `src/components/consultation/CustomerInfoForm.tsx` (existing customer search/select)
    - `src/app/consultation/summary/page.tsx` (small talk memo writes)

  **Must NOT do**:
  - Do not auto-merge customers by name.
  - Do not mutate `src/data/mock-customers.ts` at runtime (treat as seed only).

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: cross-cutting data model + migration.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5,6,7,9,10,11,12 | Blocked By: -

  **References**:
  - Pattern: `src/store/reservation-store.ts` — zustand persist + SSR-safe storage.
  - Pattern: `src/store/app-store.ts` — merge/migration approach for persisted state.
  - Data seed: `src/data/mock-customers.ts`.
  - Types: `src/types/customer.ts`.

  **Acceptance Criteria**:
  - [ ] Customer store persists and survives reload (inspect localStorage `bdx-customers`).
  - [ ] No TypeScript errors (`pnpm typecheck`).

  **QA Scenarios**:
  ```
  Scenario: First-run seed
    Tool: Bash
    Steps:
      1) pnpm dev --port 3000
      2) Open /customers (Playwright MCP) and confirm customers render
      3) Reload page; confirm list is identical
    Expected: Customers load from store; no crash; state persists
    Evidence: .sisyphus/evidence/task-1-customer-store.png

  Scenario: Phone normalization
    Tool: Bash
    Steps:
      1) Add a customer with phone "010-1234-5678" via UI (or dev console)
      2) Search/link using "01012345678"
    Expected: Same customer found; no duplicates created implicitly
    Evidence: .sisyphus/evidence/task-1-phone-normalization.txt
  ```

  **Commit**: YES | Message: `feat(store): add persistent customer store and phone normalization` | Files: [`src/store/customer-store.ts`, `src/lib/phone.ts`]

- [x] 2. Add Portfolio Tab to Main Navigation (Replace Dashboard)

  **What to do**:
  - Update `src/components/layout/BottomTabBar.tsx` TAB_DEFS: replace `/dashboard` with `/portfolio`.
  - Update `src/components/layout/SideNav.tsx` TAB_DEFS similarly.
  - Add i18n label `nav.portfolio` (all languages) in `src/lib/i18n.ts`.
  - Keep `/dashboard` route intact; keep the existing Home QuickActions link to `/dashboard` so analytics stays reachable without adding new nav.

  **Must NOT do**:
  - Do not add a 6th bottom tab (avoid cramped mobile nav).

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: localized nav updates.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5,7 | Blocked By: -

  **References**:
  - Nav: `src/components/layout/BottomTabBar.tsx`, `src/components/layout/SideNav.tsx`.
  - i18n keys: `src/lib/i18n.ts` (`nav.*`).

  **Acceptance Criteria**:
  - [ ] `pnpm typecheck` passes.
  - [ ] On mobile, bottom tab shows Portfolio; active state works for `/portfolio/*`.

  **QA Scenarios**:
  ```
  Scenario: Navigation swap
    Tool: Playwright (MCP)
    Steps:
      1) Open /home
      2) Tap Portfolio tab
    Expected: Navigates to /portfolio; Portfolio tab is active
    Evidence: .sisyphus/evidence/task-2-nav-portfolio.png

  Scenario: Dashboard still reachable
    Tool: Bash
    Steps:
      1) curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard
    Expected: 200
    Evidence: .sisyphus/evidence/task-2-dashboard-200.txt
  ```

  **Commit**: YES | Message: `feat(nav): add portfolio tab and i18n label` | Files: [`src/components/layout/BottomTabBar.tsx`, `src/components/layout/SideNav.tsx`, `src/lib/i18n.ts`]

- [x] 3. Define Local Portfolio Image Policy (Resize + Quota Guardrails)

  **What to do**:
  - Extend `src/lib/image-utils.ts` with a portfolio-specific resize helper that enforces:
    - JPEG output
    - max dimension: 480px
    - target max KB: 120KB (retry lowering quality in steps)
  - Add a small utility to estimate total persisted portfolio size and enforce:
    - max photos: 30
    - max total portfolio bytes (approx): 3MB
    - eviction: remove oldest first
  - Ensure all persistence writes catch `QuotaExceededError` and show a user-facing error message + “manage storage” CTA.

  **Must NOT do**:
  - Do not store original full-res images.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: quota/robustness + image processing.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4,5,6 | Blocked By: -

  **References**:
  - Existing helper: `src/lib/image-utils.ts` (`resizeImageToBase64`).
  - Existing precedent: designer profile images base64 persistence in `src/store/designer-store.ts`.

  **Acceptance Criteria**:
  - [ ] Uploading a large photo produces a data URL that stays under target KB.
  - [ ] When exceeding limits, app does not crash; shows clear storage warning.

  **QA Scenarios**:
  ```
  Scenario: Resize and cap
    Tool: Playwright (MCP)
    Steps:
      1) Upload a high-res image in Portfolio upload flow
      2) Observe that thumbnail renders
    Expected: Renders successfully; persisted entry exists; no lag spike >2s
    Evidence: .sisyphus/evidence/task-3-resize.png

  Scenario: Quota protection
    Tool: Playwright (MCP)
    Steps:
      1) Upload images until cap is hit
    Expected: Oldest entries evicted OR upload blocked with clear message
    Evidence: .sisyphus/evidence/task-3-quota.png
  ```

  **Commit**: YES | Message: `feat(portfolio): add thumbnail resize and storage guardrails` | Files: [`src/lib/image-utils.ts`, `src/lib/storage-budget.ts`]

- [x] 4. Add Portfolio Store + Types (Local)

  **What to do**:
  - Add `src/types/portfolio.ts`:
    - `PortfolioPhoto` { id, customerId, recordId?, kind, createdAt, takenAt?, imageDataUrl, note?, tags? }
  - Add `src/store/portfolio-store.ts` persisted in localStorage key `bdx-portfolio`:
    - `photos: PortfolioPhoto[]`
    - `addPhoto`, `removePhoto`, `getByCustomerId`, `getByRecordId`, `getRecent`
    - enforce caps from T3 at the store boundary

  **Must NOT do**:
  - Do not duplicate full record/customer objects inside portfolio items.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: persistence + caps + selectors.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5,6 | Blocked By: 3

  **References**:
  - Persist pattern: `src/store/records-store.ts`.
  - Types: `src/types/customer.ts`, `src/types/consultation.ts`.

  **Acceptance Criteria**:
  - [ ] Portfolio items persist across reload.
  - [ ] Selectors return correct subsets.

  **QA Scenarios**:
  ```
  Scenario: Persist and query
    Tool: Bash
    Steps:
      1) Add one portfolio item (via dev server UI)
      2) Reload
    Expected: Item remains visible in /portfolio grid
    Evidence: .sisyphus/evidence/task-4-persist.png

  Scenario: Record linkage
    Tool: Playwright (MCP)
    Steps:
      1) From a record detail, open linked photos
    Expected: Shows only photos for that record
    Evidence: .sisyphus/evidence/task-4-record-link.png
  ```

  **Commit**: YES | Message: `feat(portfolio): add local portfolio store and types` | Files: [`src/types/portfolio.ts`, `src/store/portfolio-store.ts`]

- [x] 5. Implement Portfolio Page (Grid + Detail)

  **What to do**:
  - Create `src/app/(main)/portfolio/page.tsx`:
    - grid layout, newest-first
    - filters: customer search (by name), kind (reference/treatment)
    - upload button (uses T3 resize; stores via portfolio-store)
    - upload metadata (decision-complete): customer selection is REQUIRED; record link is optional
  - Create `src/app/(main)/portfolio/[id]/page.tsx`:
    - detail view for a single photo; show customer name, date, linked record summary, final price (if available)
  - Add shared UI components as needed under `src/components/portfolio/*`.

  **Must NOT do**:
  - Do not rely on `URL.createObjectURL` for persistence.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: grid + modal/detail UX.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: - | Blocked By: 2,4

  **References**:
  - Main route conventions: `src/app/(main)/customers/page.tsx`.
  - Existing image usage: `src/app/(main)/customers/[id]/page.tsx` gallery sections.

  **Acceptance Criteria**:
  - [ ] /portfolio loads and shows grid.
  - [ ] Upload adds a thumbnail and persists across reload.
  - [ ] Clicking an item opens its detail with metadata.

  **QA Scenarios**:
  ```
  Scenario: Upload and view
    Tool: Playwright (MCP)
    Steps:
      1) Go to /portfolio
      2) Upload 1 image
      3) Click the new tile
    Expected: Detail page shows image + customer + (record if linked)
    Evidence: .sisyphus/evidence/task-5-portfolio-flow.png

  Scenario: Filter
    Tool: Playwright (MCP)
    Steps:
      1) Filter by kind
    Expected: Only matching photos remain
    Evidence: .sisyphus/evidence/task-5-filter.png
  ```

  **Commit**: YES | Message: `feat(portfolio): add portfolio grid and detail pages` | Files: [`src/app/(main)/portfolio/page.tsx`, `src/app/(main)/portfolio/[id]/page.tsx`, `src/components/portfolio/*`]

- [x] 6. Customer Traits: Pin/Color/Emphasis + Persist

  **What to do**:
  - Extend customer tag model for emphasis (recommended: add optional fields to `CustomerTag` in `src/types/customer.ts`):
    - `pinned?: boolean`
    - `accent?: 'rose'|'amber'|'emerald'|'sky'|'slate'` (fixed palette)
    - `sortOrder?: number` (lower = higher)
  - Update customer-store APIs to toggle pinned/accent and persist.
  - Update `src/app/(main)/customers/[id]/page.tsx` to:
    - show pinned traits prominently near top
    - provide an editor UI: pin/unpin, set color, reorder pinned

  **Must NOT do**:
  - Do not introduce free-form color strings; use fixed palette tokens.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: UX for pinning + chips.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7,12 | Blocked By: 1

  **References**:
  - Tag presets: `src/data/tag-presets.ts`.
  - Existing preference editor style: `src/components/customer/PreferenceEditor.tsx`.
  - Customer detail page: `src/app/(main)/customers/[id]/page.tsx`.

  **Acceptance Criteria**:
  - [ ] Pin/unpin persists after reload.
  - [ ] Pinned traits show in consistent order and color.

  **QA Scenarios**:
  ```
  Scenario: Pin + persist
    Tool: Playwright (MCP)
    Steps:
      1) Open /customers/customer-001
      2) Pin "큐티클민감" and set accent
      3) Reload
    Expected: Trait remains pinned with same accent
    Evidence: .sisyphus/evidence/task-6-pinned.png

  Scenario: Reorder
    Tool: Playwright (MCP)
    Steps:
      1) Reorder pinned traits
    Expected: Schedule + alerts use the new order
    Evidence: .sisyphus/evidence/task-6-order.png
  ```

  **Commit**: YES | Message: `feat(customer): add pinned trait emphasis and editor` | Files: [`src/types/customer.ts`, `src/store/customer-store.ts`, `src/app/(main)/customers/[id]/page.tsx`]

- [x] 7. Schedule-First Home: Reservation Cards Show Treatment Type + Pinned Traits

  **What to do**:
  - Add `serviceLabel?: string` and `customerId?: string` to `BookingRequest` in `src/types/consultation.ts`.
  - Update seed data to demonstrate the feature:
    - Edit `src/data/mock-reservations.ts` so at least 2 reservations reference real `customerId` values from `src/data/mock-customers.ts` and include `serviceLabel` values (e.g., "자석젤", "원컬러").
  - Update reservation creation UIs:
    - `src/components/home/ReservationForm.tsx`
    - `src/components/calendar/DayReservationList.tsx` (AddReservationForm)
    to capture `serviceLabel` (simple select) and link/create customerId using customer-store.
  - Update `src/components/home/TodayReservationCard.tsx` to render:
    - customer name
    - serviceLabel
    - up to 3 pinned trait chips (from customer-store)
  - Update `src/app/(main)/home/page.tsx` layout to make reservation list the primary block (top priority) and demote other cards.

  **Must NOT do**:
  - Do not break existing mock reservations that lack `customerId`/`serviceLabel`; handle undefined gracefully.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: home layout + card design.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 9,12 | Blocked By: 1

  **References**:
  - Home page: `src/app/(main)/home/page.tsx`.
  - Reservation list: `src/components/home/TodayReservationCard.tsx`.
  - Existing schedule views: `src/app/(main)/records/page.tsx`, `src/components/calendar/TimeGridCalendar.tsx`.
  - Reservations store: `src/store/reservation-store.ts`.

  **Acceptance Criteria**:
  - [ ] Home shows today reservations prominently.
  - [ ] Reservation cards show pinned trait chips when linked to a customer.

  **QA Scenarios**:
  ```
  Scenario: Create reservation and see traits
    Tool: Playwright (MCP)
    Steps:
      1) Add a reservation linked to an existing customer
      2) Return to /home
    Expected: Card shows serviceLabel and pinned traits
    Evidence: .sisyphus/evidence/task-7-home-traits.png

  Scenario: Unlinked reservation
    Tool: Playwright (MCP)
    Steps:
      1) Ensure a reservation without customerId exists
    Expected: Card still renders; shows "고객 연결 필요" CTA
    Evidence: .sisyphus/evidence/task-7-unlinked.png
  ```

  **Commit**: YES | Message: `feat(schedule): show service + pinned traits on home reservations` | Files: [`src/types/consultation.ts`, `src/components/home/TodayReservationCard.tsx`, `src/app/(main)/home/page.tsx`, `src/components/home/ReservationForm.tsx`, `src/components/calendar/DayReservationList.tsx`]

- [x] 8. Records + Pricing Model: Support Post-Treatment Final Price Updates

  **What to do**:
  - Extend `src/types/consultation.ts` `ConsultationRecord` to carry:
    - `finalPrice` as current value
    - add optional `finalizedAt?: string`
    - add optional `pricingAdjustments?: { basePrice: number; extras: { label: string; amount: number }[]; finalPrice: number }`
  - Update `src/store/records-store.ts` with `updateRecord(id, patch)` and persist.
  - Update record list displays (`src/components/home/RecentConsultationCard.tsx`, `src/components/records/ConsultationListItem.tsx`, `src/app/(main)/records/[id]/page.tsx`) to:
    - show “가격 미확정” if no `finalizedAt` (or if `pricingAdjustments` missing)
    - show final price once finalized

  **Must NOT do**:
  - Do not change mock seed data shapes in a breaking way; use optional fields.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: type changes + multiple UI consumers.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 11 | Blocked By: 1

  **References**:
  - Record detail: `src/app/(main)/records/[id]/page.tsx`.
  - Record store: `src/store/records-store.ts`.

  **Acceptance Criteria**:
  - [ ] Typecheck passes after adding optional fields.
  - [ ] Existing mock records still render.

  **QA Scenarios**:
  ```
  Scenario: Non-finalized record
    Tool: Playwright (MCP)
    Steps:
      1) Open a record without finalizedAt
    Expected: UI shows "가격 미확정" in price section
    Evidence: .sisyphus/evidence/task-8-nonfinal.png

  Scenario: Finalized record
    Tool: Playwright (MCP)
    Steps:
      1) Finalize price via treatment completion flow (T11)
      2) Reopen record detail
    Expected: Shows updated final price + finalizedAt
    Evidence: .sisyphus/evidence/task-8-finalized.png
  ```

  **Commit**: YES | Message: `feat(records): support post-treatment price finalization` | Files: [`src/types/consultation.ts`, `src/store/records-store.ts`, `src/app/(main)/records/[id]/page.tsx`, `src/components/home/RecentConsultationCard.tsx`, `src/components/records/ConsultationListItem.tsx`]

- [x] 9. Consultation Simplification Baseline: Hide Mid-Step Pricing + Canvas Optional

  **What to do**:
  - Update `src/store/consultation-store.ts` STEP_ORDER to remove `ConsultationStep.CANVAS` from linear flow.
  - Add `showEstimated?: boolean` prop to `src/components/consultation/ConsultationFooter.tsx` and hide estimated price when false.
  - Pass `showEstimated={false}` on intermediate step pages:
    - `src/app/consultation/customer/page.tsx`
    - `src/app/consultation/step1/page.tsx`
    - `src/app/consultation/step2/page.tsx`
    - `src/app/consultation/step3/page.tsx`
  - Add “캔버스 (선택)” button on `src/app/consultation/step3/page.tsx` and/or `src/app/consultation/summary/page.tsx` to navigate to `/consultation/canvas`.

  **Must NOT do**:
  - Do not change canvas mapping logic in `src/app/consultation/canvas/page.tsx`.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: low-churn targeted edits.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 10,11 | Blocked By: -

  **References**:
  - Flow store: `src/store/consultation-store.ts`.
  - Footer: `src/components/consultation/ConsultationFooter.tsx`.
  - Canvas integration: `src/app/consultation/canvas/page.tsx`.

  **Acceptance Criteria**:
  - [ ] Consultation flow reaches Summary without visiting Canvas.
  - [ ] Price is not shown on intermediate steps.

  **QA Scenarios**:
  ```
  Scenario: Linear flow without canvas
    Tool: Playwright (MCP)
    Steps:
      1) Start consultation from /consultation
      2) Complete customer → step1 → step2 → step3 → summary
    Expected: No canvas required; no mid-step price; summary still saves
    Evidence: .sisyphus/evidence/task-9-flow.png

  Scenario: Optional canvas
    Tool: Playwright (MCP)
    Steps:
      1) From step3 tap "캔버스 (선택)"
      2) Make a change; return to summary
    Expected: Summary reflects canvasData presence (e.g., shows canvas section)
    Evidence: .sisyphus/evidence/task-9-canvas.png
  ```

  **Commit**: YES | Message: `feat(consultation): make canvas optional and hide mid-step pricing` | Files: [`src/store/consultation-store.ts`, `src/components/consultation/ConsultationFooter.tsx`, `src/app/consultation/step3/page.tsx`, `src/app/consultation/summary/page.tsx`]

- [x] 10. Consultation Trait Capture Step (Feeds Customer Card)

  **What to do**:
  - Add new page `src/app/consultation/traits/page.tsx` (or reuse step3) to select customer traits:
    - Use `src/data/tag-presets.ts` category `etc` + optionally other categories.
    - Store selections in consultation-store (add field `selectedTraitValues: string[]`) OR store in sessionStorage.
  - On save (`src/app/consultation/summary/page.tsx`), update linked customer in customer-store:
    - ensure selected traits exist as CustomerTag entries (category `etc`)
    - optionally auto-pin the selected ones (default: pin newly selected)
  - Update `src/app/consultation/step3/page.tsx` Next routing to include /traits before /summary.

  **Must NOT do**:
  - Do not require translations in main routes; only consultation pages need dual-language pattern.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: selection UI + dual-language.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 12 | Blocked By: 1,9

  **References**:
  - Consultation pages: `src/app/consultation/*`.
  - Tag presets: `src/data/tag-presets.ts`.
  - i18n patterns: `src/app/consultation/CLAUDE.md`.

  **Acceptance Criteria**:
  - [ ] Selected traits appear on customer card after save.
  - [ ] Dual-language labels follow existing pattern.

  **QA Scenarios**:
  ```
  Scenario: Trait selection propagates to customer
    Tool: Playwright (MCP)
    Steps:
      1) Start consultation for an existing customer
      2) Select traits (e.g., 큐티클민감, 오버레이선호)
      3) Save consultation
      4) Open that customer detail page
    Expected: Traits present and pinned; visible near top
    Evidence: .sisyphus/evidence/task-10-traits.png

  Scenario: Duplicate trait protection
    Tool: Playwright (MCP)
    Steps:
      1) Repeat consultation selecting same trait
    Expected: No duplicate tags created
    Evidence: .sisyphus/evidence/task-10-dedupe.png
  ```

  **Commit**: YES | Message: `feat(consultation): capture customer traits and update CRM on save` | Files: [`src/app/consultation/traits/page.tsx`, `src/store/consultation-store.ts`, `src/app/consultation/summary/page.tsx`, `src/lib/i18n.ts`]

- [x] 11. Treatment Completion: Final Price Entry (Base + Extras + Final)

  **What to do**:
  - Enhance `src/app/consultation/treatment-sheet/page.tsx` to include a final price editor:
    - base price input
    - add/remove extras list (label + amount)
    - auto-calculate final price
    - persist into record via records-store `updateRecord`
    - set `finalizedAt` timestamp
  - Ensure `src/app/(main)/records/[id]/page.tsx` reads and displays finalized data.

  **Must NOT do**:
  - Do not require pro pricing config changes; keep simple inputs for demo.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: input UX + validation.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: 8

  **References**:
  - Treatment sheet: `src/app/consultation/treatment-sheet/page.tsx`.
  - Pricing calc: `src/lib/price-calculator.ts` (reference only; editor overrides).

  **Acceptance Criteria**:
  - [ ] Final price edits persist and reflect in record detail + lists.
  - [ ] Final price shown in portfolio detail when linked.

  **QA Scenarios**:
  ```
  Scenario: Finalize price
    Tool: Playwright (MCP)
    Steps:
      1) Complete a consultation and land on treatment-sheet
      2) Enter base price and extras
      3) Complete and return home
      4) Open /records/[id]
    Expected: Final price matches editor; finalizedAt present
    Evidence: .sisyphus/evidence/task-11-finalize.png

  Scenario: Validation
    Tool: Playwright (MCP)
    Steps:
      1) Enter negative extra amount
    Expected: Input rejected or error shown; cannot finalize
    Evidence: .sisyphus/evidence/task-11-validation.png
  ```

  **Commit**: YES | Message: `feat(pricing): add post-treatment final price editor` | Files: [`src/app/consultation/treatment-sheet/page.tsx`, `src/store/records-store.ts`, `src/types/consultation.ts`]

- [x] 12. Pre-Treatment Alert Modal (Pinned Traits)

  **What to do**:
  - When user taps “상담 시작” on a reservation (home + records views), show a modal summarizing pinned traits:
    - message list (top 3–5)
    - acknowledge button: “확인하고 시작”
  - Trigger points:
    - `src/components/home/TodayReservationCard.tsx` (before routing to consultation)
    - `src/components/calendar/DayReservationList.tsx` start button
  - Optional: also show on `treatment-sheet` load.

  **Must NOT do**:
  - Do not show alert repeatedly during normal navigation; only on start actions.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: modal UX + integration.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: 6,7

  **References**:
  - Modal component: `src/components/ui/Modal.tsx`.
  - Reservation cards: `src/components/home/TodayReservationCard.tsx`.
  - Day list: `src/components/calendar/DayReservationList.tsx`.

  **Acceptance Criteria**:
  - [ ] Modal appears on start action when customer has pinned traits.
  - [ ] Acknowledge continues navigation; cancel aborts.

  **QA Scenarios**:
  ```
  Scenario: Alert blocks start
    Tool: Playwright (MCP)
    Steps:
      1) Ensure a customer has pinned traits
      2) Tap "상담 시작"
    Expected: Modal appears; navigation does not happen until acknowledge
    Evidence: .sisyphus/evidence/task-12-alert.png

  Scenario: No pinned traits
    Tool: Playwright (MCP)
    Steps:
      1) Tap "상담 시작" for customer without pinned traits
    Expected: No modal; direct navigation
    Evidence: .sisyphus/evidence/task-12-noalert.png
  ```

  **Commit**: YES | Message: `feat(alerts): show pinned trait alert before treatment start` | Files: [`src/components/home/TodayReservationCard.tsx`, `src/components/calendar/DayReservationList.tsx`, `src/components/alerts/PretreatmentAlertModal.tsx`]

- [ ] 13. Simplify Consultation Content to Minimal CRM Capture (Default Path)

  **What to do**:
  - Reduce required input to match the interview-driven minimal flow, while reusing existing pages for low churn:
    - Keep `/consultation/customer` as Step 1 (customer + reference images upload stays here).
    - Keep `/consultation/step1` as Step 2 (bodyPart + offType + extensionType).
    - Repurpose `/consultation/step2` as Step 3 (treatment type quick select):
      - Render 4 choices: 원컬러 / 그라데이션 / 자석젤 / 아트
      - On select, set consultation fields using a fixed mapping:
        - 원컬러 -> `designScope: solid_tone`, `expressions: ['solid']`
        - 그라데이션 -> `designScope: solid_tone`, `expressions: ['gradient']`
        - 자석젤 -> `designScope: solid_tone`, `expressions: ['magnetic']`
        - 아트 -> `designScope: full_art`, `expressions: ['solid']`
      - Remove/disable DesignPresetPicker + DesignScopeSelector UI in this demo path.
    - Keep new `/consultation/traits` as Step 4 (from Task 10).
    - Keep `/consultation/summary` as Step 5 (save).
    - Canvas stays optional branch.
  - Update `src/store/consultation-store.ts` STEP_ORDER to reflect this minimal path (decision-complete):
    - `[START, CUSTOMER_INFO, STEP1_BASIC, STEP2_DESIGN, SUMMARY]` is NOT acceptable because it skips traits.
    - Add a new `ConsultationStep` enum value `TRAITS` and include it in STEP_ORDER:
      - `[START, CUSTOMER_INFO, STEP1_BASIC, STEP2_DESIGN, TRAITS, SUMMARY]`
  - Update `/consultation` entry step visualization (`src/app/consultation/page.tsx`) to reflect new step count and labels.
  - Keep existing advanced step3 page reachable as “상세 옵션(선택)” (optional) instead of required.

  **Must NOT do**:
  - Do not delete advanced pages/components; keep them as optional so regression risk stays low.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: step model changes + i18n keys + routing.
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 15 | Blocked By: 9,10

  **References**:
  - Step routing: `src/app/consultation/*`.
  - Step store and enum: `src/types/consultation.ts`, `src/store/consultation-store.ts`.
  - Existing entry visualization: `src/app/consultation/page.tsx`.

  **Acceptance Criteria**:
  - [ ] Minimal consultation can be completed in 5 screens (+ optional canvas).
  - [ ] Trait selection step is part of linear navigation.
  - [ ] Old detailed options are optional and do not block saving.

  **QA Scenarios**:
  ```
  Scenario: Minimal flow completion
    Tool: Playwright (MCP)
    Steps:
      1) Start consultation
      2) Complete customer -> step1 -> step2(treatment type) -> traits -> summary -> save
    Expected: Saves record; returns to treatment-sheet; reservation marked completed when bookingId exists
    Evidence: .sisyphus/evidence/task-13-minimal-flow.png

  Scenario: Optional detailed options
    Tool: Playwright (MCP)
    Steps:
      1) From treatment type screen, open 상세 옵션(선택)
      2) Return back and save
    Expected: Optional screen does not break step order; save still works
    Evidence: .sisyphus/evidence/task-13-optional-options.png
  ```

  **Commit**: YES | Message: `feat(consultation): simplify default flow to minimal CRM capture` | Files: [`src/types/consultation.ts`, `src/store/consultation-store.ts`, `src/app/consultation/page.tsx`, `src/app/consultation/step2/page.tsx`]

- [ ] 14. Settings: Storage Management + Demo Reset

  **What to do**:
  - Add section in `src/app/(main)/settings/page.tsx`:
    - show approximate storage usage for `bdx-customers`, `bdx-reservations`, `bdx-records`, `bdx-portfolio`
    - buttons: clear portfolio only; clear all demo data
  - Clearing should also revoke any object URLs in memory (best-effort).

  **Must NOT do**:
  - Do not clear data silently; require confirmation.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: localized settings UI.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: - | Blocked By: 1,4

  **References**:
  - Settings page patterns: `src/app/(main)/settings/page.tsx`.
  - Storage keys: various `src/store/*`.

  **Acceptance Criteria**:
  - [ ] Clearing portfolio removes items from /portfolio.
  - [ ] Clear-all returns app to seeded state.

  **QA Scenarios**:
  ```
  Scenario: Clear portfolio
    Tool: Playwright (MCP)
    Steps:
      1) Add a portfolio photo
      2) Go to settings → clear portfolio
      3) Return to /portfolio
    Expected: Grid empty
    Evidence: .sisyphus/evidence/task-13-clear-portfolio.png

  Scenario: Clear all
    Tool: Playwright (MCP)
    Steps:
      1) Clear all demo data
      2) Visit /customers
    Expected: Seeded customers restored
    Evidence: .sisyphus/evidence/task-13-clear-all.png
  ```

  **Commit**: YES | Message: `feat(settings): add storage management and demo reset` | Files: [`src/app/(main)/settings/page.tsx`, `src/lib/storage-budget.ts`]

- [ ] 15. Reservation ↔ Customer Linking UI (Backfill Existing Reservations)

  **What to do**:
  - Add a “고객 연결” flow for reservations that lack `customerId`:
    - UI entry points:
      - `src/components/home/TodayReservationCard.tsx` (within each row)
      - `src/components/calendar/DayReservationList.tsx` (within each card)
    - Modal contents:
      - search existing customers (name/phone)
      - option to create new customer (name required; phone optional)
      - on confirm: update reservation via `useReservationStore.updateReservation(id, { customerId })`
  - Ensure linking never changes reservation name/phone silently; only attaches `customerId`.
  - After linking, schedule card immediately shows pinned traits.

  **Must NOT do**:
  - Do not auto-link based on fuzzy matching; always explicit.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: modal UX + 2 entry points.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 12 | Blocked By: 1

  **References**:
  - Reservation store update: `src/store/reservation-store.ts`.
  - Modal: `src/components/ui/Modal.tsx`.
  - Home reservation list: `src/components/home/TodayReservationCard.tsx`.
  - Day list: `src/components/calendar/DayReservationList.tsx`.

  **Acceptance Criteria**:
  - [ ] Unlinked reservations can be explicitly linked to an existing customer.
  - [ ] Linking persists across reload and does not create duplicates.

  **QA Scenarios**:
  ```
  Scenario: Link existing reservation
    Tool: Playwright (MCP)
    Steps:
      1) Find a reservation without customerId
      2) Click "고객 연결"
      3) Select an existing customer
    Expected: Reservation now shows pinned trait chips; persists after reload
    Evidence: .sisyphus/evidence/task-15-link.png

  Scenario: Create new customer during linking
    Tool: Playwright (MCP)
    Steps:
      1) Link flow → create new customer
    Expected: New customer appears in /customers; reservation linked
    Evidence: .sisyphus/evidence/task-15-create.png
  ```

  **Commit**: YES | Message: `feat(reservations): add explicit customer linking flow` | Files: [`src/components/home/TodayReservationCard.tsx`, `src/components/calendar/DayReservationList.tsx`, `src/components/reservations/LinkCustomerModal.tsx`]

- [ ] 16. Consultation Link / QR for Local Demo (Kiosk Self-Input Simulation)

  **What to do**:
  - In reservation detail UI (home and/or records), add a “상담 링크” action that generates a URL using existing query param conventions:
    - `/consultation/customer?name=...&phone=...&note=...&lang=...&bookingId=...`
  - Show:
    - copyable link (clipboard)
    - optional QR (if no QR lib, render the link as large text + “Open in new tab” only)
  - Explicitly label as **same-device demo** (no server persistence).

  **Must NOT do**:
  - Do not claim multi-device persistence.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: uses existing prefill pattern.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: - | Blocked By: 7

  **References**:
  - Prefill logic: `src/app/(main)/home/page.tsx` `handleStartConsultation` builds query params.
  - Consultation customer page: `src/app/consultation/customer/page.tsx` reads query params.

  **Acceptance Criteria**:
  - [ ] Generated link opens consultation with fields prefilled.
  - [ ] bookingId is set in consultation store and reservation status updates to completed on save.

  **QA Scenarios**:
  ```
  Scenario: Open generated link
    Tool: Playwright (MCP)
    Steps:
      1) Generate link from a reservation
      2) Open link in a new tab
    Expected: Customer form is prefilled; language set; save completes
    Evidence: .sisyphus/evidence/task-16-link.png

  Scenario: bookingId status update
    Tool: Playwright (MCP)
    Steps:
      1) Save consultation started from booking link
      2) Return to schedule
    Expected: Booking status becomes completed
    Evidence: .sisyphus/evidence/task-16-status.png
  ```

  **Commit**: YES | Message: `feat(consultation): add local demo consultation link generator` | Files: [`src/components/reservations/ConsultationLinkModal.tsx`, `src/components/home/TodayReservationCard.tsx`]

- [ ] 17. Persist Customer Gallery + Auto-Create Portfolio Entries from Flows

  **What to do**:
  - Replace in-memory objectURL galleries with portfolio-store persistence:
    - `src/app/(main)/customers/[id]/page.tsx` “이미지 갤러리” should save uploads into portfolio-store (kind: treatment/consult), linked to customerId.
  - On consultation save, optionally create portfolio entries from `consultation.referenceImages` when they are base64 (decision: only save if image is a data URL; if objectURL, do not persist).
  - Update portfolio grid to show photos created from customer gallery uploads.

  **Must NOT do**:
  - Do not persist `blob:` URLs.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: refactor existing gallery + persistence.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: - | Blocked By: 3,4,5

  **References**:
  - Current gallery (objectURL): `src/app/(main)/customers/[id]/page.tsx`.
  - Consultation reference images: `src/app/consultation/customer/page.tsx`, `src/app/consultation/step2/page.tsx`.
  - Portfolio store: `src/store/portfolio-store.ts`.

  **Acceptance Criteria**:
  - [ ] Customer gallery photos survive reload and appear in /portfolio.
  - [ ] No persisted photo entry contains a `blob:` URL.

  **QA Scenarios**:
  ```
  Scenario: Customer gallery → portfolio
    Tool: Playwright (MCP)
    Steps:
      1) Upload a photo in customer detail gallery
      2) Reload
      3) Open /portfolio
    Expected: Photo appears in portfolio and in customer gallery
    Evidence: .sisyphus/evidence/task-17-gallery.png

  Scenario: Prevent blob URL persistence
    Tool: Bash
    Steps:
      1) Inspect localStorage key bdx-portfolio
    Expected: No values start with "blob:"
    Evidence: .sisyphus/evidence/task-17-noblob.txt
  ```

  **Commit**: YES | Message: `feat(portfolio): persist customer gallery uploads into portfolio store` | Files: [`src/app/(main)/customers/[id]/page.tsx`, `src/store/portfolio-store.ts`]

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. UI Smoke QA (Playwright MCP) — unspecified-high
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Commit 1: customer identity + store + phone normalization
- Commit 2: nav swap + i18n key
- Commit 3: portfolio storage policy + portfolio store
- Commit 4: portfolio pages
- Commit 5: customer trait emphasis
- Commit 6: reservations (customerId/serviceLabel) + home schedule cards + seeded demo reservations
- Commit 7: records pricing finalization model
- Commit 8: consultation baseline (optional canvas + hide mid-step pricing)
- Commit 9: consultation trait capture step
- Commit 10: simplify default consultation flow to minimal CRM capture
- Commit 11: treatment completion final price editor
- Commit 12: pre-treatment alert
- Commit 13: settings storage management
- Commit 14: reservation/customer linking UI
- Commit 15: local demo consultation link generator
- Commit 16: persist customer gallery into portfolio

## Success Criteria
- Operator can: link reservation to customer → see pinned traits on schedule → start consult with alert → save record → attach photo to portfolio → finalize price after treatment → later find photo + price in portfolio.
- App remains stable under localStorage constraints (caps + eviction + clear UX).
