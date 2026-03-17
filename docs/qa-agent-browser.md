# agent-browser QA Workflow

`agent-browser`는 빠르게 프로덕션/프리뷰 흐름을 확인하기 좋지만, 같은 세션을 여러 페이지에서 병렬 재사용하면 쿠키/스토리지/현재 탭 상태가 섞여 오탐이 나오기 쉽다. 이 문서는 BDX에서 그 문제를 피하기 위한 최소 운영 규칙이다.

## 핵심 규칙

1. 같은 `--session`을 병렬 실행에 재사용하지 않는다.
2. 한 세션에서는 한 흐름만 순차적으로 검증한다.
3. 세션 이름은 목적이 드러나게 만든다. `qa-prod-dashboard-smoke-20260317-113000` 같은 형식을 쓴다.
4. 검증이 끝난 세션은 바로 `close`로 정리한다.
5. 장기 보존 프로필 대신 필요할 때만 `state save/load`를 쓴다.
6. 브라우저 세션이 분리돼도 서버 데이터는 공유되므로, 병렬 쓰기 QA는 다른 테스트 계정이나 충돌 없는 테스트 데이터로 분리한다.

## 권장 세션 전략

### 순차 검증

같은 로그인 상태로 여러 페이지를 보고 싶으면 한 세션에서 순차적으로 이동한다.

```bash
pnpm qa:agent:prod:login
# 출력된 session 이름으로 이어서 사용
npx agent-browser --session "<session>" open https://beauty-decision.com/home
npx agent-browser --session "<session>" open https://beauty-decision.com/dashboard
npx agent-browser --session "<session>" close
```

### 병렬 검증

병렬이 필요하면 페이지마다 다른 세션을 사용한다.

```bash
npx agent-browser --session qa-prod-home-smoke-1 open https://beauty-decision.com/home
npx agent-browser --session qa-prod-dashboard-smoke-1 open https://beauty-decision.com/dashboard
```

잘못된 예시는 아래와 같다.

```bash
npx agent-browser --session qa-prod open https://beauty-decision.com/home
npx agent-browser --session qa-prod open https://beauty-decision.com/dashboard
```

## 저장소 스크립트

### 빠른 시작

```bash
pnpm qa:agent:prod:login
pnpm qa:agent:prod:home
pnpm qa:agent:prod:dashboard
pnpm qa:agent:prod:settings
```

각 명령은 안전한 세션 이름을 자동 생성해서 `open`을 실행한다.

### 범용 명령

```bash
pnpm qa:agent -- open prod dashboard --flow smoke
pnpm qa:agent -- status qa-prod-dashboard-smoke-20260317-113000
pnpm qa:agent -- close qa-prod-dashboard-smoke-20260317-113000
```

중간에 실행이 끊겼으면 새 세션을 열기 전에 `status`로 확인하고, 남아 있는 세션은 `close`로 먼저 정리한다.

## 페이지 키

- `login`
- `home`
- `records`
- `customers`
- `dashboard`
- `settings`
- `consultation`

기본 대상은 아래 두 가지다.

- `prod` -> `https://beauty-decision.com`
- `local` -> `http://localhost:3000`

## 인증 상태 운영

기본 원칙은 fresh session이다. 인증 재사용이 꼭 필요할 때만 상태 파일을 명시적으로 다룬다.

```bash
npx agent-browser state save .qa/test-owner.auth-state.json
npx agent-browser state load .qa/test-owner.auth-state.json
```

- 상태 파일은 git에 올리지 않는다.
- 상태 파일은 민감 정보로 취급하고, 로컬에서만 짧게 보관한다.
- `--session-name`, `--profile`에 장기 의존하지 않는다.
- `state save/load`는 같은 흐름의 순차 재실행에만 쓰고, 병렬 흐름에는 사용하지 않는다.
- 프로덕션 생성 데이터는 `QA-` 접두어로 식별 가능하게 만든다.

## 권장 QA 순서

1. `login` 세션 시작
2. 실계정 로그인 또는 저장된 상태 로드
3. `home -> records -> customers -> dashboard -> settings` 순으로 순차 확인
4. 오류/콘솔 확인
5. 세션 종료

## 체크 포인트

- URL이 기대 경로와 일치하는가
- 현재 매장명이 기대 계정과 일치하는가
- 이전 페이지 상태가 현재 페이지에 섞이지 않았는가
- 콘솔/브라우저 오류가 없는가
- QA 결과는 `docs/qa-production.md`에 기록했는가
