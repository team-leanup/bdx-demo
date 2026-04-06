'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { useFieldModeStore } from '@/store/field-mode-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { calculatePreConsultPrice } from '@/lib/pre-consult-price';
import { DesignConfirmSheet } from '@/components/field-mode/DesignConfirmSheet';
import { QuickOptionsPanel } from '@/components/field-mode/QuickOptionsPanel';
import { PriceBar } from '@/components/field-mode/PriceBar';
import type { PortfolioPhoto } from '@/types/portfolio';
import type { DesignCategory } from '@/types/pre-consultation';
import { getPortfolioPublicUrl } from '@/lib/db';

// ── Constants ─────────────────────────────────────────────────────────────────

type SortMode = 'featured' | 'popular';

const CATEGORY_TABS: Array<{ key: DesignCategory | null; labelKey: string }> = [
  { key: null, labelKey: 'fieldMode.categoryAll' },
  { key: 'simple', labelKey: 'fieldMode.categorySimple' },
  { key: 'french', labelKey: 'fieldMode.categoryFrench' },
  { key: 'magnet', labelKey: 'fieldMode.categoryMagnet' },
  { key: 'art', labelKey: 'fieldMode.categoryArt' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FieldModePage() {
  const router = useRouter();
  const t = useT();

  // Category + sort state for the portfolio grid
  const [activeCategory, setActiveCategory] = useState<DesignCategory | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('featured');

  // ── Auth ──────────────────────────────────────────────────────────────────
  const activeDesignerName = useAuthStore((s) => s.activeDesignerName);

  // ── Field mode store ──────────────────────────────────────────────────────
  const phase = useFieldModeStore((s) => s.phase);
  const selectedCategory = useFieldModeStore((s) => s.selectedCategory);
  const selectedPhotoId = useFieldModeStore((s) => s.selectedPhotoId);
  const selectedPhotoUrl = useFieldModeStore((s) => s.selectedPhotoUrl);
  const removalType = useFieldModeStore((s) => s.removalType);
  const lengthType = useFieldModeStore((s) => s.lengthType);
  const extensionLength = useFieldModeStore((s) => s.extensionLength);
  const addOns = useFieldModeStore((s) => s.addOns);
  const selectDesign = useFieldModeStore((s) => s.selectDesign);
  const confirmDesign = useFieldModeStore((s) => s.confirmDesign);
  const setPhase = useFieldModeStore((s) => s.setPhase);
  const setRemovalType = useFieldModeStore((s) => s.setRemovalType);
  const setLengthType = useFieldModeStore((s) => s.setLengthType);
  const setExtensionLength = useFieldModeStore((s) => s.setExtensionLength);
  const toggleAddOn = useFieldModeStore((s) => s.toggleAddOn);
  const startTreatment = useFieldModeStore((s) => s.startTreatment);

  // ── Portfolio ─────────────────────────────────────────────────────────────
  const allPhotos = usePortfolioStore((s) => s.photos);
  const hydrateFromDB = usePortfolioStore((s) => s.hydrateFromDB);

  useEffect(() => {
    hydrateFromDB();
  }, [hydrateFromDB]);

  // phase 가드: 데이터 없이 후속 phase에 멈춰있으면 portfolio로 리셋
  useEffect(() => {
    if (phase !== 'portfolio' && phase !== 'design-confirm' && !selectedCategory) {
      setPhase('portfolio');
    }
  }, [phase, selectedCategory, setPhase]);

  const publicPhotos = useMemo(
    () => allPhotos.filter((p) => p.isPublic !== false),
    [allPhotos],
  );

  // ── Shop settings ─────────────────────────────────────────────────────────
  const { shopSettings } = useAppStore();

  // ── Price estimate ────────────────────────────────────────────────────────
  const estimate = useMemo(() => {
    if (!selectedCategory) return null;
    return calculatePreConsultPrice({
      designCategory: selectedCategory,
      removalPreference: removalType,
      lengthPreference: lengthType,
      addOns,
      categoryPricing: shopSettings.categoryPricing,
      surcharges: shopSettings.surcharges,
    });
  }, [selectedCategory, removalType, lengthType, addOns, shopSettings]);

  // ── Reconstruct selected photo ────────────────────────────────────────────
  const selectedPhoto = useMemo((): PortfolioPhoto | null => {
    if (!selectedPhotoId) return null;
    const found = allPhotos.find((p) => p.id === selectedPhotoId);
    if (found) return found;
    if (!selectedPhotoUrl || !selectedCategory) return null;
    return {
      id: selectedPhotoId,
      shopId: '',
      customerId: '',
      kind: 'treatment',
      createdAt: '',
      imageDataUrl: selectedPhotoUrl,
      styleCategory: selectedCategory,
    };
  }, [selectedPhotoId, selectedPhotoUrl, selectedCategory, allPhotos]);

  // ── Filtered + sorted photos ──────────────────────────────────────────────
  const displayedPhotos = useMemo(() => {
    const filtered = publicPhotos.filter((p) => {
      if (activeCategory === null) return true;
      return p.styleCategory === activeCategory;
    });
    return [...filtered].sort((a, b) => {
      if (sortMode === 'featured') {
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      }
      return (b.price ?? 0) - (a.price ?? 0);
    });
  }, [publicPhotos, activeCategory, sortMode]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSelectPhoto(photo: PortfolioPhoto) {
    const photoUrl = photo.imagePath
      ? (photo.imagePath.startsWith('http') ? photo.imagePath : getPortfolioPublicUrl(photo.imagePath))
      : photo.imageDataUrl;
    selectDesign(
      photo.id,
      photoUrl,
      (photo.styleCategory ?? 'simple') as DesignCategory,
    );
  }

  function handleBack() {
    if (phase === 'portfolio') {
      router.push('/home');
    } else if (phase === 'design-confirm') {
      setPhase('portfolio');
    } else if (phase === 'options') {
      setPhase('design-confirm');
    } else {
      router.push('/home');
    }
  }

  function handleStartTreatment() {
    startTreatment();
    router.push('/field-mode/treatment');
  }

  const phaseLabel =
    phase === 'portfolio' || phase === 'design-confirm'
      ? t('fieldMode.phasePortfolio')
      : t('fieldMode.phaseOptions');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/50 flex-shrink-0">
        <button
          onClick={handleBack}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-surface-alt active:bg-surface-inset transition-colors flex-shrink-0"
          aria-label={t('fieldMode.back')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h1 className="text-lg font-bold text-text">{t('fieldMode.title')}</h1>

        <span className="text-sm text-text-muted">{phaseLabel}</span>

        {activeDesignerName && (
          <span className="ml-auto text-sm text-text-muted whitespace-nowrap">
            {activeDesignerName}
          </span>
        )}
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* STEP 1 + 2: Portfolio Grid */}
          {(phase === 'portfolio' || phase === 'design-confirm') && (
            <motion.div
              key="portfolio-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Category chips + sort bar */}
              <div className="bg-background/95 backdrop-blur-sm px-4 pt-2 pb-1 border-b border-border flex-shrink-0">
                <div className="max-w-2xl mx-auto w-full">
                  <div
                    className="flex gap-2 overflow-x-auto pb-2"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {CATEGORY_TABS.map(({ key, labelKey }) => (
                      <button
                        key={String(key)}
                        onClick={() => setActiveCategory(key)}
                        className={cn(
                          'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          activeCategory === key
                            ? 'bg-primary text-white'
                            : 'bg-surface-alt text-text-secondary hover:bg-surface-inset',
                        )}
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1 mt-2 mb-1">
                    {(['featured', 'popular'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSortMode(mode)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          sortMode === mode
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-secondary hover:bg-surface-alt',
                        )}
                      >
                        {t(
                          mode === 'featured'
                            ? 'fieldMode.sortFeatured'
                            : 'fieldMode.sortPopular',
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photo grid */}
              <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8">
                <div className="max-w-2xl mx-auto w-full">
                {displayedPhotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-surface-alt flex items-center justify-center text-3xl">
                      🖼️
                    </div>
                    <p className="text-base font-semibold text-text">
                      {t('fieldMode.noPhotos')}
                    </p>
                    <p className="text-sm text-text-muted text-center max-w-[240px]">
                      {t('fieldMode.noPhotosDesc')}
                    </p>
                    {allPhotos.length === 0 && (
                      <button
                        type="button"
                        onClick={() => router.push('/portfolio/upload')}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                      >
                        {t('fieldMode.noPhotosUploadBtn')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="columns-2 gap-3">
                    {displayedPhotos.map((photo, index) => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        index={index}
                        onSelect={handleSelectPhoto}
                      />
                    ))}
                  </div>
                )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3 + 4: Options panel */}
          {phase === 'options' && (
            <motion.div
              key="options-view"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto w-full">
                <QuickOptionsPanel
                  removalType={removalType}
                  lengthType={lengthType}
                  extensionLength={extensionLength}
                  addOns={addOns}
                  surcharges={shopSettings.surcharges}
                  onRemovalChange={setRemovalType}
                  onLengthChange={setLengthType}
                  onExtensionChange={setExtensionLength}
                  onToggleAddOn={toggleAddOn}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 2: Design confirm sheet (overlay on portfolio grid) */}
        <AnimatePresence>
          {phase === 'design-confirm' && selectedPhoto && (
            <DesignConfirmSheet
              key="confirm-sheet"
              photo={selectedPhoto}
              categoryPricing={shopSettings.categoryPricing}
              onConfirm={confirmDesign}
              onCancel={() => setPhase('portfolio')}
            />
          )}
        </AnimatePresence>
      </div>

      {/* STEP 4: Price bar (options phase + valid estimate) */}
      <AnimatePresence>
        {phase === 'options' && estimate && (
          <PriceBar
            key="price-bar"
            estimate={estimate}
            designCategory={selectedCategory ?? undefined}
            hasRemoval={removalType !== 'none'}
            hasExtension={lengthType === 'extend'}
            addOnCount={addOns.length}
            onStartTreatment={handleStartTreatment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PhotoCard ─────────────────────────────────────────────────────────────────

function PhotoCard({
  photo,
  index,
  onSelect,
}: {
  photo: PortfolioPhoto;
  index: number;
  onSelect: (p: PortfolioPhoto) => void;
}) {
  const displayUrl = photo.imagePath
    ? (photo.imagePath.startsWith('http') ? photo.imagePath : getPortfolioPublicUrl(photo.imagePath))
    : photo.imageDataUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="break-inside-avoid mb-3"
    >
      <button
        onClick={() => onSelect(photo)}
        className="relative w-full rounded-2xl overflow-hidden block active:scale-[0.97] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{ aspectRatio: '3 / 4' }}
        aria-label={`디자인 선택${photo.styleCategory ? ` — ${photo.styleCategory}` : ''}`}
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

        {photo.isFeatured && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            직원추천
          </span>
        )}

        {photo.price != null && photo.price > 0 && (
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg font-medium">
            ₩{photo.price.toLocaleString()}~
          </span>
        )}
      </button>
    </motion.div>
  );
}
