import type { NailShape } from '@/types/consultation';
import type { CategoryPricingSettings, SurchargeSettings } from '@/types/shop';

// ── Step & Category Enums ────────────────────────────────────────────────────

export type PreConsultStep = 'start' | 'design' | 'consult' | 'confirm' | 'complete';

export type DesignCategory = 'simple' | 'french' | 'magnet' | 'art';

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

export type AddOnOption = 'stone' | 'parts' | 'glitter' | 'point_art';

// ── Price Estimate ────────────────────────────────────────────────────────────

export interface PreConsultPriceEstimate {
  categoryBase: number;
  removalSurcharge: number;
  extensionSurcharge: number;
  addOnSurcharge: number;
  minTotal: number;
  maxTotal: number;
  estimatedMinutes: number;
}

// ── Core Data ─────────────────────────────────────────────────────────────────

export interface PreConsultationData {
  // Design selection
  designCategory?: DesignCategory;
  selectedPhotoUrl?: string;

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

  // Reference images
  referenceImageUrls: string[];
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
  categoryPricing: CategoryPricingSettings;
  surcharges: SurchargeSettings;
  customerNotice?: string;
}
