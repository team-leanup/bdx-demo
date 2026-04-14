'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import type { PortfolioPhoto } from '@/types/portfolio';
import type { CategoryPricingSettings } from '@/types/shop';
import { getPortfolioPublicUrl } from '@/lib/db';

interface DesignConfirmSheetProps {
  photo: PortfolioPhoto;
  categoryPricing: CategoryPricingSettings;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DesignConfirmSheet({
  photo,
  categoryPricing,
  onConfirm,
  onCancel,
}: DesignConfirmSheetProps) {
  const t = useT();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [onCancel]);

  const displayUrl = photo.imagePath
    ? (photo.imagePath.startsWith('http') ? photo.imagePath : getPortfolioPublicUrl(photo.imagePath))
    : photo.imageDataUrl;
  const category = photo.styleCategory ?? 'simple';
  const pricing = categoryPricing[category];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Sheet */}
      <motion.div
        key="sheet"
        ref={dialogRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-elevated"
        role="dialog"
        aria-modal="true"
        aria-label={t('fieldMode.designConfirmTitle')}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-6 pb-8 safe-bottom flex flex-col gap-5">
          {/* Design image */}
          <div className="w-full max-h-[50vh] rounded-2xl overflow-hidden bg-surface-alt">
            {displayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl}
                alt={photo.note ?? '선택된 디자인'}
                className="w-full h-full object-cover aspect-[3/4] max-h-[50vh]"
                draggable={false}
              />
            ) : (
              <div className="flex items-center justify-center bg-surface-alt aspect-[3/4] max-h-[50vh]">
                <span className="text-text-muted text-sm">이미지 없음</span>
              </div>
            )}
          </div>

          {/* Title + price/time info */}
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-text">{t('fieldMode.designConfirmTitle')}</h2>
            {pricing && (
              <p className="text-sm text-text-muted font-medium">
                ₩{pricing.price.toLocaleString()} · ~{pricing.time}분
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={onConfirm}
            >
              {t('fieldMode.designConfirmBtn')}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={onCancel}
            >
              {t('fieldMode.designConfirmCancel')}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
