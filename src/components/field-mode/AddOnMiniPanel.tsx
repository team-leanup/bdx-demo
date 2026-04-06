'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import type { SurchargeSettings } from '@/types/shop';
import { ADDON_FIXED_PRICES } from '@/lib/pre-consult-price';
import type { FieldModeAddon } from '@/types/field-mode';

interface AddOnMiniPanelProps {
  addons: FieldModeAddon[];
  surcharges: SurchargeSettings;
  onAdd: (addon: { label: string; amount: number }) => void;
  onRemove: (id: string) => void;
}

interface QuickAddBtn {
  labelKey: string;
  getAmount: (s: SurchargeSettings) => number;
}

const QUICK_ADDS: QuickAddBtn[] = [
  { labelKey: 'fieldMode.addParts',     getAmount: (s) => s.largeParts },
  { labelKey: 'fieldMode.addGlitter',   getAmount: () => ADDON_FIXED_PRICES.glitter },
  { labelKey: 'fieldMode.addPointArt',  getAmount: (s) => s.pointArt },
  { labelKey: 'fieldMode.addExtension', getAmount: (s) => s.extension },
];

export function AddOnMiniPanel({
  addons,
  surcharges,
  onAdd,
  onRemove,
}: AddOnMiniPanelProps): React.ReactElement {
  const t = useT();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const handleQuickAdd = (labelKey: string, amount: number): void => {
    onAdd({ label: t(labelKey), amount });
  };

  const handleCustomSubmit = (): void => {
    const trimmed = customLabel.trim();
    const parsed = parseInt(customAmount.replace(/[^0-9]/g, ''), 10);
    if (!trimmed || isNaN(parsed) || parsed <= 0) return;
    onAdd({ label: trimmed, amount: parsed });
    setCustomLabel('');
    setCustomAmount('');
    setShowCustomForm(false);
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleCustomSubmit();
    if (e.key === 'Escape') setShowCustomForm(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Section title */}
      <p className="text-sm font-bold text-text-secondary uppercase tracking-wide">
        {t('fieldMode.addOnSection')}
      </p>

      {/* Quick-add buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ADDS.map(({ labelKey, getAmount }) => {
          const amount = getAmount(surcharges);
          return (
            <button
              key={labelKey}
              type="button"
              onClick={() => handleQuickAdd(labelKey, amount)}
              className="min-h-[44px] rounded-xl px-3 py-2 bg-surface-alt border border-border text-sm font-medium text-text hover:border-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-150 select-none"
            >
              {t(labelKey)}{' '}
              <span className="text-primary font-semibold">
                +₩{amount.toLocaleString()}
              </span>
            </button>
          );
        })}

        {/* 기타 직접입력 toggle */}
        <button
          type="button"
          onClick={() => setShowCustomForm((v) => !v)}
          className={cn(
            'min-h-[44px] rounded-xl px-3 py-2 border text-sm font-medium transition-all duration-150 active:scale-[0.97] select-none',
            showCustomForm
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-surface-alt border-border text-text hover:border-primary hover:bg-primary/5',
          )}
        >
          {t('fieldMode.addCustom')} ✏️
        </button>
      </div>

      {/* Inline custom form */}
      <AnimatePresence>
        {showCustomForm && (
          <motion.div
            key="custom-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                placeholder={t('fieldMode.customAddonName')}
                className="flex-1 min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                autoFocus
              />
              <input
                type="number"
                inputMode="numeric"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                placeholder={t('fieldMode.customAddonAmount')}
                className="w-28 min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={handleCustomSubmit}
                disabled={!customLabel.trim() || !customAmount}
                className="min-h-[44px] rounded-xl px-4 bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary-dark active:scale-[0.97] transition-all duration-150 select-none whitespace-nowrap"
              >
                추가
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added items list */}
      <AnimatePresence initial={false}>
        {addons.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-1.5 mt-1"
          >
            {addons.map((addon) => (
              <motion.li
                key={addon.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-surface border border-border"
              >
                <span className="text-sm font-medium text-text truncate mr-2">
                  {addon.label}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    +₩{addon.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(addon.id)}
                    aria-label={`${addon.label} 삭제`}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-error hover:bg-error/10 transition-all duration-150 active:scale-95"
                  >
                    ×
                  </button>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
