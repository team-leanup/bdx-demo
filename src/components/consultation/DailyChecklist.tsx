'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useT, useLocale } from '@/lib/i18n';
import type { DailyChecklist as DailyChecklistType, NailShape } from '@/types/consultation';

interface DailyChecklistProps {
  consultationId: string;
  initialData?: DailyChecklistType;
  onSave?: (data: DailyChecklistType) => void;
  onSaveToPreference?: (data: DailyChecklistType) => void;
}

function SelectButton({
  selected,
  onClick,
  children,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-sm md:text-base font-semibold transition-all duration-200',
        selected
          ? 'text-white shadow-sm scale-[1.02]'
          : 'border-2 text-text-secondary hover:border-primary/40 active:scale-95',
      )}
      style={
        selected
          ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
          : { background: 'var(--color-surface)', borderColor: 'var(--color-border)' }
      }
    >
      {icon}
      {children}
    </button>
  );
}

function ChecklistSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-alt p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-bold text-text">{title}</h4>
      </div>
      {children}
    </div>
  );
}

const SHAPE_ICONS: Record<NailShape, string> = {
  round: '⭕',
  oval: '🥚',
  square: '⬜',
  squoval: '🔲',
  almond: '💧',
  stiletto: '📍',
  coffin: '⬛',
};

