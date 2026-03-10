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
  overlay: number;            // 오버레이
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
