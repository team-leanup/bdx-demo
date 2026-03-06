#!/bin/bash
# Claude Code Hook: Post-build 알림
# 트리거: pnpm build 후 실행
# 목적: 빌드 성공/실패 상태 명확히 표시

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "╔════════════════════════════════════════╗"
  echo "║  ✅ BUILD SUCCESSFUL                   ║"
  echo "║  Ready for deployment                  ║"
  echo "╚════════════════════════════════════════╝"
  echo ""
  
  # 빌드 결과 요약
  if [ -d ".next" ]; then
    echo "📦 Build output:"
    du -sh .next 2>/dev/null || true
  fi
else
  echo ""
  echo "╔════════════════════════════════════════╗"
  echo "║  ❌ BUILD FAILED                       ║"
  echo "║  Check errors above                    ║"
  echo "╚════════════════════════════════════════╝"
  echo ""
  exit $BUILD_EXIT_CODE
fi
