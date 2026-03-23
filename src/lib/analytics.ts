import type { ConsultationRecord } from '@/types/consultation';
import type { BookingRequest } from '@/types/consultation';
import type { Customer } from '@/types/customer';
import type { Designer } from '@/types/shop';
import { getTodayInKorea, toKoreanDateString } from '@/lib/format';
import { calculatePrice } from '@/lib/price-calculator';
import { getReservationReadiness } from '@/lib/reservation-readiness';

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface KPICard {
  label: string;
  value: string;
  rawValue: number;
  change: number;
  changeDirection: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface DailyConsultation {
  date: string;
  consultations: number;
  designScope?: string;
}

export interface ServiceBreakdown {
  name: string;
  count: number;
  percentage: number;
}

export interface DesignerStats {
  designerId: string;
  designerName: string;
  consultations: number;
  bookings: number;
  revenue: number;
  assignedBookingRate: number;
  completedReservations: number;
  consultationCompletionRate: number;
  topDesign: string;
  topShape: string;
  topExpression: string;
}

export interface UpsellMetrics {
  totalUpsellRevenue: number;
  upsellConsultations: number;
  upsellRate: number;
  partsUpsellCount: number;
  partsUpsellConsultations: number;
  colorUpsellCount: number;
  colorUpsellConsultations: number;
}

export interface ForeignLanguageStatus {
  language: 'en' | 'zh' | 'ja';
  label: string;
  flag: string;
  total: number;
  ready: number;
  pending: number;
  readyRate: number;
}

export interface ForeignReservationSummary {
  foreignerCount: number;
  totalReady: number;
  totalPending: number;
  statuses: ForeignLanguageStatus[];
}

export interface GoldenTimeTarget {
  customerId: string;
  customerName: string;
  phone: string;
  assignedDesignerName: string;
  expectedReservationDate: string;
  daysSinceLastVisit: number;
  recentServiceLabel: string;
  reminderMessage: string;
}

export interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  newPercentage: number;
  returningPercentage: number;
  averageVisitInterval: number;
  vipCustomers: { id: string; name: string; totalSpend: number; visitCount: number }[];
}

export interface HourlyDistribution {
  hour: number;
  label: string;
  count: number;
}

// Helper: get YYYY-MM-DD string
function toDateStr(date: Date): string {
  return toKoreanDateString(date);
}

function toLocalDate(value: string): Date {
  return value.includes('T') ? new Date(value) : new Date(`${value}T12:00:00`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfWeek(date: Date): Date {
  const end = addDays(startOfWeek(date), 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

// Get label for design scope key
const DESIGN_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원컬러',
  solid_point: '단색+포인트',
  full_art: '풀아트',
  monthly_art: '이달의 아트',
};

const EXPRESSION_LABEL: Record<string, string> = {
  solid: '기본',
  gradient: '그라데이션',
  french: '프렌치',
  magnetic: '마그네틱/캣아이',
};

const SHAPE_LABEL: Record<string, string> = {
  round: '라운드',
  oval: '오벌',
  square: '스퀘어',
  squoval: '스퀘오벌',
  almond: '아몬드',
  stiletto: '스틸레토',
  coffin: '코핀',
};

// Sum finalPrice of records where finalizedAt falls on today (Korea)
export function computeTodayRevenue(records: ConsultationRecord[]): number {
  const today = getTodayInKorea();
  return records
    .filter((r) => r.finalizedAt && toKoreanDateString(r.finalizedAt) === today)
    .reduce((sum, r) => sum + r.finalPrice, 0);
}

// Sum finalPrice of records where finalizedAt falls in the given year/month
export function computeMonthlyRevenue(
  records: ConsultationRecord[],
  year: number,
  month: number,
): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return records
    .filter((r) => r.finalizedAt && toKoreanDateString(r.finalizedAt).startsWith(prefix))
    .reduce((sum, r) => sum + r.finalPrice, 0);
}

// Count records where createdAt falls in the given year/month
export function computeMonthlyConsultations(
  records: ConsultationRecord[],
  year: number,
  month: number,
): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return records.filter((r) => toKoreanDateString(r.createdAt).startsWith(prefix)).length;
}

// Find the most common designScope value across records, return the label
export function computeTopDesignScope(records: ConsultationRecord[]): string {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const scope = r.consultation.designScope;
    if (scope) {
      counts[scope] = (counts[scope] ?? 0) + 1;
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return '-';
  return DESIGN_SCOPE_LABEL[top[0]] ?? top[0];
}

// Return rate = (customers with visitCount >= 2) / total * 100
export function computeReturnRate(
  _records: ConsultationRecord[],
  customers: Customer[],
): number {
  if (customers.length === 0) return 0;
  const returning = customers.filter((c) => c.visitCount >= 2).length;
  return Math.round((returning / customers.length) * 1000) / 10;
}

// Count customers where isRegular === true
export function computeRegularCount(customers: Customer[]): number {
  return customers.filter((c) => c.isRegular === true).length;
}

// Count reservations where reservationDate === today
export function computeTodayBookings(reservations: BookingRequest[]): number {
  const today = getTodayInKorea();
  return reservations.filter((r) => r.reservationDate === today).length;
}

// ((current - previous) / previous * 100), handle division by zero → 0
export function computeChangeRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

// For the last N days, count consultations per day
export function computeDailyConsultations(
  records: ConsultationRecord[],
  days: number,
): DailyConsultation[] {
  const result: DailyConsultation[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = toDateStr(d);
      const dayRecords = records.filter((r) => toKoreanDateString(r.createdAt) === dateStr);

    // Find top design scope for this day
    const scopeCounts: Record<string, number> = {};
    for (const r of dayRecords) {
      const scope = r.consultation.designScope;
      if (scope) scopeCounts[scope] = (scopeCounts[scope] ?? 0) + 1;
    }
    const topScope = Object.entries(scopeCounts).sort((a, b) => b[1] - a[1])[0];

    result.push({
      date: dateStr,
      consultations: dayRecords.length,
      designScope: topScope ? (DESIGN_SCOPE_LABEL[topScope[0]] ?? topScope[0]) : undefined,
    });
  }

  return result;
}

// Group records by designScope, count each, calc percentage
export function computeDesignScopeBreakdown(records: ConsultationRecord[]): ServiceBreakdown[] {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const scope = r.consultation.designScope;
    if (scope) counts[scope] = (counts[scope] ?? 0) + 1;
  }
  const total = records.length || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      name: DESIGN_SCOPE_LABEL[key] ?? key,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }));
}

