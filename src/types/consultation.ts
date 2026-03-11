export enum ConsultationStep {
  START = 'start',
  CUSTOMER_INFO = 'customer_info',
  STEP1_BASIC = 'step1_basic',
  STEP2_DESIGN = 'step2_design',
  STEP3_OPTIONS = 'step3_options',
  TRAITS = 'traits',
  PRO_MODE = 'pro_mode',
  CANVAS = 'canvas',
  SUMMARY = 'summary',
}

import type { HandSide, PartGrade } from './canvas';

export type BodyPart = 'hand' | 'foot';

export type OffType = 'none' | 'same_shop' | 'other_shop';

export type ExtensionType = 'none' | 'repair' | 'extension';

export type NailShape =
  | 'round'
  | 'oval'
  | 'square'
  | 'squoval'
  | 'almond'
  | 'stiletto'
  | 'coffin';

export type DesignScope =
  | 'solid_tone'      // 원컬러
  | 'solid_point'     // 단색+포인트
  | 'full_art'        // 풀아트
  | 'monthly_art';    // 이달의 아트

export type ExpressionType =
  | 'solid'           // 기본
  | 'gradient'        // 그라데이션
  | 'french'          // 프렌치
  | 'magnetic';       // 마그네틱/캣아이

export interface FingerPartSelection {
  fingerId: string;       // thumb, index, middle, ring, pinky
  partGrade: PartGrade;
  quantity: number;
  customPartId?: string;  // CustomPart 기반 선택 시 사용
  position?: { x: number; y: number };
}

export interface FingerArtSelection {
  fingerId: string;
  artType: 'solid' | 'gradient' | 'art' | 'point' | 'french' | 'magnetic';
  colorCode?: string;
  isPoint?: boolean;
  note?: string;  // treatment type label e.g. "원컬러", "그라데이션"
  memo?: string;  // custom memo from shop owner
}

export interface CanvasData {
  handSide: HandSide;
  fingerParts: FingerPartSelection[];
  fingerArts: FingerArtSelection[];
}

export interface DiscountConfig {
  type: 'fixed' | 'percent';
  value: number;
}

export interface ConsultationType {
  // 기본 정보
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  sourceShopName?: string;

  // STEP1: 기본 조건
  bodyPart: BodyPart;
  offType: OffType;
  extensionType: ExtensionType;
  nailShape: NailShape;

  // STEP2: 디자인 범위
  designScope: DesignScope;

  // STEP3: 추가 옵션
  expressions: ExpressionType[];
  hasParts: boolean;
  partsSelections: { grade: PartGrade; quantity: number; customPartId?: string }[];
  extraColorCount: number;

  // Pro 모드
  pointFingerCount?: number;   // 포인트 손가락 수
  repairCount?: number;        // 리페어 개수
  baseType?: string;           // 베이스 타입

  // 참고 이미지
  referenceImages?: string[];

  // 고객 특성 선택
  selectedTraitValues?: string[];

  // 무드 태그 (customer_link 모드)
  moodTags?: string[];

  // 캔버스
  canvasData?: CanvasData[];

  // 할인 & 예약금
  discount?: DiscountConfig;
  deposit?: number;

  // 담당 선생님
  designerId?: string;

  // 연결된 예약 ID
  bookingId?: string;

  entryPoint?: 'staff' | 'customer_link';

  // 현재 단계
  currentStep: ConsultationStep;
}

export type BookingChannel = 'kakao' | 'naver' | 'phone' | 'walk_in';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingRequest {
  id: string;
  shopId: string;
  customerName: string;
  phone: string;
  reservationDate: string;
  reservationTime: string;
  channel: BookingChannel;
  requestNote?: string;
  referenceImageUrls?: string[];
  status: BookingStatus;
  createdAt: string;
  language?: 'ko' | 'en' | 'zh' | 'ja';
  designerId?: string;
  serviceLabel?: string;   // e.g., "자석젤", "원컬러", "그라데이션", "아트"
  customerId?: string;     // link to customer in customer-store
  preConsultationCompletedAt?: string;
  preConsultationData?: ConsultationType;
  deposit?: number;        // 원장 직접 입력 예약금
}

export interface DailyChecklist {
  shape: NailShape | null;
  length: 'short' | 'medium' | 'long' | null;
  thickness: 'thin' | 'medium' | 'thick' | null;
  cuticleSensitivity: 'low' | 'medium' | 'high' | null;
  memo: string;
  savedAt?: string;
}

export interface ConsultationRecord {
  id: string;
  shopId: string;
  designerId: string;
  customerId: string;
  consultation: ConsultationType;
  totalPrice: number;
  estimatedMinutes: number;
  finalPrice: number;        // totalPrice - discount - deposit
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  language?: 'ko' | 'en' | 'zh' | 'ja';
  pricingAdjustments?: {
    basePrice: number;
    extras: { label: string; amount: number }[];
    finalPrice: number;
  };
  notes?: string;
  imageUrls?: string[];
  checklist?: DailyChecklist;
}
