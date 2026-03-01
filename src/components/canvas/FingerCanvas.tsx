'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button } from '@/components/ui';
import { HandIllustration } from './HandIllustration';
import { HandSwitcher } from './HandSwitcher';
import { FingerSummary } from './FingerSummary';
import { PartsPalette } from './PartsPalette';
import { ColorPicker } from './ColorPicker';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import type { FingerPosition, FingerSelection, PartType, PartGrade } from '@/types/canvas';

type HandSide = 'left' | 'right';

interface CustomPartEntry {
  id: string;
  name: string;
  quantity: number;
}

// Local state structure for canvas
interface CanvasSelections {
  left: Partial<Record<FingerPosition, FingerSelection>>;
  right: Partial<Record<FingerPosition, FingerSelection>>;
}

type TreatmentType = '원컬러' | '그라데이션' | '프렌치' | '마그네틱' | '포인트아트' | '풀아트' | '연장' | '리페어' | '오버레이' | '젤제거';

interface ModalState {
  isOpen: boolean;
  hand: HandSide;
  finger: FingerPosition | null;
  activeTab: 'parts' | 'color';
  // Draft values
  draftColor: string;
  draftIsPoint: boolean;
  draftTreatmentType: TreatmentType;
  draftPartType: PartType;
  draftGrade: PartGrade;
  draftPartId: string;
  draftQty: number;
  draftCustomEntries: CustomPartEntry[];
  draftMemo: string;
}

interface FingerCanvasProps {
  initialSelections?: CanvasSelections;
  onChange?: (selections: CanvasSelections) => void;
  className?: string;
}

