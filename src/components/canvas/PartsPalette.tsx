'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Counter } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { CustomPart } from '@/types/canvas';
import { PARTS_GRADE_OPTIONS, DEFAULT_CUSTOM_PARTS } from '@/data/service-options';
import { usePartsStore } from '@/store/parts-store';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface CustomPartEntry {
  id: string;
  name: string;
  quantity: number;
}

interface PartsPaletteProps {
  customParts?: CustomPart[];
  selectedPartId: string;
  quantity: number;
  onPartChange: (partId: string) => void;
  onQuantityChange: (qty: number) => void;
  // New: custom text-based parts
  customEntries?: CustomPartEntry[];
  onCustomEntriesChange?: (entries: CustomPartEntry[]) => void;
}

export function PartsPalette({
  customParts = DEFAULT_CUSTOM_PARTS,
  selectedPartId,
  quantity,
  onPartChange,
  onQuantityChange,
  customEntries = [],
  onCustomEntriesChange,
}: PartsPaletteProps) {
  const t = useT();
  const locale = useLocale();
  const ko = useKo();
  const quickPartsChips = usePartsStore((s) => s.customParts);
  const [textInput, setTextInput] = useState('');
  const [showGradeSystem, setShowGradeSystem] = useState(false);

  const activeParts = customParts.filter((p) => p.isActive);
  const selectedPart = activeParts.find((p) => p.id === selectedPartId);
  const totalGradePrice = (selectedPart?.pricePerUnit ?? 0) * quantity;

  const addCustomEntry = (name: string) => {
    if (!name.trim()) return;
    const existing = customEntries.find(
      (e) => e.name.toLowerCase() === name.trim().toLowerCase(),
    );
    if (existing) {
      onCustomEntriesChange?.(
        customEntries.map((e) =>
          e.id === existing.id ? { ...e, quantity: e.quantity + 1 } : e,
        ),
      );
    } else {
      onCustomEntriesChange?.([
        ...customEntries,
        { id: `custom-${Date.now()}`, name: name.trim(), quantity: 1 },
      ]);
    }
    setTextInput('');
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      onCustomEntriesChange?.(customEntries.filter((e) => e.id !== id));
    } else {
      onCustomEntriesChange?.(
        customEntries.map((e) => (e.id === id ? { ...e, quantity: qty } : e)),
      );
    }
  };

  const removeEntry = (id: string) => {
    onCustomEntriesChange?.(customEntries.filter((e) => e.id !== id));
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* ── Custom text input (primary) ── */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('selector.partsInput')}</p>
          {locale !== 'ko' && (
            <p className="text-[10px] text-text-muted mt-0.5">{ko('selector.partsInput')}</p>
          )}
        </div>

        {/* Text input row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addCustomEntry(textInput);
            }}
            placeholder={t('selector.partsInputPlaceholder')}
            className="flex-1 px-3 py-2.5 rounded-2xl border-2 border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            type="button"
            onClick={() => addCustomEntry(textInput)}
            disabled={!textInput.trim()}
            className="px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95 transition-all"
          >
            {t('selector.add')}
          </button>
        </div>

        {/* Quick chip presets — from parts store */}
        <div className="flex flex-wrap gap-1.5">
          {quickPartsChips.map((part) => (
            <motion.button
              key={part.id}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => addCustomEntry(part.name)}
              className="px-3 py-1.5 rounded-full border border-border bg-surface-alt text-xs font-semibold text-text hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
            >
              + {part.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Added custom parts list */}
      <AnimatePresence>
        {customEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2"
          >
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              {t('selector.addedParts').replace('{count}', String(customEntries.length))}
            </p>
            <div className="flex flex-col gap-2">
              {customEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-primary/30 bg-primary/5"
                >
                  <span className="flex-1 text-sm font-semibold text-text">{entry.name}</span>
                  <Counter
                    value={entry.quantity}
                    onChange={(qty) => updateQuantity(entry.id, qty)}
                    min={0}
                    max={20}
                  />
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="w-7 h-7 rounded-full border border-border bg-surface flex items-center justify-center text-text-muted hover:text-error hover:border-error/30 hover:bg-error/5 transition-all"
                    aria-label={t('common.delete')}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-px bg-border" />

      {/* ── Grade-based system (PRO, collapsible) ── */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowGradeSystem((v) => !v)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('selector.gradePartsSystem')}</p>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full uppercase tracking-wider">
              PRO
            </span>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={cn('text-text-muted transition-transform duration-200', showGradeSystem ? 'rotate-180' : '')}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <AnimatePresence>
          {showGradeSystem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-3 overflow-hidden"
            >
              {/* Grade preset list */}
              <div className="flex flex-col gap-2">
                {activeParts.map((part) => {
                  const isSelected = selectedPartId === part.id;
                  return (
                    <motion.button
                      key={part.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onPartChange(part.id)}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-200',
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-surface-alt hover:border-primary/40',
                      )}
                    >
                      <span className={cn('text-sm font-semibold', isSelected ? 'text-primary' : 'text-text')}>
                        {part.name}
                      </span>
                      <span className={cn('text-sm font-bold', isSelected ? 'text-primary' : 'text-text-secondary')}>
                        {part.pricePerUnit.toLocaleString()}{t('canvas.currencyUnit')}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Grade tier labels */}
              <div className="flex flex-col gap-2">
                {PARTS_GRADE_OPTIONS.map((gradeOpt) => (
                  <div
                    key={gradeOpt.grade}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-alt border border-border text-xs"
                  >
                    <span
                      className={cn(
                        'font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                        gradeOpt.grade === 'S'
                          ? 'bg-yellow-100 text-yellow-700'
                          : gradeOpt.grade === 'A'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-surface-alt text-text-secondary',
                      )}
                    >
                      {gradeOpt.grade}
                    </span>
                    <span className="text-text-secondary">{gradeOpt.examples.join(' · ')}</span>
                    <span className="ml-auto text-text-muted font-semibold">{gradeOpt.pricePerUnit.toLocaleString()}{t('canvas.currencyUnit')}{t('selector.perUnit')}</span>
                  </div>
                ))}
              </div>

              {/* Quantity counter */}
              {selectedPart && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-alt border border-border">
                  <Counter
                    value={quantity}
                    onChange={onQuantityChange}
                    min={1}
                    max={20}
                    label={t('selector.quantity')}
                  />
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs text-text-muted">{t('selector.partsAmount')}</span>
                    <span className="text-lg font-bold text-primary">
                      {totalGradePrice.toLocaleString()}{t('canvas.currencyUnit')}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {t('selector.priceCalculation')
                        .replace('{price}', `${selectedPart.pricePerUnit.toLocaleString()}${t('canvas.currencyUnit')}`)
                        .replace('{count}', String(quantity))}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
