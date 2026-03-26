'use client';

import { useRouter } from 'next/navigation';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { FingerCanvas } from '@/components/canvas/FingerCanvas';
import type { CanvasSelections } from '@/components/canvas/FingerCanvas';
import type { FingerPosition, FingerSelection, PartPlacement } from '@/types/canvas';
import { ConsultationStep } from '@/types/consultation';
import type { FingerArtSelection, FingerPartSelection, CanvasData } from '@/types/consultation';
import { useT, useKo } from '@/lib/i18n';
import { useConsultationGuard } from '@/lib/use-consultation-guard';

const FINGER_ORDER: FingerPosition[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

const VALID_ART_TYPES = new Set(['solid', 'gradient', 'art', 'french', 'magnetic']);

function buildInitialSelections(canvasData: CanvasData[]): CanvasSelections {
  const result: CanvasSelections = { left: {}, right: {} };
  for (const handData of canvasData) {
    const hand: 'left' | 'right' = handData.handSide === 'left_hand' ? 'left' : 'right';
    for (const art of handData.fingerArts) {
      const finger = art.fingerId.split('_').pop() as FingerPosition;
      if (!finger) continue;
      const rawArtType = art.artType;
      const artType: FingerSelection['artType'] = VALID_ART_TYPES.has(rawArtType)
        ? (rawArtType as FingerSelection['artType'])
        : undefined;
      result[hand][finger] = {
        finger,
        isPoint: art.isPoint ?? rawArtType === 'point',
        artType,
        colorCode: art.colorCode,
        parts: [],
        note: art.note,
        memo: art.memo,
      };
    }
    for (const part of handData.fingerParts) {
      const finger = part.fingerId.split('_').pop() as FingerPosition;
      if (!finger) continue;
      const fingerSel = result[hand][finger];
      if (!fingerSel) continue;
      for (let i = 0; i < part.quantity; i++) {
        const placement: PartPlacement = {
          id: `restored-${part.fingerId}-${part.partGrade}-${i}`,
          partType: 'stone',
          grade: part.partGrade,
          customPartId: part.customPartId,
          // N-21: 저장된 좌표가 있으면 복원, 없으면 기본 중앙
          x: part.position?.x ?? 0.5,
          y: part.position?.y ?? 0.5,
        };
        fingerSel.parts.push(placement);
      }
    }
  }
  return result;
}

export default function CanvasPage() {
  useConsultationGuard();
  const router = useRouter();
  const consultation = useConsultationStore((s) => s.consultation);
  const setStep = useConsultationStore((s) => s.setStep);
  const t = useT();
  const tKo = useKo();

  const handleChange = (selections: CanvasSelections) => {
    // Convert canvas selections to ConsultationType.canvasData format
    const fingerArts: FingerArtSelection[] = [];
    const fingerParts: FingerPartSelection[] = [];

    for (const [handKey, handSel] of Object.entries(selections) as [
      'left' | 'right',
      Partial<Record<FingerPosition, import('@/types/canvas').FingerSelection>>,
    ][]) {
      const handSide = handKey === 'left' ? 'left_hand' : 'right_hand';

      for (const finger of FINGER_ORDER) {
        const sel = handSel[finger];
        if (!sel?.colorCode) continue;

        const fingerId = `${handSide}_${finger}`;

        fingerArts.push({
          fingerId,
          artType: sel.artType || (sel.isPoint ? 'point' : 'solid'),
          colorCode: sel.colorCode,
          isPoint: sel.isPoint,
          note: sel.note,
          memo: sel.memo,
        });

        // Aggregate parts: customPartId별로 우선 묶고, 없으면 grade별 집계
        const customPartMap: Record<string, { qty: number; grade: string }> = {};
        const gradeMap: Record<string, number> = {};
        for (const p of sel.parts) {
          if (p.customPartId) {
            const key = p.customPartId;
            if (!customPartMap[key]) customPartMap[key] = { qty: 0, grade: p.grade };
            customPartMap[key].qty += 1;
          } else {
            gradeMap[p.grade] = (gradeMap[p.grade] ?? 0) + 1;
          }
        }

        for (const [customPartId, { qty, grade }] of Object.entries(customPartMap)) {
          fingerParts.push({
            fingerId,
            partGrade: grade as import('@/types/consultation').FingerPartSelection['partGrade'],
            quantity: qty,
            customPartId,
          });
        }

        for (const [grade, qty] of Object.entries(gradeMap)) {
          fingerParts.push({
            fingerId,
            partGrade: grade as import('@/types/consultation').FingerPartSelection['partGrade'],
            quantity: qty,
          });
        }
      }
    }

    useConsultationStore.setState((state) => ({
      consultation: {
        ...state.consultation,
        canvasData: [
          {
            handSide: 'left_hand',
            fingerArts: fingerArts.filter((f) => f.fingerId.startsWith('left')),
            fingerParts: fingerParts.filter((f) => f.fingerId.startsWith('left')),
          },
          {
            handSide: 'right_hand',
            fingerArts: fingerArts.filter((f) => f.fingerId.startsWith('right')),
            fingerParts: fingerParts.filter((f) => f.fingerId.startsWith('right')),
          },
        ],
      },
    }));
  };

  const initialSelections = consultation.canvasData?.length
    ? buildInitialSelections(consultation.canvasData)
    : undefined;

  const handleNext = () => {
    setStep(ConsultationStep.TRAITS);
    router.push('/consultation/traits');
  };

  const handleBack = () => {
    setStep(ConsultationStep.STEP2_DESIGN);
    router.push('/consultation/step2');
  };

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <ConsultationHeader
        title={t('consultation.canvasTitle')}
        titleKo={tKo('consultation.canvasTitle')}
        onBack={handleBack}
      />

      <main className="flex-1 overflow-y-auto pb-28">
        <div className="px-4 md:px-8 py-4 max-w-2xl md:max-w-4xl mx-auto">
          <FingerCanvas onChange={handleChange} initialSelections={initialSelections} />
        </div>
      </main>

      <ConsultationFooter onNext={handleNext} nextLabel={t('common.next')} />
    </div>
  );
}
