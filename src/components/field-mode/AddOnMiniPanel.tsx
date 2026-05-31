'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import type { SurchargeSettings, CustomPartSetting } from '@/types/shop';
import { ADDON_FIXED_PRICES } from '@/lib/pre-consult-price';
import type { FieldModeAddon } from '@/types/field-mode';
import type { AddOnOption } from '@/types/pre-consultation';

interface AddOnMiniPanelProps {
  addons: FieldModeAddon[];
  surcharges: SurchargeSettings;
  onAdd: (addon: { label: string; amount: number }) => void;
  onRemove: (id: string) => void;
  /** 0530 FM-1: 사전상담에서 이미 반영된(=baseEstimate에 포함된) add-on. 중복 청구 방지용으로 퀵버튼 비활성화 */
  carriedAddOns?: AddOnOption[];
  /** 0531: 설정의 커스텀 파츠(종류·단가) 연동. 있으면 하드코딩 퀵버튼 대신 파츠를 수량 선택 가능하게 표시 */
  customParts?: CustomPartSetting[];
}

interface QuickAddBtn {
  labelKey: string;
  getAmount: (s: SurchargeSettings) => number;
  /** 사전상담 addOns와 매칭되는 키 — carriedAddOns에 있으면 이미 반영된 것으로 보고 중복 추가 차단 */
  addOnKey?: AddOnOption;
}

const QUICK_ADDS: QuickAddBtn[] = [
  { labelKey: 'fieldMode.addParts',     getAmount: (s) => s.largeParts,             addOnKey: 'parts' },
  { labelKey: 'fieldMode.addGlitter',   getAmount: () => ADDON_FIXED_PRICES.glitter, addOnKey: 'glitter' },
  { labelKey: 'fieldMode.addPointArt',  getAmount: (s) => s.pointArt,               addOnKey: 'point_art' },
  { labelKey: 'fieldMode.addExtension', getAmount: (s) => s.extension },
];

export function AddOnMiniPanel({
  addons,
  surcharges,
  onAdd,
  onRemove,
  carriedAddOns = [],
  customParts,
}: AddOnMiniPanelProps): React.ReactElement {
  const t = useT();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const hasCustomParts = !!customParts && customParts.length > 0;

  const handleQuickAdd = (labelKey: string, amount: number): void => {
    onAdd({ label: t(labelKey), amount });
  };

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

      {/* Quick-add buttons */}
      <div className="flex flex-wrap gap-2">
        {hasCustomParts ? (
          // 0531: 설정 커스텀 파츠 연동 — 탭하면 1개씩 누적, 수량 스테퍼로 여러 개 선택·가격 계산
          customParts!.map((part) => {
            const matching = addons.filter((a) => a.label === part.name);
            const qty = matching.length;
            const addOne = (): void => onAdd({ label: part.name, amount: part.pricePerUnit });
            const removeOne = (): void => {
              const last = matching[matching.length - 1];
              if (last) onRemove(last.id);
            };
            if (qty === 0) {
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={addOne}
                  className="min-h-[44px] rounded-xl px-3 py-2 bg-surface-alt border border-border text-sm font-medium text-text hover:border-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-150 select-none"
                >
                  <span className="text-primary font-bold">+ </span>
                  {part.name}{' '}
                  <span className="text-primary font-semibold">₩{part.pricePerUnit.toLocaleString()}</span>
                </button>
              );
            }
            return (
              <div
                key={part.id}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl pl-3 pr-1 py-1 bg-primary/5 border border-primary/40"
              >
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
            );
          })
        ) : (
          QUICK_ADDS.map(({ labelKey, getAmount, addOnKey }) => {
            const amount = getAmount(surcharges);
            // FM-1: 사전상담에서 이미 반영된 add-on은 baseEstimate에 포함돼 있으므로 다시 누르면 이중 청구됨 → 비활성화
            const alreadyApplied = addOnKey != null && carriedAddOns.includes(addOnKey);
            if (alreadyApplied) {
              return (
                <span
                  key={labelKey}
                  aria-disabled="true"
                  className="min-h-[44px] inline-flex items-center gap-1 rounded-xl px-3 py-2 bg-primary/5 border border-primary/30 text-sm font-medium text-primary/70 select-none cursor-default"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {t(labelKey)} <span className="text-text-muted">· 사전상담 반영됨</span>
                </span>
              );
            }
            return (
              <button
                key={labelKey}
                type="button"
                onClick={() => handleQuickAdd(labelKey, amount)}
                className="min-h-[44px] rounded-xl px-3 py-2 bg-surface-alt border border-border text-sm font-medium text-text hover:border-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-150 select-none"
              >
                {t(labelKey)}{' '}
                <span className="text-primary font-semibold">
                  +₩{amount.toLocaleString()}
                </span>
              </button>
            );
          })
        )}

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

      {/* Added items list */}
      <AnimatePresence initial={false}>
        {addons.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-1.5 mt-1"
          >
            {addons.map((addon) => (
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
