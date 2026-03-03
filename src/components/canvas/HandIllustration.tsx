'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT, useLocale } from '@/lib/i18n';
import type { FingerPosition, FingerSelection, PartPlacement } from '@/types/canvas';

function extractHexColor(colorCode?: string): string | null {
  if (!colorCode) return null;
  const match = colorCode.match(/#[0-9a-fA-F]{3,6}/);
  return match ? match[0] : null;
}

interface HandIllustrationProps {
  hand: 'left' | 'right';
  selections: Partial<Record<FingerPosition, FingerSelection>>;
  onFingerTap: (finger: FingerPosition) => void;
  className?: string;
}

const FINGER_DEFS: {
  id: FingerPosition;
  nail: { cx: number; cy: number; rx: number; ry: number };
  fingerPath: string;
  hitArea: { x: number; y: number; w: number; h: number };
}[] = [
  {
    id: 'pinky',
    nail: { cx: 45, cy: 90, rx: 14, ry: 13 },
    fingerPath: 'M25 105 C25 80 30 70 45 70 C60 70 65 80 65 105 L65 200 C65 220 60 225 45 225 C30 225 25 220 25 200 Z',
    hitArea: { x: 20, y: 65, w: 50, h: 165 },
  },
  {
    id: 'ring',
    nail: { cx: 100, cy: 60, rx: 17, ry: 16 },
    fingerPath: 'M76 80 C76 45 82 30 100 30 C118 30 124 45 124 80 L124 220 C124 235 118 240 100 240 C82 240 76 235 76 220 Z',
    hitArea: { x: 70, y: 25, w: 58, h: 220 },
  },
  {
    id: 'middle',
    nail: { cx: 160, cy: 45, rx: 18, ry: 17 },
    fingerPath: 'M134 70 C134 30 142 15 160 15 C178 15 186 30 186 70 L186 230 C186 245 178 250 160 250 C142 250 134 245 134 230 Z',
    hitArea: { x: 128, y: 10, w: 64, h: 245 },
  },
  {
    id: 'index',
    nail: { cx: 220, cy: 60, rx: 17, ry: 16 },
    fingerPath: 'M196 80 C196 45 202 30 220 30 C238 30 244 45 244 80 L244 220 C244 235 238 240 220 240 C202 240 196 235 196 220 Z',
    hitArea: { x: 190, y: 25, w: 58, h: 220 },
  },
  {
    id: 'thumb',
    nail: { cx: 280, cy: 110, rx: 20, ry: 18 },
    fingerPath: 'M252 130 C252 100 260 85 280 85 C300 85 308 100 308 130 L308 220 C308 240 300 245 280 245 C260 245 252 240 252 220 Z',
    hitArea: { x: 246, y: 80, w: 66, h: 170 },
  },
];

const FINGER_NAMES: Record<string, Record<FingerPosition, string>> = {
  ko: { pinky: '소지', ring: '약지', middle: '중지', index: '검지', thumb: '엄지' },
};

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

/** Annotation layout positions per hand */
const ANNOTATION_LAYOUT: Record<'left' | 'right', {
  leftTop: FingerPosition;
  leftBottom: FingerPosition;
  rightTop: FingerPosition;
  rightBottom: FingerPosition;
}> = {
  left: { leftTop: 'pinky', leftBottom: 'ring', rightTop: 'index', rightBottom: 'thumb' },
  right: { leftTop: 'thumb', leftBottom: 'index', rightTop: 'ring', rightBottom: 'pinky' },
};

/** Summarize parts: group by customPartId (name) and count */
function summarizeParts(parts: PartPlacement[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of parts) {
    const name = p.customPartId || p.partType;
    map.set(name, (map.get(name) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}

function AnnotationCard({ fingerName, fingerNameKo, selection, locale, t }: {
  fingerName: string;
  fingerNameKo?: string;
  selection?: FingerSelection;
  locale?: string;
  t: (key: string) => string;
}) {
  const hexColor = extractHexColor(selection?.colorCode);
  const partsSummary = selection?.parts ? summarizeParts(selection.parts) : [];
  const totalParts = selection?.parts?.length || 0;
  const showKo = locale && locale !== 'ko';

  return (
    <div className="bg-surface border-2 border-primary/20 rounded-2xl px-3 py-2.5 shadow-md">
      {/* Finger name + color dot */}
      <div className="flex items-center gap-1.5">
        {hexColor && (
          <span
            className="inline-block w-3 h-3 rounded-full border border-white flex-shrink-0"
            style={{ backgroundColor: hexColor, boxShadow: `0 0 4px ${hexColor}66` }}
          />
        )}
        <p className="text-[11px] font-bold text-text-muted">
          {fingerName}
          {showKo && fingerNameKo && (
            <span className="ml-0.5 opacity-60">{fingerNameKo}</span>
          )}
        </p>
      </div>
      {/* Art type (note) */}
      {selection?.note && (
        <p className="text-sm font-extrabold text-primary leading-snug break-words">
          {TREATMENT_TYPE_I18N[selection.note] ? t(TREATMENT_TYPE_I18N[selection.note]) : selection.note}
        </p>
      )}
      {/* Color memo (colorCode text) */}
      {selection?.colorCode && !hexColor && (
        <p className="text-[10px] text-text-secondary leading-snug">{selection.colorCode}</p>
      )}
      {/* Treatment memo */}
      {selection?.memo && (
        <p className="text-xs text-text-muted mt-0.5 leading-snug break-words">{selection.memo}</p>
      )}
      {/* Parts summary */}
      {totalParts > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {partsSummary.map((p) => (
            <span key={p.name} className="inline-flex items-center gap-0.5 bg-accent/10 text-accent rounded-full px-1.5 py-0.5 text-[9px] font-bold">
              {p.name}{p.count > 1 && <span>×{p.count}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function HandIllustration({
  hand,
  selections,
  onFingerTap,
  className,
}: HandIllustrationProps) {
  const isLeft = hand === 'left';
  const t = useT();
  const locale = useLocale();

  const FINGER_LABELS: Record<FingerPosition, string> = {
    thumb: t('canvas.thumb'),
    index: t('canvas.index'),
    middle: t('canvas.middle'),
    ring: t('canvas.ring'),
    pinky: t('canvas.pinky'),
  };

  const layout = ANNOTATION_LAYOUT[hand];

  const hasFinger = (fid: FingerPosition) => {
    const s = selections[fid];
    return s?.note || s?.memo || s?.colorCode || (s?.parts && s.parts.length > 0);
  };

  const hasAnyLabel = (['pinky', 'ring', 'middle', 'index', 'thumb'] as FingerPosition[]).some(hasFinger);

  const middleSel = selections.middle;
  const middleHasLabel = hasFinger('middle');

  const renderCard = (fid: FingerPosition) => {
    const sel = selections[fid];
    if (!hasFinger(fid)) return null;
    return (
      <AnnotationCard
        fingerName={FINGER_LABELS[fid]}
        fingerNameKo={FINGER_NAMES.ko[fid]}
        selection={sel}
        locale={locale}
        t={t}
      />
    );
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* ── Middle finger label (top center — longest finger) ── */}
      {hasAnyLabel && middleHasLabel && (
        <div className="flex justify-center">
          <div className="max-w-[200px] md:max-w-[260px]">
            <AnnotationCard
              fingerName={FINGER_LABELS.middle}
              fingerNameKo={FINGER_NAMES.ko.middle}
              selection={middleSel}
              locale={locale}
              t={t}
            />
          </div>
        </div>
      )}

      {/* ── Main area: left labels | hand SVG | right labels ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 md:gap-3 items-center">
        {/* Left labels */}
        <div className="flex flex-col gap-2 justify-center items-end">
          {hasAnyLabel && (
            <>
              {renderCard(layout.leftTop)}
              {renderCard(layout.leftBottom)}
            </>
          )}
        </div>

        {/* Hand SVG (smaller) */}
        <div className="w-[160px] md:w-[240px] overflow-hidden">
          <svg
            viewBox="0 0 320 260"
            className="w-full"
            style={{ transform: !isLeft ? 'scaleX(-1)' : 'none' }}
            aria-label={isLeft ? t('canvas.leftHand') : t('canvas.rightHand')}
          >
            <defs>
              <filter id="finger-shadow-lg" x="-20%" y="-10%" width="140%" height="130%">
                <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.1)" />
              </filter>
              <linearGradient id="finger-gradient-v2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-surface)" />
                <stop offset="100%" stopColor="var(--color-surface-alt)" />
              </linearGradient>
            </defs>

            {/* Connection Arc */}
            <path
              d="M30 240 Q160 270 290 240"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="5 10"
              opacity="0.25"
            />

            {FINGER_DEFS.map((f) => {
              const sel = selections[f.id];
              const hasSelection = !!sel?.colorCode;
              const hexColor = extractHexColor(sel?.colorCode);
              const nailColor = hexColor || (hasSelection ? 'var(--color-primary)' : 'var(--color-surface)');

              return (
                <g key={f.id} className="group/finger">
                  {/* Finger Body */}
                  <path
                    d={f.fingerPath}
                    fill="url(#finger-gradient-v2)"
                    stroke="var(--color-border)"
                    strokeWidth="2.5"
                    filter="url(#finger-shadow-lg)"
                    className="transition-all duration-300 group-hover/finger:stroke-primary/40 group-hover/finger:fill-white"
                  />
                  {/* Joint */}
                  <path
                    d={`M${f.nail.cx - f.nail.rx * 0.7} ${f.nail.cy + f.nail.ry + 30} Q${f.nail.cx} ${f.nail.cy + f.nail.ry + 28} ${f.nail.cx + f.nail.rx * 0.7} ${f.nail.cy + f.nail.ry + 30}`}
                    fill="none" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" opacity="0.5"
                  />
                  {/* Nail */}
                  <ellipse
                    cx={f.nail.cx} cy={f.nail.cy} rx={f.nail.rx} ry={f.nail.ry}
                    fill={nailColor}
                    stroke={hasSelection ? 'white' : 'var(--color-border)'}
                    strokeWidth={hasSelection ? '2.5' : '2'}
                    className="transition-all duration-300"
                    style={{ filter: hasSelection ? `drop-shadow(0 0 8px ${nailColor}77)` : 'none' }}
                  />
                  {/* Shine */}
                  <ellipse
                    cx={f.nail.cx - f.nail.rx * 0.35} cy={f.nail.cy - f.nail.ry * 0.35}
                    rx={f.nail.rx * 0.35} ry={f.nail.ry * 0.35}
                    fill="white" opacity={hasSelection ? 0.45 : 0.65} className="pointer-events-none"
                  />
                  {/* Parts Badge */}
                  {sel?.parts && sel.parts.length > 0 && (
                    <g>
                      <rect
                        x={f.nail.cx + f.nail.rx - 6} y={f.nail.cy - f.nail.ry - 10}
                        width={22} height={22} rx={11}
                        fill="var(--color-accent)" filter="url(#finger-shadow-lg)"
                      />
                      <text
                        x={f.nail.cx + f.nail.rx + 5} y={f.nail.cy - f.nail.ry + 6}
                        textAnchor="middle" fontSize="14" fontWeight="900" fill="white"
                        className="pointer-events-none"
                        style={{
                          transform: !isLeft ? 'scaleX(-1)' : 'none',
                          transformOrigin: `${f.nail.cx + f.nail.rx + 5}px ${f.nail.cy - f.nail.ry + 6}px`,
                        }}
                      >
                        {sel.parts.length}
                      </text>
                    </g>
                  )}
                  {/* Hit Area */}
                  <motion.rect
                    x={f.hitArea.x} y={f.hitArea.y} width={f.hitArea.w} height={f.hitArea.h}
                    fill="transparent" className="cursor-pointer"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onFingerTap(f.id)}
                    role="button"
                    aria-label={`${isLeft ? t('canvas.leftHand') : t('canvas.rightHand')} ${FINGER_LABELS[f.id]}`}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFingerTap(f.id); }}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right labels */}
        <div className="flex flex-col gap-2 justify-center items-start">
          {hasAnyLabel && (
            <>
              {renderCard(layout.rightTop)}
              {renderCard(layout.rightBottom)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
