'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { useConsultationStore } from '@/store/consultation-store';
import { formatPrice, formatDateDot } from '@/lib/format';
import { cn } from '@/lib/cn';
import { InstagramHashtags } from './InstagramHashtags';
import type { PortfolioPhoto } from '@/types/portfolio';
import type { Customer } from '@/types/customer';
import { ConsultationStep } from '@/types/consultation';
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

const SERVICE_TO_DESIGN_SCOPE: Record<string, string> = {
  '원컬러': 'solid_tone',
  '단색+포인트': 'solid_point',
  '풀아트': 'full_art',
  '이달의 아트': 'monthly_art',
};

export function PortfolioOverlay({
  photoIds,
  initialPhotoId,
  photos,
  customerMap,
  recordMap,
  onClose,
}: PortfolioOverlayProps): React.ReactElement {
  const router = useRouter();
  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const [currentId, setCurrentId] = useState(initialPhotoId);
  const [showHashtags, setShowHashtags] = useState(false);

  const currentIndex = photoIds.indexOf(currentId);
  const photo = photos.find((p) => p.id === currentId);
  const customer = photo ? customerMap.get(photo.customerId) : undefined;
  const linkedRecord = photo?.recordId ? recordMap.get(photo.recordId) : undefined;
  const serviceType = photo?.serviceType
    ?? (linkedRecord ? DESIGN_SCOPE_LABEL[linkedRecord.consultation.designScope] ?? linkedRecord.consultation.designScope : undefined);
  const effectivePrice = photo?.price ?? linkedRecord?.finalPrice;
  const effectiveDate = photo ? (photo.takenAt ?? photo.createdAt) : undefined;
  const estimatedMinutes = linkedRecord?.estimatedMinutes;

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentId(photoIds[currentIndex - 1]);
  }, [currentIndex, photoIds]);

  const goNext = useCallback(() => {
    if (currentIndex < photoIds.length - 1) setCurrentId(photoIds[currentIndex + 1]);
  }, [currentIndex, photoIds]);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const NAIL_FALLBACKS = [
    '/images/mock/nail/nail-1.jpg',
    '/images/mock/nail/nail-2.jpg',
    '/images/mock/nail/nail-3.jpg',
    '/images/mock/nail/nail-4.jpg',
    '/images/mock/nail/nail-5.jpg',
    '/images/mock/nail/nail-6.jpg',
    '/images/mock/nail/nail-7.jpg',
    '/images/mock/nail/nail-8.jpg',
  ];
  const imgSrc = photo?.imageDataUrl || NAIL_FALLBACKS[currentIndex % NAIL_FALLBACKS.length];

  if (!photo) return <></>;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-y-auto overscroll-contain"
        onClick={onClose}
      >
        <motion.div
          key={`overlay-${currentId}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm mx-4 my-4 flex flex-col gap-0 rounded-3xl overflow-hidden shadow-2xl max-h-[95dvh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 사진 */}
          <div className="relative aspect-square w-full bg-black">
            <Image
              src={imgSrc}
              alt={customer?.name ?? '포트폴리오'}
              fill
              unoptimized
              className="object-cover"
            />

            {/* 상단 닫기 */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 네비게이션 */}
            {currentIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {currentIndex < photoIds.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

          </div>

          {/* 정보 + 액션 */}
          <div className="bg-surface flex flex-col gap-0 min-h-0 overflow-y-auto overscroll-contain">
            {/* 고객 정보 */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-foreground truncate">{photo.kind === 'reference' ? '레퍼런스' : (customer?.name ?? '고객')}</p>
                {effectiveDate && (
                  <p className="text-xs text-muted-foreground shrink-0">{formatDateDot(effectiveDate)}</p>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {effectivePrice != null && (
                  <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
                    {formatPrice(effectivePrice)}
                  </span>
                )}
                {estimatedMinutes != null && (
                  <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {estimatedMinutes}분
                  </span>
                )}
                {serviceType && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {serviceType}
                  </span>
                )}
              </div>
              {photo.colorLabels && photo.colorLabels.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {photo.colorLabels.map((c, i) => (
                    <span key={i} className="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* 인스타 해시태그 토글 */}
            {showHashtags && (
              <div className="border-t border-border">
                <InstagramHashtags
                  tags={photo.tags}
                  colorLabels={photo.colorLabels}
                  serviceType={serviceType}
                  designType={photo.designType}
                  price={effectivePrice}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 p-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHashtags((v) => !v)}
                className={cn('flex-shrink-0', showHashtags && 'text-primary')}
              >
                #해시태그
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/portfolio/${photo.id}`)}
              >
                상세 보기
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const scopeKey = serviceType ? SERVICE_TO_DESIGN_SCOPE[serviceType] : undefined;
                  hydrateConsultation({
                    referenceImages: photo.imageDataUrl ? [photo.imageDataUrl] : [],
                    entryPoint: 'staff',
                    currentStep: ConsultationStep.START,
                    ...(scopeKey ? { designScope: scopeKey as 'solid_tone' | 'solid_point' | 'full_art' | 'monthly_art' } : {}),
                  });
                  router.push('/consultation');
                  onClose();
                }}
              >
                이 디자인으로 상담 시작
              </Button>
            </div>

            {/* 인디케이터 */}
            {photoIds.length > 1 && (
              <div className="flex justify-center gap-1 pb-3 pt-1">
                {photoIds.map((pid) => (
                  <button
                    key={pid}
                    onClick={() => setCurrentId(pid)}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      pid === currentId ? 'w-4 bg-primary' : 'w-1.5 bg-border',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PortfolioOverlay;
