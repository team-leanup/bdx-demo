export type PortfolioPhotoKind = 'reference' | 'treatment';

export interface PortfolioPhoto {
  id: string;
  customerId: string;
  recordId?: string;
  kind: PortfolioPhotoKind;
  createdAt: string;
  takenAt?: string;
  imageDataUrl: string;
  note?: string;
  tags?: string[];
}
