// 대시보드 KPI 및 분석 데이터

export interface KPICard {
  label: string;
  value: string;
  rawValue: number;
  change: number;         // 전월 대비 % 변화
  changeDirection: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface DailyConsultation {
  date: string;          // YYYY-MM-DD
  consultations: number;
  designScope?: string;  // 가장 인기 디자인
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
  topDesign: string;
  topShape: string;
  topExpression: string;
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
    label: '이달 상담 건수',
    value: '127건',
    rawValue: 127,
    change: 5,
    changeDirection: 'up',
    icon: '✂️',
  },
  {
    label: '인기 디자인',
    value: '단색+포인트',
    rawValue: 33,
    change: 4,
    changeDirection: 'up',
    icon: '🎨',
  },
  {
    label: '평균 옵션 선택',
    value: '3.2개',
    rawValue: 3.2,
    change: 6,
    changeDirection: 'up',
    icon: '📊',
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

// 최근 30일 일별 상담 데이터
export const MOCK_DAILY_CONSULTATIONS: DailyConsultation[] = [
  { date: '2026-01-28', consultations: 4, designScope: '단색+포인트' },
  { date: '2026-01-29', consultations: 5, designScope: '원컬러' },
  { date: '2026-01-30', consultations: 3, designScope: '단색+포인트' },
  { date: '2026-01-31', consultations: 6, designScope: '풀아트' },
  { date: '2026-02-01', consultations: 0 },                            // 일요일 휴무
  { date: '2026-02-02', consultations: 4, designScope: '단색+포인트' },
  { date: '2026-02-03', consultations: 5, designScope: '원컬러' },
  { date: '2026-02-04', consultations: 6, designScope: '풀아트' },
  { date: '2026-02-05', consultations: 3, designScope: '단색+포인트' },
  { date: '2026-02-06', consultations: 4, designScope: '이달의 아트' },
  { date: '2026-02-07', consultations: 7, designScope: '풀아트' },     // 토요일 많음
  { date: '2026-02-08', consultations: 0 },                            // 일요일 휴무
  { date: '2026-02-09', consultations: 0 },                            // 설연휴
  { date: '2026-02-10', consultations: 0 },                            // 설연휴
  { date: '2026-02-11', consultations: 0 },                            // 설연휴
  { date: '2026-02-12', consultations: 6, designScope: '단색+포인트' },
  { date: '2026-02-13', consultations: 5, designScope: '원컬러' },
  { date: '2026-02-14', consultations: 8, designScope: '풀아트' },     // 밸런타인데이
  { date: '2026-02-15', consultations: 0 },                            // 일요일 휴무
  { date: '2026-02-16', consultations: 4, designScope: '단색+포인트' },
  { date: '2026-02-17', consultations: 5, designScope: '이달의 아트' },
  { date: '2026-02-18', consultations: 5, designScope: '단색+포인트' },
  { date: '2026-02-19', consultations: 4, designScope: '원컬러' },
  { date: '2026-02-20', consultations: 5, designScope: '풀아트' },
  { date: '2026-02-21', consultations: 7, designScope: '단색+포인트' }, // 토요일
  { date: '2026-02-22', consultations: 0 },                            // 일요일 휴무
  { date: '2026-02-23', consultations: 5, designScope: '원컬러' },
  { date: '2026-02-24', consultations: 4, designScope: '단색+포인트' },
  { date: '2026-02-25', consultations: 3, designScope: '풀아트' },
  { date: '2026-02-26', consultations: 2, designScope: '원컬러' },
  { date: '2026-02-27', consultations: 4, designScope: '단색+포인트' },
  { date: '2026-02-28', consultations: 6, designScope: '풀아트' },
  { date: '2026-03-01', consultations: 0 },                            // 일요일 휴무
  { date: '2026-03-02', consultations: 5, designScope: '원컬러' },
  { date: '2026-03-03', consultations: 3, designScope: '단색+포인트' },
];

// 서비스 범위별 분석
export const MOCK_DESIGN_SCOPE_BREAKDOWN: ServiceBreakdown[] = [
  { name: '원컬러', count: 35, percentage: 27.6 },
  { name: '단색+포인트', count: 42, percentage: 33.1 },
  { name: '풀아트', count: 32, percentage: 25.2 },
  { name: '이달의 아트', count: 18, percentage: 14.2 },
];

// 표현 기법별 분석
export const MOCK_EXPRESSION_BREAKDOWN: ServiceBreakdown[] = [
  { name: '기본', count: 55, percentage: 43.3 },
  { name: '그라데이션', count: 38, percentage: 29.9 },
  { name: '프렌치', count: 22, percentage: 17.3 },
  { name: '마그네틱', count: 12, percentage: 9.4 },
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
    topDesign: '풀아트',
    topShape: '아몬드',
    topExpression: '그라데이션',
  },
  {
    designerId: 'designer-002',
    designerName: '도윤',
    consultations: 41,
    topDesign: '이달의 아트',
    topShape: '라운드',
    topExpression: '기본',
  },
  {
    designerId: 'designer-003',
    designerName: '하린',
    consultations: 24,
    topDesign: '단색+포인트',
    topShape: '스퀘어 오프',
    topExpression: '프렌치',
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