// Group records by expression, count each, calc percentage
export function computeExpressionBreakdown(records: ConsultationRecord[]): ServiceBreakdown[] {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const expressions = r.consultation.expressions;
    if (Array.isArray(expressions)) {
      for (const expr of expressions) {
        counts[expr] = (counts[expr] ?? 0) + 1;
      }
    }
  }
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      name: EXPRESSION_LABEL[key] ?? key,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }));
}

// For each designer, count their consultations, find top designScope, top expression
export function computeDesignerStats(
  records: ConsultationRecord[],
  designers: Designer[],
  reservations: BookingRequest[],
): DesignerStats[] {
  const activeReservations = reservations.filter((reservation) => reservation.status !== 'cancelled');
  const totalActiveReservations = Math.max(activeReservations.length, 1);

  return designers
    .filter((d) => d.isActive)
    .map((designer) => {
      const designerRecords = records.filter((r) => r.designerId === designer.id);
      const designerReservations = activeReservations.filter((reservation) => reservation.designerId === designer.id);
      const completedReservations = designerReservations.filter(
        (reservation) => reservation.status === 'completed',
      ).length;

      const scopeCounts: Record<string, number> = {};
      const exprCounts: Record<string, number> = {};
      const shapeCounts: Record<string, number> = {};

      for (const r of designerRecords) {
        const scope = r.consultation.designScope;
        if (scope) scopeCounts[scope] = (scopeCounts[scope] ?? 0) + 1;

        const expressions = r.consultation.expressions;
        if (Array.isArray(expressions)) {
          for (const expr of expressions) {
            exprCounts[expr] = (exprCounts[expr] ?? 0) + 1;
          }
        }

        const shape = r.consultation.nailShape;
        if (shape) shapeCounts[shape] = (shapeCounts[shape] ?? 0) + 1;
      }

      const topScopeEntry = Object.entries(scopeCounts).sort((a, b) => b[1] - a[1])[0];
      const topExprEntry = Object.entries(exprCounts).sort((a, b) => b[1] - a[1])[0];
      const topShapeEntry = Object.entries(shapeCounts).sort((a, b) => b[1] - a[1])[0];

      return {
        designerId: designer.id,
        designerName: designer.name,
        consultations: designerRecords.length,
        bookings: designerReservations.length,
        revenue: designerRecords.reduce((sum, record) => sum + record.finalPrice, 0),
        assignedBookingRate: roundToSingleDecimal(
          (designerReservations.length / totalActiveReservations) * 100,
        ),
        completedReservations,
        consultationCompletionRate: designerReservations.length > 0
          ? roundToSingleDecimal((completedReservations / designerReservations.length) * 100)
          : 0,
        topDesign: topScopeEntry ? (DESIGN_SCOPE_LABEL[topScopeEntry[0]] ?? topScopeEntry[0]) : '-',
        topShape: topShapeEntry ? (SHAPE_LABEL[topShapeEntry[0]] ?? topShapeEntry[0]) : '-',
        topExpression: topExprEntry ? (EXPRESSION_LABEL[topExprEntry[0]] ?? topExprEntry[0]) : '-',
      };
    })
    .sort((a, b) => b.consultations - a.consultations);
}

