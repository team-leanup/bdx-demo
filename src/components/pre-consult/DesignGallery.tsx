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
  const setSelectedUrl = usePreConsultStore((s) => s.setSelectedPhotoUrl);
  const [reassurance, setReassurance] = useState<string | null>(null);

  const filteredPhotos = useMemo(() => {
    return photos
      .filter((p) => {
        // styleCategory 직접 매칭
        if (p.styleCategory === selectedCategory) return true;
        // serviceType → styleCategory 간접 매핑
        const derived = serviceTypeToCategory(p.serviceType);
        if (derived === selectedCategory) return true;
        // 둘 다 없으면 모든 카테고리에 표시
        if (!p.styleCategory && !derived) return true;
        return false;
      })
      .sort((a, b) => {
        // 직접 매칭 우선 → 간접 매핑 → 미분류
        const aScore = a.styleCategory === selectedCategory ? 0
          : serviceTypeToCategory(a.serviceType) === selectedCategory ? 1 : 2;
        const bScore = b.styleCategory === selectedCategory ? 0
          : serviceTypeToCategory(b.serviceType) === selectedCategory ? 1 : 2;
        if (aScore !== bScore) return aScore - bScore;
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

  const handleSelect = (url: string): void => {
    setSelectedUrl(url);
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
          <span className="block text-[10px] text-text-muted opacity-60">
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

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredPhotos.map((photo) => {
          const url = photo.imagePath ?? photo.imageDataUrl;
          const isSelected = selectedUrl === url;
          return (
            <motion.button
              key={photo.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(url)}
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
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-primary/90 text-white text-[9px] font-bold">
                  PICK
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm button */}
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
    </div>
  );
}
