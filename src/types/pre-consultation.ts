import type { NailShape } from '@/types/consultation';
import type { BusinessHours, CategoryPricingSettings, CustomCategory, CustomPartSetting, ServiceStructure, SurchargeSettings } from '@/types/shop';

// ── Step & Category Enums ────────────────────────────────────────────────────

export type PreConsultStep = 'start' | 'design' | 'consult' | 'confirm' | 'complete';

/** 기본 4개 카테고리 (사장님이 삭제/이름변경 불가) */
export type BuiltinDesignCategory = 'simple' | 'french' | 'magnet' | 'art';

/** DesignCategory = 기본 4개 + 사장님이 추가한 custom-* id */
export type DesignCategory = BuiltinDesignCategory | string;

/** 기본 카테고리 상수 — 순회/검증에 사용 */
export const BUILTIN_DESIGN_CATEGORIES: BuiltinDesignCategory[] = ['simple', 'french', 'magnet', 'art'];

/** 사장님이 추가할 수 있는 최대 시술 종류 수 (기본 4 + 추가 4) */
export const MAX_DESIGN_CATEGORIES = 8;
export const MAX_CUSTOM_CATEGORIES = 4;

export type BodyPart = 'hand' | 'foot';

// ── Nail Status & Preferences ────────────────────────────────────────────────

export type NailCurrentStatus = 'none' | 'existing';

export type RemovalPreference = 'none' | 'self_shop' | 'other_shop';

export type LengthPreference = 'keep' | 'shorten' | 'extend';

export type ExtensionLength = 'natural' | 'medium' | 'long';

export type WrappingPreference = 'yes' | 'no';

// ── Design Feel & Style ───────────────────────────────────────────────────────

export type DesignFeel = 'natural' | 'french' | 'trendy' | 'fancy';

export type StylePreference = 'photo_match' | 'natural_fit' | 'clean_subtle';

export type StyleKeyword =
  | 'office_friendly'
  | 'slim_fingers'
  | 'tidy_look'
  | 'subtle_point'
  | 'more_fancy';

// ── Add-On Options ────────────────────────────────────────────────────────────

export type AddOnOption = 'stone' | 'parts' | 'glitter' | 'point_art' | 'wrapping';

// ── Price Estimate ────────────────────────────────────────────────────────────

export interface PreConsultPriceEstimate {
  categoryBase: number;
  removalSurcharge: number;
  extensionSurcharge: number;
  addOnSurcharge: number;
  /** 0528 — 커스텀 파츠 추가금 (사장님 설정 × 손님이 선택한 개수) */
  customPartsSurcharge: number;
  minTotal: number;
  maxTotal: number;
  estimatedMinutes: number;
}

// ── Core Data ─────────────────────────────────────────────────────────────────

export interface PreConsultationData {
  // 시술 부위 (손/발)
  bodyPart?: BodyPart;

  // Design selection
  designCategory?: DesignCategory;
  selectedPhotoUrl?: string;
  /** 0528 C5 — 사진별 가격(포트폴리오에서 가격이 설정된 사진 선택 시) — 가격 정합성 보장 */
  selectedPhotoPrice?: number;

  // Current nail status
  nailStatus?: NailCurrentStatus;
  removalPreference?: RemovalPreference;

  // Length
  lengthPreference?: LengthPreference;
  extensionLength?: ExtensionLength;

  // Shape
  nailShape?: NailShape;

  // Wrapping
  wrappingPreference?: WrappingPreference;

  // Design feel & style
  designFeel?: DesignFeel;
  stylePreference?: StylePreference;
  styleKeyword: StyleKeyword[];

  // Add-ons
  addOns: AddOnOption[];

  // 0528 — 사장님이 등록한 커스텀 파츠 (name → 개수)
  customPartSelections?: Record<string, number>;

  // Reference images
  referenceImageUrls: string[];

  // Free-text customer request
  additionalRequest?: string;
}

// ── Pre-Consultation Record ───────────────────────────────────────────────────

export interface PreConsultationType {
  id: string;
  shopId: string;
  bookingId?: string;
  customerId?: string;
  language: 'ko' | 'en' | 'zh' | 'ja';
  status: 'in_progress' | 'completed' | 'expired' | 'reviewed';
  data: PreConsultationData;
  designCategory?: DesignCategory;
  confirmedPrice?: number;
  estimatedMinutes?: number;
  referenceImagePaths: string[];
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  completedAt?: string;
  reviewedAt?: string;
  expiresAt?: string;
}

// ── Shop Public Data (for customer-facing pre-consult page) ──────────────────

export interface ShopPublicData {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  /** 0528 H6 — 핸드/페디 기본가 (사전상담 견적에 사용) */
  baseHandPrice?: number;
  baseFootPrice?: number;
  /** 0528 H8 — 영업시간 (사전상담 슬롯 필터링용) */
  businessHours?: BusinessHours[];
  categoryPricing: CategoryPricingSettings;
  surcharges: SurchargeSettings;
  customerNotice?: string;
  kakaoTalkUrl?: string;
  naverReservationUrl?: string;
  // 0528 — 설정 ↔ 상담 연동 확장
  /** 시술 항목 ON/OFF (OFF한 항목은 사전상담/현장모드에 표시 안 함) */
  serviceStructure?: ServiceStructure;
  /** 커스텀 파츠 (상담 시 빠른 선택 옵션) */
  customParts?: CustomPartSetting[];
  /** 사장님이 추가한 시술 종류 (기본 4개 외) — 0528 */
  customCategories?: CustomCategory[];
  /** 예약금 (사전상담 제출 시 booking에 자동 적용) */
  depositAmount?: number;
  /** 디자인 옵션 추가금 (사전상담 가격 계산 반영) */
  baseSolidPointPrice?: number;
  baseFullArtPrice?: number;
  baseMonthlyArtPrice?: number;
}