export function computeUpsellMetrics(records: ConsultationRecord[]): UpsellMetrics {
  let totalUpsellRevenue = 0;
  let upsellConsultations = 0;
  let partsUpsellCount = 0;
  let partsUpsellConsultations = 0;
  let colorUpsellCount = 0;
  let colorUpsellConsultations = 0;

  records.forEach((record) => {
    const breakdown = calculatePrice(record.consultation);
    const manualExtras = record.pricingAdjustments?.extras.reduce(
      (sum, extra) => sum + extra.amount,
      0,
    ) ?? 0;

    const consultationUpsell =
      breakdown.designSurcharge
      + breakdown.expressionSurcharge
      + breakdown.partsSurcharge
      + breakdown.colorSurcharge
      + manualExtras;

    totalUpsellRevenue += consultationUpsell;

    if (consultationUpsell > 0) {
      upsellConsultations += 1;
    }

    const totalPartsInRecord = record.consultation.partsSelections.reduce(
      (sum, selection) => sum + selection.quantity,
      0,
    );
    if (record.consultation.hasParts && totalPartsInRecord > 0) {
      partsUpsellCount += totalPartsInRecord;
      partsUpsellConsultations += 1;
    }

    if (record.consultation.extraColorCount > 0) {
      colorUpsellCount += record.consultation.extraColorCount;
      colorUpsellConsultations += 1;
    }
  });

  return {
    totalUpsellRevenue,
    upsellConsultations,
    upsellRate: records.length > 0 ? roundToSingleDecimal((upsellConsultations / records.length) * 100) : 0,
    partsUpsellCount,
    partsUpsellConsultations,
    colorUpsellCount,
    colorUpsellConsultations,
  };
}

const FOREIGN_LANGUAGE_META: Record<NonNullable<BookingRequest['language']>, { label: string; flag: string }> = {
  ko: { label: '한국어', flag: 'KR' },
  en: { label: '영어', flag: 'EN' },
  zh: { label: '중국어', flag: 'ZH' },
  ja: { label: '일본어', flag: 'JA' },
};

export function computeForeignReservationSummary(
  reservations: BookingRequest[],
): ForeignReservationSummary {
  const today = getTodayInKorea();
  const todayReservations = reservations.filter(
    (reservation) => reservation.status !== 'cancelled' && reservation.reservationDate === today,
  );
  const foreignReservations = todayReservations.filter(
    (reservation) => reservation.language != null && reservation.language !== 'ko',
  ) as Array<BookingRequest & { language: 'en' | 'zh' | 'ja' }>;

  const statuses: ForeignLanguageStatus[] = (['en', 'zh', 'ja'] as const).map((language) => {
    const bookings = foreignReservations.filter((reservation) => reservation.language === language);
    const ready = bookings.filter(
      (reservation) => getReservationReadiness(reservation).state === 'ready',
    ).length;
    const total = bookings.length;

    return {
      language,
      label: FOREIGN_LANGUAGE_META[language].label,
      flag: FOREIGN_LANGUAGE_META[language].flag,
      total,
      ready,
      pending: total - ready,
      readyRate: total > 0 ? roundToSingleDecimal((ready / total) * 100) : 0,
    };
  });

  return {
    foreignerCount: foreignReservations.length,
    totalReady: statuses.reduce((sum, status) => sum + status.ready, 0),
    totalPending: statuses.reduce((sum, status) => sum + status.pending, 0),
    statuses,
  };
}

