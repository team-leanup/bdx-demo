/**
 * 예측 불가능한 ID 생성 유틸리티 (2026-04-20 추가)
 *
 * `crypto.randomUUID()`가 가장 안전. fallback으로 Web Crypto API 사용.
 * `Date.now() + Math.random()` 은 IDOR 공격 면이 넓어 금지.
 */

export function generateId(prefix?: string): string {
  const uuid = secureRandomUuid();
  return prefix ? `${prefix}-${uuid}` : uuid;
}

function secureRandomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // RFC4122 v4 비트 설정
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  // 최후 수단 — 개발 환경에서만 도달 가능
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`;
}
