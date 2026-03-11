'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import {
  IconShape,
  IconRuler,
  IconLayers,
  IconHands,
  IconHealth,
  IconNote,
} from '@/components/icons';

interface PreferenceData {
  shape: string;
  length: string;
  thickness: string;
  cuticle: string;
  nailCondition: string;
  memo: string;
}

interface PreferenceEditorProps {
  customerId: string;
  preference: PreferenceData;
  onSave: (updated: PreferenceData) => void;
  initialEditMode?: boolean;
  initialEditing?: boolean;
}

function SelectButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        selected ? 'text-white' : 'border text-text-secondary hover:border-primary',
      )}
      style={
        selected
          ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
          : { background: 'var(--color-surface)', borderColor: 'var(--color-border)' }
      }
    >
      {children}
    </button>
  );
}

const SHAPE_OPTIONS = [
  { value: 'round', label: '라운드' },
  { value: 'oval', label: '오벌' },
  { value: 'square', label: '스퀘어' },
  { value: 'squoval', label: '스퀘오벌' },
  { value: 'almond', label: '아몬드' },
  { value: 'stiletto', label: '스틸레토' },
  { value: 'coffin', label: '코핀' },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: '짧게' },
  { value: 'medium', label: '보통' },
  { value: 'long', label: '길게' },
];

const THICKNESS_OPTIONS = [
  { value: 'thin', label: '얇게' },
  { value: 'medium', label: '보통' },
  { value: 'thick', label: '도톰' },
];

const CUTICLE_OPTIONS = [
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '보통' },
  { value: 'high', label: '높음' },
  { value: 'normal', label: '보통' },
  { value: 'sensitive', label: '민감' },
];

const CUTICLE_DISPLAY_LABEL: Record<string, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  normal: '보통',
  sensitive: '민감',
};

// 표시 전용 행
interface DisplayRow {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentVar: string;
  bgVar: string;
}

export function PreferenceEditor({ customerId: _customerId, preference, onSave, initialEditMode = false, initialEditing = false }: PreferenceEditorProps) {
  const [editing, setEditing] = useState(initialEditMode || initialEditing);
  const [draft, setDraft] = useState<PreferenceData>({ ...preference });

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({ ...preference });
    setEditing(false);
  };

  const displayRows: DisplayRow[] = [
    preference.shape && {
      label: '선호 쉐입',
      value: preference.shape,
      Icon: IconShape,
      accentVar: 'var(--color-primary-dark)',
      bgVar: 'var(--color-primary-light)',
    },
    preference.length && {
      label: '선호 길이',
      value: preference.length,
      Icon: IconRuler,
      accentVar: 'var(--color-accent)',
      bgVar: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
    },
    preference.thickness && {
      label: '선호 두께',
      value: preference.thickness,
      Icon: IconLayers,
      accentVar: 'var(--color-primary)',
      bgVar: 'color-mix(in srgb, var(--color-primary) 18%, transparent)',
    },
    preference.cuticle && {
      label: '큐티클 민감도',
      value: CUTICLE_DISPLAY_LABEL[preference.cuticle] ?? preference.cuticle,
      Icon: IconHands,
      accentVar: 'var(--color-primary-dark)',
      bgVar: 'color-mix(in srgb, var(--color-primary-dark) 12%, transparent)',
    },
    preference.nailCondition && {
      label: '손톱 상태',
      value: preference.nailCondition,
      Icon: IconHealth,
      accentVar: 'var(--color-primary)',
      bgVar: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
    },
    preference.memo && {
      label: '메모',
      value: preference.memo,
      Icon: IconNote,
      accentVar: 'var(--color-primary-dark)',
      bgVar: 'color-mix(in srgb, var(--color-primary-dark) 12%, transparent)',
    },
  ].filter(Boolean) as DisplayRow[];

  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">선호도 프로필</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            편집
          </button>
        )}
      </div>

      {/* 표시 모드 */}
      {!editing && (
        <div className="grid grid-cols-2 gap-3">
          {displayRows.length === 0 ? (
            <p className="col-span-2 text-sm text-text-muted">등록된 선호 프로필이 없습니다</p>
          ) : (
            displayRows.map(({ label, value, Icon, accentVar, bgVar }) => (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4',
                  label === '메모' || label === '손톱 상태' ? 'col-span-2' : '',
                )}
                style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}
              >
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: bgVar }}
                >
                  <Icon className="h-6 w-6" style={{ color: accentVar }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-muted leading-tight">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-text leading-tight truncate">{value}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 편집 모드 */}
      {editing && (
        <div className="flex flex-col gap-4">
          {/* 쉐입 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-text-muted">쉐입</p>
            <div className="flex flex-wrap gap-2">
              {SHAPE_OPTIONS.map((opt) => (
                <SelectButton
                  key={opt.value}
                  selected={draft.shape === opt.value}
                  onClick={() => setDraft((d) => ({ ...d, shape: opt.value }))}
                >
                  {opt.label}
                </SelectButton>
              ))}
            </div>
          </div>

          {/* 길이 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-text-muted">길이</p>
            <div className="flex gap-2">
              {LENGTH_OPTIONS.map((opt) => (
                <SelectButton
                  key={opt.value}
                  selected={draft.length === opt.value}
                  onClick={() => setDraft((d) => ({ ...d, length: opt.value }))}
                >
                  {opt.label}
                </SelectButton>
              ))}
            </div>
          </div>

          {/* 두께감 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-text-muted">두께감</p>
            <div className="flex gap-2">
              {THICKNESS_OPTIONS.map((opt) => (
                <SelectButton
                  key={opt.value}
                  selected={draft.thickness === opt.value}
                  onClick={() => setDraft((d) => ({ ...d, thickness: opt.value }))}
                >
                  {opt.label}
                </SelectButton>
              ))}
            </div>
          </div>

          {/* 큐티클 민감도 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-text-muted">큐티클 민감도</p>
            <div className="flex gap-2">
              {CUTICLE_OPTIONS.slice(0, 3).map((opt) => (
                <SelectButton
                  key={opt.value}
                  selected={draft.cuticle === opt.value || (opt.value === 'medium' && draft.cuticle === 'normal')}
                  onClick={() => setDraft((d) => ({ ...d, cuticle: opt.value }))}
                >
                  {opt.label}
                </SelectButton>
              ))}
            </div>
          </div>

          {/* 손톱 상태 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-text-muted">손톱 상태</p>
            <textarea
              value={draft.nailCondition}
              onChange={(e) => setDraft((d) => ({ ...d, nailCondition: e.target.value }))}
              placeholder="손톱 상태를 입력하세요"
              rows={2}
              className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition-colors focus:border-primary"
              style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}
            />
          </div>

          {/* 메모 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-text-muted">메모</p>
            <textarea
              value={draft.memo}
              onChange={(e) => setDraft((d) => ({ ...d, memo: e.target.value }))}
              placeholder="기타 메모를 입력하세요"
              rows={2}
              className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition-colors focus:border-primary"
              style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}
            />
          </div>

          {/* 저장 / 취소 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)' }}
            >
              저장
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-primary hover:text-primary"
              style={{ borderColor: 'var(--color-border)' }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
