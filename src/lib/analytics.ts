import type { ConsultationRecord } from '@/types/consultation';
import type { BookingRequest } from '@/types/consultation';
import type { Customer } from '@/types/customer';
import type { Designer } from '@/types/shop';
import { getTodayInKorea, toKoreanDateString } from '@/lib/format';
import { calculatePrice } from '@/lib/price-calculator';
import type { ServicePricing } from '@/types/price';
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
  // 0529 LOW-2: YYYY-MM-DD 문자열에 KST 정오(+09:00) 명시 → 시스템 TZ 의존 제거.
  return value.includes('T') ? new Date(value) : new Date(`${value}T12:00:00+09:00`);
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

// 0528 M5 — 회원권 결제로 finalPrice=0인 경우도 실제 시술 금액(=membershipApplied)을 매출로 인식
function recordRevenue(r: ConsultationRecord): number {
  return r.finalPrice + (r.membershipApplied ?? 0);
}

// Sum finalPrice of records where finalizedAt falls on today (Korea)
export function computeTodayRevenue(records: ConsultationRecord[]): number {
  const today = getTodayInKorea();
  return records
    .filter((r) => r.finalizedAt && toKoreanDateString(r.finalizedAt) === today)
    .reduce((sum, r) => sum + recordRevenue(r), 0);
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
    .reduce((sum, r) => sum + recordRevenue(r), 0);
}

// Count records where createdAt falls in the given year/month
export function computeMonthlyConsultations(
  records: ConsultationRecord[],
  reservations: BookingRequest[],
  year: number,
  month: number,
): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const recordCount = records.filter((r) => toKoreanDateString(r.createdAt).startsWith(prefix)).length;
  // 0528 — 사전상담 응답(시술 미완료)도 상담 건수에 포함. record로 변환된 booking은 중복 방지 위해 제외.
  const recordBookingIds = new Set(
    records.map((r) => r.consultation?.bookingId).filter((id): id is string => typeof id === 'string'),
  );
  const preConsultCount = reservations.filter(
    (r) =>
      r.preConsultationCompletedAt &&
      toKoreanDateString(r.preConsultationCompletedAt).startsWith(prefix) &&
      !recordBookingIds.has(r.id),
  ).length;
  return recordCount + preConsultCount;
}

// 0528 N3: 원본 designCategory 우선 → DESIGN_SCOPE_LABEL fallback.
// magnet→solid_tone 매핑으로 자석 시술이 "원컬러"로 잘못 카운트되던 문제 해결.
const CATEGORY_DISPLAY_LABEL: Record<string, string> = {
  simple: '심플',
  french: '프렌치',
  magnet: '자석',
  art: '아트',
};

export function computeTopDesignScope(records: ConsultationRecord[]): string {
  const counts: Record<string, number> = {};
  for (const r of records) {
    // designCategory가 있으면 그것 우선, 없으면 designScope (legacy)
    const key = r.consultation.designCategory || r.consultation.designScope;
    if (key) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return '-';
  return CATEGORY_DISPLAY_LABEL[top[0]] ?? DESIGN_SCOPE_LABEL[top[0]] ?? top[0];
}

// Return rate = (customers with visitCount >= 2) / total * 100
export function computeReturnRate(
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
  // 0528 M7: '미정'·빈 문자열 같은 비표준 reservationTime은 시간대 차트와 일관되게 제외
  // 0530 HIGH-2: 취소 건 제외 (computeDesignerStats/computeForeignReservationSummary와 일관)
  return reservations.filter(
    (r) =>
      r.reservationDate === today &&
      r.status !== 'cancelled' &&
      r.reservationTime &&
      /^\d{1,2}:\d{2}$/.test(r.reservationTime),
  ).length;
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
    // 0529 HIGH-4: designCategory 우선 (magnet→solid_tone 매핑 우회), 없으면 designScope fallback.
    const scopeCounts: Record<string, number> = {};
    for (const r of dayRecords) {
      const key = r.consultation.designCategory || r.consultation.designScope;
      if (key) scopeCounts[key] = (scopeCounts[key] ?? 0) + 1;
    }
    const topScope = Object.entries(scopeCounts).sort((a, b) => b[1] - a[1])[0];

    result.push({
      date: dateStr,
      consultations: dayRecords.length,
      designScope: topScope
        ? (CATEGORY_DISPLAY_LABEL[topScope[0]] ?? DESIGN_SCOPE_LABEL[topScope[0]] ?? topScope[0])
        : undefined,
    });
  }

  return result;
}

// Group records by designScope, count each, calc percentage
export function computeDesignScopeBreakdown(records: ConsultationRecord[]): ServiceBreakdown[] {
  // 0529 HIGH-4 + LOW-1: designCategory 우선해 "자석"이 "원컬러"로 잘못 묶이지 않게 함.
  // computeTopDesignScope KPI와 동일 기준으로 통일.
  const counts: Record<string, number> = {};
  for (const r of records) {
    const key = r.consultation.designCategory || r.consultation.designScope;
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
  const total = records.length || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      name: CATEGORY_DISPLAY_LABEL[key] ?? DESIGN_SCOPE_LABEL[key] ?? key,
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
        // 0529: designCategory 우선 (magnet→solid_tone 오집계 방지), 없으면 legacy designScope
        const scope = r.consultation.designCategory || r.consultation.designScope;
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
        revenue: designerRecords.filter((r) => r.finalizedAt).reduce((sum, record) => sum + record.finalPrice + (record.membershipApplied ?? 0), 0),
        assignedBookingRate: roundToSingleDecimal(
          (designerReservations.length / totalActiveReservations) * 100,
        ),
        completedReservations,
        consultationCompletionRate: designerReservations.length > 0
          ? roundToSingleDecimal((completedReservations / designerReservations.length) * 100)
          : 0,
        topDesign: topScopeEntry ? (CATEGORY_DISPLAY_LABEL[topScopeEntry[0]] ?? DESIGN_SCOPE_LABEL[topScopeEntry[0]] ?? topScopeEntry[0]) : '-',
        topShape: topShapeEntry ? (SHAPE_LABEL[topShapeEntry[0]] ?? topShapeEntry[0]) : '-',
        topExpression: topExprEntry ? (EXPRESSION_LABEL[topExprEntry[0]] ?? topExprEntry[0]) : '-',
      };
    })
    .sort((a, b) => b.consultations - a.consultations);
}

