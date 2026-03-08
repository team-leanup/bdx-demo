#!/bin/bash
# Claude Code Hook: i18n 패턴 검증
# 트리거: consultation 폴더 파일 수정 후 실행
# 목적: dual language 패턴 누락 방지

FILE="$1"

# consultation 폴더 파일만 검사
if [[ "$FILE" == *"consultation"* ]] && [[ "$FILE" == *.tsx ]]; then
  echo "🌐 Checking i18n patterns in: $FILE"
  
  # useT 사용 확인
  if ! grep -q "useT()" "$FILE" 2>/dev/null; then
    echo "⚠️  Warning: $FILE - useT() not found in consultation page"
  fi
  
  # locale !== 'ko' 패턴 확인 (dual language)
  if ! grep -q "locale !== 'ko'" "$FILE" 2>/dev/null; then
    echo "⚠️  Warning: $FILE - Dual language pattern not found"
    echo "   Consider adding: {locale !== 'ko' && <span>{tKo(...)}</span>}"
  fi
fi
