import type { BookedSlot, ConsultationLinkPublicData } from '@/types/consultation-link';
import type { BusinessHours } from '@/types/shop';
import { getTodayInKorea } from '@/lib/format';

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
  while (timeLess(addMinutes(cur, safeDuration), closeTime) || cur === closeTime) {
    if (guard++ > 288) break;
    slots.push(cur);
    cur = addMinutes(cur, safeInterval);
    if (cur === closeTime || !timeLess(cur, closeTime)) break;
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
  const today = getTodayInKorea();
  const start = parseDate(link.validFrom < today ? today : link.validFrom);
  const end = parseDate(link.validUntil);

  const bookedSet = new Set<string>();
  for (const b of link.bookedSlots ?? []) {
    bookedSet.add(`${b.date}__${b.time}`);
  }

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
        // 오늘 날짜면 현재 시간 이후 슬롯만
        if (dateStr === today) {
          const now = new Date();
          const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          if (!timeLess(nowStr, time)) return false;
        }
        return true;
      })
      .map((time) => ({
        date: dateStr,
        time,
        isBooked: bookedSet.has(`${dateStr}__${time}`),
      }));

    if (slots.length === 0) continue;

    result.push({
      date: dateStr,
      weekday: WEEKDAY_KO[dayOfWeek],
      slots,
    });
  }
  return result;
}

export function formatSlotLabel(date: string, time: string, locale: 'ko' | 'en' | 'zh' | 'ja' = 'ko'): string {
  const d = parseDate(date);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const weekday = WEEKDAY_KO[d.getUTCDay()];
  if (locale === 'ko') {
    return `${month}월 ${day}일 (${weekday}) ${time}`;
  }
  return `${month}/${day} ${time}`;
}
