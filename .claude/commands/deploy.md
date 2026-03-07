---
description: Vercel 프로덕션 배포 (린트 + 타입체크 + 빌드 + 배포)
---

# Deploy to Vercel Production

## Pre-deployment Checks

Run these checks sequentially - stop if any fails:

```bash
pnpm lint
npx tsc --noEmit
pnpm build
```

## Deploy

If all checks pass:

```bash
npx vercel --prod --yes
```

## Post-deployment

1. Report the deployment URL
2. Summarize what was deployed (git diff from last deployment if available)