export function computeUpsellMetrics(records: ConsultationRecord[], shopPricing?: ServicePricing): UpsellMetrics {
  let totalUpsellRevenue = 0;
  let upsellConsultations = 0;
  let partsUpsellCount = 0;
  let partsUpsellConsultations = 0;
  let colorUpsellCount = 0;
  let colorUpsellConsultations = 0;

  records.forEach((record) => {
    const breakdown = calculatePrice(record.consultation, shopPricing);
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

    // 0528 N2 + 0529 HIGH-2: settlement에서 명시 저장된 upsellAmount가 있으면
    // 그 값만 사용 (inTreatmentTotal). 명시 저장 없는 사장님 직접 상담(/consultation/summary)
    // 경로는 record.consultation 기반 consultationUpsell 사용.
    // 이전 구현은 둘을 합산해 quick-sale에 사전상담 addOns가 양쪽으로 들어가면
    // 이중 카운트 가능성. 명시 우선 원칙으로 충돌 차단.
    const totalUpsellForRecord = record.upsellAmount != null
      ? record.upsellAmount
      : consultationUpsell;

    totalUpsellRevenue += totalUpsellForRecord;

    if (totalUpsellForRecord > 0) {
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
      (reservation) => getReservationReadiness(reservation).state === 'completed',
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
// 0530 MED-3: '이달 기준' 표기와 일치하도록 이달 예약만 포함, 취소 건 제외
export function computeHourlyDistribution(reservations: BookingRequest[]): HourlyDistribution[] {
  const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  const monthPrefix = getTodayInKorea().slice(0, 7); // YYYY-MM
  const counts: Record<number, number> = {};
  for (const r of reservations) {
    if (
      r.status === 'cancelled' ||
      !r.reservationDate.startsWith(monthPrefix) ||
      !r.reservationTime
    ) {
      continue;
    }
    const hour = parseInt(r.reservationTime.split(':')[0], 10);
    if (hours.includes(hour)) {
      counts[hour] = (counts[hour] ?? 0) + 1;
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
  // 0530 MED-4: Vercel UTC 자정~오전9시 구간 전월 오집계 방지 → KST 날짜 기준으로 year/month 추출
  const [yearStr, monthStr] = getTodayInKorea().split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Derive prev month
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const thisMonthCount = computeMonthlyConsultations(records, reservations, year, month);
  const prevMonthCount = computeMonthlyConsultations(records, reservations, prevYear, prevMonth);
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

  const returnRate = computeReturnRate(customers);
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
    .reduce((sum, r) => sum + r.finalPrice + (r.membershipApplied ?? 0), 0);
  const todayRevenueChange = computeChangeRate(todayRevenue, yesterdayRevenue);

  // 재방문율 전월 대비 계산
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const thisMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const prevMonthPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  function monthReturnRate(prefix: string): number {
    // 0529 MED-4: 같은 손님이 한 달에 여러 번 와도 분모-분자가 동일 손님을 한 번만 카운트.
    // 0530 MED-7: prefix 월 이전에 동일 customerId 레코드가 존재하면 재방문으로 판단.
    //   → 현재 visitCount 기반은 미래 방문까지 포함해 과거 월 재방문율을 과대 계산.
    //   → prefix(YYYY-MM) 보다 createdAt이 이른 레코드가 있는지로 재방문 판단.
    //   한계: 레코드 외 오프라인 방문 이력은 반영 불가. '레코드 기준 재방문율'로 표기.
    const allRecords = records;
    const monthRecords = allRecords.filter((r) => toKoreanDateString(r.createdAt).startsWith(prefix));
    if (monthRecords.length === 0) return 0;
    const uniqueCustomers = new Set<string>();
    const returningCustomers = new Set<string>();
    for (const r of monthRecords) {
      if (!r.customerId) continue;
      uniqueCustomers.add(r.customerId);
      // prefix 이전(prefix < createdAt 날짜)에 같은 고객의 레코드가 하나라도 있으면 재방문
      const hasEarlierRecord = allRecords.some(
        (prev) =>
          prev.customerId === r.customerId &&
          toKoreanDateString(prev.createdAt) < prefix,
      );
      if (hasEarlierRecord) returningCustomers.add(r.customerId);
    }
    if (uniqueCustomers.size === 0) return 0;
    return Math.round((returningCustomers.size / uniqueCustomers.size) * 1000) / 10;
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
// 0530 MED-6: designCategory 우선 사용 (magnet→solid_tone 오집계 방지)
// computeTopDesignScope/computeDesignScopeBreakdown과 동일 기준으로 통일
export function computePopularTreatments(
  records: ConsultationRecord[],
): { rank: number; name: string; count: number }[] {
  const counts: Record<string, number> = {};

  for (const r of records) {
    const scope = r.consultation.designCategory || r.consultation.designScope;
    if (scope) {
      const label = CATEGORY_DISPLAY_LABEL[scope] ?? DESIGN_SCOPE_LABEL[scope] ?? scope;
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
