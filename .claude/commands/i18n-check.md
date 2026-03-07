---
description: i18n 번역 누락 및 패턴 검증
---

# i18n Translation Check

## Task

이 프로젝트의 다국어 시스템을 검증합니다.

## Steps

1. **번역 키 수집**: `src/lib/i18n.ts` 파일에서 모든 번역 키 추출

2. **사용처 검색**: 코드베이스에서 `t('`, `tKo('` 패턴 검색

3. **누락 검증**:
   - 코드에서 사용되지만 번역이 없는 키
   - 번역은 있지만 사용되지 않는 키 (dead translations)
   - 4개 언어(ko/en/zh/ja) 중 일부만 있는 키

4. **패턴 검증**:
   - `consultation/*` 경로에서 dual language 패턴 사용 확인
   - `(main)/*` 경로에서 한국어만 사용 확인

## Output Format

```
## 번역 누락 (Missing Translations)
- key_name: missing in [en, zh]

## 미사용 번역 (Unused Translations)  
- unused_key_name

## 패턴 위반 (Pattern Violations)
- file.tsx:42 - consultation 페이지에서 dual language 미사용
```