export function computeGoldenTimeTargets(
  customers: Customer[],
  reservations: BookingRequest[],
  averageCycleDays = 28,
): GoldenTimeTarget[] {
  const today = new Date(`${getTodayInKorea()}T12:00:00`);
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const reservedCustomerIds = new Set(
    reservations
      .filter((reservation) => reservation.status !== 'cancelled' && reservation.customerId)
      .filter((reservation) => {
        const reservationDate = toLocalDate(reservation.reservationDate);
        return reservationDate >= weekStart && reservationDate <= weekEnd;
      })
      .map((reservation) => reservation.customerId as string),
  );

  return customers
    .filter((customer) => customer.visitCount >= 2)
    .filter((customer) => !reservedCustomerIds.has(customer.id))
    .map((customer) => {
      const lastVisitDate = toLocalDate(customer.lastVisitDate);
      const expectedReservationDate = addDays(lastVisitDate, averageCycleDays);
      const recentServiceLabel = customer.treatmentHistory[0]?.designScope ?? '최근 시술';

      return {
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        assignedDesignerName: customer.assignedDesignerName ?? '담당 디자이너',
        expectedReservationDate: toDateStr(expectedReservationDate),
        daysSinceLastVisit: Math.max(
          0,
          Math.round((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)),
        ),
        recentServiceLabel,
        reminderMessage: `${customer.name}님, 안녕하세요. ${customer.assignedDesignerName ?? 'BDX'}입니다. 지난 ${recentServiceLabel} 시술 후 4주차가 되어 이번 주 관리 타이밍 안내드립니다. 편하신 시간에 예약 도와드릴게요.`,
      };
    })
    .filter((target) => {
      const expectedDate = toLocalDate(target.expectedReservationDate);
      return expectedDate >= weekStart && expectedDate <= weekEnd;
    })
    .sort((a, b) => a.expectedReservationDate.localeCompare(b.expectedReservationDate));
}

// Compute customer analytics
export function computeCustomerAnalytics(
  _records: ConsultationRecord[],
  customers: Customer[],
): CustomerAnalytics {
  const newCustomers = customers.filter((c) => c.visitCount <= 1).length;
  const returningCustomers = customers.filter((c) => c.visitCount >= 2).length;
  const total = customers.length || 1;

  // Average visit interval for returning customers
  const returningList = customers.filter((c) => c.visitCount >= 2);
  let averageVisitInterval = 0;
  if (returningList.length > 0) {
    const intervals = returningList
      .filter((c) => c.firstVisitDate && c.lastVisitDate)
      .map((c) => {
        const first = new Date(c.firstVisitDate).getTime();
        const last = new Date(c.lastVisitDate).getTime();
        const visits = Math.max(c.visitCount - 1, 1);
        return (last - first) / visits / (1000 * 60 * 60 * 24);
      })
      .filter((v) => v > 0);
    if (intervals.length > 0) {
      averageVisitInterval = Math.round(
        intervals.reduce((s, v) => s + v, 0) / intervals.length,
      );
    }
  }

  // VIP customers: top 5 by totalSpend
  const vipCustomers = [...customers]
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      totalSpend: c.totalSpend,
      visitCount: c.visitCount,
    }));

  return {
    newCustomers,
    returningCustomers,
    newPercentage: Math.round((newCustomers / total) * 1000) / 10,
    returningPercentage: Math.round((returningCustomers / total) * 1000) / 10,
    averageVisitInterval,
    vipCustomers,
  };
}

// Group reservations by hour, count each hour from 10-18
export function computeHourlyDistribution(reservations: BookingRequest[]): HourlyDistribution[] {
  const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  const counts: Record<number, number> = {};
  for (const r of reservations) {
    if (r.reservationTime) {
      const hour = parseInt(r.reservationTime.split(':')[0], 10);
      if (hours.includes(hour)) {
        counts[hour] = (counts[hour] ?? 0) + 1;
      }
    }
  }
  return hours.map((hour) => ({
    hour,
    label: `${hour}시`,
    count: counts[hour] ?? 0,
  }));
}

