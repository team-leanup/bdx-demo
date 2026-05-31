import type { BookingRequest } from '@/types/consultation';
import { isRenderableImageSrc } from '@/lib/image-utils';

export interface BookingThumbnailItem {
  src: string;
  label: '요청' | '이전';
}

/**
 * 예약 카드에 표시할 썸네일 아이템 목록을 반환합니다.
 * - 요청 이미지: preConsultationData.referenceImages 또는 referenceImageUrls (최대 2개)
 * - 이전 포트폴리오: portfolioImageUrls (합산 최대 3개)
 * - blob: URL 및 중복 src 제외
 */
export function getBookingThumbnailItems(
  booking: BookingRequest,
  portfolioImageUrls: string[],
): BookingThumbnailItem[] {
  const items: BookingThumbnailItem[] = [];
  const seen = new Set<string>();
  const requestImageUrls = booking.preConsultationData?.referenceImages?.length
    ? booking.preConsultationData.referenceImages
    : (booking.referenceImageUrls ?? []);

  for (const src of requestImageUrls) {
    if (!isRenderableImageSrc(src) || seen.has(src)) continue;
    seen.add(src);
    items.push({ src, label: '요청' });
    if (items.length >= 2) break;
  }

  for (const src of portfolioImageUrls) {
    if (!isRenderableImageSrc(src) || seen.has(src)) continue;
    seen.add(src);
    items.push({ src, label: '이전' });
    if (items.length >= 3) break;
  }

  return items;
}
