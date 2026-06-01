import type { DesignCategory } from '@/types/pre-consultation';

export type PortfolioPhotoKind = 'reference' | 'treatment';

// StyleCategory is identical to DesignCategory; unified under DesignCategory
export type { DesignCategory as StyleCategory };

export interface PortfolioPhoto {
  id: string;
  shopId: string;
  customerId?: string;
  recordId?: string;
  kind: PortfolioPhotoKind;
  createdAt: string;
  takenAt?: string;
  imageDataUrl: string;
  imagePath?: string;
  note?: string;
  tags?: string[];
  colorLabels?: string[];
  designType?: string;
  serviceType?: string;
  styleCategory?: DesignCategory;
  price?: number;
  isPublic?: boolean;
  isFeatured?: boolean;
  isStaffPick?: boolean;
  isPopular?: boolean;
  /** 0601: 카테고리 대표사진(커버) — 카테고리당 1장 */
  isRepresentative?: boolean;
  partsMemo?: string;
  /** 0601: 이 사진으로 만든 공유카드 id (상담기록 미연결 단독 사진도 공유 링크 재사용) */
  shareCardId?: string;
}
