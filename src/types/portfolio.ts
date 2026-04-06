import type { DesignCategory } from '@/types/pre-consultation';

export type PortfolioPhotoKind = 'reference' | 'treatment';

// StyleCategory is identical to DesignCategory; unified under DesignCategory
export type { DesignCategory as StyleCategory };

export interface PortfolioPhoto {
  id: string;
  shopId: string;
  customerId: string;
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
}