export function DailyChecklist({
  consultationId: _consultationId,
  initialData,
  onSave,
  onSaveToPreference,
}: DailyChecklistProps) {
  const t = useT();
  const locale = useLocale();

  const [shape, setShape] = useState<NailShape | null>(initialData?.shape ?? null);
  const [length, setLength] = useState<'short' | 'medium' | 'long' | null>(initialData?.length ?? null);
  const [thickness, setThickness] = useState<'thin' | 'medium' | 'thick' | null>(initialData?.thickness ?? null);
  const [cuticleSensitivity, setCuticleSensitivity] = useState<'low' | 'medium' | 'high' | null>(
    initialData?.cuticleSensitivity ?? null,
  );
  const [memo, setMemo] = useState(initialData?.memo ?? '');
  const [savedState, setSavedState] = useState<'idle' | 'saved'>(initialData?.savedAt ? 'saved' : 'idle');

  const SHAPE_OPTIONS: { value: NailShape; i18nKey: string; koLabel: string }[] = [
    { value: 'round', i18nKey: 'checklist.shape_round', koLabel: '라운드' },
    { value: 'oval', i18nKey: 'checklist.shape_oval', koLabel: '오벌' },
    { value: 'square', i18nKey: 'checklist.shape_square', koLabel: '스퀘어' },
    { value: 'squoval', i18nKey: 'checklist.shape_squoval', koLabel: '스퀘오벌' },
    { value: 'almond', i18nKey: 'checklist.shape_almond', koLabel: '아몬드' },
    { value: 'stiletto', i18nKey: 'checklist.shape_stiletto', koLabel: '스틸레토' },
    { value: 'coffin', i18nKey: 'checklist.shape_coffin', koLabel: '코핀' },
  ];

  const LENGTH_OPTIONS: { value: 'short' | 'medium' | 'long'; i18nKey: string; koLabel: string }[] = [
    { value: 'short', i18nKey: 'checklist.length_short', koLabel: '짧게' },
    { value: 'medium', i18nKey: 'checklist.length_medium', koLabel: '보통' },
    { value: 'long', i18nKey: 'checklist.length_long', koLabel: '길게' },
  ];

  const THICKNESS_OPTIONS: { value: 'thin' | 'medium' | 'thick'; i18nKey: string; koLabel: string }[] = [
    { value: 'thin', i18nKey: 'checklist.thickness_thin', koLabel: '얇게' },
    { value: 'medium', i18nKey: 'checklist.thickness_medium', koLabel: '보통' },
    { value: 'thick', i18nKey: 'checklist.thickness_thick', koLabel: '도톰' },
  ];

  const CUTICLE_OPTIONS: { value: 'low' | 'medium' | 'high'; i18nKey: string; koLabel: string }[] = [
    { value: 'low', i18nKey: 'checklist.cuticle_low', koLabel: '낮음' },
    { value: 'medium', i18nKey: 'checklist.cuticle_medium', koLabel: '보통' },
    { value: 'high', i18nKey: 'checklist.cuticle_high', koLabel: '높음' },
  ];

  const handleSave = () => {
    const data: DailyChecklistType = {
      shape,
      length,
      thickness,
      cuticleSensitivity,
      memo,
      savedAt: new Date().toISOString(),
    };
    onSave?.(data);
    setSavedState('saved');
    setTimeout(() => setSavedState('idle'), 2000);
  };

  const handleSaveToPreference = () => {
    const data: DailyChecklistType = {
      shape,
      length,
      thickness,
      cuticleSensitivity,
      memo,
      savedAt: new Date().toISOString(),
    };
    onSaveToPreference?.(data);
  };

  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <h3 className="text-sm font-semibold text-text-secondary">{t('checklist.title')}</h3>

      {/* 쉐입 */}
      <ChecklistSection title={t('checklist.sectionShape')} icon="💅">
        <div className="flex flex-wrap gap-2">
          {SHAPE_OPTIONS.map((opt) => (
            <SelectButton
              key={opt.value}
              selected={shape === opt.value}
              onClick={() => setShape(shape === opt.value ? null : opt.value)}
              icon={<span className="text-base">{SHAPE_ICONS[opt.value]}</span>}
            >
              <span className="flex flex-col items-start leading-tight">
                <span>{t(opt.i18nKey)}</span>
                {locale !== 'ko' && (
                  <span className="text-[10px] opacity-70 font-normal">{opt.koLabel}</span>
                )}
              </span>
            </SelectButton>
          ))}
        </div>
      </ChecklistSection>

      {/* 길이 */}
      <ChecklistSection title={t('checklist.sectionLength')} icon="📏">
        <div className="flex gap-2">
          {LENGTH_OPTIONS.map((opt) => (
            <SelectButton
              key={opt.value}
              selected={length === opt.value}
              onClick={() => setLength(length === opt.value ? null : opt.value)}
            >
              <span className="flex flex-col items-center leading-tight">
                <span>{t(opt.i18nKey)}</span>
                {locale !== 'ko' && (
                  <span className="text-[10px] opacity-70 font-normal">{opt.koLabel}</span>
                )}
              </span>
            </SelectButton>
          ))}
        </div>
      </ChecklistSection>

      {/* 두께감 */}
      <ChecklistSection title={t('checklist.sectionThickness')} icon="🔘">
        <div className="flex gap-2">
          {THICKNESS_OPTIONS.map((opt) => (
            <SelectButton
              key={opt.value}
              selected={thickness === opt.value}
              onClick={() => setThickness(thickness === opt.value ? null : opt.value)}
            >
              <span className="flex flex-col items-center leading-tight">
                <span>{t(opt.i18nKey)}</span>
                {locale !== 'ko' && (
                  <span className="text-[10px] opacity-70 font-normal">{opt.koLabel}</span>
                )}
              </span>
            </SelectButton>
          ))}
        </div>
      </ChecklistSection>

      {/* 큐티클 민감도 */}
      <ChecklistSection title={t('checklist.sectionCuticle')} icon="✋">
        <div className="flex gap-2">
          {CUTICLE_OPTIONS.map((opt) => (
            <SelectButton
              key={opt.value}
              selected={cuticleSensitivity === opt.value}
              onClick={() => setCuticleSensitivity(cuticleSensitivity === opt.value ? null : opt.value)}
            >
              <span className="flex flex-col items-center leading-tight">
                <span>{t(opt.i18nKey)}</span>
                {locale !== 'ko' && (
                  <span className="text-[10px] opacity-70 font-normal">{opt.koLabel}</span>
                )}
              </span>
            </SelectButton>
          ))}
        </div>
      </ChecklistSection>

      {/* 특이사항 메모 */}
      <ChecklistSection title={t('checklist.sectionMemo')} icon="📝">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={t('checklist.memoPh')}
          rows={3}
          className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition-colors focus:border-primary"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        />
      </ChecklistSection>

      {/* 저장 버튼 */}
      <button
        type="button"
        onClick={handleSave}
        disabled={savedState === 'saved'}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-70"
        style={{ background: savedState === 'saved' ? 'var(--color-success)' : 'var(--color-primary)' }}
      >
        {savedState === 'saved' ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {t('checklist.saved')}
          </>
        ) : (
          t('checklist.save')
        )}
      </button>

      {/* 선호 프로필로 저장 링크 */}
      {onSaveToPreference && (
        <button
          type="button"
          onClick={handleSaveToPreference}
          className="text-xs text-text-secondary underline underline-offset-2 hover:text-primary transition-colors"
        >
          {t('checklist.saveToProfile')}
        </button>
      )}
    </div>
  );
}
