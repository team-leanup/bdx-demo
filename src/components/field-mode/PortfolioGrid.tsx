'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import type { PortfolioPhoto } from '@/types/portfolio';
import type { DesignCategory } from '@/types/pre-consultation';

interface PortfolioGridProps {
  photos: PortfolioPhoto[];
  onSelectPhoto: (photo: PortfolioPhoto) => void;
  selectedCategory: DesignCategory | null;
}

type SortMode = 'featured' | 'popular';

const CATEGORY_TABS: Array<{ key: DesignCategory | null; labelKey: string }> = [
  { key: null, labelKey: 'fieldMode.categoryAll' },
  { key: 'simple', labelKey: 'fieldMode.categorySimple' },
  { key: 'french', labelKey: 'fieldMode.categoryFrench' },
  { key: 'magnet', labelKey: 'fieldMode.categoryMagnet' },
  { key: 'art', labelKey: 'fieldMode.categoryArt' },
];

export function PortfolioGrid({ photos, onSelectPhoto, selectedCategory }: PortfolioGridProps) {
  const t = useT();
  const [sortMode, setSortMode] = useState<SortMode>('featured');

  const filtered = photos.filter((p) => {
    if (selectedCategory === null) return true;
    return p.styleCategory === selectedCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'featured') {
      const aFeat = a.isFeatured ? 1 : 0;
      const bFeat = b.isFeatured ? 1 : 0;
      return bFeat - aFeat;
    }
    // popular: sort by price descending as proxy
    return (b.price ?? 0) - (a.price ?? 0);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Category chips */}
      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm px-4 pt-2 pb-1 border-b border-border">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {CATEGORY_TABS.map(({ key, labelKey }) => (
            <CategoryChip
              key={String(key)}
              label={t(labelKey)}
              active={selectedCategory === key}
              href={key}
            />
          ))}
        </div>

        {/* Sort toggle */}
        <div className="flex gap-1 mt-2 mb-1">
          <button
            onClick={() => setSortMode('featured')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
              sortMode === 'featured'
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-surface-alt',
            )}
          >
            {t('fieldMode.sortFeatured')}
          </button>
          <button
            onClick={() => setSortMode('popular')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
              sortMode === 'popular'
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-surface-alt',
            )}
          >
            {t('fieldMode.sortPopular')}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-32">
        {sorted.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <div className="columns-2 gap-3">
            {sorted.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                onSelect={onSelectPhoto}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryChip({
  label,
  active,
  href: _href,
}: {
  label: string;
  active: boolean;
  href: DesignCategory | null;
}) {
  return (
    <span
      className={cn(
        'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px] flex items-center cursor-default',
        active
          ? 'bg-primary text-white'
          : 'bg-surface-alt text-text-secondary',
      )}
    >
      {label}
    </span>
  );
}

function PhotoCard({
  photo,
  index,
  onSelect,
}: {
  photo: PortfolioPhoto;
  index: number;
  onSelect: (p: PortfolioPhoto) => void;
}) {
  const displayUrl = photo.imagePath ?? photo.imageDataUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="break-inside-avoid mb-3"
    >
      <button
        onClick={() => onSelect(photo)}
        className="relative w-full rounded-2xl overflow-hidden block active:scale-[0.97] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{ aspectRatio: '3 / 4' }}
        aria-label={`디자인 선택 ${photo.styleCategory ?? ''}`}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={photo.note ?? '포트폴리오 디자인'}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-surface-alt flex items-center justify-center">
            <span className="text-text-muted text-xs">이미지 없음</span>
          </div>
        )}

        {/* Featured badge */}
        {photo.isFeatured && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            추천
          </span>
        )}

        {/* Price badge */}
        {photo.price != null && photo.price > 0 && (
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg font-medium">
            ₩{photo.price.toLocaleString()}~
          </span>
        )}
      </button>
    </motion.div>
  );
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-16 h-16 rounded-2xl bg-surface-alt flex items-center justify-center text-3xl">
        🖼️
      </div>
      <p className="text-base font-semibold text-text">{t('fieldMode.noPhotos')}</p>
      <p className="text-sm text-text-muted text-center max-w-[240px]">{t('fieldMode.noPhotosDesc')}</p>
    </div>
  );
}
