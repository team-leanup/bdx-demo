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

  // 0601: 슬롯 차단 = "그 칸이 기존 예약에 물리는가"만 판정.
  // 손님은 시간 선택 시점에 아직 시술을 안 골랐으므로 새 예약의 길이를 알 수 없다.
  // 따라서 새 슬롯은 자기 칸([sStart, sStart+slotInterval))만 점유한다고 보고,
  // 기존 예약 구간 [bStart, bEnd)와 겹치는 슬롯만 차단한다.
  // (이전엔 새 슬롯을 estimatedDurationMin=90분으로 잡아 90분 시술이 물리는 앞 칸들까지
  //  과다 차단했다 — 13:00~14:00 예약에 12:00·12:30까지 막히던 버그)
  // 겹침 조건: sStart < bEnd && sStart+slotInterval > bStart.
  //
  // 검증: B=13:00~14:00 (bStart=780, bEnd=840), slotInterval=30
  //   12:00 (sEnd=12:30): 720<840 && 750>780? → 열림 ✓
  //   12:30 (sEnd=13:00): 750<840 && 780>780? → 열림 ✓
  //   13:00 (sEnd=13:30): 780<840 && 810>780 → 차단 ✓
  //   13:30 (sEnd=14:00): 810<840 && 840>780 → 차단 ✓
  //   14:00 (sEnd=14:30): 840<840? → 열림 ✓
  const slotMin = Math.max(1, Math.floor(link.slotIntervalMin));

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
        // 새 슬롯 칸 [sStart, sStart+slotInterval)와 기존 예약 [bStart, bEnd)가 겹치면 차단.
        const [sh, sm] = time.split(':').map(Number);
        const sStartMin = sh * 60 + sm;
        const sEndMin = sStartMin + slotMin;
        const isBooked = (link.bookedSlots ?? []).some((b) => {
          if (b.date !== dateStr) return false;
          const [bh, bm] = b.time.split(':').map(Number);
          const bStartMin = bh * 60 + bm;
          // 기존 예약의 실제 종료시간(endTime, RPC가 카테고리 시술시간으로 계산) 우선 사용.
          // 없으면 slotInterval만큼만 점유한 것으로 간주.
          let bEndMin = bStartMin + slotMin;
          if (b.endTime && /^\d{2}:\d{2}$/.test(b.endTime)) {
            const [eh, em] = b.endTime.split(':').map(Number);
            const candidateEnd = eh * 60 + em;
            if (candidateEnd > bStartMin) bEndMin = candidateEnd;
          }
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
