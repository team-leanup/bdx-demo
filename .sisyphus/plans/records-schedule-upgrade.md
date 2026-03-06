# Records Schedule Upgrade (Day View + Drag + Customer Highlights)

## TL;DR
> **Summary**: Make `/records` reservations schedule day-based (single-day), columned by designer, with drag-to-reschedule (time + designer) and at-a-glance customer caution highlights.
> **Deliverables**:
> - Day schedule view as default (selected date label: `3월 2일 (월요일)` style)
> - Designer-column day grid with 30-min snap drag move (same-day)
> - Reservation blocks show pinned customer highlights (주의/특이사항) + core booking context
> **Effort**: Medium
> **Parallel**: YES - 3 waves
> **Critical Path**: Day view scaffold → drag+snap+persist → customer highlights in blocks

## Context

### Original Request
Field feedback for `src/app/(main)/records/`:
- Prefer day-unit scheduling UX (avoid week-range label `3/2~8`; show single-day like `3월 2일 월요일`).
- Allow dragging existing reservations to move them freely ("자리 이동"; columns per designer/teacher).
- Differentiate by showing core customer info (cautions/preferences) prominently on the schedule.
- Let owner select and highlight key caution points (e.g., cuticle sensitivity, avoids conversation) so the schedule alone can remind them.

### Interview Summary
- View: **"일간만 메인으로 전환"** (day view becomes primary).
- Drag scope: **same day** only; change **time + designer**.
- Snap: **30 minutes**.

### Metis Review (gaps addressed)
- Explicitly define booking block duration (keep existing implicit 60m; reservations render as 60-minute blocks).
- Define collision policy, unassigned-designer handling, role permissions, out-of-hours handling.
- Prefer using existing Framer Motion drag (already a dependency) over adding a new DnD library.

## Work Objectives

### Core Objective
On `/records` → Reservations tab: ship a day-based schedule that is faster to read and edit than competitor ERPs, by surfacing customer-specific “remember this” context and enabling drag rescheduling.

### Deliverables
- Day schedule becomes default view (toggle supports at least: `일간`, `월간`).
- Day schedule UI:
  - Selected date label in Korean long form (e.g., `3월 2일 (월요일)`)
  - Columns per designer + `미지정` column
  - Vertical time axis aligned to shop business hours
- Drag to move reservation blocks:
  - Same-day only
  - Updates `designerId` + `reservationTime` via `useReservationStore().updateReservation`
  - 30-minute snap
  - Collision policy: reject drop (revert) if overlaps an existing booking in same designer column
  - Out-of-hours: clamp into business hours window
  - Role policy:
    - owner: can move any booking (designer+time)
    - staff: can move only bookings where `designerId === activeDesignerId` and cannot change designer
- Customer highlights on blocks:
  - For linked customers (`customerId`), show pinned tags (`CustomerTag.pinned === true`) as “주의/특이사항” chips
  - Show minimal context: `serviceLabel` (if present), channel badge, language flag (if non-ko)

### Definition of Done (verifiable)
- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes.
- Agent-executed QA evidence captured for:
  - day view renders and navigates dates
  - drag moves a booking and persists after reload
  - pinned tags render for linked customers
  - collision drop is rejected

### Must Have
- No new backend or channel integrations.
- Changes are limited to reservations schedule UI + related calendar components.
- Drag is usable with touch (tablet) and mouse.

### Must NOT Have
- No cross-day drag.
- No resizing blocks.
- No auto-shift/auto-pack scheduling.
- No new “caution” data model fields; reuse pinned tags.
- No large refactor of consultation list/search.

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: **none (no existing test infra)**; rely on `lint + typecheck + build` plus Playwright-driven QA scenarios.
- QA policy: every task includes Playwright or deterministic logic verification.
- Evidence location: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Foundations)
- Update view-mode types and wiring for day-as-primary (records page + toggle)
- Add date formatting helper for long-form Korean day label
- Extend event mapping to include `customerId`/`serviceLabel`/`channel`/`language`

Wave 2 (Day Grid UI)
- Implement `DesignerDayGridCalendar` (designer columns + time axis + block rendering)
- Integrate WeekCalendar-style date navigation for picking the active day
- Render pinned tag chips on blocks (via customer store lookup)

