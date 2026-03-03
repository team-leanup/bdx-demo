'use client';

import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';
import type { FingerPosition, FingerSelection } from '@/types/canvas';

interface FingerSummaryProps {
  leftSelections: Partial<Record<FingerPosition, FingerSelection>>;
  rightSelections: Partial<Record<FingerPosition, FingerSelection>>;
  activeHand: 'left' | 'right';
  onFingerTap?: (hand: 'left' | 'right', finger: FingerPosition) => void;
  className?: string;
}

const FINGER_ORDER: FingerPosition[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

interface FingerItemProps {
  handLabel: string;
  fingerLabel: string;
  finger: FingerPosition;
  selection?: FingerSelection;
  isActive: boolean;
  onTap?: () => void;
  notSelectedLabel: string;
  partsLabel: string;
  t: (key: string) => string;
}

const TREATMENT_TYPE_I18N: Record<string, string> = {
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

function FingerItem({ handLabel, fingerLabel, finger, selection, isActive, onTap, notSelectedLabel, partsLabel, t }: FingerItemProps) {
  const hasColor = !!selection?.colorCode;
  const partsCount = selection?.parts?.length ?? 0;
  const treatmentType = selection?.note;

  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        'flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all duration-150',
        'text-left',
        isActive && hasColor
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-surface-alt border border-transparent',
      )}
    >
      {/* Iconic Finger Icon Indicator */}
      <div className="relative w-8 h-10 flex-shrink-0">
        {/* Finger body mini */}
        <div className={cn(
          "absolute inset-0 m-auto w-6 h-9 rounded-full border transition-all duration-300",
          hasColor ? "bg-surface border-primary/20" : "bg-surface-alt border-border"
        )} />
        {/* Nail mini */}
        <div
          className={cn(
            "absolute top-0.5 left-1/2 -translate-x-1/2 w-4.5 h-5 rounded-t-full rounded-b-sm border shadow-sm transition-all duration-300",
            hasColor ? "border-white/40" : "border-border bg-surface"
          )}
          style={hasColor ? { backgroundColor: selection.colorCode } : {}}
        >
          {hasColor && (
             <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white/30" />
          )}
        </div>
      </div>

      {/* Finger info */}
      <div className="flex-1 min-w-0">
        <span className="text-xs md:text-sm font-bold text-text-secondary">
          {handLabel} {fingerLabel}
        </span>
        {hasColor ? (
          <div className="flex items-center flex-wrap gap-1 mt-0.5">
            {treatmentType && (
              <span className="text-[9px] md:text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                {(() => {
                  const key = TREATMENT_TYPE_I18N[treatmentType];
                  return key ? t(key) : treatmentType;
                })()}
              </span>
            )}
            {selection?.isPoint && (
              <span className="text-[9px] md:text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">
                {t('canvas.point')}
              </span>
            )}
            {partsCount > 0 && (
              <span className="text-[9px] md:text-xs bg-surface-alt text-text-muted px-1.5 py-0.5 rounded font-bold">
                {partsLabel} {partsCount}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] md:text-xs text-text-muted block mt-0.5">{notSelectedLabel}</span>
        )}
      </div>

      {/* Arrow */}
      <svg
        className="w-3 h-3 text-text-muted/50 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

export function FingerSummary({
  leftSelections,
  rightSelections,
  activeHand,
  onFingerTap,
  className,
}: FingerSummaryProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const FINGER_LABELS: Record<FingerPosition, string> = {
    thumb: t('canvas.thumb'),
    index: t('canvas.index'),
    middle: t('canvas.middle'),
    ring: t('canvas.ring'),
    pinky: t('canvas.pinky'),
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-[11px] font-extrabold text-text-muted uppercase tracking-[0.05em] px-1 mb-1">
        {t('canvas.selectFinger')}
        {locale !== 'ko' && (
          <span className="ml-2 text-[9px] font-medium opacity-60 normal-case tracking-normal">
            {tKo('canvas.selectFinger')}
          </span>
        )}
      </p>

      {/* Left hand */}
      <div className="mb-2">
        <p className="text-[10px] font-bold text-text-muted px-1 mb-1.5 opacity-70">
          {t('canvas.leftHand')}
          {locale !== 'ko' && (
            <span className="ml-1 text-[8px] font-medium opacity-60">{tKo('canvas.leftHand')}</span>
          )}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {FINGER_ORDER.map((finger) => (
            <FingerItem
              key={`left-${finger}`}
              handLabel={t('canvas.leftHand')}
              fingerLabel={FINGER_LABELS[finger]}
              finger={finger}
              selection={leftSelections[finger]}
              isActive={activeHand === 'left'}
              onTap={onFingerTap ? () => onFingerTap('left', finger) : undefined}
              notSelectedLabel={t('canvas.notSelected')}
              partsLabel={t('canvas.partsLabel')}
              t={t}
            />
          ))}
          <div />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50 mx-1 my-1" />

      {/* Right hand */}
      <div>
        <p className="text-[10px] font-bold text-text-muted px-1 mb-1.5 opacity-70">
          {t('canvas.rightHand')}
          {locale !== 'ko' && (
            <span className="ml-1 text-[8px] font-medium opacity-60">{tKo('canvas.rightHand')}</span>
          )}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {FINGER_ORDER.map((finger) => (
            <FingerItem
              key={`right-${finger}`}
              handLabel={t('canvas.rightHand')}
              fingerLabel={FINGER_LABELS[finger]}
              finger={finger}
              selection={rightSelections[finger]}
              isActive={activeHand === 'right'}
              onTap={onFingerTap ? () => onFingerTap('right', finger) : undefined}
              notSelectedLabel={t('canvas.notSelected')}
              partsLabel={t('canvas.partsLabel')}
              t={t}
            />
          ))}
          <div />
        </div>
      </div>
    </div>
  );
}
