'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface MoodTag {
  key: string;
  label: string;
  icon: string;
}

const MOOD_TAGS: MoodTag[] = [
  { key: 'simple', label: '심플', icon: '✨' },
  { key: 'glam', label: '화려', icon: '💅' },
  { key: 'kitsch', label: '키치', icon: '🎀' },
  { key: 'wedding', label: '웨딩', icon: '💍' },
  { key: 'glitter', label: '글리터', icon: '✨' },
  { key: 'natural', label: '내추럴', icon: '🌿' },
  { key: 'minimal', label: '미니멀', icon: '⬜' },
  { key: 'cute', label: '귀여운', icon: '🎀' },
  { key: 'chic', label: '시크', icon: '🖤' },
  { key: 'vintage', label: '빈티지', icon: '🍂' },
];

// i18n 키 매핑
const MOOD_I18N: Record<string, { en: string; zh: string; ja: string }> = {
  simple: { en: 'Simple', zh: '简约', ja: 'シンプル' },
  glam: { en: 'Glam', zh: '华丽', ja: 'グラマー' },
  kitsch: { en: 'Kitsch', zh: '奇趣', ja: 'キッチュ' },
  wedding: { en: 'Wedding', zh: '婚礼', ja: 'ウェディング' },
  glitter: { en: 'Glitter', zh: '闪闪', ja: 'グリッター' },
  natural: { en: 'Natural', zh: '自然', ja: 'ナチュラル' },
  minimal: { en: 'Minimal', zh: '简约', ja: 'ミニマル' },
  cute: { en: 'Cute', zh: '可爱', ja: 'キュート' },
  chic: { en: 'Chic', zh: '时髦', ja: 'シック' },
  vintage: { en: 'Vintage', zh: '复古', ja: 'ヴィンテージ' },
};

interface MoodTagSelectorProps {
  selected: string[];
  onToggle: (tag: string) => void;
  className?: string;
}

export function MoodTagSelector({ selected, onToggle, className }: MoodTagSelectorProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const getLabelForLocale = (tag: MoodTag): string => {
    if (locale === 'ko') return tag.label;
    return MOOD_I18N[tag.key]?.[locale as 'en' | 'zh' | 'ja'] ?? tag.label;
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div>
        <p className="text-sm font-bold text-text">
          {t('consultation.moodTitle')}
          {locale !== 'ko' && (
            <span className="ml-2 text-xs font-medium text-text-muted opacity-60">{tKo('consultation.moodTitle')}</span>
          )}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {t('consultation.moodDescription')}
          {locale !== 'ko' && (
            <span className="ml-1 text-[10px] opacity-60">{tKo('consultation.moodDescription')}</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MOOD_TAGS.map((tag) => {
          const isSelected = selected.includes(tag.label);
          return (
            <motion.button
              key={tag.key}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => onToggle(tag.label)}
              className={cn(
                'relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border-2 text-sm font-bold transition-all duration-200',
                isSelected
                  ? 'border-primary bg-white text-primary shadow-sm'
                  : 'border-border bg-surface text-text-secondary hover:border-primary/30',
              )}
            >
              <span className="text-base">{tag.icon}</span>
              <span>{getLabelForLocale(tag)}</span>
              {locale !== 'ko' && isSelected && (
                <span className="text-[9px] opacity-60 ml-0.5">({tag.label})</span>
              )}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-sm"
                >
                  <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs font-bold text-primary">
          {selected.length}개 선택됨
          {locale !== 'ko' && (
            <span className="ml-1 font-normal text-text-muted opacity-60">
              {selected.length} selected
            </span>
          )}
        </p>
      )}
    </div>
  );
}
