# Learnings

- Added customer store API with: getById, findByPhoneNormalized, createCustomer, updateCustomer, updateTags, setPinnedTraits, appendSmallTalkNote.
- Seed uses deep clone of MOCK_CUSTOMERS to avoid shared references between runtime and mock data.
- setPinnedTraits reorders the tags array so pinned values (matched by tag.value) come first without changing type definitions.
- Added `pnpm typecheck` script (`tsc --noEmit`) to match plan verification commands.
- Nav swap (Task 2): replaced Dashboard tab with Portfolio in `src/components/layout/BottomTabBar.tsx` and `src/components/layout/SideNav.tsx`; added `nav.portfolio` translations in `src/lib/i18n.ts`.

- Added nav.portfolio translations and swapped Dashboard tab href to /portfolio in BottomTabBar and SideNav. Ensured active detection uses pathname.startsWith(tab.href) so /portfolio/* becomes active.

Gotchas:
- Did not remove /dashboard route (left unchanged). Home QuickActions still reference /dashboard.
- lsp reported an unused _TranslationDict type in i18n.ts (hint only) — harmless but noticed.