Wave 3 (Drag + Policies + Polish)
- Add drag+snap+persist logic with collision + role + bounds guardrails
- Update bottom-sheet reservation detail to include pinned tags and a link to customer detail
- Final QA pass + screenshots/video evidence

### Dependency Matrix (full)
- W1 blocks W2 (day grid needs view mode + formatting + event shape)
- W2 blocks W3 (drag works only once grid rendering is stable)

### Agent Dispatch Summary
- Wave 1: 3 tasks → `quick` / `unspecified-low`
- Wave 2: 3 tasks → `visual-engineering`
- Wave 3: 3 tasks → `visual-engineering` / `unspecified-high`

## TODOs

- [ ] 1. Switch reservations schedule to day-as-primary view

  **What to do**:
  - Update `ViewMode` model from `timegrid|month` to `day|month`.
  - Make `day` default on `/records` reservations tab.
  - Preserve existing monthly picker/list, but wire it to drive `selectedDate` for the day view.

  **Must NOT do**:
  - Do not delete weekly `TimeGridCalendar` implementation; keep it unused (or dev-only) to minimize risk.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: small TS wiring changes
  - Skills: [`frontend-standards`] — keep types and patterns consistent

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4,5,6,7,8 | Blocked By: -

  **References**:
  - Page: `src/app/(main)/records/page.tsx` (state: `viewMode`, `selectedDate`)
  - Toggle: `src/components/records/ViewModeToggle.tsx`
  - Monthly view components: `src/components/calendar/MonthCalendar.tsx`, `src/components/calendar/DayReservationList.tsx`

  **Acceptance Criteria**:
  - [ ] `pnpm typecheck` passes.
  - [ ] `/records` loads with day view selected by default.

  **QA Scenarios**:
  ```
  Scenario: Default view is day schedule
    Tool: Playwright (MCP) or dev-browser
    Steps: Open /records → confirm reservations tab shows day view UI
    Expected: Visible selected-date label + designer columns
    Evidence: .sisyphus/evidence/task-1-day-default.png

  Scenario: Month view still accessible
    Tool: Playwright (MCP) or dev-browser
    Steps: Toggle to 월간
    Expected: Month calendar renders; selecting a date updates day context
    Evidence: .sisyphus/evidence/task-1-month-toggle.png
  ```

- [ ] 2. Add long-form Korean day label formatting

  **What to do**:
  - In `src/lib/format.ts`, add:
    - `export function formatDayLabelKo(dateStr: string): string`
  - Output format (decision-complete): `M월 D일 (요일)` with weekday in Korean long form.
    - Example: `2026-03-02` → `3월 2일 (월요일)`
  - Invalid input behavior (decision-complete): if `new Date(dateStr)` is invalid, return the original `dateStr`.
  - Use it in the day schedule header.

  **Must NOT do**:
  - Do not introduce i18n keys for main pages; keep Korean literal formatting.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: small utility addition
  - Skills: [`frontend-standards`]

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4,5,6,7,8 | Blocked By: -

  **References**:
  - Date utilities: `src/lib/format.ts`

  **Acceptance Criteria**:
  - [ ] `pnpm typecheck` passes.
  - [ ] Date label shows `...월 ...일 (...요일)` in day view.

  **QA Scenarios**:
  ```
  Scenario: Label matches expected format
    Tool: Playwright (MCP) or dev-browser
    Steps: Open /records; note selected date label
    Expected: Korean long form like '3월 2일 (월요일)'
    Evidence: .sisyphus/evidence/task-2-date-label.png

  Scenario: Label updates when switching day
    Tool: Playwright (MCP) or dev-browser
    Steps: Use the week strip to select a different day
    Expected: Label changes to the newly selected day, same long-form format
    Evidence: .sisyphus/evidence/task-2-date-label-switch.png
  ```

