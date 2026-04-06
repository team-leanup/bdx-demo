'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface Props {
  imageUrls: string[];
}

export function ShareCardImageCarousel({ imageUrls }: Props): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const handleDragStart = (_: unknown, info: { point: { x: number } }): void => {
    setDragStartX(info.point.x);
  };

  const handleDragEnd = (_: unknown, info: { point: { x: number } }): void => {
    const delta = dragStartX - info.point.x;
    if (delta > 50 && currentIndex < imageUrls.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (delta < -50 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (imageUrls.length === 0) {
    return (
      <div className="w-full aspect-[4/5] bg-surface rounded-2xl flex flex-col items-center justify-center gap-3">
        <svg
          className="w-12 h-12 text-text-muted opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
          />
        </svg>
        <p className="text-sm text-text-muted opacity-60">등록된 이미지가 없어요</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3"
      role="region"
      aria-label="이미지 갤러리"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(currentIndex - 1);
        if (e.key === 'ArrowRight' && currentIndex < imageUrls.length - 1) setCurrentIndex(currentIndex + 1);
      }}
    >
      <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-surface">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Image
              src={imageUrls[currentIndex]}
              alt={`네일 디자인 이미지 ${currentIndex + 1}`}
              fill
              className="object-cover select-none"
              unoptimized
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Arrow buttons for desktop */}
        {imageUrls.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
                aria-label="이전 이미지"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            {currentIndex < imageUrls.length - 1 && (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
                aria-label="다음 이미지"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Image counter badge */}
        {imageUrls.length > 1 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
            {currentIndex + 1} / {imageUrls.length}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {imageUrls.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {imageUrls.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="p-2"
              aria-label={`이미지 ${idx + 1}/${imageUrls.length}`}
            >
              <span className={cn(
                'block rounded-full transition-all duration-300',
                idx === currentIndex ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-text-muted/30',
              )} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
