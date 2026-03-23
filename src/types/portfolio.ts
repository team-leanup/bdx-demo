export type PortfolioPhotoKind = 'reference' | 'treatment';

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
  price?: number;
  isPublic?: boolean;
}