- [ ] 3. Extend reservation→event mapping to carry core booking context

  **What to do**:
  - Extend `TimeGridEvent` to optionally include `customerId`, `serviceLabel`.
  - Update mapping in `src/app/(main)/records/page.tsx` so event blocks can render:
    - channel badge
    - language flag (if non-ko)
    - service label

  **Must NOT do**:
  - Do not change booking persistence schema.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: [`frontend-standards`]

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4,5,6,7,8 | Blocked By: -

  **References**:
  - Event type: `src/components/calendar/TimeGridCalendar.tsx#L8`
  - Mapping: `src/app/(main)/records/page.tsx#L63`
  - Booking model: `src/types/consultation.ts#L122`

  **Acceptance Criteria**:
  - [ ] `pnpm typecheck` passes.
  - [ ] Day blocks can render channel/language/service label without additional lookups.

  **QA Scenarios**:
  ```
  Scenario: Non-ko booking shows language flag
    Tool: Playwright (MCP) or dev-browser
    Steps: Ensure at least one booking has language != ko; view it on day grid
    Expected: Flag chip/emoji renders
    Evidence: .sisyphus/evidence/task-3-language-flag.png

  Scenario: Booking with serviceLabel renders it
    Tool: Playwright (MCP) or dev-browser
    Steps: Find booking with serviceLabel; view its block
    Expected: Service label chip is visible
    Evidence: .sisyphus/evidence/task-3-service-label.png
  ```

