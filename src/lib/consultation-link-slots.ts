import type { BookedSlot, ConsultationLinkPublicData } from '@/types/consultation-link';
import type { BusinessHours } from '@/types/shop';
import { getTodayInKorea, getCurrentTimeInKorea } from '@/lib/format';

export interface AvailableSlot {
  date: string;
  time: string;
  isBooked: boolean;
}

export interface AvailableDate {
  date: string;
  weekday: string;
  slots: AvailableSlot[];
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function toKstDate(base: Date): string {
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMinutes(hhmm: string, min: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + min;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function timeLess(a: string, b: string): boolean {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return ah * 60 + am < bh * 60 + bm;
}

function timeLessOrEqual(a: string, b: string): boolean {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return ah * 60 + am <= bh * 60 + bm;
}

function getBusinessHoursForDay(businessHours: BusinessHours[], dayOfWeek: number): BusinessHours | null {
  return businessHours.find((bh) => bh.dayOfWeek === dayOfWeek) ?? null;
}

/**
 * 샵 영업시간 기반으로 슬롯 후보 생성
 */
function generateSlotCandidates(
  openTime: string,
  closeTime: string,
  durationMin: number,
  intervalMin: number,
): string[] {
  const safeInterval = Math.max(1, Math.floor(intervalMin));
  const safeDuration = Math.max(1, Math.floor(durationMin));
  const slots: string[] = [];
  let cur = openTime;
  let guard = 0;
  while (timeLessOrEqual(addMinutes(cur, safeDuration), closeTime)) {
    if (guard++ > 288) break;
    slots.push(cur);
    cur = addMinutes(cur, safeInterval);
    if (!timeLess(cur, closeTime)) break;
  }
  return slots;
}

/**
 * 공유 상담 링크 데이터를 기반으로 날짜별 가능 슬롯 계산
 * - valid_from ~ valid_until 기간 내 날짜 순회
 * - 각 날짜의 샵 영업시간 확인
 * - 시술 시간·슬롯 간격으로 후보 생성
 * - 기존 예약(bookedSlots)이 겹치는 슬롯은 disable
 * - 과거 시간은 제외
 */
export function computeAvailableDates(link: ConsultationLinkPublicData): AvailableDate[] {
  if (link.status !== 'active') return [];
  const today = getTodayInKorea();
  // 0529 MED-5: validUntil이 오늘 이전이면 만료된 링크 — 빈 배열 반환.
  if (link.validUntil < today) return [];
  const start = parseDate(link.validFrom < today ? today : link.validFrom);
  const end = parseDate(link.validUntil);

  // I12 fix: 구간 겹침(overlap) 기반으로 이중예약 차단.
  // 새 슬롯 후보 [sStart, sStart+durationMin)이 기존 예약 [bStart, bStart+bDurMin)과
  // 겹치면 isBooked=true. 겹침 조건: sStart < bEnd && sEnd > bStart.
  // BookedSlot에 duration 필드가 없으므로 link.estimatedDurationMin을 보수적 proxy로 사용.
  // (실제 예약 길이가 달라도 이중예약 방지가 우선이므로 보수적으로 처리)
  //
  // 검증 예시: B1=15:15, bDurMin=90 (bEnd=16:45)
  //   슬롯 14:00 (sEnd=15:30): 14:00<16:45 && 15:30>15:15 → 차단 ✓
  //   슬롯 14:30 (sEnd=16:00): 14:30<16:45 && 16:00>15:15 → 차단 ✓
  //   슬롯 15:00 (sEnd=16:30): 15:00<16:45 && 16:30>15:15 → 차단 ✓
  //   슬롯 15:30 (sEnd=17:00): 15:30<16:45 && 17:00>15:15 → 차단 ✓  (기존 뚫림 수정)
  //   슬롯 16:00 (sEnd=17:30): 16:00<16:45 && 17:30>15:15 → 차단 ✓  (기존 뚫림 수정)
  //   슬롯 17:00 (sEnd=18:30): 17:00<16:45 → false → 열림 ✓
  const durationMin = Math.max(1, Math.floor(link.estimatedDurationMin));

  const result: AvailableDate[] = [];
  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = toKstDate(d);
    const dayOfWeek = d.getUTCDay();
    const bh = getBusinessHoursForDay(link.businessHours ?? [], dayOfWeek);
    if (!bh || !bh.isOpen) continue;
    if (!bh.openTime || !bh.closeTime) continue;

    const candidates = generateSlotCandidates(
      bh.openTime,
      bh.closeTime,
      link.estimatedDurationMin,
      link.slotIntervalMin,
    );

    const slots: AvailableSlot[] = candidates
      .filter((time) => {
        // 0529 HIGH-5: 오늘 날짜면 KST 기준 현재 시간 이후 슬롯만.
        // 이전 구현은 시스템 TZ(Vercel Edge UTC)에 의존해 KST 09시 이전 구간에서
        // 이미 지난 슬롯이 예약 가능으로 표시되던 문제를 수정.
        if (dateStr === today) {
          const { hour, minute } = getCurrentTimeInKorea();
          const nowStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          if (!timeLess(nowStr, time)) return false;
        }
        return true;
      })
      .map((time) => {
        // I12 fix: 올바른 양방향 구간 겹침 검사.
        // 새 슬롯 [sStart, sEnd)와 기존 예약 [bStart, bEnd)가 겹치는지 확인.
        const [sh, sm] = time.split(':').map(Number);
        const sStartMin = sh * 60 + sm;
        const sEndMin = sStartMin + durationMin;
        const isBooked = (link.bookedSlots ?? []).some((b) => {
          if (b.date !== dateStr) return false;
          const [bh, bm] = b.time.split(':').map(Number);
          const bStartMin = bh * 60 + bm;
          // BookedSlot에 duration 없으므로 link.estimatedDurationMin을 proxy로 사용
          const bEndMin = bStartMin + durationMin;
          return sStartMin < bEndMin && sEndMin > bStartMin;
        });
        return { date: dateStr, time, isBooked };
      });

    if (slots.length === 0) continue;

    result.push({
      date: dateStr,
      weekday: WEEKDAY_KO[dayOfWeek],
      slots,
    });
  }
  return result;
}