const FINGER_ORDER: FingerPosition[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

// Map treatment type to artType for backward compatibility
function treatmentToArtType(type: TreatmentType): FingerSelection['artType'] {
  switch (type) {
    case '원컬러': return 'solid';
    case '그라데이션': return 'gradient';
    case '프렌치': return 'french';
    case '마그네틱': return 'magnetic';
    case '포인트아트': return 'art';
    case '풀아트': return 'art';
    default: return 'solid';
  }
}

const DEFAULT_MODAL: ModalState = {
  isOpen: false,
  hand: 'right',
  finger: null,
  activeTab: 'color',
  draftColor: '',
  draftIsPoint: false,
  draftTreatmentType: '원컬러',
  draftPartType: 'stone',
  draftGrade: 'A',
  draftPartId: 'basic-stone',
  draftQty: 1,
  draftCustomEntries: [],
  draftMemo: '',
};

export function FingerCanvas({ initialSelections, onChange, className }: FingerCanvasProps) {
  const [activeHand, setActiveHand] = useState<HandSide>('right');
  const [selections, setSelections] = useState<CanvasSelections>(
    initialSelections ?? { left: {}, right: {} },
  );
  const [modal, setModal] = useState<ModalState>(DEFAULT_MODAL);
  const t = useT();

  const currentSel = selections[activeHand];

  const openFingerModal = useCallback(
    (hand: HandSide, finger: FingerPosition) => {
      const existing = selections[hand][finger];
      setModal({
        isOpen: true,
        hand,
        finger,
        activeTab: 'color',
        draftColor: existing?.colorCode ?? '',
        draftIsPoint: existing?.isPoint ?? false,
        draftTreatmentType: (existing?.note as TreatmentType) ?? '원컬러',
        draftPartType: existing?.parts?.[0]?.partType ?? 'stone',
        draftGrade: existing?.parts?.[0]?.grade ?? 'A',
        draftPartId: existing?.parts?.[0]?.customPartId ?? 'basic-stone',
        draftQty: existing?.parts?.length ?? 1,
        draftCustomEntries: [],
        draftMemo: existing?.memo ?? '',
      });
    },
    [selections],
  );

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const applySelection = () => {
    if (!modal.finger) return;

    const newSelection: FingerSelection = {
      finger: modal.finger,
      isPoint: modal.draftIsPoint,
      artType: treatmentToArtType(modal.draftTreatmentType),
      colorCode: modal.draftColor || undefined,
      note: modal.draftTreatmentType,
      memo: modal.draftMemo || undefined,
      parts: [],
    };

    // If custom entries exist, use them; otherwise fall back to grade-based
    if (modal.draftCustomEntries.length > 0) {
      newSelection.parts = modal.draftCustomEntries.flatMap((entry) =>
        Array.from({ length: entry.quantity }, (_, i) => ({
          id: `${modal.hand}-${modal.finger}-${entry.id}-${i}`,
          partType: 'other' as PartType,
          grade: 'A' as PartGrade,
          customPartId: entry.name,
          x: 0.3 + i * 0.1,
          y: 0.5,
        })),
      );
    } else if (modal.draftQty > 0) {
      newSelection.parts = Array.from({ length: modal.draftQty }, (_, i) => ({
        id: `${modal.hand}-${modal.finger}-part-${i}`,
        partType: modal.draftPartType,
        grade: modal.draftGrade,
        x: 0.3 + i * 0.1,
        y: 0.5,
      }));
    }

    const updated: CanvasSelections = {
      ...selections,
      [modal.hand]: {
        ...selections[modal.hand],
        [modal.finger]: newSelection,
      },
    };

    setSelections(updated);
    onChange?.(updated);
    closeModal();
  };

  const clearFinger = (hand: HandSide, finger: FingerPosition) => {
    const updated: CanvasSelections = {
      ...selections,
      [hand]: {
        ...selections[hand],
        [finger]: undefined,
      },
    };
    setSelections(updated);
    onChange?.(updated);
  };

  const applyAllSame = () => {
    const templateFinger = FINGER_ORDER.find((f) => selections[activeHand][f]?.colorCode);
    if (!templateFinger) return;

    const template = selections[activeHand][templateFinger]!;
    const allFingers: Partial<Record<FingerPosition, FingerSelection>> = {};
    FINGER_ORDER.forEach((f) => {
      allFingers[f] = {
        ...template,
        finger: f,
        parts: template.parts.map((p, i) => ({ ...p, id: `${activeHand}-${f}-part-${i}` })),
      };
    });

    const updated: CanvasSelections = {
      ...selections,
      [activeHand]: allFingers,
    };
    setSelections(updated);
    onChange?.(updated);
  };

  const FINGER_LABELS: Record<FingerPosition, string> = {
    thumb: t('canvas.thumb'),
    index: t('canvas.index'),
    middle: t('canvas.middle'),
    ring: t('canvas.ring'),
    pinky: t('canvas.pinky'),
  };

  const fingerLabel = modal.finger
    ? `${modal.hand === 'left' ? t('canvas.leftHand') : t('canvas.rightHand')} ${FINGER_LABELS[modal.finger]}`
    : '';

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Hand switcher */}
      <HandSwitcher
        activeHand={activeHand}
        leftSelections={selections.left}
        rightSelections={selections.right}
        onSwitch={setActiveHand}
      />

      {/* Hand illustration — top, pushed down slightly */}
      <div className="flex flex-col items-center gap-3 md:gap-6 pt-2 md:pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHand}
            initial={{ opacity: 0, x: activeHand === 'right' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeHand === 'right' ? -30 : 30 }}
            transition={{ duration: 0.2 }}
          >
            <HandIllustration
              hand={activeHand}
              selections={currentSel}
              onFingerTap={(finger) => openFingerModal(activeHand, finger)}
            />
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-3 md:gap-4">
          <p className="text-xs md:text-base text-text-muted text-center">
            {t('canvas.tapToSelect')}
          </p>

          {/* Apply all same button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={applyAllSame}
            disabled={!FINGER_ORDER.some((f) => currentSel[f]?.colorCode)}
            className="gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('canvas.applyAll')}
          </Button>
        </div>
      </div>

      {/* Finger summary — below */}
      <div className="rounded-2xl border border-border bg-surface p-3">
        <FingerSummary
          leftSelections={selections.left}
          rightSelections={selections.right}
          activeHand={activeHand}
          onFingerTap={(hand, finger) => openFingerModal(hand, finger)}
        />
      </div>

      {/* Finger detail modal — tablet optimized width */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={fingerLabel}
        className="max-h-[80vh] md:max-w-2xl md:w-[90vw]"
      >
        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['color', 'parts'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setModal((prev) => ({ ...prev, activeTab: tab }))}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors',
                modal.activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {tab === 'color' ? '컬러 · 시술' : '파츠'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto">
          {modal.activeTab === 'color' ? (
            <ColorPicker
              selectedColor={modal.draftColor}
              isPoint={modal.draftIsPoint}
              treatmentType={modal.draftTreatmentType}
              onColorChange={(color) => setModal((prev) => ({ ...prev, draftColor: color }))}
              onPointToggle={(isPoint) => setModal((prev) => ({ ...prev, draftIsPoint: isPoint }))}
              onTreatmentTypeChange={(type) => setModal((prev) => ({ ...prev, draftTreatmentType: type }))}
            />
          ) : (
            <PartsPalette
              selectedPartId={modal.draftPartId}
              quantity={modal.draftQty}
              onPartChange={(partId) => setModal((prev) => ({ ...prev, draftPartId: partId }))}
              onQuantityChange={(qty) => setModal((prev) => ({ ...prev, draftQty: qty }))}
              customEntries={modal.draftCustomEntries}
              onCustomEntriesChange={(entries) =>
                setModal((prev) => ({ ...prev, draftCustomEntries: entries }))
              }
            />
          )}
        </div>

        {/* Memo textarea */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs font-bold text-text-muted mb-1.5">시술 메모</p>
          <textarea
            value={modal.draftMemo}
            onChange={(e) => setModal((prev) => ({ ...prev, draftMemo: e.target.value }))}
            placeholder="시술 세부사항, 참고사항을 입력하세요..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-2xl border-2 border-border bg-surface-alt text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 py-4 border-t border-border">
          {modal.finger && selections[modal.hand][modal.finger]?.colorCode && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                if (modal.finger) clearFinger(modal.hand, modal.finger);
                closeModal();
              }}
              className="flex-shrink-0"
            >
              {t('canvas.reset')}
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={applySelection}
            disabled={!modal.draftColor}
            fullWidth
          >
            {t('canvas.apply')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Export the CanvasSelections type for use in the page
export type { CanvasSelections };
