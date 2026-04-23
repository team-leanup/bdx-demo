import type { Membership } from '@/types/customer';

/**
 * 회원권 잔액(원)을 반환한다.
 * 0423 반영: "얼마 남았는지" 기준 표기의 단일 원천.
 * 하위 호환: `remainingAmount`가 없으면 횟수 기반으로 추정.
 */
export function getRemainingAmount(m: Membership): number {
  if (typeof m.remainingAmount === 'number') return Math.max(0, m.remainingAmount);
  if (m.totalSessions > 0) {
    return Math.max(0, Math.round(m.purchaseAmount * (m.remainingSessions / m.totalSessions)));
  }
  return 0;
}

/**
 * 회원권 사용 금액(원)을 반환한다.
 */
export function getUsedAmount(m: Membership): number {
  if (typeof m.usedAmount === 'number') return Math.max(0, m.usedAmount);
  return Math.max(0, m.purchaseAmount - getRemainingAmount(m));
}

/**
 * 시술 단건에 실제로 차감되는 회원권 금액을 계산.
 * - 회원권 잔액이 시술 금액보다 적으면 잔액만큼만 차감
 * - 잔여 횟수가 0이면 차감하지 않음 (회원권 소진)
 */
export function calcMembershipDeduct(
  m: Membership,
  serviceAmount: number,
): number {
  if (m.status !== 'active') return 0;
  if (m.remainingSessions <= 0) return 0;
  const remaining = getRemainingAmount(m);
  return Math.max(0, Math.min(remaining, serviceAmount));
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 회원권 만료일이 지났는지 판정 (표시/판정 계층에서 사용).
 * DB에 저장된 status는 'active'로 남아 있더라도 오늘이 만료일을 넘으면 'expired'로 취급.
 */
export function isMembershipExpired(m: Membership): boolean {
  if (!m.expiryDate) return false;
  try {
    const expiry = new Date(m.expiryDate);
    if (Number.isNaN(expiry.getTime())) return false;
    // 만료일 당일까지는 유효. 자정 지나면 만료.
    expiry.setHours(23, 59, 59, 999);
    return expiry.getTime() < Date.now();
  } catch {
    return false;
  }
}

/**
 * DB 저장 status를 만료일·잔액과 결합해 실제 사용 가능 여부를 반환.
 */
export function getEffectiveStatus(m: Membership): Membership['status'] {
  if (m.status === 'used_up') return 'used_up';
  if (isMembershipExpired(m)) return 'expired';
  if (getRemainingAmount(m) <= 0) return 'used_up';
  return m.status;
}

/**
 * 회원권으로 이번 시술을 결제할 수 있는지.
 * - status 우선 적용 (expired, used_up은 불가)
 * - 잔액 > 0 이어야 함 (잔액 기반 정책: 횟수 카운터가 0이어도 잔액 남으면 허용)
 */
export function canUseMembership(m: Membership | undefined): boolean {
  if (!m) return false;
  const eff = getEffectiveStatus(m);
  if (eff !== 'active') return false;
  return getRemainingAmount(m) > 0;
}

/**
 * 회원권의 현재 회차 상태를 계산.
 * 지승호 대표 0423 피드백: "1회권 중 5만원 사용, 남은 금액 5만원" 표시를 위해.
 *
 * 예: 구매금액 300,000원 · 3회권 (1회 한도 100,000원)
 *  - 사용 0원     → 1회차 시작 (0/100,000)
 *  - 사용 50,000  → 1회차 중 50,000 사용, 50,000 남음
 *  - 사용 100,000 → 1회차 소진, 2회차 시작 (0/100,000)
 *  - 사용 170,000 → 2회차 중 70,000 사용, 30,000 남음
 */
export interface MembershipSessionState {
  /** 1회차 한도 (원) = purchaseAmount / totalSessions */
  sessionLimit: number;
  /** 현재 소비 중인 회차 번호 (1-based 표시용) */
  currentSessionNumber: number;
  /** 현재 회차에서 사용한 금액 */
  currentSessionUsed: number;
  /** 현재 회차에 남은 한도 */
  currentSessionRemaining: number;
  /** 앞으로 남은 회차 수 (현재 회차 포함) */
  remainingSessionsCount: number;
  /** 소진 여부 */
  isFullyUsed: boolean;
}

export function getMembershipSessionState(m: Membership): MembershipSessionState {
  const total = Math.max(1, m.totalSessions);
  const sessionLimit = Math.floor(m.purchaseAmount / total);
  const usedAmount = getUsedAmount(m);
  const remainingAmount = getRemainingAmount(m);

  if (sessionLimit <= 0 || remainingAmount <= 0) {
    return {
      sessionLimit: Math.max(0, sessionLimit),
      currentSessionNumber: total,
      currentSessionUsed: sessionLimit,
      currentSessionRemaining: 0,
      remainingSessionsCount: 0,
      isFullyUsed: true,
    };
  }

  // 사용액이 마지막 회차를 넘어갈 수 있으니 마지막 회차로 clamp
  const rawIdx = Math.floor(usedAmount / sessionLimit);
  const currentSessionIdx = Math.min(total - 1, rawIdx);
  const currentSessionUsed = Math.max(
    0,
    Math.min(sessionLimit, usedAmount - currentSessionIdx * sessionLimit),
  );
  const currentSessionRemaining = Math.max(0, sessionLimit - currentSessionUsed);
  const remainingSessionsCount = total - currentSessionIdx;

  return {
    sessionLimit,
    currentSessionNumber: currentSessionIdx + 1,
    currentSessionUsed,
    currentSessionRemaining,
    remainingSessionsCount,
    isFullyUsed: false,
  };
}
