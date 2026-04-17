import type { StyleCategory } from '@/types/portfolio';
import type { BusinessHours } from '@/types/shop';

export type ConsultationLinkStatus = 'active' | 'paused' | 'expired';

export interface ConsultationLink {
  id: string;
  shopId: string;
  designerId?: string;
  title?: string;
  description?: string;
  styleCategory?: StyleCategory;
  validFrom: string;
  validUntil: string;
  estimatedDurationMin: number;
  slotIntervalMin: number;
  bookingCount: number;
  status: ConsultationLinkStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookedSlot {
  date: string;
  time: string;
}

export interface LinkPortfolioPreview {
  id: string;
  imageUrl: string;
  styleCategory?: StyleCategory;
  designType?: string;
  price?: number;
}

export interface ConsultationLinkPublicData {
  id: string;
  shopId: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  designerId?: string;
  designerName?: string;
  title?: string;
  description?: string;
  styleCategory?: StyleCategory;
  status: ConsultationLinkStatus;
  validFrom: string;
  validUntil: string;
  estimatedDurationMin: number;
  slotIntervalMin: number;
  bookedSlots: BookedSlot[];
  businessHours: BusinessHours[];
  portfolio: LinkPortfolioPreview[];
  expiresAt: string;
}

export interface CreateConsultationLinkInput {
  shopId: string;
  designerId?: string;
  title?: string;
  description?: string;
  styleCategory?: StyleCategory;
  validFrom: string;
  validUntil: string;
  estimatedDurationMin?: number;
  slotIntervalMin?: number;
  expiresAt?: string;
}
