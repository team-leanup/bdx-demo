'use client';

import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import type { NailShape } from '@/types/consultation';

interface ShapePickerSimpleProps {
  onComplete: () => void;
}

interface ShapeConfig {
  key: NailShape;
  tKey: string;
  svgPath: string;
}

const SHAPES: ShapeConfig[] = [
  {
    key: 'round',
    tKey: 'preConsult.shapeRound',
    svgPath: 'M10,20 C10,20 4,16 4,8 C4,4.7 6.7,2 10,2 C13.3,2 16,4.7 16,8 C16,16 10,20 10,20Z',
  },
  {
    key: 'oval',
    tKey: 'preConsult.shapeOval',
    svgPath: 'M10,20 C10,20 4,17 4,10 C4,5.6 6.7,2 10,2 C13.3,2 16,5.6 16,10 C16,17 10,20 10,20Z',
  },
  {
    key: 'square',
    tKey: 'preConsult.shapeSquare',
    svgPath: 'M4,20 L4,4 C4,2.9 4.9,2 6,2 L14,2 C15.1,2 16,2.9 16,4 L16,20 Z',
  },
  {
    key: 'almond',
    tKey: 'preConsult.shapeAlmond',
    svgPath: 'M10,20 C10,20 4,15 4,8 C4,4.7 6.7,2 10,2 C13.3,2 16,4.7 16,8 C16,15 10,20 10,20Z M10,20 C8,17 6,14 6,8 C6,5.8 7.8,4 10,4 C12.2,4 14,5.8 14,8 C14,14 12,17 10,20Z',
  },
];

export function ShapePickerSimple({ onComplete }: ShapePickerSimpleProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const store = usePreConsultStore();

  const handleSelect = (shape: NailShape): void => {
    store.setNailShape(shape);
    onComplete();
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-base font-bold text-text">
          {t('preConsult.shapeTitle')}
        </h3>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.shapeTitle')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {SHAPES.map((shape) => {
          const isSelected = store.nailShape === shape.key;
          return (
            <motion.button
              key={shape.key}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(shape.key)}
              className={[
                'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface hover:border-primary/40',
              ].join(' ')}
            >
              <svg
                viewBox="0 0 20 22"
                className={`w-8 h-10 ${isSelected ? 'text-primary' : 'text-text-muted'}`}
                fill="currentColor"
              >
                <path d={shape.svgPath} />
              </svg>
              <div className="text-center">
                <p className={`text-xs font-semibold leading-tight ${isSelected ? 'text-primary' : 'text-text'}`}>
                  {t(shape.tKey)}
                </p>
                {locale !== 'ko' && (
                  <p className="text-xs text-text-muted opacity-60 leading-tight mt-0.5">
                    {tKo(shape.tKey)}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
