'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { fetchBookingRequestById } from '@/lib/db';
import { CategoryPicker } from '@/components/pre-consult/CategoryPicker';
import { DesignGallery } from '@/components/pre-consult/DesignGallery';
import { PriceRangeHint } from '@/components/pre-consult/PriceRangeHint';
import type { StyleCategory } from '@/types/portfolio';

const VALID_CATEGORIES: StyleCategory[] = ['simple', 'french', 'magnet', 'art'];

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
  const [showPrice, setShowPrice] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  // 예약의 레퍼런스 이미지 fetch
  useEffect(() => {
    if (!bookingId) return;
    fetchBookingRequestById(bookingId, shopId).then((booking) => {
      if (booking?.referenceImageUrls && booking.referenceImageUrls.length > 0) {
        setReferenceImages(booking.referenceImageUrls);
      }
    });
  }, [bookingId, shopId]);

  // 공유카드에서 넘어온 경우 카테고리 자동 선택
  useEffect(() => {
    const designCategory = searchParams.get('designCategory');
    if (designCategory && VALID_CATEGORIES.includes(designCategory as StyleCategory) && !selectedCategory) {
      usePreConsultStore.getState().setSelectedCategory(designCategory as StyleCategory);
    }
  }, [searchParams, selectedCategory]);

  const handleGalleryConfirm = (): void => {
    setShowPrice(true);
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
            포트폴리오에서 선택하지 않아도, 다음 단계에서 직접 사진을 업로드할 수 있어요
          </p>
        </div>

        {/* 예약 레퍼런스 이미지 */}
        {referenceImages.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface-alt p-4">
            <p className="text-sm font-semibold text-text mb-1">사장님이 보내준 참고 이미지</p>
            <p className="text-xs text-text-muted mb-3">이런 느낌을 원하시는 거죠? 아래에서 비슷한 디자인을 골라보세요</p>
            <div className="flex gap-2 overflow-x-auto">
              {referenceImages.map((url, i) => (
                <div key={i} className="h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden border border-border">
                  <Image src={url} alt="" width={96} height={96} className="h-full w-full object-cover" unoptimized />
                </div>
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

        {/* Price Range — reveals after photo confirmation */}
        <AnimatePresence>
          {showPrice && selectedPhotoUrl && (
            <motion.div
              key="price"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PriceRangeHint onNext={handleNext} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
