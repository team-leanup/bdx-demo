'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { FingerCanvas } from '@/components/canvas/FingerCanvas';
import type { CanvasSelections } from '@/components/canvas/FingerCanvas';
import type { FingerPosition } from '@/types/canvas';
import type { FingerArtSelection, FingerPartSelection } from '@/types/consultation';
import { useT, useKo } from '@/lib/i18n';
import { useConsultationGuard } from '@/lib/use-consultation-guard';

const FINGER_ORDER: FingerPosition[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

export default function CanvasPage() {
  useConsultationGuard();
  const router = useRouter();
  const consultation = useConsultationStore((s) => s.consultation);
  const setStep = useConsultationStore((s) => s.setStep);
  const t = useT();
  const tKo = useKo();

  void consultation;
  void setStep;

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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleNext = () => {
    router.push('/consultation/traits');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <ConsultationHeader
        stepNumber={5}
        totalSteps={6}
        title={t('consultation.canvasTitle')}
        titleKo={tKo('consultation.canvasTitle')}
        onBack={handleBack}
      />

      <main className="flex-1 overflow-y-auto overscroll-contain pb-[calc(8rem+env(safe-area-inset-bottom,0px))] md:pb-6">
        <div className="px-4 md:px-8 py-4 max-w-2xl md:max-w-4xl mx-auto">
          <FingerCanvas onChange={handleChange} />
        </div>
      </main>

      <ConsultationFooter onNext={handleNext} nextLabel={t('common.next')} />
    </div>
  );
}
