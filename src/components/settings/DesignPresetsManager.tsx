'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePartsStore, type DesignPreset } from '@/store/parts-store';
import { Counter } from '@/components/ui/Counter';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import type { DesignScope, ExpressionType } from '@/types/consultation';

const DESIGN_SCOPE_OPTIONS: { value: DesignScope; label: string; color: string }[] = [
  { value: 'solid_tone', label: '원컬러', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'solid_point', label: '단색+포인트', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'full_art', label: '풀아트', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'monthly_art', label: '이달의 아트', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

const EXPRESSION_OPTIONS: { value: ExpressionType; label: string }[] = [
  { value: 'solid', label: '기본' },
  { value: 'gradient', label: '그라데이션' },
  { value: 'french', label: '프렌치' },
  { value: 'magnetic', label: '마그네틱' },
];


interface PresetFormState {
  name: string;
  description: string;
  designScope: DesignScope;
  expressions: ExpressionType[];
  hasParts: boolean;
  defaultParts: { partId: string; quantity: number }[];
}

const EMPTY_FORM: PresetFormState = {
  name: '',
  description: '',
  designScope: 'solid_tone',
  expressions: ['solid'],
  hasParts: false,
  defaultParts: [],
};

function PresetForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: PresetFormState;
  onSave: (data: PresetFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PresetFormState>(initial);
  const { customParts } = usePartsStore();

  const toggleExpression = (expr: ExpressionType) => {
    setForm((prev) => ({
      ...prev,
      expressions: prev.expressions.includes(expr)
        ? prev.expressions.filter((e) => e !== expr)
        : [...prev.expressions, expr],
    }));
  };

  const getPartQty = (partId: string): number =>
    form.defaultParts.find((p) => p.partId === partId)?.quantity ?? 0;

  const setPartQty = (partId: string, qty: number) => {
    setForm((prev) => {
      if (qty <= 0) {
        return { ...prev, defaultParts: prev.defaultParts.filter((p) => p.partId !== partId) };
      }
      const existing = prev.defaultParts.find((p) => p.partId === partId);
      if (existing) {
        return {
          ...prev,
          defaultParts: prev.defaultParts.map((p) =>
            p.partId === partId ? { ...p, quantity: qty } : p,
          ),
        };
      }
      return { ...prev, defaultParts: [...prev.defaultParts, { partId, quantity: qty }] };
    });
  };

  const canSave = form.name.trim().length > 0 && form.expressions.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">프리셋 이름 *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="예: 봄 플라워 세트"
          className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">설명 (선택)</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="프리셋에 대한 간단한 설명"
          rows={2}
          className="w-full resize-none px-3 py-2.5 rounded-xl border-2 border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Design Scope */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-2">시술 범위</label>
        <div className="grid grid-cols-2 gap-2">
          {DESIGN_SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, designScope: opt.value }))}
              className={cn(
                'px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                form.designScope === opt.value
                  ? `${opt.color} border-current`
                  : 'border-border bg-surface text-text-secondary hover:border-border-focus',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expressions */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-2">표현 기법</label>
        <div className="flex flex-wrap gap-2">
          {EXPRESSION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleExpression(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                form.expressions.includes(opt.value)
                  ? 'bg-primary text-white border-primary'
                  : 'border-border bg-surface text-text-secondary hover:border-primary/40',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Has Parts Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary">파츠 포함</span>
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, hasParts: !p.hasParts, defaultParts: p.hasParts ? [] : p.defaultParts }))}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            form.hasParts ? 'bg-primary' : 'bg-border',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
              form.hasParts ? 'translate-x-5' : '',
            )}
          />
        </button>
      </div>

      {/* Parts selection */}
      <AnimatePresence>
        {form.hasParts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pt-1">
              <label className="block text-xs font-semibold text-text-secondary">기본 파츠 설정</label>
              {customParts.map((part) => {
                const qty = getPartQty(part.id);
                return (
                  <div key={part.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface border border-border/60">
                    <div>
                      <span className="text-sm font-medium text-text">{part.name}</span>
                      <span className="text-xs text-text-muted ml-2">{formatPrice(part.pricePerUnit)}/개</span>
                    </div>
                    <Counter
                      value={qty}
                      onChange={(v) => setPartQty(part.id, v)}
                      min={0}
                      max={10}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => canSave && onSave(form)}
          disabled={!canSave}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          저장
        </button>
      </div>
    </div>
  );
}

export function DesignPresetsManager() {
  const { designPresets, addDesignPreset, updateDesignPreset, removeDesignPreset } =
    usePartsStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = (data: PresetFormState) => {
    addDesignPreset({
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      designScope: data.designScope,
      expressions: data.expressions,
      hasParts: data.hasParts,
      defaultParts: data.hasParts ? data.defaultParts : undefined,
    });
    setShowAddForm(false);
  };

  const handleUpdate = (id: string, data: PresetFormState) => {
    updateDesignPreset(id, {
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      designScope: data.designScope,
      expressions: data.expressions,
      hasParts: data.hasParts,
      defaultParts: data.hasParts ? data.defaultParts : undefined,
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      removeDesignPreset(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const scopeLabel = (scope: DesignScope) =>
    DESIGN_SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope;
  const scopeColor = (scope: DesignScope) =>
    DESIGN_SCOPE_OPTIONS.find((o) => o.value === scope)?.color ?? '';
  const exprLabel = (expr: ExpressionType) =>
    EXPRESSION_OPTIONS.find((o) => o.value === expr)?.label ?? expr;

  const presetToForm = (preset: DesignPreset): PresetFormState => ({
    name: preset.name,
    description: preset.description ?? '',
    designScope: preset.designScope,
    expressions: preset.expressions,
    hasParts: preset.hasParts,
    defaultParts: preset.defaultParts ?? [],
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Preset list */}
      <AnimatePresence mode="popLayout">
        {designPresets.map((preset) => (
          <motion.div
            key={preset.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {editingId === preset.id ? (
              <PresetForm
                initial={presetToForm(preset)}
                onSave={(data) => handleUpdate(preset.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex flex-col gap-2 p-3 rounded-2xl border border-border/60 bg-surface-alt">
                {/* Header row */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text">{preset.name}</span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                          scopeColor(preset.designScope),
                        )}
                      >
                        {scopeLabel(preset.designScope)}
                      </span>
                    </div>
                    {preset.description && (
                      <p className="text-xs text-text-muted mt-0.5 truncate">{preset.description}</p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {confirmDeleteId === preset.id ? (
                      <>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-text-secondary"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleDelete(preset.id)}
                          className="rounded-lg bg-error/10 border border-error/30 px-2 py-1 text-[11px] font-semibold text-error"
                        >
                          삭제
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(preset.id); setConfirmDeleteId(null); }}
                          className="w-7 h-7 rounded-lg border border-border bg-surface flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 transition-all"
                          aria-label="수정"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M8.5 1.5l2 2L3 11H1v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(preset.id)}
                          className="w-7 h-7 rounded-lg border border-border bg-surface flex items-center justify-center text-text-muted hover:text-error hover:border-error/40 transition-all"
                          aria-label="삭제"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expressions */}
                <div className="flex flex-wrap gap-1">
                  {preset.expressions.map((expr) => (
                    <span
                      key={expr}
                      className="px-2 py-0.5 rounded-full bg-surface border border-border text-[10px] font-medium text-text-secondary"
                    >
                      {exprLabel(expr)}
                    </span>
                  ))}
                  {preset.hasParts && preset.defaultParts && preset.defaultParts.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary">
                      파츠 {preset.defaultParts.reduce((s, p) => s + p.quantity, 0)}개
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add form or button */}
      <AnimatePresence>
        {showAddForm ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <PresetForm
              initial={EMPTY_FORM}
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </motion.div>
        ) : (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 py-2.5 px-4 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            새 프리셋 추가
          </button>
        )}
      </AnimatePresence>

      {designPresets.length === 0 && !showAddForm && (
        <p className="text-xs text-text-muted text-center py-2">등록된 프리셋이 없습니다</p>
      )}
    </div>
  );
}
