/**
 * 경량 클라이언트 레이어 rate limit (2026-04-20 추가)
 *
 * sessionStorage 기반으로 한 브라우저 내 과도한 제출을 방지한다.
 * - 의도적 공격(쿠키 삭제 + 자동화)에는 우회 가능 → 서버측 Upstash Ratelimit 추가 필요.
 * - 일반 사용자의 실수 연타/중복 제출은 효과적으로 막는다.
 */

interface RateLimitConfig {
  /** 키(endpoint 식별자) */
  key: string;
  /** 윈도우 길이(밀리초) */
  windowMs: number;
  /** 윈도우 내 허용 최대 호출 수 */
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** 남은 허용 회수 */
  remaining: number;
  /** 다음 허용까지 대기(ms) */
  retryAfterMs: number;
}

function getStore(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function consumeClientRateLimit({ key, windowMs, max }: RateLimitConfig): RateLimitResult {
  const store = getStore();
  if (!store) return { allowed: true, remaining: max, retryAfterMs: 0 };

  const storeKey = `bdx-rl:${key}`;
  const now = Date.now();
  let timestamps: number[] = [];
  try {
    const raw = store.getItem(storeKey);
    timestamps = raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    timestamps = [];
  }

  // 윈도우 밖 타임스탬프 제거
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    const oldest = timestamps[0];
    const retryAfterMs = windowMs - (now - oldest);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  timestamps.push(now);
  try {
    store.setItem(storeKey, JSON.stringify(timestamps));
  } catch {
    /* ignore */
  }
  return { allowed: true, remaining: max - timestamps.length, retryAfterMs: 0 };
}