// Build the 6 KPI cards
export function computeKPICards(
  records: ConsultationRecord[],
  customers: Customer[],
  reservations: BookingRequest[],
): KPICard[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Derive prev month
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const thisMonthCount = computeMonthlyConsultations(records, year, month);
  const prevMonthCount = computeMonthlyConsultations(records, prevYear, prevMonth);
  const monthChange = computeChangeRate(thisMonthCount, prevMonthCount);

  const topDesign = computeTopDesignScope(records);

  // Average number of options per consultation
  // Count non-null/non-default fields: bodyPart, offType (not 'none'), extensionType (not 'none'),
  // nailShape, designScope, expressions (each counts), hasParts, discount, deposit
  const avgOptions =
    records.length > 0
      ? Math.round(
          (records.reduce((sum, r) => {
            const c = r.consultation;
            let opts = 0;
            if (c.bodyPart) opts++;
            if (c.offType && c.offType !== 'none') opts++;
            if (c.extensionType && c.extensionType !== 'none') opts++;
            if (c.nailShape) opts++;
            if (c.designScope) opts++;
            if (Array.isArray(c.expressions)) opts += c.expressions.length;
            if (c.hasParts) opts++;
            return sum + opts;
          }, 0) /
            records.length) *
            10,
        ) / 10
      : 0;

  const returnRate = computeReturnRate(records, customers);
  const regularCount = computeRegularCount(customers);
  const todayBookings = computeTodayBookings(reservations);

  // 오늘 매출 및 어제 대비
  const todayRevenue = computeTodayRevenue(records);
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toKoreanDateString(d);
  })();
  const yesterdayRevenue = records
    .filter((r) => r.finalizedAt && toKoreanDateString(r.finalizedAt) === yesterdayStr)
    .reduce((sum, r) => sum + r.finalPrice, 0);
  const todayRevenueChange = computeChangeRate(todayRevenue, yesterdayRevenue);

  // 재방문율 전월 대비 계산
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const thisMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const prevMonthPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  function monthReturnRate(prefix: string): number {
    const monthRecords = records.filter((r) => toKoreanDateString(r.createdAt).startsWith(prefix));
    if (monthRecords.length === 0) return 0;
    const returning = monthRecords.filter((r) => {
      const c = customerMap.get(r.customerId);
      return c !== undefined && c.visitCount >= 2;
    }).length;
    return Math.round((returning / monthRecords.length) * 1000) / 10;
  }

  const thisMonthReturnRate = monthReturnRate(thisMonthPrefix);
  const prevMonthReturnRate = monthReturnRate(prevMonthPrefix);
  const returnRateChange = computeChangeRate(thisMonthReturnRate, prevMonthReturnRate);

  // Change direction helper
  const dir = (change: number): 'up' | 'down' | 'neutral' =>
    change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return [
    {
      label: '이달 상담 건수',
      value: `${thisMonthCount}건`,
      rawValue: thisMonthCount,
      change: monthChange,
      changeDirection: dir(monthChange),
      icon: '✂️',
    },
    {
      label: '인기 디자인',
      value: topDesign,
      rawValue: 0,
      change: 0,
      changeDirection: 'neutral',
      icon: '🎨',
    },
    {
      label: '평균 옵션 선택',
      value: `${avgOptions}개`,
      rawValue: avgOptions,
      change: 0,
      changeDirection: 'neutral',
      icon: '📊',
    },
    {
      label: '재방문율',
      value: `${returnRate}%`,
      rawValue: returnRate,
      change: returnRateChange,
      changeDirection: dir(returnRateChange),
      icon: '🔄',
    },
    {
      label: '단골 고객',
      value: `${regularCount}명`,
      rawValue: regularCount,
      change: 0,
      changeDirection: 'neutral',
      icon: '⭐',
    },
    {
      label: '오늘 예약',
      value: `${todayBookings}건`,
      rawValue: todayBookings,
      change: 0,
      changeDirection: 'neutral',
      icon: '📅',
    },
    {
      label: '오늘 매출',
      value: `${todayRevenue.toLocaleString('ko-KR')}원`,
      rawValue: todayRevenue,
      change: todayRevenueChange,
      changeDirection: dir(todayRevenueChange),
      icon: '💰',
    },
  ];
}

// Top 3 design scopes + expressions combined
export function computePopularTreatments(
  records: ConsultationRecord[],
): { rank: number; name: string; count: number }[] {
  const counts: Record<string, number> = {};

  for (const r of records) {
    const scope = r.consultation.designScope;
    if (scope) {
      const label = DESIGN_SCOPE_LABEL[scope] ?? scope;
      counts[label] = (counts[label] ?? 0) + 1;
    }
    const expressions = r.consultation.expressions;
    if (Array.isArray(expressions)) {
      for (const expr of expressions) {
        const label = EXPRESSION_LABEL[expr] ?? expr;
        counts[label] = (counts[label] ?? 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count], i) => ({ rank: i + 1, name, count }));
}

// Percentage of customers that are regular
export function computeRegularVisitRate(customers: Customer[]): number {
  if (customers.length === 0) return 0;
  const regular = customers.filter((c) => c.isRegular === true).length;
  return Math.round((regular / customers.length) * 100);
}

// Top 3 busiest hours
export function computePeakHours(
  reservations: BookingRequest[],
): { time: string; label: string; count: number }[] {
  const dist = computeHourlyDistribution(reservations);
  return [...dist]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((d) => ({
      time: `${d.hour}:00~${d.hour + 1}:00`,
      label: d.label,
      count: d.count,
    }));
}
