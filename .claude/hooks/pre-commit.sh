#!/bin/bash
# Claude Code Hook: Pre-commit 검증
# 트리거: git commit 전 실행
# 목적: 린트/타입 에러가 있는 코드가 커밋되지 않도록 방지

set -e

echo "🔍 Running pre-commit checks..."

# 1. ESLint 검사
echo "→ Checking ESLint..."
pnpm lint --quiet
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors found. Fix before committing."
  exit 1
fi

# 2. TypeScript 타입 체크
echo "→ Checking TypeScript..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Fix before committing."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
