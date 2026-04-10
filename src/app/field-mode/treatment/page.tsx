'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useFieldModeStore } from '@/store/field-mode-store';
import { useAppStore } from '@/store/app-store';
import { calculatePreConsultPrice } from '@/lib/pre-consult-price';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { TreatmentTimer } from '@/components/field-mode/TreatmentTimer';
import { AddOnMiniPanel } from '@/components/field-mode/AddOnMiniPanel';
import { CATEGORY_LABELS } from '@/lib/labels';

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TreatmentPage(): React.ReactElement {
  const t = useT();
  const router = useRouter();
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const {
    selectedCategory,
    selectedPhotoUrl,
    treatmentStartedAt,
    inTreatmentAddons,
    addOns,
    removalType,
    lengthType,
    addInTreatmentAddon,
    removeInTreatmentAddon,
    completeTreatment,
  } = useFieldModeStore();

  const { shopSettings } = useAppStore();

  // Redirect guard — no category means session is gone
  useEffect(() => {
    if (!selectedCategory) {
      router.replace('/field-mode');
    }
  }, [selectedCategory, router]);

  // Wake Lock — keep screen on during treatment
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async (): Promise<void> => {
      try {
        wakeLock = await navigator.wakeLock?.request('screen');
      } catch {
        // Silently ignore — not critical
      }
    };
    requestWakeLock();
    return () => {
      wakeLock?.release();
    };
  }, []);

  // Base price estimate (memoized)
  const baseEstimate = useMemo(() => {
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

  // Running total
  const inTreatmentTotal = inTreatmentAddons.reduce((sum, a) => sum + a.amount, 0);
  const currentTotal = (baseEstimate?.minTotal ?? 0) + inTreatmentTotal;

  const handleComplete = (): void => {
    completeTreatment();
    router.push('/field-mode/settlement');
  };

  const handleBackConfirm = (): void => {
    setShowBackConfirm(false);
    router.back();
  };

  if (!selectedCategory) {
    // Render nothing while redirect happens
    return <></>;
  }

  const categoryLabel = CATEGORY_LABELS[selectedCategory];
  const basePrice = shopSettings.categoryPricing[selectedCategory].price;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="flex items-center justify-between px-4 pt-safe-top py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setShowBackConfirm(true)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-alt active:scale-95 transition-all duration-150 flex-shrink-0"
              aria-label={t('fieldMode.back')}
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-base font-bold text-text truncate">
              {t('fieldMode.treatmentInProgress')}
            </span>
          </div>

          {treatmentStartedAt && (
            <TreatmentTimer startedAt={treatmentStartedAt} />
          )}
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4 flex flex-col gap-5 max-w-lg mx-auto">

          {/* Design card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm"
          >
            {selectedPhotoUrl ? (
              <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhotoUrl}
                  alt={categoryLabel}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-surface-alt border border-border flex items-center justify-center text-2xl">
                💅
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted font-medium mb-1">
                {t('fieldMode.designCard')}
              </p>
              <p className="text-lg font-bold text-text leading-tight">
                {categoryLabel}
              </p>
              <p className="text-sm font-semibold text-primary mt-1">
                {basePrice.toLocaleString()}{t('fieldMode.won')}
              </p>
            </div>
          </motion.div>

          {/* Add-on mini panel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.06, ease: 'easeOut' }}
            className="bg-surface border border-border rounded-2xl p-4 shadow-sm"
          >
            <AddOnMiniPanel
              addons={inTreatmentAddons}
              surcharges={shopSettings.surcharges}
              onAdd={addInTreatmentAddon}
              onRemove={removeInTreatmentAddon}
            />
          </motion.div>

        </div>
      </main>

      {/* ── Fixed bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-border pb-safe-bottom">
        <div className="flex items-center justify-between gap-3 px-4 py-3 max-w-lg mx-auto">
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-text-muted font-medium">
              {t('fieldMode.currentTotal')}
            </span>
            <span className="text-2xl font-bold text-text tabular-nums">
              ₩{currentTotal.toLocaleString()}
            </span>
          </div>
          <Button
            size="lg"
            variant="primary"
            onClick={handleComplete}
            className="flex-shrink-0"
          >
            {t('fieldMode.completeTreatment')} →
          </Button>
        </div>
      </div>

      {/* ── Back confirmation dialog ── */}
      <AnimatePresence>
        {showBackConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-backdrop/60 px-4 pb-safe-bottom"
            onClick={() => setShowBackConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface rounded-2xl p-6 mb-4 shadow-elevated"
            >
              <p className="text-base font-bold text-text mb-1">시술을 중단하시겠어요?</p>
              <p className="text-sm text-text-muted mb-5">
                진행 중인 시술 정보가 유지됩니다.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowBackConfirm(false)}
                >
                  계속 진행
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleBackConfirm}
                >
                  중단하기
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
