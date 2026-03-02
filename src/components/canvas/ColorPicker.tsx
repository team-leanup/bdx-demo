'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

type TreatmentType = '원컬러' | '그라데이션' | '프렌치' | '마그네틱' | '포인트아트' | '풀아트' | '연장' | '리페어' | '오버레이' | '젤제거';

const TREATMENT_TYPE_KEYS: Record<TreatmentType, string> = {
  '원컬러': 'canvas.oneColor',
  '그라데이션': 'expression.gradient',
  '프렌치': 'expression.french',
  '마그네틱': 'expression.magnetic',
  '포인트아트': 'expression.pointArt',
  '풀아트': 'expression.fullArt',
  '연장': 'expression.extension',
  '리페어': 'expression.repair',
  '오버레이': 'expression.overlay',
  '젤제거': 'expression.gelRemoval',
};

interface ColorPickerProps {
  selectedColor?: string;
  isPoint: boolean;
  treatmentType: TreatmentType;
  onColorChange: (color: string) => void;
  onPointToggle: (isPoint: boolean) => void;
  onTreatmentTypeChange: (type: TreatmentType) => void;
}

const TREATMENT_OPTIONS: { value: TreatmentType; icon: (sel: boolean) => React.ReactNode }[] = [
  {
    value: '원컬러',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="16" rx="3" fill="currentColor" fillOpacity={sel ? '0.7' : '0.2'} stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    value: '그라데이션',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <defs>
          <linearGradient id="grad-tx" x1="4" y1="14" x2="24" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="currentColor" stopOpacity={sel ? '0.8' : '0.4'} />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect x="4" y="6" width="20" height="16" rx="3" fill="url(#grad-tx)" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    value: '프렌치',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="16" rx="3" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 17 Q14 13 24 17 L24 19 Q14 23 4 19 Z" fill="currentColor" fillOpacity={sel ? '0.7' : '0.3'} />
      </svg>
    ),
  },
  {
    value: '마그네틱',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="16" rx="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 18 Q14 10 21 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity={sel ? '0.9' : '0.4'} />
        <path d="M7 18 Q14 10 21 8" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    value: '포인트아트',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="16" rx="3" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 9 L15 12 L18 12 L15.5 14 L16.5 17 L14 15 L11.5 17 L12.5 14 L10 12 L13 12 Z" fill="currentColor" fillOpacity={sel ? '0.8' : '0.4'} />
      </svg>
    ),
  },
  {
    value: '풀아트',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="16" rx="3" fill="currentColor" fillOpacity={sel ? '0.3' : '0.08'} stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="12" r="2" fill="currentColor" fillOpacity={sel ? '0.7' : '0.3'} />
        <circle cx="17" cy="10" r="1.5" fill="currentColor" fillOpacity={sel ? '0.6' : '0.3'} />
        <circle cx="20" cy="16" r="1.5" fill="currentColor" fillOpacity={sel ? '0.6' : '0.3'} />
        <circle cx="12" cy="18" r="1" fill="currentColor" fillOpacity={sel ? '0.5' : '0.2'} />
      </svg>
    ),
  },
  {
    value: '연장',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="14" width="16" height="10" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 14 Q6 4 14 4 Q22 4 22 14" fill="currentColor" fillOpacity={sel ? '0.4' : '0.15'} stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
        <path d="M14 10 L14 6 M12 8 L14 6 L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: '리페어',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="8" width="16" height="16" rx="3" fill="currentColor" fillOpacity={sel ? '0.2' : '0.08'} stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 16 L13 16 M17 16 L15 16 M14 13 L14 15 M14 19 L14 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: '오버레이',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="8" width="16" height="14" rx="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8" y="6" width="16" height="14" rx="3" fill="currentColor" fillOpacity={sel ? '0.35' : '0.15'} stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    value: '젤제거',
    icon: (sel) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="8" width="16" height="14" rx="3" fill="currentColor" fillOpacity={sel ? '0.15' : '0.06'} stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 12 L18 20 M18 12 L10 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function ColorPicker({
  selectedColor,
  isPoint,
  treatmentType,
  onColorChange,
  onPointToggle,
  onTreatmentTypeChange,
}: ColorPickerProps) {
  const t = useT();
  const locale = useLocale();
  const ko = useKo();
  const [inputValue, setInputValue] = useState(selectedColor ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(selectedColor ?? '');
  }, [selectedColor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onColorChange(value.trim() || '');
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* Treatment type selection — 10 types with icons */}
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('canvas.artType')}</p>
          {locale !== 'ko' && (
            <p className="text-[10px] text-text-muted mt-0.5">{ko('canvas.artType')}</p>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {TREATMENT_OPTIONS.map((type) => {
            const isSelected = treatmentType === type.value;
            return (
              <motion.button
                key={type.value}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => onTreatmentTypeChange(type.value)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-1 rounded-2xl border-2 transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-text-muted hover:border-primary/40',
                )}
              >
                <span className="block">{type.icon(isSelected)}</span>
                <span className="text-[10px] font-bold leading-tight text-center whitespace-nowrap">
                  {t(TREATMENT_TYPE_KEYS[type.value])}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Color memo text input */}
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('canvas.colorMemo')}</p>
          {locale !== 'ko' && (
            <p className="text-[10px] text-text-muted mt-0.5">{ko('canvas.colorMemo')}</p>
          )}
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={t('canvas.colorMemoPlaceholder')}
            className="w-full pl-3 pr-10 py-3 rounded-2xl border-2 border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => { setInputValue(''); onColorChange(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-[11px] text-text-muted">{t('canvas.colorMemoHint')}</p>
      </div>

      <div className="h-px bg-border" />

      {/* Point toggle */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-semibold text-text">{t('canvas.pointArt')}</p>
          {locale !== 'ko' && (
            <p className="text-[10px] text-text-muted">{ko('canvas.pointArt')}</p>
          )}
          <p className="text-xs text-text-muted mt-0.5">{t('canvas.setAsPoint')}</p>
        </div>
        <button
          type="button"
          onClick={() => onPointToggle(!isPoint)}
          className={cn(
            'relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0',
            isPoint ? 'bg-primary' : 'bg-border',
          )}
          aria-label={isPoint ? t('canvas.pointArt') : t('canvas.setAsPoint')}
        >
          <span
            className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300',
              isPoint ? 'left-[26px]' : 'left-0.5',
            )}
          />
        </button>
      </div>

      {/* Selected color summary */}
      {selectedColor && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-alt border border-border">
          <div className="w-9 h-9 rounded-xl border border-border/50 flex-shrink-0 bg-surface flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-text-muted">
              <path d="M9 2.5c-2.5 0-5 1.5-5 4 0 1.5 1 2.5 1 3.5C5 12 7 15.5 9 15.5S13 12 13 10c0-1 1-2 1-3.5 0-2.5-2.5-4-5-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted">{t('canvas.colorMemo')}</p>
            <p className="text-sm font-bold text-text truncate">{selectedColor}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs bg-surface border border-border text-text-secondary px-2 py-0.5 rounded-full font-medium">
              {t(TREATMENT_TYPE_KEYS[treatmentType])}
            </span>
            {isPoint && (
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                {t('canvas.point')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