- [ ] 4. Implement DesignerDayGridCalendar (day grid with designer columns)

  **What to do**:
  - Create `src/components/calendar/DesignerDayGridCalendar.tsx`.
  - Use the same time-scale constant as weekly view (decision): `const HOUR_HEIGHT = 64`.
  - Use the same left time-axis width as weekly view (decision): `const AXIS_WIDTH = 60`.
  - Inputs (decision-complete):
    - `date: string`
    - `events: TimeGridEvent[]` (reservations only)
    - `designers: { id: string; name: string }[]` (from `MOCK_DESIGNERS`)
    - `startHour`, `endHour`
    - `role: UserRole` and `activeDesignerId: string | null` (used for drag permissions in Task 7)
    - callbacks (decision-complete):
      - `onEventClick(ev: TimeGridEvent): void`
      - `onEventMove(reservationId: string, updates: { reservationTime: string; designerId?: string }): void`
  - Layout:
    - Columns: `미지정` + designers
    - Rows: time axis with hour gridlines
    - Implementation pattern (decision-complete): mirror `TimeGridCalendar` structure:
      - Outer container is horizontally scrollable.
      - Header row uses CSS grid: `grid-cols-[60px_repeat(C,1fr)]` where `C = 1 + designers.length`.
      - Body uses a relative positioned container with fixed height: `(END_HOUR-START_HOUR+1) * HOUR_HEIGHT`.
    - Each event renders as a block positioned by `event.startTime` and fixed duration 60m (use `event.endTime` if provided; otherwise `start+60m`)
    - Safety clamp for rendering (decision-complete):
      - Compute `topRaw` from `reservationTime`.
      - Clamp: `top = Math.min(Math.max(topRaw, 0), gridHeight - blockHeight)`.
      - If clamped (i.e., `top !== topRaw`), render a tiny indicator in the block header:
        - `topRaw < 0` → show `↥`
        - `topRaw > gridHeight - blockHeight` → show `↧`

  **Must NOT do**:
  - No drag yet in this task (rendering only) to keep scope small.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: [`frontend-standards`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 7,8 | Blocked By: 1,2,3

  **References**:
  - Weekly grid positioning math: `src/components/calendar/TimeGridCalendar.tsx#L90`
  - Designers: `src/data/mock-shop.ts#L28`
  - Business hour window already computed: `src/app/(main)/records/page.tsx#L148`
  - Role type: `src/types/auth.ts#L1`

  **Acceptance Criteria**:
  - [ ] `pnpm lint` passes.
  - [ ] `pnpm typecheck` passes.
  - [ ] Day grid renders `미지정` + 3 designer columns with hour gridlines.

  **QA Scenarios**:
  ```
  Scenario: Day grid renders and blocks are in correct columns
    Tool: Playwright (MCP) or dev-browser
    Steps: Open /records; locate bookings assigned to different designers
    Expected: Booking blocks appear under matching designer column; unassigned under 미지정
    Evidence: .sisyphus/evidence/task-4-day-grid-columns.png

  Scenario: Out-of-window times still render safely
    Tool: Playwright (MCP) or dev-browser
    Steps: Open a reservation → edit start time to `08:00` (or `23:00`) → save → return to day grid
    Expected: Block is pinned at the top/bottom edge and shows `↥`/`↧` indicator
    Evidence: .sisyphus/evidence/task-4-render-outside-hours.png
  ```

- [ ] 5. Wire date navigation for day view (week strip)

  **What to do**:
  - Embed `src/components/calendar/WeekCalendar.tsx` above the day grid to select the active day.
  - Ensure selecting a day updates the day grid and header label.

  **Must NOT do**:
  - Do not introduce a new date picker UI; reuse existing WeekCalendar.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: [`frontend-standards`]

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 8 | Blocked By: 1

  **References**:
  - Week strip component: `src/components/calendar/WeekCalendar.tsx`
  - Selected date state: `src/app/(main)/records/page.tsx#L125`

  **Acceptance Criteria**:
  - [ ] Changing the selected day updates the blocks shown.

  **QA Scenarios**:
  ```
  Scenario: Select a different day
    Tool: Playwright (MCP) or dev-browser
    Steps: Click next day in week strip
    Expected: Header label updates; blocks update to that date
    Evidence: .sisyphus/evidence/task-5-date-switch.png

  Scenario: Jump to this week
    Tool: Playwright (MCP) or dev-browser
    Steps: Click the week label (goToThisWeek)
    Expected: Selected day becomes today
    Evidence: .sisyphus/evidence/task-5-this-week.png
  ```

- [ ] 6. Render pinned customer highlights on schedule blocks

  **What to do**:
  - For events with `customerId`, look up `useCustomerStore().getPinnedTags(customerId)`.
  - Render up to 2 pinned tags inline on the block; if more, add `+N` chip.
  - Visual rule (decision): pinned tags render in high-salience red-tinted style (using existing `text-error`/`bg-error/10` Tailwind tokens), regardless of tag accent.

  **Must NOT do**:
  - Do not add new tag categories or schema changes.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: [`frontend-standards`]

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 8 | Blocked By: 3,4

  **References**:
  - Customer store pinned tags: `src/store/customer-store.ts#L157`
  - Existing pinned-tags UX: `src/app/(main)/customers/[id]/page.tsx#L372`
  - Pretreatment alert uses pinned tags: `src/components/calendar/DayReservationList.tsx#L226`

  **Acceptance Criteria**:
  - [ ] For a booking with linked `customerId`, pinned tags appear on the schedule block.

  **QA Scenarios**:
  ```
  Scenario: Booking with pinned tags shows them inline
    Tool: Playwright (MCP) or dev-browser
    Steps: Open /records; find a booking whose customer has pinned tags
    Expected: 1-2 red-tinted chips render on the block
    Evidence: .sisyphus/evidence/task-6-pinned-tags-inline.png

  Scenario: Booking without customer link
    Tool: Playwright (MCP) or dev-browser
    Steps: Find a booking with no customerId
    Expected: No pinned-tag chips render; layout still looks consistent
    Evidence: .sisyphus/evidence/task-6-no-customer.png
  ```

- [ ] 7. Add drag-to-move (time + designer) with snap, collision, role, bounds

  **What to do**:
  - Implement drag on event blocks in `DesignerDayGridCalendar` using Framer Motion:
    - Use `motion.div`/`motion.button` with `drag` enabled and `dragMomentum={false}`.
    - On drag end:
      - Compute drop coordinates using `info.point` and a grid container ref (decision-complete):
        - `const rect = gridRef.current.getBoundingClientRect()`
        - `const dropX = (info.point.x - rect.left) + gridRef.current.scrollLeft`
        - `const dropY = (info.point.y - rect.top) + gridRef.current.scrollTop`
      - Compute target column index from `dropX`:
        - `const dropXCols = dropX - AXIS_WIDTH`
        - `const colWidth = columnsRef.current.clientWidth / columnCount`
        - `col = clampInt(Math.floor(dropXCols / colWidth), 0, columnCount-1)`
      - Compute target time from `dropY` (dropY = pointerY - gridTop).
      - Snap to 30-min increments.
      - Clamp into business hours so the 60m block fully fits.
      - Collision check: if any other booking in same designer column overlaps `[start, start+60m)`, reject and revert.
        - Ignore the dragged event itself (`ev.originalId`).
      - Call `onEventMove(originalId, { designerId, reservationTime })`.

    Deterministic math (executor must implement exactly):
    - Let `minuteFromTop = (dropY / HOUR_HEIGHT) * 60 + START_HOUR*60`
    - Snap: `snapped = Math.round(minuteFromTop / 30) * 30`
    - Clamp start: `minStart = START_HOUR*60`, `maxStart = (END_HOUR*60) - 60`
    - `clamped = Math.min(Math.max(snapped, minStart), maxStart)`
    - Format `clamped` back to `HH:mm`.
    - Column targeting: `col=0` means `designerId = undefined` ("미지정"); otherwise map to designers list.
  - Role guard (decision-complete):
    - owner: can move any booking (designer+time)
    - staff: can move only bookings with `designerId === activeDesignerId` and cannot change designer

  **Must NOT do**:
  - No cross-day moves.
  - No resize.
  - No auto-scroll during drag (accept as limitation for v1).
  - Do not allow dragging `cancelled` or `completed` reservations.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: [`frontend-standards`]

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 8 | Blocked By: 4,5

  **References**:
  - Framer Motion already used widely: `src/app/(main)/records/page.tsx`, `src/components/calendar/WeekCalendar.tsx`
  - Reservation persistence update: `src/store/reservation-store.ts#L38`
  - Auth role/activeDesignerId: `src/app/(main)/records/page.tsx#L135`

  **Acceptance Criteria**:
  - [ ] Dragging a booking changes its time and designer column and persists after reload.
  - [ ] Staff cannot drag other designers' bookings or change designer.
  - [ ] Collision drop is rejected (booking returns to origin).

  **QA Scenarios**:
  ```
  Scenario: Owner drags booking to new designer+time
    Tool: Playwright (MCP)
    Steps: Open `/lock` → select 원장 → select 소율 → enter password `1234` → login → open `/records` → drag a booking block to another column and later time
    Expected: Block re-renders in new column/time; store value persists on refresh
    Evidence: .sisyphus/evidence/task-7-drag-owner.png

  Scenario: Collision rejection
    Tool: Playwright (MCP)
    Steps: Drag a booking onto a time slot already occupied in target column
    Expected: Drop rejected; block returns to original position; optional toast shown
    Evidence: .sisyphus/evidence/task-7-collision-reject.png
  ```

- [ ] 8. Enhance reservation detail bottom sheet with customer highlights + customer link

  **What to do**:
  - In `/records` reservation detail modal (currently in `src/app/(main)/records/page.tsx`):
    - If booking has `customerId`, show pinned tags section.
    - Add a button: `고객 상세 보기` linking to `/customers/{customerId}`.
    - Ensure existing edit/save/start-consultation flows still work.

  **Must NOT do**:
  - Do not change consultation flow routes.

  **Recommended Agent Profile**:
  - Category: `unspecified-low`
  - Skills: [`frontend-standards`]

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: 3,6

  **References**:
  - Modal code: `src/app/(main)/records/page.tsx#L404`
  - Customer page: `src/app/(main)/customers/[id]/page.tsx`
  - Pinned tags getter: `src/store/customer-store.ts#L157`

  **Acceptance Criteria**:
  - [ ] Clicking a reservation opens modal; pinned tags appear if present; customer link navigates.

  **QA Scenarios**:
  ```
  Scenario: Modal shows pinned tags
    Tool: Playwright (MCP) or dev-browser
    Steps: Click a reservation with linked customerId
    Expected: Pinned tags section present; link button visible
    Evidence: .sisyphus/evidence/task-8-modal-pinned.png

  Scenario: Customer link navigation
    Tool: Playwright (MCP)
    Steps: Click '고객 상세 보기'
    Expected: Navigates to /customers/{id}
    Evidence: .sisyphus/evidence/task-8-modal-link.png
  ```

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ Playwright)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- 1 commit recommended: `feat(records): add day schedule with drag and customer highlights`
- If risk feels high: split into 2 commits:
  1) `feat(records): add day schedule view scaffolding`
  2) `feat(records): add drag rescheduling and pinned highlights`

## Success Criteria
- Day schedule is the default in `/records` and is readable at-a-glance.
- Drag rescheduling works reliably with snap, bounds, collision, and role guardrails.
- Pinned customer highlights are visible directly on the schedule blocks.
