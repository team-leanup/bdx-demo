export interface ServiceStructure {
  removal: boolean;      // 제거 있음
  gradation: boolean;    // 그라데이션 있음
  french: boolean;       // 프렌치 있음
  magnet: boolean;       // 자석 있음
  pointFullArt: boolean; // 포인트/풀아트 구분
  parts: boolean;        // 파츠 있음
  repair: boolean;       // 리페어 있음
  overlay: boolean;      // 오버레이 있음
  extension: boolean;    // 연장 있음
}

export interface SurchargeSettings {
  selfRemoval: number;        // 자샵 제거
  otherRemoval: number;       // 타샵 제거
  gradation: number;          // 그라데이션 추가금
  french: number;             // 프렌치 추가금
  magnet: number;             // 자석 추가금
  pointArt: number;           // 포인트 아트
  fullArt: number;            // 풀아트
  parts1000included: number;  // 1000원 파츠 포함 개수
  parts2000included: number;  // 2000원 파츠 포함 개수
  parts3000included: number;  // 3000원 파츠 포함 개수
  partsExcessPer: number;     // 초과 개당 금액
  largeParts: number;         // 큰 파츠 추가금
  repairPer: number;          // 리페어 개당
  extension: number;
  overlay: number;            // 오버레이
  wrapping?: number;          // 랩핑 (손톱 끝 감싸기) — 미설정 시 기본 5000
}

export interface TimeSettings {
  baseHand: number;    // 기본 손 원톤 (분)
  gradation: number;   // 그라 추가
  french: number;      // 프렌치 추가
  magnet: number;      // 자석 추가
  point: number;       // 포인트 추가
  fullArt: number;     // 풀아트 추가
  repairPer: number;   // 리페어 개당
  parts: number;       // 파츠 추가
}

export interface BusinessHours {
  dayOfWeek: number;  // 0=일요일, 1=월요일, ..., 6=토요일
  isOpen: boolean;
  openTime?: string;  // "09:00"
  closeTime?: string; // "20:00"
}

export interface Designer {
  id: string;
  shopId: string;
  name: string;
  role: 'owner' | 'staff';
  profileImageUrl?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  pin?: string;
}

export interface CategoryPricingItem {
  price: number;
  time: number;
}

export interface CategoryPricingSettings {
  simple: CategoryPricingItem;
  french: CategoryPricingItem;
  magnet: CategoryPricingItem;
  art: CategoryPricingItem;
  // 0528: 사장님이 추가한 커스텀 카테고리 가격 (key는 CustomCategory.id)
  [customId: string]: CategoryPricingItem;
}

/**
 * 0528 — 사장님이 추가한 시술 종류 (기본 4개 외 추가)
 * 최대 4개 추가 가능 (기본 4개 + 추가 4개 = 총 8개)
 * 한국어는 필수, 다른 언어는 선택 → 미입력 시 한국어 fallback
 */
export interface CustomCategory {
  id: string;          // 'custom-{slug}' 형태
  name: string;        // 한국어 (필수)
  nameEn?: string;
  nameZh?: string;
  nameJa?: string;
  description?: string; // 한국어 짧은 설명 (선택)
  price: number;
  time: number;        // 분
  order: number;       // 정렬 순서
}

export interface CustomPartSetting {
  id: string;
  name: string;
  pricePerUnit: number;
}

export interface ShopExtendedSettings {
  addressDetail?: string;
  baseOffSameShop?: number;
  baseOffOtherShop?: number;
  baseSolidPointPrice?: number;
  baseFullArtPrice?: number;
  baseMonthlyArtPrice?: number;
  designerCount?: number;
  selectedServices?: string[];
  serviceStructure?: ServiceStructure;
  surcharges?: SurchargeSettings;
  timeSettings?: TimeSettings;
  customerNotice?: string;
  categoryPricing?: CategoryPricingSettings;
  kakaoTalkUrl?: string;
  naverReservationUrl?: string;
  /** 0528: 커스텀 파츠 (상담 시 빠른 선택 옵션) — 사전상담/현장모드 노출용 */
  customParts?: CustomPartSetting[];
  /** 0528: 추가 시술 종류 (기본 4개 외 사장님이 추가) — 최대 4개 */
  customCategories?: CustomCategory[];
  /** 0528: 예약금 (사전상담 제출 시 booking_requests.deposit에 자동 적용) */
  depositAmount?: number;
  /** 월 목표 매출 — 대시보드 KPI 달성률 표시용. shops.settings jsonb에 자동 포함 */
  monthlyTargetRevenue?: number;
  /**
   * 0423 반영: 재방문 알림 문자 기본 문구틀 (샵주인 편집 가능).
   * 치환 변수: {customerName}, {shopName}
   */
  revisitMessageTemplate?: string;
  /**
   * 재방문 알림 주기 (주 단위). 미설정 시 기본 4주.
   * 유효 범위: 1~12. 설정 UI에서 사장님이 변경 가능.
   */
  revisitIntervalWeeks?: number;
  /**
   * 원장이 builtin 카테고리(simple/french/magnet/art)를 rename했을 때의 override.
   * key: builtin 카테고리 키, value: 원장이 지정한 한국어 라벨.
   * settings jsonb에 자동 포함되므로 DB 마이그레이션 불필요.
   */
  categoryLabels?: Record<string, string>;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  phone?: string;
  address?: string;
  themeId: string;
  businessHours: BusinessHours[];
  baseHandPrice: number;   // 핸드 기본가
  baseFootPrice: number;   // 페디큐어 기본가
  logoUrl?: string;
  onboardingCompletedAt?: string;
  settings?: ShopExtendedSettings;
  createdAt: string;
  updatedAt: string;
}
