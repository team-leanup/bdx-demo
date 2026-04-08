'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioStore } from '@/store/portfolio-store';
import { formatPrice, formatDateDot } from '@/lib/format';
import { cn } from '@/lib/cn';
import { downloadForInstagram } from '@/lib/image-utils';
import type { PortfolioPhoto } from '@/types/portfolio';
import type { Customer } from '@/types/customer';
import type { ConsultationRecord } from '@/types/consultation';

interface PortfolioOverlayProps {
  photoIds: string[];
  initialPhotoId: string;
  photos: PortfolioPhoto[];
  customerMap: Map<string, Customer>;
  recordMap: Map<string, ConsultationRecord>;
  onClose: () => void;
}

const DESIGN_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원컬러',
  solid_point: '단색+포인트',
  full_art: '풀아트',
  monthly_art: '이달의 아트',
};

const NAIL_FALLBACKS = [
  '/images/mock/nail/nail-1.jpg', '/images/mock/nail/nail-2.jpg',
  '/images/mock/nail/nail-3.jpg', '/images/mock/nail/nail-4.jpg',
  '/images/mock/nail/nail-5.jpg', '/images/mock/nail/nail-6.jpg',
  '/images/mock/nail/nail-7.jpg', '/images/mock/nail/nail-8.jpg',
];

export function PortfolioOverlay({
  photoIds,
  initialPhotoId,
  photos,
  customerMap,
  recordMap,
  onClose,
}: PortfolioOverlayProps): React.ReactElement {
  const router = useRouter();
  const toggleMenu = usePortfolioStore((s) => s.toggleMenu);
  const [currentId, setCurrentId] = useState(initialPhotoId);
  const [downloadingInsta, setDownloadingInsta] = useState(false);

  const currentIndex = photoIds.indexOf(currentId);
  const photo = photos.find((p) => p.id === currentId);
  const customer = photo ? customerMap.get(photo.customerId) : undefined;
  const linkedRecord = photo?.recordId ? recordMap.get(photo.recordId) : undefined;
  const serviceType = photo?.serviceType
    ?? (linkedRecord ? DESIGN_SCOPE_LABEL[linkedRecord.consultation.designScope] ?? linkedRecord.consultation.designScope : undefined);
  const effectivePrice = photo?.price ?? linkedRecord?.finalPrice;
  const effectiveDate = photo ? (photo.takenAt ?? photo.createdAt) : undefined;
  const imgSrc = photo?.imageDataUrl || NAIL_FALLBACKS[currentIndex % NAIL_FALLBACKS.length];

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentId(photoIds[currentIndex - 1]);
  }, [currentIndex, photoIds]);

  const goNext = useCallback(() => {
    if (currentIndex < photoIds.length - 1) setCurrentId(photoIds[currentIndex + 1]);
  }, [currentIndex, photoIds]);

  if (!photo) return <></>;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80"
        onClick={onClose}
      >
        <motion.div
          key={`overlay-${currentId}`}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:mx-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl bg-surface"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 사진 */}
          <div className="relative aspect-[4/3] w-full bg-black">
            <Image
              src={imgSrc}
              alt={customer?.name ?? '포트폴리오'}
              fill
              unoptimized
              className="object-cover"
            />

            {/* 닫기 */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 좌우 네비 */}
            {currentIndex > 0 && (
              <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            {currentIndex < photoIds.length - 1 && (
              <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            )}

            {/* 뱃지 */}
            <div className="absolute top-3 left-3 flex gap-1">
              {photo.isFeatured && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow">메뉴</span>}
              {photo.isStaffPick && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow">추천</span>}
              {photo.isPopular && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">인기</span>}
            </div>

            {/* 가격 오버레이 */}
            {effectivePrice != null && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-3 px-4">
                <span className="text-xl font-bold text-white">{formatPrice(effectivePrice)}</span>
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-base font-bold text-text truncate">{photo.designType ?? customer?.name ?? '미지정'}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary">
                  {customer?.name && <span>{customer.name}</span>}
                  {serviceType && <span className="text-primary font-medium">{serviceType}</span>}
                  {effectiveDate && <span>{formatDateDot(effectiveDate)}</span>}
                </div>
              </div>
            </div>
            {photo.colorLabels && photo.colorLabels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {photo.colorLabels.map((c, i) => (
                  <span key={i} className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-medium text-text-secondary">{c}</span>
                ))}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
            {/* 메뉴 토글 */}
            <button
              onClick={() => toggleMenu(photo.id, photo.price)}
              className={cn('rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                photo.isFeatured ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-surface-alt text-text-secondary',
              )}
            >
              {photo.isFeatured ? '메뉴 해제' : '메뉴 등록'}
            </button>
            {/* 인스타 저장 */}
            <button
              disabled={downloadingInsta}
              onClick={async () => {
                if (!photo.imageDataUrl) return;
                setDownloadingInsta(true);
                try { await downloadForInstagram(photo.imageDataUrl, '4:5'); } catch { /* */ } finally { setDownloadingInsta(false); }
              }}
              className="rounded-lg bg-surface-alt px-3 py-2 text-xs font-medium text-text-secondary"
            >
              {downloadingInsta ? '저장 중...' : '인스타 저장'}
            </button>
            {/* 고객 카드 */}
            {customer?.id && (
              <button
                onClick={() => { router.push(`/customers/${customer.id}`); onClose(); }}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white text-center"
              >
                고객 카드
              </button>
            )}
          </div>

          {/* 인디케이터 */}
          {photoIds.length > 1 && (
            <div className="flex justify-center gap-1 pb-3">
              {photoIds.map((pid) => (
                <button
                  key={pid}
                  onClick={() => setCurrentId(pid)}
                  className={cn('h-1.5 rounded-full transition-all', pid === currentId ? 'w-4 bg-primary' : 'w-1.5 bg-border')}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
