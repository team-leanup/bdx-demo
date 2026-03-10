import { cn } from '@/lib/cn';

interface FlagIconProps {
  language: 'ko' | 'en' | 'zh' | 'ja';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const FLAG_MAP: Record<FlagIconProps['language'], string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  zh: '🇨🇳',
  ja: '🇯🇵',
};

const LABEL_MAP: Record<FlagIconProps['language'], string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

const SIZE_CLASSES: Record<NonNullable<FlagIconProps['size']>, string> = {
  sm: 'text-base gap-1 text-xs',
  md: 'text-xl gap-1.5 text-sm',
};

export function FlagIcon({
  language,
  size = 'sm',
  showLabel = false,
  className,
}: FlagIconProps): React.ReactElement {
  return (
    <span className={cn('inline-flex items-center', SIZE_CLASSES[size], className)}>
      <span>{FLAG_MAP[language]}</span>
      {showLabel && (
        <span className="font-medium text-text-secondary">{LABEL_MAP[language]}</span>
      )}
    </span>
  );
}

export default FlagIcon;
