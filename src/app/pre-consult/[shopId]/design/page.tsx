'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { fetchBookingRequestById } from '@/lib/db';
import { BodyPartToggle } from '@/components/pre-consult/BodyPartToggle';
import { CategoryPicker } from '@/components/pre-consult/CategoryPicker';
import { DesignGallery } from '@/components/pre-consult/DesignGallery';

import type { StyleCategory } from '@/types/portfolio';
import { BUILTIN_DESIGN_CATEGORIES } from '@/types/pre-consultation';

export default function PreConsultDesignPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ shopId: string }>();
  const searchParams = useSearchParams();
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const selectedCategory = usePreConsultStore((s) => s.selectedCategory);
  const selectedPhotoUrl = usePreConsultStore((s) => s.selectedPhotoUrl);
  const bookingId = usePreConsultStore((s) => s.bookingId);
  const shopId = usePreConsultStore((s) => s.shopId);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  // 예약의 레퍼런스 이미지 fetch
  useEffect(() => {
    if (!bookingId) return;
    fetchBookingRequestById(bookingId, shopId).then((booking) => {
      if (booking?.referenceImageUrls && booking.referenceImageUrls.length > 0) {
        setReferenceImages(booking.referenceImageUrls);
      }
    });
  }, [bookingId, shopId]);

  // 공유카드에서 넘어온 경우 카테고리 자동 선택 (builtin + custom 모두 허용)
  // URL carry(designCategory)가 있으면 stale selectedCategory 유무와 무관하게 항상 검증·override.
  // (builtin은 이미 pre-select이라 동일 값 재적용으로 무해; custom은 shopData 로드 후 정확히 검증)
  const shopDataInStore = usePreConsultStore((s) => s.shopData);
  useEffect(() => {
    const designCategory = searchParams.get('designCategory');
    if (!designCategory) return;
    const isBuiltin = (BUILTIN_DESIGN_CATEGORIES as ReadonlyArray<string>).includes(designCategory);
    const isCustom = shopDataInStore?.customCategories?.some((c) => c.id === designCategory) ?? false;
    if (isBuiltin || isCustom) {
      usePreConsultStore.getState().setSelectedCategory(designCategory as StyleCategory);
    }
  }, [searchParams, shopDataInStore]);

  const handleGalleryConfirm = (): void => {
    handleNext();
  };

  const handleNext = (): void => {
    usePreConsultStore.getState().setCurrentStep('consult');
    router.push(`/pre-consult/${params.shopId}/consult`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 px-4 pt-5 pb-8"
    >
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        {/* 손/발 우선 선택 — 디자인 선택 전 필수 */}
        <BodyPartToggle />

        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-text">
            {t('preConsult.designTitle')}
          </h2>
          {locale !== 'ko' && (
            <p className="text-xs text-text-muted opacity-60 mt-1">
              {tKo('preConsult.designTitle')}
            </p>
          )}
          <p className="text-sm text-text-muted mt-1">{t('preConsult.designSub')}</p>
          <p className="text-xs text-text-muted mt-2 opacity-70">
            {t('preConsult.portfolioUploadSkipHint')}
          </p>
          {locale !== 'ko' && (
            <p className="text-xs text-text-muted opacity-50">
              {tKo('preConsult.portfolioUploadSkipHint')}
            </p>
          )}
        </div>

        {/* 예약 레퍼런스 이미지 */}
        {referenceImages.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface-alt p-4">
            <p className="text-sm font-semibold text-text mb-1">
              {t('preConsult.bookingReferenceLabel')}
            </p>
            {locale !== 'ko' && (
              <p className="text-xs text-text-muted opacity-60">
                {tKo('preConsult.bookingReferenceLabel')}
              </p>
            )}
            <p className="text-xs text-text-muted mb-3">
              {t('preConsult.bookingReferenceHint')}
            </p>
            {locale !== 'ko' && (
              <p className="text-xs text-text-muted opacity-60 mb-3">
                {tKo('preConsult.bookingReferenceHint')}
              </p>
            )}
            <div className="flex gap-2 overflow-x-auto">
              {referenceImages.map((url, i) => (
                <button key={i} onClick={() => setZoomSrc(url)} className="h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden border border-border hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer">
                  <Image src={url} alt="" width={96} height={96} className="h-full w-full object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Picker — always visible */}
        <CategoryPicker />

        {/* Gallery — reveals after category selection */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DesignGallery onConfirm={handleGalleryConfirm} onSkip={handleNext} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 이미지 확대 오버레이 */}
      <AnimatePresence>
        {zoomSrc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80"
              onClick={() => setZoomSrc(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-4 z-50 flex items-center justify-center"
              onClick={() => setZoomSrc(null)}
            >
              <Image
                src={zoomSrc}
                alt=""
                width={600}
                height={600}
                className="max-h-[80dvh] w-auto rounded-2xl object-contain"
                unoptimized
              />
              <button
                onClick={() => setZoomSrc(null)}
                className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
