'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioStore } from '@/store/portfolio-store';
import { fetchPortfolioPhotos } from '@/lib/db';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';
import type { PortfolioPhoto } from '@/types/portfolio';
import { DEMO_PORTFOLIO_PHOTOS } from '@/data/demo-portfolio';

interface PortfolioBrowserProps {
  onToggleSelect: (imageUrl: string) => void;
  selectedUrls: string[];
  className?: string;
  shopId?: string;
  shopName?: string;
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

function getPhotoImageSrc(photo: PortfolioPhoto, index: number): string {
  return photo.imageDataUrl || NAIL_FALLBACKS[index % NAIL_FALLBACKS.length];
}

export function PortfolioBrowser({
  onToggleSelect,
  selectedUrls,
  className,
  shopId,
  shopName,
}: PortfolioBrowserProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const storedPhotos = usePortfolioStore((s) => s.photos);
  const hydrateFromDB = usePortfolioStore((s) => s.hydrateFromDB);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [linkedShopPhotos, setLinkedShopPhotos] = useState<PortfolioPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const hydrate = async () => {
      setIsLoading(true);

      if (shopId === 'shop-demo') {
        if (!isCancelled) {
          setLinkedShopPhotos(DEMO_PORTFOLIO_PHOTOS);
          setIsLoading(false);
        }
        return;
      }

      if (shopId) {
        const photos = await fetchPortfolioPhotos(shopId);
        if (!isCancelled) {
          setLinkedShopPhotos(photos);
          setIsLoading(false);
        }
        return;
      }

      await hydrateFromDB();
      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    void hydrate();

    return () => {
      isCancelled = true;
    };
  }, [hydrateFromDB, shopId]);

  const photos = useMemo(
    () => (shopId ? linkedShopPhotos : storedPhotos),
    [linkedShopPhotos, shopId, storedPhotos],
  );

  useEffect(() => {
    if (photos.length === 0) {
      setActivePhotoId(null);
      return;
    }

    if (!activePhotoId || !photos.some((photo) => photo.id === activePhotoId)) {
      setActivePhotoId(photos[0].id);
    }
  }, [activePhotoId, photos]);

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border border-border bg-surface p-5 text-center', className)}>
        <p className="text-sm font-semibold text-text">
          {t('consultation.portfolioLoading')}
          {locale !== 'ko' && (
            <span className="ml-1 text-xs text-text-muted opacity-60">{tKo('consultation.portfolioLoading')}</span>
          )}
        </p>
      </div>
    );
  }

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

  const displayPhotos = isExpanded ? photos : photos.slice(0, 6);
  const activePhoto = photos.find((photo) => photo.id === activePhotoId) ?? photos[0];
  const activePhotoIndex = photos.findIndex((photo) => photo.id === activePhoto.id);
  const activePhotoSrc = getPhotoImageSrc(activePhoto, Math.max(activePhotoIndex, 0));
  const isActiveSelected = selectedUrls.includes(activePhotoSrc);

  return (
    <>
      <div className={cn('flex flex-col gap-3', className)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-text">
              {t('consultation.portfolioTitle')}
              {locale !== 'ko' && (
                <span className="ml-2 text-xs font-medium text-text-muted opacity-60">{tKo('consultation.portfolioTitle')}</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {t('consultation.portfolioDesc')}
              {locale !== 'ko' && (
                <span className="ml-1 text-[10px] opacity-60">{tKo('consultation.portfolioDesc')}</span>
              )}
            </p>
          </div>
          {selectedUrls.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
              {selectedUrls.length}개 선택
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsViewerOpen(true)}
          className="flex min-h-[44px] items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
        >
          <div>
            <p className="text-sm font-bold text-primary">
              {t('consultation.portfolioBrowse')}
              {locale !== 'ko' && (
                <span className="ml-1 text-[10px] font-medium opacity-60">{tKo('consultation.portfolioBrowse')}</span>
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {t('consultation.portfolioBrowseDesc')}
            </p>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="grid grid-cols-3 gap-2">
          {displayPhotos.map((photo, idx) => {
            const imgSrc = getPhotoImageSrc(photo, idx);
            const isSelected = selectedUrls.includes(imgSrc);
            return (
              <motion.button
                key={photo.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onToggleSelect(imgSrc)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200',
                  isSelected ? 'border-primary shadow-sm shadow-primary/20' : 'border-border',
                )}
              >
                <Image
                  src={imgSrc}
                  alt={photo.designType ?? t('consultation.portfolioTitle')}
                  fill
                  unoptimized
                  className="object-cover"
                />
                {isSelected ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-md">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-1.5">
                    <span className="text-[9px] font-bold text-white">
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
            className="min-h-[44px] px-3 text-xs font-bold text-primary transition-colors hover:underline"
          >
            {isExpanded ? '접기' : `+ ${photos.length - 6}개 더 보기`}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isViewerOpen && activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-background"
          >
            <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-bold text-text">{shopName || t('consultation.portfolioTitle')}</p>
                <p className="text-xs text-text-muted">{t('consultation.portfolioBrowseDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsViewerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-alt">
                  <Image
                    src={activePhotoSrc}
                    alt={activePhoto.designType ?? t('consultation.portfolioTitle')}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-text">
                      {activePhoto.designType ?? t('consultation.portfolioTitle')}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {activePhoto.note ?? activePhoto.serviceType ?? t('consultation.portfolioDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleSelect(activePhotoSrc)}
                    className={cn(
                      'min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold transition-colors',
                      isActiveSelected ? 'bg-surface-alt text-text border border-border' : 'bg-primary text-white',
                    )}
                  >
                    {isActiveSelected ? t('consultation.portfolioDeselect') : t('consultation.portfolioSelect')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo, idx) => {
                    const imgSrc = getPhotoImageSrc(photo, idx);
                    const isSelected = selectedUrls.includes(imgSrc);
                    const isActive = activePhotoId === photo.id;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setActivePhotoId(photo.id)}
                        className={cn(
                          'relative aspect-square overflow-hidden rounded-2xl border-2 transition-all',
                          isActive ? 'border-primary' : 'border-border',
                        )}
                      >
                        <Image
                          src={imgSrc}
                          alt={photo.designType ?? t('consultation.portfolioTitle')}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        {isSelected && (
                          <div className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
