import type { UserRole } from '@/types/auth';

interface CanMoveParams {
  role: UserRole;
  activeDesignerId: string | null;
  reservationDesignerId: string | undefined;
  nextDesignerId: string | undefined;
}

interface CanMoveResult {
  ok: boolean;
  reason?: string;
}

export function canMoveReservation({
  role,
  activeDesignerId,
  reservationDesignerId,
  nextDesignerId,
}: CanMoveParams): CanMoveResult {
  if (role === 'owner') {
    return { ok: true };
  }

  if (role === 'staff') {
    if (reservationDesignerId !== activeDesignerId) {
      return { ok: false, reason: '다른 선생님의 예약은 이동할 수 없습니다.' };
    }
    if (nextDesignerId !== reservationDesignerId) {
      return { ok: false, reason: '스태프는 선생님을 변경할 수 없습니다.' };
    }
    return { ok: true };
  }

  return { ok: false, reason: '권한이 없습니다.' };
}

export function clampStartMinutes({
  startMinutes,
  startHour,
  endHour,
  durationMinutes,
}: {
  startMinutes: number;
  startHour: number;
  endHour: number;
  durationMinutes: number;
}): number {
  const minStart = startHour * 60;
  const maxStart = endHour * 60 - durationMinutes;
  return Math.min(Math.max(startMinutes, minStart), maxStart);
}

export function snapToInterval(minutes: number, interval: number): number {
  return Math.round(minutes / interval) * interval;
}

interface OverlapCheckParams {
  reservationId: string;
  nextDesignerId: string | undefined;
  nextStartMinutes: number;
  durationMinutes: number;
  reservationsSameDay: Array<{
    id: string;
    designerId?: string;
    startMinutes: number;
    durationMinutes: number;
  }>;
}

export function overlapsAny({
  reservationId,
  nextDesignerId,
  nextStartMinutes,
  durationMinutes,
  reservationsSameDay,
}: OverlapCheckParams): boolean {
  const nextEnd = nextStartMinutes + durationMinutes;

  return reservationsSameDay.some((r) => {
    if (r.id === reservationId) return false;

    const sameColumn =
      (r.designerId ?? 'unassigned') === (nextDesignerId ?? 'unassigned');
    if (!sameColumn) return false;

    const existingEnd = r.startMinutes + r.durationMinutes;
    return nextStartMinutes < existingEnd && nextEnd > r.startMinutes;
  });
}

export function minutesToTimeStr(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeStrToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
