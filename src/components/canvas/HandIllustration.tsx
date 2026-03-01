'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import type { FingerPosition, FingerSelection } from '@/types/canvas';

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

/**
 * Finger definitions - Increased size and improved alignment
 * ViewBox: 320 x 300 (Slightly larger to accommodate bigger fingers)
 */
const FINGER_DEFS: {
  id: FingerPosition;
  nail: { cx: number; cy: number; rx: number; ry: number };
  fingerPath: string;
  hitArea: { x: number; y: number; w: number; h: number };
}[] = [
  {
    id: 'pinky',
    nail: { cx: 45, cy: 90, rx: 14, ry: 13 },
    // W=40, L=160
    fingerPath: 'M25 105 C25 80 30 70 45 70 C60 70 65 80 65 105 L65 200 C65 220 60 225 45 225 C30 225 25 220 25 200 Z',
    hitArea: { x: 20, y: 65, w: 50, h: 165 },
  },
  {
    id: 'ring',
    nail: { cx: 100, cy: 60, rx: 17, ry: 16 },
    // W=48, L=200
    fingerPath: 'M76 80 C76 45 82 30 100 30 C118 30 124 45 124 80 L124 220 C124 235 118 240 100 240 C82 240 76 235 76 220 Z',
    hitArea: { x: 70, y: 25, w: 58, h: 220 },
  },
  {
    id: 'middle',
    nail: { cx: 160, cy: 45, rx: 18, ry: 17 },
    // W=52, L=220
    fingerPath: 'M134 70 C134 30 142 15 160 15 C178 15 186 30 186 70 L186 230 C186 245 178 250 160 250 C142 250 134 245 134 230 Z',
    hitArea: { x: 128, y: 10, w: 64, h: 245 },
  },
  {
    id: 'index',
    nail: { cx: 220, cy: 60, rx: 17, ry: 16 },
    // W=48, L=200
    fingerPath: 'M196 80 C196 45 202 30 220 30 C238 30 244 45 244 80 L244 220 C244 235 238 240 220 240 C202 240 196 235 196 220 Z',
    hitArea: { x: 190, y: 25, w: 58, h: 220 },
  },
  {
    id: 'thumb',
    nail: { cx: 280, cy: 110, rx: 20, ry: 18 },
    // W=56, L=150
    fingerPath: 'M252 130 C252 100 260 85 280 85 C300 85 308 100 308 130 L308 220 C308 240 300 245 280 245 C260 245 252 240 252 220 Z',
    hitArea: { x: 246, y: 80, w: 66, h: 170 },
  },
];

