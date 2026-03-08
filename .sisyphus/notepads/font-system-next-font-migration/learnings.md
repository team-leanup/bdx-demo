# Learnings

- Moved PretendardVariable.woff2 from public/fonts to src/assets/fonts to use with next/font/local.
- Created src/lib/fonts.ts exporting pretendard via next/font/local with variable `--next-font-pretendard` and display 'swap'.
- Verify no legacy CSS references remain (grep passed for exact public URL).
- Note: Next's local font expects relative path from the file; using '../assets/fonts/PretendardVariable.woff2'.

- Earlier attempt created src/lib/fonts.ts in the base repo by mistake; this run creates the file correctly inside the worktree only.

- Updated src/app/layout.tsx to import { pretendard } from '@/lib/fonts' and add className={pretendard.variable} to <html> so Tailwind variable font class is applied at root.
