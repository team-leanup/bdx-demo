// 대시보드 KPI 및 분석 데이터

export interface KPICard {
  label: string;
  value: string;
  rawValue: number;
  change: number;         // 전월 대비 % 변화
  changeDirection: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface DailyRevenue {
  date: string;          // YYYY-MM-DD
  revenue: number;
  consultations: number;
}

export interface ServiceBreakdown {
  name: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface DesignerStats {
  designerId: string;
  designerName: string;
  consultations: number;
  revenue: number;
  averagePrice: number;
  topDesign: string;
}

export interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  newPercentage: number;
  returningPercentage: number;
  averageVisitInterval: number;    // days
  vipCustomers: { name: string; totalSpend: number; visitCount: number }[];
}

export interface HourlyDistribution {
  hour: number;
  label: string;
  count: number;
}

export interface WeeklyDistribution {
  dayOfWeek: number;
  label: string;
  count: number;
}

// KPI 데이터 (2026년 2월 기준)
export const MOCK_KPI_CARDS: KPICard[] = [
  {
    label: '이달 매출',
    value: '₩9,834,000',
    rawValue: 9834000,
    change: 8,
    changeDirection: 'up',
    icon: '💰',
  },
  {
    label: '이달 상담 수',
    value: '127건',
    rawValue: 127,
    change: 5,
    changeDirection: 'up',
    icon: '✂️',
  },
  {
    label: '객단가',
    value: '₩77,000',
    rawValue: 77000,
    change: 3,
    changeDirection: 'up',
    icon: '📈',
  },
  {
    label: '재방문율',
    value: '82.2%',
    rawValue: 82.2,
    change: 3,
    changeDirection: 'up',
    icon: '🔄',
  },
  {
    label: '단골 고객',
    value: '12명',
    rawValue: 12,
    change: 20,
    changeDirection: 'up',
    icon: '⭐',
  },
  {
    label: '오늘 예약',
    value: '4건',
    rawValue: 4,
    change: 0,
    changeDirection: 'neutral',
    icon: '📅',
  },
];

// 최근 30일 일별 매출 데이터
export const MOCK_DAILY_REVENUE: DailyRevenue[] = [
  { date: '2026-01-28', revenue: 280000, consultations: 4 },
  { date: '2026-01-29', revenue: 350000, consultations: 5 },
  { date: '2026-01-30', revenue: 195000, consultations: 3 },
  { date: '2026-01-31', revenue: 420000, consultations: 6 },
  { date: '2026-02-01', revenue: 0, consultations: 0 },       // 일요일 휴무
  { date: '2026-02-02', revenue: 310000, consultations: 4 },
  { date: '2026-02-03', revenue: 390000, consultations: 5 },
  { date: '2026-02-04', revenue: 450000, consultations: 6 },
  { date: '2026-02-05', revenue: 260000, consultations: 3 },
  { date: '2026-02-06', revenue: 340000, consultations: 4 },
  { date: '2026-02-07', revenue: 520000, consultations: 7 },  // 토요일 많음
  { date: '2026-02-08', revenue: 0, consultations: 0 },       // 일요일 휴무
  { date: '2026-02-09', revenue: 0, consultations: 0 },       // 설연휴
  { date: '2026-02-10', revenue: 0, consultations: 0 },       // 설연휴
  { date: '2026-02-11', revenue: 0, consultations: 0 },       // 설연휴
  { date: '2026-02-12', revenue: 490000, consultations: 6 },
  { date: '2026-02-13', revenue: 380000, consultations: 5 },
  { date: '2026-02-14', revenue: 620000, consultations: 8 },  // 밸런타인데이
  { date: '2026-02-15', revenue: 0, consultations: 0 },       // 일요일 휴무
  { date: '2026-02-16', revenue: 320000, consultations: 4 },
  { date: '2026-02-17', revenue: 410000, consultations: 5 },
  { date: '2026-02-18', revenue: 350000, consultations: 5 },
  { date: '2026-02-19', revenue: 290000, consultations: 4 },
  { date: '2026-02-20', revenue: 430000, consultations: 5 },
  { date: '2026-02-21', revenue: 550000, consultations: 7 },  // 토요일
  { date: '2026-02-22', revenue: 0, consultations: 0 },       // 일요일 휴무
  { date: '2026-02-23', revenue: 380000, consultations: 5 },
  { date: '2026-02-24', revenue: 340000, consultations: 4 },
  { date: '2026-02-25', revenue: 270000, consultations: 3 },
  { date: '2026-02-26', revenue: 150000, consultations: 2 },  // 오늘 (현재)
];

// 서비스 범위별 분석
export const MOCK_DESIGN_SCOPE_BREAKDOWN: ServiceBreakdown[] = [
  { name: '원컬러', count: 35, percentage: 27.6, revenue: 2100000 },
  { name: '단색+포인트', count: 42, percentage: 33.1, revenue: 3150000 },
  { name: '풀아트', count: 32, percentage: 25.2, revenue: 2880000 },
  { name: '이달의 아트', count: 18, percentage: 14.2, revenue: 1704000 },
];

// 표현 기법별 분석
export const MOCK_EXPRESSION_BREAKDOWN: ServiceBreakdown[] = [
  { name: '기본', count: 55, percentage: 43.3, revenue: 0 },
  { name: '그라데이션', count: 38, percentage: 29.9, revenue: 190000 },
  { name: '프렌치', count: 22, percentage: 17.3, revenue: 110000 },
  { name: '마그네틱', count: 12, percentage: 9.4, revenue: 60000 },
];

// 파츠 사용 분석
export const MOCK_PARTS_USAGE = {
  withParts: 58,
  withoutParts: 69,
  withPartsPercentage: 45.7,
  gradeS: 18,
  gradeA: 29,
  gradeB: 11,
};

// 선생님별 성과
export const MOCK_DESIGNER_STATS: DesignerStats[] = [
  {
    designerId: 'designer-001',
    designerName: '소율',
    consultations: 62,
    revenue: 4836000,
    averagePrice: 78000,
    topDesign: '풀아트',
  },
  {
    designerId: 'designer-002',
    designerName: '도윤',
    consultations: 41,
    revenue: 3198000,
    averagePrice: 78000,
    topDesign: '이달의 아트',
  },
  {
    designerId: 'designer-003',
    designerName: '하린',
    consultations: 24,
    revenue: 1800000,
    averagePrice: 75000,
    topDesign: '단색+포인트',
  },
];

// 고객 분석
export const MOCK_CUSTOMER_ANALYTICS: CustomerAnalytics = {
  newCustomers: 8,
  returningCustomers: 37,
  newPercentage: 17.8,
  returningPercentage: 82.2,
  averageVisitInterval: 28,
  vipCustomers: [
    { name: '윤서연', totalSpend: 738000, visitCount: 9 },
    { name: '박지현', totalSpend: 760000, visitCount: 8 },
    { name: '이수진', totalSpend: 696000, visitCount: 12 },
    { name: '김미영', totalSpend: 360000, visitCount: 5 },
    { name: '최은서', totalSpend: 272000, visitCount: 4 },
  ],
};

// 시간대별 분포
export const MOCK_HOURLY_DISTRIBUTION: HourlyDistribution[] = [
  { hour: 10, label: '10시', count: 12 },
  { hour: 11, label: '11시', count: 18 },
  { hour: 12, label: '12시', count: 8 },
  { hour: 13, label: '13시', count: 15 },
  { hour: 14, label: '14시', count: 22 },
  { hour: 15, label: '15시', count: 25 },
  { hour: 16, label: '16시', count: 20 },
  { hour: 17, label: '17시', count: 16 },
  { hour: 18, label: '18시', count: 11 },
];

// 요일별 분포
export const MOCK_WEEKLY_DISTRIBUTION: WeeklyDistribution[] = [
  { dayOfWeek: 1, label: '월', count: 15 },
  { dayOfWeek: 2, label: '화', count: 18 },
  { dayOfWeek: 3, label: '수', count: 22 },
  { dayOfWeek: 4, label: '목', count: 24 },
  { dayOfWeek: 5, label: '금', count: 28 },
  { dayOfWeek: 6, label: '토', count: 20 },
];

// 할인/예약금 현황
export const MOCK_DISCOUNT_STATS = {
  withDiscount: 43,
  withoutDiscount: 84,
  discountRate: 33.9,         // %
  averageDiscount: 6200,      // 원
  withDeposit: 38,
  depositCollectionRate: 29.9, // %
  averageDeposit: 10000,      // 원
};
