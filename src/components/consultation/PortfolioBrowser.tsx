'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePortfolioStore } from '@/store/portfolio-store';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface PortfolioBrowserProps {
  onSelect: (imageUrl: string) => void;
  selectedUrls: string[];
  className?: string;
}

export function PortfolioBrowser({ onSelect, selectedUrls, className }: PortfolioBrowserProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const photos = usePortfolioStore((s) => s.photos);
  const hydrateFromDB = usePortfolioStore((s) => s.hydrateFromDB);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    hydrateFromDB();
  }, [hydrateFromDB]);

  if (photos.length === 0) {
    return (
      <div className={cn('rounded-2xl border-2 border-dashed border-border p-6 flex flex-col items-center gap-2', className)}>
        <span className="text-2xl">🖼️</span>
        <p className="text-sm text-text-muted text-center">
          {t('consultation.portfolioTitle')}
          {locale !== 'ko' && (
            <span className="block text-[11px] opacity-60">{tKo('consultation.portfolioTitle')}</span>
          )}
        </p>
        <p className="text-xs text-text-muted opacity-70">포트폴리오 사진이 아직 없어요</p>
      </div>
    );
  }

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

  const displayPhotos = isExpanded ? photos : photos.slice(0, 6);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-text">
            {t('consultation.portfolioTitle')}
            {locale !== 'ko' && (
              <span className="ml-2 text-xs font-medium text-text-muted opacity-60">{tKo('consultation.portfolioTitle')}</span>
            )}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {t('consultation.portfolioDesc')}
            {locale !== 'ko' && (
              <span className="ml-1 text-[10px] opacity-60">{tKo('consultation.portfolioDesc')}</span>
            )}
          </p>
        </div>
        {selectedUrls.length > 0 && (
          <span className="text-xs font-bold text-primary px-2 py-1 rounded-full bg-primary/10">
            {selectedUrls.length}개 선택
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {displayPhotos.map((photo, idx) => {
          const imgSrc = NAIL_FALLBACKS[idx % NAIL_FALLBACKS.length];
          const isSelected = selectedUrls.includes(imgSrc);
          return (
            <motion.button
              key={photo.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(imgSrc)}
              className={cn(
                'relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200',
                isSelected
                  ? 'border-primary shadow-sm shadow-primary/20'
                  : 'border-border',
              )}
            >
              <Image
                src={imgSrc}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
              {/* Select label */}
              {!isSelected && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent py-1.5 px-2">
                  <span className="text-[9px] text-white font-bold">
                    {t('consultation.portfolioSelect')}
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {photos.length > 6 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-primary hover:underline transition-colors min-h-[44px] px-3"
        >
          {isExpanded ? '접기' : `+ ${photos.length - 6}개 더 보기`}
        </button>
      )}
    </div>
  );
}
