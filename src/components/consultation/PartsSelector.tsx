'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { usePartsStore } from '@/store/parts-store';
import { useLocaleStore } from '@/store/locale-store';
import { Counter } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface PartsSelectorProps {
  className?: string;
}

interface CustomPartEntry {
  id: string;
  name: string;
  quantity: number;
  customPartId?: string; // links to parts store for price lookup
}

// Map preset part IDs to i18n keys for bilingual display
const PARTS_I18N_MAP: Record<string, string> = {
  'preset-cubic': 'selector.partsCubic',
  'preset-swarovski': 'selector.partsSwarovski',
  'preset-pearl': 'selector.partsPearl',
  'preset-glitter': 'selector.partsGlitter',
  'preset-shell': 'selector.partsShell',
  'preset-foil': 'selector.partsFoil',
  'preset-sticker': 'selector.partsSticker',
  'preset-charm': 'selector.partsCharm',
};

export function PartsSelector({ className }: PartsSelectorProps) {
  const t = useT();
  const ko = useKo();
  const locale = useLocale();
  const isKo = locale === 'ko';
  const currentLocale = useLocaleStore((s) => s.locale);
  const localeMap: Record<string, string> = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
  const _hasParts = useConsultationStore((s) => s.consultation.hasParts);
  const setHasParts = useConsultationStore((s) => s.setHasParts);

  const quickPartsChips = usePartsStore((s) => s.customParts);

  const [textInput, setTextInput] = useState('');
  const [customEntries, setCustomEntries] = useState<CustomPartEntry[]>([]);

  // ── Custom text-based parts ──
  const addCustomEntry = (name: string, customPartId?: string) => {
    if (!name.trim()) return;
    setHasParts(true);
    const existing = customEntries.find(
      (e) => e.name.toLowerCase() === name.trim().toLowerCase(),
    );
    if (existing) {
      setCustomEntries(
        customEntries.map((e) =>
          e.id === existing.id ? { ...e, quantity: e.quantity + 1 } : e,
        ),
      );
    } else {
      setCustomEntries([
        ...customEntries,
        { id: `custom-${Date.now()}`, name: name.trim(), quantity: 1, customPartId },
      ]);
    }
    setTextInput('');
  };

  const updateCustomQuantity = (id: string, qty: number) => {
    const next = qty <= 0
      ? customEntries.filter((e) => e.id !== id)
      : customEntries.map((e) => (e.id === id ? { ...e, quantity: qty } : e));
    setCustomEntries(next);
    if (next.length === 0) setHasParts(false);
  };

  const removeCustomEntry = (id: string) => {
    const next = customEntries.filter((e) => e.id !== id);
    setCustomEntries(next);
    if (next.length === 0) setHasParts(false);
  };

  const totalCustomCount = customEntries.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-xl bg-surface-alt flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} stroke="currentColor" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-text-secondary">{t('selector.addParts')}</p>
            {!isKo && (
              <p className="text-[10px] text-text-muted/60">{ko('selector.addParts')}</p>
            )}
          </div>
        </div>
        {totalCustomCount > 0 && (
          <span className="text-sm font-bold text-primary bg-surface-alt border border-primary px-2.5 py-0.5 rounded-full">
            {t('selector.total').replace('{count}', String(totalCustomCount))}
          </span>
        )}
      </div>

      {/* ── Custom text input ── */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl border-2 border-border bg-surface">
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('selector.partsInput')}</p>
          {!isKo && (
            <p className="text-[10px] text-text-muted/60">{ko('selector.partsInput')}</p>
          )}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCustomEntry(textInput); }}
            placeholder={t('selector.partsInputPlaceholder')}
            className="flex-1 px-3 py-2.5 rounded-2xl border-2 border-border bg-surface-alt text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary transition-all"
          />
          <button
            type="button"
            onClick={() => addCustomEntry(textInput)}
            disabled={!textInput.trim()}
            className="px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0"
          >
            {t('selector.add')}
          </button>
        </div>

        {/* Quick chips — from parts store */}
        <div className="flex flex-wrap gap-1.5">
          {quickPartsChips.map((part) => {
            const i18nKey = PARTS_I18N_MAP[part.id];
            const chipLabel = i18nKey ? t(i18nKey) : part.name;
            const chipLabelKo = i18nKey ? ko(i18nKey) : part.name;
            return (
              <motion.button
                key={part.id}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => addCustomEntry(part.name, part.id)}
                className="px-3 py-1.5 rounded-full border border-border bg-surface-alt text-xs font-semibold text-text hover:border-gray-300 hover:bg-white hover:text-primary transition-all whitespace-nowrap"
              >
                + {chipLabel}
                {!isKo && i18nKey && <span className="ml-0.5 text-[9px] opacity-60">{chipLabelKo}</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Added custom parts */}
        <AnimatePresence>
          {customEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 pt-1"
            >
              <div className="h-px bg-border" />
              {customEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-2 px-3 py-2.5 rounded-2xl border-2 border-primary bg-white md:flex-row md:items-center md:gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3 md:flex-1">
                    {/* Part icon dot */}
                    <div className="w-7 h-7 rounded-xl bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="3" fill="currentColor" className="text-primary" />
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1" className="text-primary" fillOpacity="0" />
                      </svg>
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">
                      {(() => {
                        const key = entry.customPartId ? PARTS_I18N_MAP[entry.customPartId] : undefined;
                        if (key) {
                          return <>{t(key)}{!isKo && <span className="ml-1 text-[10px] text-text-muted opacity-60">{ko(key)}</span>}</>;
                        }
                        return entry.name;
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pl-10 md:pl-0 md:flex-shrink-0">
                    <Counter
                      value={entry.quantity}
                      onChange={(qty) => updateCustomQuantity(entry.id, qty)}
                      min={0}
                      max={20}
                    />
                    <div className="ml-auto flex items-center gap-2">
                      <AnimatePresence>
                        {entry.quantity > 0 && entry.customPartId && (() => {
                          const part = quickPartsChips.find((p) => p.id === entry.customPartId);
                          if (!part) return null;
                          return (
                            <motion.span
                              key="price"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="text-xs font-bold text-primary whitespace-nowrap flex-shrink-0"
                            >
                              +₩{(part.pricePerUnit * entry.quantity).toLocaleString(localeMap[currentLocale] || 'ko-KR')}
                            </motion.span>
                          );
                        })()}
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={() => removeCustomEntry(entry.id)}
                        className="w-7 h-7 rounded-full border border-border bg-surface flex items-center justify-center text-text-muted hover:text-error hover:border-error/30 hover:bg-error/5 transition-all flex-shrink-0"
                        aria-label={t('common.delete')}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Total summary */}
      {totalCustomCount > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-alt border border-border">
          <span className="text-sm text-text-secondary">
            {t('selector.totalParts').replace('{count}', String(totalCustomCount))}
          </span>
          <span className="text-sm font-bold text-primary">
            {t('selector.separateCalc')}
          </span>
        </div>
      )}
    </div>
  );
}
