'use client';

import { motion } from 'framer-motion';
import { usePartsStore, type DesignPreset } from '@/store/parts-store';
import type { DesignScope } from '@/types/consultation';
import { cn } from '@/lib/cn';
import { useT, useLocale } from '@/lib/i18n';

interface DesignPresetPickerProps {
  onSelect: (preset: DesignPreset) => void;
  selectedId?: string;
}

// Korean labels for shop owner reference (always visible alongside translation)
const EXPRESSION_KO: Record<string, string> = {
  solid: '기본',
  gradient: '그라데이션',
  french: '프렌치',
  magnetic: '마그네틱',
};

const SCOPE_KO: Record<string, string> = {
  solid_tone: '단색톤',
  solid_point: '단색포인트',
  full_art: '풀아트',
  monthly_art: '이달의 아트',
};

export function DesignPresetPicker({ onSelect, selectedId }: DesignPresetPickerProps) {
  const t = useT();
  const locale = useLocale();
  const isKo = locale === 'ko';
  const designPresets = usePartsStore((s) => s.designPresets);
  // Scope badge: Korean for shop owner, translated for customer
  const SCOPE_CONFIG: Record<
    DesignScope,
    { label: string; koLabel: string; icon: string; bg: string; text: string; border: string }
  > = {
    solid_tone: {
      label: t('design.solidTone'),
      koLabel: SCOPE_KO.solid_tone,
      icon: '◼',
      bg: 'bg-surface-alt',
      text: 'text-text-secondary',
      border: 'border-border',
    },
    solid_point: {
      label: t('design.solidPoint'),
      koLabel: SCOPE_KO.solid_point,
      icon: '✦',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    full_art: {
      label: t('design.fullArt'),
      koLabel: SCOPE_KO.full_art,
      icon: '🎨',
      bg: 'bg-pink-50',
      text: 'text-pink-700',
      border: 'border-pink-200',
    },
    monthly_art: {
      label: t('design.monthlyArt'),
      koLabel: SCOPE_KO.monthly_art,
      icon: '✨',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
  };

  if (designPresets.length === 0) {
    return (
      <p className="text-xs text-text-muted py-2">
        {t('selector.noPresets')}
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      {designPresets.map((preset) => {
        const scopeConf = SCOPE_CONFIG[preset.designScope];
        const isSelected = selectedId === preset.id;
        const totalParts =
          preset.defaultParts?.reduce((s, p) => s + p.quantity, 0) ?? 0;

        return (
          <motion.button
            key={preset.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(preset)}
            className={cn(
              'flex-shrink-0 w-36 flex flex-col gap-2 p-3 rounded-2xl border-2 text-left transition-all',
              isSelected
                ? 'ring-2 ring-primary border-primary bg-primary/5'
                : `border-border bg-surface hover:border-primary/40`,
            )}
          >
            {/* Scope badge — Korean for shop owner */}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                  scopeConf.bg,
                  scopeConf.text,
                  scopeConf.border,
                )}
              >
                {scopeConf.icon} {scopeConf.koLabel}
              </span>
            </div>

            {/* Name — translated for customer (big text) */}
            <p className="text-xs font-bold text-text leading-tight line-clamp-2">
              {preset.i18nKey ? t(preset.i18nKey) : preset.name}
            </p>
            {/* Korean name for shop owner (small text) */}
            {!isKo && preset.name && (
              <p className="text-[10px] text-text-muted/70 -mt-1">
                {preset.name}
              </p>
            )}

            {/* Expression — Korean for shop owner */}
            <p className="text-[10px] text-text-muted">
              {preset.expressions
                .map((e) => EXPRESSION_KO[e] ?? e)
                .join(' · ')}
            </p>

            {/* Parts badge — Korean */}
            {preset.hasParts && totalParts > 0 && (
              <span className="self-start px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary border border-primary/20">
                파츠 추가 {totalParts}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
