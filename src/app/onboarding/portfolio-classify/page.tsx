'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useOnboardingPhotoStore } from '@/store/onboarding-photo-store';
import type { StyleCategory } from '@/types/portfolio';

const CATEGORIES: { value: StyleCategory; label: string; color: string }[] = [
  { value: 'simple', label: '심플', color: '#8B95A1' },
  { value: 'french', label: '프렌치', color: '#F472B6' },
  { value: 'magnet', label: '자석', color: '#8B5CF6' },
  { value: 'art', label: '아트', color: '#F4845F' },
];

const MIN_FEATURED = 3;
const MAX_FEATURED = 5;

export default function PortfolioClassifyPage() {
  const router = useRouter();
  const { photos, classifyPhoto, setFeaturedIds: storeFeaturedIds } = useOnboardingPhotoStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [phase, setPhase] = useState<'classify' | 'featured'>('classify');
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());

  const currentPhoto = photos[currentIndex];
  const totalPhotos = photos.length;
  const classifiedCount = photos.filter((p) => p.category).length;

  const classify = useCallback(
    (category: StyleCategory) => {
      if (currentPhoto) {
        classifyPhoto(currentPhoto.id, category);
      }
      if (currentIndex < totalPhotos - 1) {
        setDirection(1);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setPhase('featured');
      }
    },
    [currentIndex, totalPhotos, currentPhoto, classifyPhoto]
  );

  const skip = useCallback(() => {
    if (currentIndex < totalPhotos - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setPhase('featured');
    }
  }, [currentIndex, totalPhotos]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goNext = () => {
    if (currentIndex < totalPhotos - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const toggleFeatured = (id: string) => {
    setFeaturedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_FEATURED) {
        next.add(id);
      }
      return next;
    });
  };

  const handleFinish = () => {
    storeFeaturedIds(Array.from(featuredIds));
    router.push('/onboarding/pricing');
  };

  const canFinish = featuredIds.size >= MIN_FEATURED;

  // No photos loaded
  if (totalPhotos === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-112px)] px-5">
        <p className="text-sm text-text-muted mb-4">업로드된 사진이 없어요</p>
        <Button size="lg" onClick={() => router.push('/onboarding/portfolio-upload')}>
          사진 업로드하기
        </Button>
      </div>
    );
  }

  // Phase 1: Classify
  if (phase === 'classify') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col px-5 md:px-0 py-4 md:py-6 min-h-[calc(100dvh-112px)]"
      >
        {/* Header */}
        <div className="flex flex-col gap-1 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-text">포트폴리오 정리</h1>
          <p className="text-sm text-text-secondary">디자인을 가볍게 정리해볼게요</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text tabular-nums">
              {currentIndex + 1} / {totalPhotos}
            </span>
            <div className="w-20 h-1 rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${((currentIndex + 1) / totalPhotos) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <span className="text-xs text-text-muted">분류됨: {classifiedCount}</span>
        </div>

        {/* Card */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-full max-w-xs aspect-[3/4] rounded-2xl overflow-hidden shadow-lg mb-6">
            <AnimatePresence mode="wait" custom={direction}>
              {currentPhoto && (
                <motion.img
                  key={currentPhoto.id}
                  custom={direction}
                  initial={{ x: direction > 0 ? 200 : -200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction > 0 ? -200 : 200, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  src={currentPhoto.dataUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </AnimatePresence>

            {/* Current category badge */}
            {currentPhoto?.category && (
              <div className="absolute top-3 left-3">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  style={{
                    backgroundColor:
                      CATEGORIES.find((c) => c.value === currentPhoto.category)?.color ?? '#8B95A1',
                  }}
                >
                  {CATEGORIES.find((c) => c.value === currentPhoto.category)?.label}
                </span>
              </div>
            )}
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30 transition-opacity hover:bg-surface-alt"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-xs text-text-muted">이 디자인은 어떤 스타일인가요?</span>
            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex === totalPhotos - 1}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30 transition-opacity hover:bg-surface-alt"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Category buttons */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-xs mb-3">
            {CATEGORIES.map((cat) => {
              const isSelected = currentPhoto?.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => classify(cat.value)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200"
                  style={{
                    borderColor: isSelected ? cat.color : 'var(--color-border)',
                    backgroundColor: isSelected ? `${cat.color}10` : 'var(--color-surface)',
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isSelected ? cat.color : 'var(--color-text-secondary)' }}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Skip */}
          <button
            type="button"
            onClick={skip}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            건너뛰기
          </button>
        </div>

        {/* Helper */}
        <p className="text-xs text-text-muted text-center mt-4 mb-2">
          대략적으로만 선택해도 괜찮아요
        </p>

        {/* CTA to skip to featured */}
        {classifiedCount >= 3 && (
          <div className="pt-2">
            <Button
              size="lg"
              fullWidth
              variant="secondary"
              onClick={() => setPhase('featured')}
            >
              분류 마치고 대표 디자인 선택
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  // Phase 2: Featured selection
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-5 md:px-0 py-4 md:py-6 min-h-[calc(100dvh-112px)]"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-text">대표 디자인 선택</h1>
        <p className="text-sm text-text-secondary">
          고객이 가장 먼저 보게 될 디자인이에요
        </p>
      </div>

      {/* Selection counter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-text-muted">
          {featuredIds.size} / {MAX_FEATURED}개 선택됨
        </span>
        {featuredIds.size < MIN_FEATURED && (
          <span className="text-xs text-error">
            최소 {MIN_FEATURED}개 선택
          </span>
        )}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 flex-1">
        {photos.map((photo) => {
          const isFeatured = featuredIds.has(photo.id);
          const cat = CATEGORIES.find((c) => c.value === photo.category);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => toggleFeatured(photo.id)}
              className="relative aspect-square rounded-xl overflow-hidden transition-all duration-200"
              style={{
                outline: isFeatured ? '3px solid var(--color-primary)' : 'none',
                outlineOffset: '-2px',
              }}
            >
              <img
                src={photo.dataUrl}
                alt=""
                className="w-full h-full object-cover"
              />

              {/* Category badge */}
              {cat && (
                <span
                  className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.label}
                </span>
              )}

              {/* Selected overlay */}
              {isFeatured && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-primary/20 flex items-center justify-center"
                >
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                      <path d="M1 5.5L5 9.5L13 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="pt-6">
        <Button size="lg" fullWidth onClick={handleFinish} disabled={!canFinish}>
          다음
        </Button>
      </div>
    </motion.div>
  );
}
