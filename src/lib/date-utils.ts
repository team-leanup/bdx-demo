/**
 * date-utils.ts
 * 날짜/변환 유틸리티 — records 페이지에서 추출한 순수 함수 모음.
 * KST(한국 표준시) 처리 로직은 format.ts의 함수에 위임.
 */

import { getTodayInKorea, toKoreanDateString } from '@/lib/format';
import { resolveCategoryTimeMin } from '@/lib/pre-consult-price';
import type { TimeGridEvent } from '@/components/calendar/TimeGridCalendar';
import type { BookingRequest } from '@/types/consultation';
import type { Customer } from '@/types/customer';
import type { CategoryPricingSettings, CustomCategory } from '@/types/shop';

export type FilterPeriod = 'all' | 'today' | 'week' | 'month';

/**
 * 날짜 문자열이 주어진 기간 필터에 해당하는지 확인.
 * KST 기준 오늘/이번주/이번달을 판단.
 *
 * @param dateStr  - ISO 날짜 문자열 (YYYY-MM-DD 또는 ISO timestamp)
 * @param period   - 'all' | 'today' | 'week' | 'month'
 */
export function isInPeriod(dateStr: string, period: FilterPeriod): boolean {
  const today = getTodayInKorea();
  const todayDate = new Date(`${today}T12:00:00`);
  const normalizedDate = toKoreanDateString(dateStr);
  const d = new Date(`${normalizedDate}T12:00:00`);
  if (period === 'all') return true;
  if (period === 'today') return normalizedDate === today;
  if (period === 'week') {
    const startOfWeek = new Date(todayDate);
    const dayOfWeek = (todayDate.getDay() + 6) % 7; // Monday=0, Sunday=6
    startOfWeek.setDate(todayDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    // 0531 — 주 끝(일요일) 상한 추가: 상한이 없으면 다음 주 이후 미래 레코드까지 '이번주'에 포함됨
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return d >= startOfWeek && d <= endOfWeek;
  }
  if (period === 'month') {
    return d.getFullYear() === todayDate.getFullYear() && d.getMonth() === todayDate.getMonth();
  }
  return true;
}

/**
 * BookingRequest 배열을 TimeGridEvent 배열로 변환.
 * 컴포넌트 상태에 의존하지 않는 순수 변환 함수.
 *
 * @param reservations   - 예약 목록
 * @param getCustomerById - 고객 ID로 Customer 객체를 조회하는 함수
 */
export function toTimeGridEvents(
  reservations: BookingRequest[],
  getCustomerById: (id: string) => Customer | undefined,
  categorySettings?: { categoryPricing?: CategoryPricingSettings; customCategories?: CustomCategory[] },
): TimeGridEvent[] {
  const events: TimeGridEvent[] = [];

  for (const r of reservations) {
    if (!r.reservationTime || !r.reservationTime.includes(':')) continue;
    const [h, m] = r.reservationTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) continue;
    // 0601: 종료시간 = 카테고리 시술시간(슬롯 차단 RPC와 동일 기준)으로 통일.
    //   이전엔 (duration ?? 60)이라 magnet(80분) 예약이 13:00~14:00으로 표시돼
    //   슬롯 차단(14:20까지)과 어긋났음. 명시 duration > 카테고리시간 > 60분 순.
    const explicitDuration = (r as BookingRequest & { duration?: number }).duration;
    const designCategory = (r.preConsultationData as { designCategory?: string } | undefined)?.designCategory;
    const durationMins = explicitDuration
      ?? resolveCategoryTimeMin(designCategory, categorySettings?.categoryPricing, categorySettings?.customCategories, 60);
    const totalEndMins = h * 60 + m + durationMins;
    const endH = Math.min(Math.floor(totalEndMins / 60), 23);
    const endM = totalEndMins % 60;
    const customer = r.customerId ? getCustomerById(r.customerId) : undefined;
    const durationMap: Record<string, string> = { short: '짧음', normal: '보통', long: '김' };
    const sensitivityMap: Record<string, string> = { normal: '보통', sensitive: '민감' };
    events.push({
      id: `res-${r.id}`,
      title: r.customerName,
      date: r.reservationDate,
      startTime: r.reservationTime,
      endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      type: 'reservation',
      status: r.status,
      channel: r.channel,
      customerPhone: r.phone,
      requestNote: r.requestNote,
      language: r.language,
      designerId: r.designerId,
      originalId: r.id,
      customerId: r.customerId,
      serviceLabel: r.serviceLabel,
      consultationLinkSentAt: r.consultationLinkSentAt,
      preConsultationCompletedAt: r.preConsultationCompletedAt,
      nailShape: customer?.preference?.preferredShape ?? undefined,
      cuticleSensitivity: customer?.preference?.cuticleSensitivity ? sensitivityMap[customer.preference.cuticleSensitivity] : undefined,
      durationPreference: customer?.durationPreference ? durationMap[customer.durationPreference] : undefined,
      customerNote: r.requestNote,
      visitCount: customer?.visitCount ?? 0,
      preferredColors: customer?.treatmentHistory?.[0]?.colorLabels ?? [],
      removalNeeded: (() => {
        const raw = r.preConsultationData as Record<string, unknown> | undefined;
        const pref = raw?.removalPreference as string | undefined;
        if (pref === 'self_shop') return '자샵 제거';
        if (pref === 'other_shop') return '타샵 제거';
        return undefined;
      })(),
      wrappingNeeded: (() => {
        const raw = r.preConsultationData as Record<string, unknown> | undefined;
        const pref = raw?.wrappingPreference as string | undefined;
        if (pref === 'yes') return '랩핑 원함';
        if (pref === 'no') return '랩핑 불필요';
        return undefined;
      })(),
    });
  }

  return events;
}
