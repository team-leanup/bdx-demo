'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { Button } from '@/components/ui/Button';
import { serviceTypeToCategory } from '@/lib/category-mapping';

interface DesignGalleryProps {
  onConfirm: () => void;
  onSkip?: () => void;
}

export function DesignGallery({ onConfirm, onSkip }: DesignGalleryProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const selectedCategory = usePreConsultStore((s) => s.selectedCategory);
  const photos = usePreConsultStore((s) => s.portfolioPhotos);
  const selectedUrl = usePreConsultStore((s) => s.selectedPhotoUrl);
  const selectedPhotoId = usePreConsultStore((s) => s.selectedPhotoId);
  const setSelectedPhoto = usePreConsultStore((s) => s.setSelectedPhoto);
  const [reassurance, setReassurance] = useState<string | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  const filteredPhotos = useMemo(() => {
    return photos
      .filter((p) => {
        if (!p.isFeatured) return false;
        if (p.styleCategory === selectedCategory) return true;
        const derived = serviceTypeToCategory(p.serviceType);
        if (derived === selectedCategory) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [photos, selectedCategory]);

  const reassurances = [
    t('preConsult.reassurance1'),
    t('preConsult.reassurance2'),
    t('preConsult.reassurance3'),
  ];

  const handleSelect = (photo: (typeof filteredPhotos)[number]): void => {
    if (selectedPhotoId === photo.id) {
      setSelectedPhoto(null, null, null);
      return;
    }
    setSelectedPhoto(photo.id, photo.imageDataUrl, photo.price ?? null);
    const msg = reassurances[Math.floor(Math.random() * reassurances.length)];
    setReassurance(msg);
    setTimeout(() => setReassurance(null), 2000);
  };

  if (filteredPhotos.length === 0) {
    return (
      <div className="text-center py-8 flex flex-col items-center gap-4">
        <p className="text-text-muted text-sm">{t('preConsult.galleryEmpty')}</p>
        {onSkip && (
          <Button variant="outline" onClick={onSkip}>
            {t('preConsult.next')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-text-secondary text-center">
        {t('preConsult.galleryTitle')}
        {locale !== 'ko' && (
          <span className="block text-xs text-text-muted opacity-60">
            {tKo('preConsult.galleryTitle')}
          </span>
        )}
      </p>

      {/* Reassurance toast */}
      <AnimatePresence>
        {reassurance && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-primary font-medium"
          >
            {reassurance}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 선택 옵션 안내 */}
      <p className="text-center text-xs text-text-muted mb-1">
        선택하지 않아도 다음으로 넘어갈 수 있어요
      </p>

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredPhotos.map((photo) => {
          const url = photo.imageDataUrl;
          const isSelected = selectedPhotoId === photo.id;
          return (
            <motion.button
              key={photo.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(photo)}
              className={[
                'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
                isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border',
              ].join(' ')}
            >
              <Image src={url} alt="" fill unoptimized className="object-cover" />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
              {photo.isFeatured && !isSelected && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-primary/90 text-white text-xs font-bold">
                  PICK
                </div>
              )}
              {/* 확대 아이콘 */}
              <button
                type="button"
                aria-label="확대"
                onClick={(e) => { e.stopPropagation(); setZoomSrc(url); }}
                className="absolute top-1.5 right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
              {/* 가격 뱃지 */}
              {photo.price != null && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent pt-4 pb-1.5 px-2">
                  <span className="text-xs font-bold text-white">
                    {photo.price.toLocaleString('ko-KR')}원
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm / Skip buttons */}
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {selectedUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button fullWidth onClick={onConfirm}>
                {t('preConsult.gallerySelect')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {!selectedUrl && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
          >
            {t('preConsult.next')}
          </button>
        )}
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
    </div>
  );
}