export function HandIllustration({
  hand,
  selections,
  onFingerTap,
  className,
}: HandIllustrationProps) {
  const isLeft = hand === 'left';
  const t = useT();

  const FINGER_LABELS: Record<FingerPosition, string> = {
    thumb: t('canvas.thumb'),
    index: t('canvas.index'),
    middle: t('canvas.middle'),
    ring: t('canvas.ring'),
    pinky: t('canvas.pinky'),
  };

  return (
    <div className={cn('flex justify-center', className)}>
      <div className="relative w-full max-w-[600px] aspect-[320/280]">
        <svg
          viewBox="0 0 320 280"
          className="w-full h-full overflow-visible"
          style={{ transform: !isLeft ? 'scaleX(-1)' : 'none' }}
          aria-label={isLeft ? t('canvas.leftHand') : t('canvas.rightHand')}
        >
          {/* Gradients and Filters */}
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
            d="M30 250 Q160 290 290 250"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="5 10"
            opacity="0.25"
          />

          {/* Fingers */}
          {FINGER_DEFS.map((f) => {
            const sel = selections[f.id];
            const hasSelection = !!sel?.colorCode;
            const hexColor = extractHexColor(sel?.colorCode);
            const nailColor = hexColor || (hasSelection ? 'var(--color-primary)' : 'var(--color-surface)');

            return (
              <g key={f.id} className="group/finger">
                {/* Finger Body - Bigger & Cleaner */}
                <path
                  d={f.fingerPath}
                  fill="url(#finger-gradient-v2)"
                  stroke="var(--color-border)"
                  strokeWidth="2.5"
                  filter="url(#finger-shadow-lg)"
                  className="transition-all duration-300 group-hover/finger:stroke-primary/40 group-hover/finger:fill-white"
                />

                {/* Joint Line */}
                <path
                  d={`M${f.nail.cx - f.nail.rx * 0.7} ${f.nail.cy + f.nail.ry + 30} Q${f.nail.cx} ${f.nail.cy + f.nail.ry + 28} ${f.nail.cx + f.nail.rx * 0.7} ${f.nail.cy + f.nail.ry + 30}`}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.5"
                />

                {/* Nail Plate - Larger area for designs */}
                <ellipse
                  cx={f.nail.cx}
                  cy={f.nail.cy}
                  rx={f.nail.rx}
                  ry={f.nail.ry}
                  fill={nailColor}
                  stroke={hasSelection ? 'white' : 'var(--color-border)'}
                  strokeWidth={hasSelection ? '2.5' : '2'}
                  className="transition-all duration-300"
                  style={{
                    filter: hasSelection ? `drop-shadow(0 0 8px ${nailColor}77)` : 'none'
                  }}
                />

                {/* Nail Shine */}
                <ellipse
                  cx={f.nail.cx - f.nail.rx * 0.35}
                  cy={f.nail.cy - f.nail.ry * 0.35}
                  rx={f.nail.rx * 0.35}
                  ry={f.nail.ry * 0.35}
                  fill="white"
                  opacity={hasSelection ? 0.45 : 0.65}
                  className="pointer-events-none"
                />

                {/* Parts Badge - Re-positioned for the larger nail */}
                {sel?.parts && sel.parts.length > 0 && (
                  <g>
                    <rect
                      x={f.nail.cx + f.nail.rx - 6}
                      y={f.nail.cy - f.nail.ry - 10}
                      width={22}
                      height={22}
                      rx={11}
                      fill="var(--color-accent)"
                      filter="url(#finger-shadow-lg)"
                    />
                    <text
                      x={f.nail.cx + f.nail.rx + 5}
                      y={f.nail.cy - f.nail.ry + 6}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="900"
                      fill="white"
                      className="pointer-events-none"
                      style={{
                        transform: !isLeft ? `scaleX(-1)` : 'none',
                        transformOrigin: `${f.nail.cx + f.nail.rx + 5}px ${f.nail.cy - f.nail.ry + 6}px`
                      }}
                    >
                      {sel.parts.length}
                    </text>
                  </g>
                )}

                {/* Note/Art Label */}
                {sel?.note && (
                  <text
                    x={f.nail.cx}
                    y={f.nail.cy - f.nail.ry - 18}
                    textAnchor="middle"
                    fontSize="15"
                    fontWeight="800"
                    fill="var(--color-primary)"
                    className="pointer-events-none"
                    style={{
                      transform: !isLeft ? `scaleX(-1)` : 'none',
                      transformOrigin: `${f.nail.cx}px ${f.nail.cy - f.nail.ry - 18}px`
                    }}
                  >
                    {sel.note}
                  </text>
                )}

                {/* Memo Label — below note */}
                {sel?.memo && (
                  <text
                    x={f.nail.cx}
                    y={f.nail.cy + f.nail.ry + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="var(--color-text-muted)"
                    className="pointer-events-none"
                    style={{
                      transform: !isLeft ? `scaleX(-1)` : 'none',
                      transformOrigin: `${f.nail.cx}px ${f.nail.cy + f.nail.ry + 20}px`
                    }}
                  >
                    {sel.memo.length > 6 ? sel.memo.slice(0, 6) + '…' : sel.memo}
                  </text>
                )}

                {/* Hit Area */}
                <motion.rect
                  x={f.hitArea.x}
                  y={f.hitArea.y}
                  width={f.hitArea.w}
                  height={f.hitArea.h}
                  fill="transparent"
                  className="cursor-pointer"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onFingerTap(f.id)}
                  role="button"
                  aria-label={`${isLeft ? t('canvas.leftHand') : t('canvas.rightHand')} ${FINGER_LABELS[f.id]}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onFingerTap(f.id);
                  }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
