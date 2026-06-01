'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import type { SurchargeSettings, CustomPartSetting } from '@/types/shop';
import { ADDON_FIXED_PRICES } from '@/lib/pre-consult-price';
import type { FieldModeAddon } from '@/types/field-mode';

interface AddOnMiniPanelProps {
  addons: FieldModeAddon[];
  surcharges: SurchargeSettings;
  onAdd: (addon: { label: string; amount: number }) => void;
  onRemove: (id: string) => void;
  /** 0531: 설정의 커스텀 파츠(종류·단가) 연동. 있으면 일반 '파츠' 버튼 대신 파츠별 수량 스테퍼로 표시 */
  customParts?: CustomPartSetting[];
  /**
   * 0601: 사전상담에서 이미 선택한 커스텀 파츠 수량 (name → count).
   * baseEstimate에 포함된 수량으로, 파츠 스테퍼 아래에 "사전상담 N개 포함" 보조 라벨로 표시한다.
   * 스테퍼 수량(qty)은 inTreatment 추가분만 카운트하므로 별도 표기해 혼동을 방지한다.
   */
  preSelectedPartCounts?: Record<string, number>;
  /**
   * 0601: baseEstimate에 이미 포함된 표준 추가금의 한국어 라벨 집합 (예: ['랩핑', '연장', '제거']).
   * 해당 라벨의 버튼은 disabled 처리하고 "사전상담 포함" 표기 — 이중청구 방지.
   */
  baseAddOnLabels?: string[];
}

interface QuickAddBtn {
  labelKey: string;
  getAmount: (s: SurchargeSettings) => number;
}

// 0531 회의: 시술 중 추가금(파츠·글리터·포인트아트·연장·랩핑·제거)을 원장이 자유롭게 여러 번 추가.
// 사전상담에서 이미 고른 항목도 "현장에서 더 추가"할 수 있어야 하므로 비활성화하지 않는다(탭마다 1개씩 누적).
// 0601: 파츠·포인트아트 빠른추가 제거 — 파츠는 커스텀 파츠로 대체. 글리터/연장/랩핑/제거만 표준 추가금.
const STANDARD_ADDS: QuickAddBtn[] = [
  { labelKey: 'fieldMode.addGlitter',   getAmount: () => ADDON_FIXED_PRICES.glitter },
  { labelKey: 'fieldMode.addExtension', getAmount: (s) => s.extension },
  { labelKey: 'fieldMode.addWrapping',  getAmount: (s) => s.wrapping ?? ADDON_FIXED_PRICES.wrapping },
  { labelKey: 'fieldMode.addRemoval',   getAmount: (s) => s.selfRemoval },
];

