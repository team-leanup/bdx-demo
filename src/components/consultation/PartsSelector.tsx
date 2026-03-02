'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { usePartsStore } from '@/store/parts-store';
import { useLocaleStore } from '@/store/locale-store';
import { Counter } from '@/components/ui';
import { PARTS_GRADE_OPTIONS } from '@/data/service-options';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';
import type { PartGrade } from '@/types/canvas';

interface PartsSelectorProps {
  className?: string;
}

interface CustomPartEntry {
  id: string;
  name: string;
  quantity: number;
  customPartId?: string; // links to parts store for price lookup
}

export function PartsSelector({ className }: PartsSelectorProps) {
  const t = useT();
  const ko = useKo();
  const locale = useLocale();
  const isKo = locale === 'ko';
  const currentLocale = useLocaleStore((s) => s.locale);
  const localeMap: Record<string, string> = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
  const hasParts = useConsultationStore((s) => s.consultation.hasParts);
  const partsSelections = useConsultationStore((s) => s.consultation.partsSelections);
  const setHasParts = useConsultationStore((s) => s.setHasParts);
  const setPartsSelections = useConsultationStore((s) => s.setPartsSelections);

  const quickPartsChips = usePartsStore((s) => s.customParts);

  const [textInput, setTextInput] = useState('');
  const [customEntries, setCustomEntries] = useState<CustomPartEntry[]>([]);
  const [showGradeSystem, setShowGradeSystem] = useState(false);

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
    if (next.length === 0 && partsSelections.length === 0) setHasParts(false);
  };

  const removeCustomEntry = (id: string) => {
    const next = customEntries.filter((e) => e.id !== id);
    setCustomEntries(next);
    if (next.length === 0 && partsSelections.length === 0) setHasParts(false);
  };

  // ── Grade-based parts (PRO) ──
  const getCount = (grade: PartGrade): number => {
    return partsSelections.find((s) => s.grade === grade)?.quantity ?? 0;
  };

  const handleCountChange = (grade: PartGrade, count: number) => {
    if (count === 0) {
      const next = partsSelections.filter((s) => s.grade !== grade);
      setPartsSelections(next);
      if (next.length === 0 && customEntries.length === 0) setHasParts(false);
    } else {
      const existing = partsSelections.find((s) => s.grade === grade);
      if (existing) {
        setPartsSelections(partsSelections.map((s) => (s.grade === grade ? { ...s, quantity: count } : s)));
      } else {
        setHasParts(true);
        setPartsSelections([...partsSelections, { grade, quantity: count }]);
      }
    }
  };

  const totalGradePartsPrice = partsSelections.reduce((sum, sel) => {
    const gradeOpt = PARTS_GRADE_OPTIONS.find((g) => g.grade === sel.grade);
    return sum + (gradeOpt?.pricePerUnit ?? 0) * sel.quantity;
  }, 0);

  const totalGradePartsCount = partsSelections.reduce((sum, sel) => sum + sel.quantity, 0);
  const totalCustomCount = customEntries.reduce((sum, e) => sum + e.quantity, 0);
  const totalAllCount = totalGradePartsCount + totalCustomCount;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
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
        {totalAllCount > 0 && (
          <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
            {t('selector.total').replace('{count}', String(totalAllCount))}
            {totalGradePartsPrice > 0 && ` · ${formatPrice(totalGradePartsPrice)}`}
          </span>
        )}
      </div>

      {/* ── 1. Custom text input (primary, above grade system) ── */}
      <div className="flex flex-col gap-3 p-4 rounded-3xl border-2 border-border bg-surface">
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
            className="flex-1 px-3 py-2.5 rounded-2xl border-2 border-border bg-surface-alt text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
          {quickPartsChips.map((part) => (
            <motion.button
              key={part.id}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => addCustomEntry(part.name, part.id)}
              className="px-3 py-1.5 rounded-full border border-border bg-surface-alt text-xs font-semibold text-text hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
            >
              + {part.name}
            </motion.button>
          ))}
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border-2 border-primary/25 bg-primary/5"
                >
                  {/* Part icon dot */}
                  <div className="w-7 h-7 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="3" fill="currentColor" className="text-primary" />
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1" className="text-primary" fillOpacity="0" />
                    </svg>
                  </div>
                  <span className="flex-1 text-sm font-semibold text-text">{entry.name}</span>
                  <Counter
                    value={entry.quantity}
                    onChange={(qty) => updateCustomQuantity(entry.id, qty)}
                    min={0}
                    max={20}
                  />
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
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 2. Grade-based system (PRO, collapsible) ── */}
      <div className="flex flex-col gap-0 rounded-3xl border-2 border-border bg-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGradeSystem((v) => !v)}
          className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-alt transition-colors"
        >
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-bold text-text">{t('selector.gradePartsSystem')}</p>
              {!isKo && (
                <p className="text-[10px] text-text-muted/60">{ko('selector.gradePartsSystem')}</p>
              )}
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full uppercase tracking-wider">
              PRO
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totalGradePartsCount > 0 && (
              <span className="text-xs font-bold text-primary">{t('selector.total').replace('{count}', String(totalGradePartsCount))}</span>
            )}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={cn('text-text-muted transition-transform duration-200', showGradeSystem ? 'rotate-180' : '')}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        <AnimatePresence>
          {showGradeSystem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="h-px bg-border" />
              <div className="flex flex-col gap-3 p-4">
                {PARTS_GRADE_OPTIONS.map((gradeOpt) => {
                  const count = getCount(gradeOpt.grade);
                  return (
                    <div
                      key={gradeOpt.grade}
                      className="flex flex-col gap-2 p-4 rounded-2xl border border-border bg-surface-alt"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs font-bold px-2 py-0.5 rounded-full',
                              gradeOpt.grade === 'S'
                                ? 'bg-yellow-100 text-yellow-700'
                                : gradeOpt.grade === 'A'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-surface-alt text-text-secondary',
                            )}
                          >
                            {gradeOpt.grade}
                          </span>
                          <span className="text-sm font-semibold text-text">{gradeOpt.label}</span>
                        </div>
                        <span className="text-xs text-text-muted">{gradeOpt.description}</span>
                      </div>
                      <p className="text-xs text-text-muted">{gradeOpt.examples.join(' · ')}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Counter
                          value={count}
                          onChange={(v) => handleCountChange(gradeOpt.grade, v)}
                          min={0}
                          max={20}
                        />
                        {count > 0 && (
                          <span className="text-sm font-semibold text-primary">
                            {formatPrice(gradeOpt.pricePerUnit * count)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {totalGradePartsCount > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <span className="text-sm text-text-secondary">
                      {t('selector.gradeParts').replace('{count}', String(totalGradePartsCount))}
                    </span>
                    <span className="text-sm font-bold text-primary">{formatPrice(totalGradePartsPrice)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Total summary */}
      {totalAllCount > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
          <span className="text-sm text-text-secondary">
            {t('selector.totalParts').replace('{count}', String(totalAllCount))}
          </span>
          <span className="text-sm font-bold text-primary">
            {totalGradePartsPrice > 0 ? formatPrice(totalGradePartsPrice) : t('selector.separateCalc')}
          </span>
        </div>
      )}
    </div>
  );
}