export function AddOnMiniPanel({
  addons,
  surcharges,
  onAdd,
  onRemove,
  customParts,
  preSelectedPartCounts,
  baseAddOnLabels,
}: AddOnMiniPanelProps): React.ReactElement {
  const t = useT();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const hasCustomParts = !!customParts && customParts.length > 0;
  // 파츠는 커스텀 파츠 스테퍼로만 추가 — 표준 추가금(글리터/연장/랩핑/제거)은 항상 노출
  const quickAdds = STANDARD_ADDS;
  // 0601: base에 이미 포함된 표준 추가금 라벨 집합 (비활성화 판정용)
  const baseAddOnLabelSet = new Set<string>(baseAddOnLabels ?? []);

  // 스테퍼로 이미 표시 중인 라벨 집합 — 하단 목록에서 중복 제외하기 위해 빌드
  const stepperLabels = new Set<string>([
    ...(customParts ?? []).map((p) => p.name),
    ...quickAdds.map(({ labelKey, getAmount }) => (getAmount(surcharges) > 0 ? t(labelKey) : '')).filter(Boolean),
  ]);

  const handleCustomSubmit = (): void => {
    const trimmed = customLabel.trim();
    const parsed = parseInt(customAmount.replace(/[^0-9]/g, ''), 10);
    if (!trimmed || isNaN(parsed) || parsed <= 0) return;
    onAdd({ label: trimmed, amount: parsed });
    setCustomLabel('');
    setCustomAmount('');
    setShowCustomForm(false);
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleCustomSubmit();
    if (e.key === 'Escape') setShowCustomForm(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Section title */}
      <p className="text-sm font-bold text-text-secondary uppercase tracking-wide">
        {t('fieldMode.addOnSection')}
      </p>

      {/* Quick-add buttons — 모두 여러 번 탭해 누적 추가 가능 (사전상담 반영분도 현장에서 더 추가 가능) */}
      <div className="flex flex-wrap gap-2">
        {/* 설정 커스텀 파츠 — 파츠별 수량 스테퍼 (탭마다 1개씩 누적) */}
        {hasCustomParts &&
          customParts!.map((part) => {
            const matching = addons.filter((a) => a.label === part.name);
            const qty = matching.length;
            const addOne = (): void => onAdd({ label: part.name, amount: part.pricePerUnit });
            const removeOne = (): void => {
              const last = matching[matching.length - 1];
              if (last) onRemove(last.id);
            };
            // 0601: 사전상담에서 선택한 수량 — baseEstimate에 이미 포함됨
            const preCount = preSelectedPartCounts?.[part.name] ?? 0;
            if (qty === 0) {
              return (
                <div key={part.id} className="flex flex-col items-start gap-0.5">
                  <button
                    type="button"
                    onClick={addOne}
                    className="min-h-[44px] rounded-xl px-3 py-2 bg-surface-alt border border-border text-sm font-medium text-text hover:border-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-150 select-none"
                  >
                    <span className="text-primary font-bold">+ </span>
                    {part.name}{' '}
                    <span className="text-primary font-semibold">₩{part.pricePerUnit.toLocaleString()}</span>
                  </button>
                  {preCount > 0 && (
                    <span className="text-[11px] text-text-muted pl-1">
                      사전상담 {preCount}개 포함
                    </span>
                  )}
                </div>
              );
            }
            return (
              <div key={part.id} className="flex flex-col items-start gap-0.5">
                <div className="min-h-[44px] inline-flex items-center gap-2 rounded-xl pl-3 pr-1 py-1 bg-primary/5 border border-primary/40">
                  <span className="text-sm font-semibold text-text">{part.name}</span>
                  <span className="text-xs text-primary font-medium tabular-nums">₩{part.pricePerUnit.toLocaleString()}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={removeOne}
                      aria-label={`${part.name} 1개 빼기`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-base font-bold leading-none text-text-secondary hover:border-primary active:scale-95 transition-all"
                    >
                      −
                    </button>
                    <span className="min-w-[1.25rem] text-center text-sm font-bold text-primary tabular-nums">{qty}</span>
                    <button
                      type="button"
                      onClick={addOne}
                      aria-label={`${part.name} 1개 추가`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-base font-bold leading-none text-white hover:bg-primary-dark active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
                {preCount > 0 && (
                  <span className="text-[11px] text-text-muted pl-1">
                    사전상담 {preCount}개 포함 · 현장 추가 {qty}개
                  </span>
                )}
              </div>
            );
          })}

        {/* 표준 추가금 — 커스텀 파츠와 동일한 수량 스테퍼 UI (방향 A: store 구조 유지, 표시 단계에서 label 기준 group) */}
        {quickAdds.map(({ labelKey, getAmount }) => {
          const amount = getAmount(surcharges);
          if (amount <= 0) return null;
          const label = t(labelKey);
          // 0601: base에 이미 포함된 표준 추가금 → disabled + "사전상담 포함" 표기 (이중청구 방지)
          const isBaseIncluded = baseAddOnLabelSet.has(label);
          if (isBaseIncluded) {
            return (
              <div key={labelKey} className="flex flex-col items-start gap-0.5">
                <button
                  type="button"
                  disabled
                  className="min-h-[44px] rounded-xl px-3 py-2 bg-surface-alt border border-border text-sm font-medium text-text-muted opacity-60 cursor-not-allowed select-none"
                  aria-label={`${label} — 사전상담 포함`}
                >
                  {label}{' '}
                  <span className="font-semibold">
                    +₩{amount.toLocaleString()}
                  </span>
                </button>
                <span className="text-[11px] text-text-muted pl-1">
                  사전상담 포함
                </span>
              </div>
            );
          }
          // 동일 라벨 항목을 group해 qty 계산
          const matching = addons.filter((a) => a.label === label);
          const qty = matching.length;
          const addOne = (): void => onAdd({ label, amount });
          const removeOne = (): void => {
            const last = matching[matching.length - 1];
            if (last) onRemove(last.id);
          };
          if (qty === 0) {
            return (
              <button
                key={labelKey}
                type="button"
                onClick={addOne}
                className="min-h-[44px] rounded-xl px-3 py-2 bg-surface-alt border border-border text-sm font-medium text-text hover:border-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-150 select-none"
              >
                {label}{' '}
                <span className="text-primary font-semibold">
                  +₩{amount.toLocaleString()}
                </span>
              </button>
            );
          }
          return (
            <div
              key={labelKey}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl pl-3 pr-1 py-1 bg-primary/5 border border-primary/40"
            >
              <span className="text-sm font-semibold text-text">{label}</span>
              <span className="text-xs text-primary font-medium tabular-nums">₩{amount.toLocaleString()}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={removeOne}
                  aria-label={`${label} 1개 빼기`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-base font-bold leading-none text-text-secondary hover:border-primary active:scale-95 transition-all"
                >
                  −
                </button>
                <span className="min-w-[1.25rem] text-center text-sm font-bold text-primary tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={addOne}
                  aria-label={`${label} 1개 추가`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-base font-bold leading-none text-white hover:bg-primary-dark active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        {/* 기타 직접입력 toggle */}
        <button
          type="button"
          onClick={() => setShowCustomForm((v) => !v)}
          className={cn(
            'min-h-[44px] rounded-xl px-3 py-2 border text-sm font-medium transition-all duration-150 active:scale-[0.97] select-none',
            showCustomForm
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-surface-alt border-border text-text hover:border-primary hover:bg-primary/5',
          )}
        >
          {t('fieldMode.addCustom')} ✏️
        </button>
      </div>

      {/* Inline custom form */}
      <AnimatePresence>
        {showCustomForm && (
          <motion.div
            key="custom-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                placeholder={t('fieldMode.customAddonName')}
                className="flex-1 min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                autoFocus
              />
              <input
                type="number"
                inputMode="numeric"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                placeholder={t('fieldMode.customAddonAmount')}
                className="w-28 min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={handleCustomSubmit}
                disabled={!customLabel.trim() || !customAmount}
                className="min-h-[44px] rounded-xl px-4 bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary-dark active:scale-[0.97] transition-all duration-150 select-none whitespace-nowrap"
              >
                추가
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added items list — 스테퍼로 관리되는 항목(커스텀 파츠·표준 추가금)은 위에서 표시되므로 여기선 기타 직접입력만 노출 */}
      <AnimatePresence initial={false}>
        {addons.some((a) => !stepperLabels.has(a.label)) && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-1.5 mt-1"
          >
            {addons.filter((a) => !stepperLabels.has(a.label)).map((addon) => (
              <motion.li
                key={addon.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-surface border border-border"
              >
                <span className="text-sm font-medium text-text truncate mr-2">
                  {addon.label}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    +₩{addon.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(addon.id)}
                    aria-label={`${addon.label} 삭제`}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-error hover:bg-error/10 transition-all duration-150 active:scale-95"
                  >
                    ×
                  </button>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
