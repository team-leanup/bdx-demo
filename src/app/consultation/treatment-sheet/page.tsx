'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConsultationStore } from '@/store/consultation-store';
import { useAuthStore } from '@/store/auth-store';
import { useRecordsStore } from '@/store/records-store';
import { HandIllustration } from '@/components/canvas/HandIllustration';
import { formatPrice } from '@/lib/format';
import { calculatePrice } from '@/lib/price-calculator';
import { estimateTime } from '@/lib/time-calculator';
import { MOCK_DESIGNERS } from '@/data/mock-shop';
import { MOCK_CUSTOMERS } from '@/data/mock-customers';
import type { FingerPosition, FingerSelection } from '@/types/canvas';
import type { NailShape } from '@/types/consultation';

const SHAPE_LABELS: Record<string, string> = {
  round: '라운드', oval: '오벌', square: '스퀘어', squoval: '스퀘오벌',
  almond: '아몬드', stiletto: '스틸레토', coffin: '코핀',
};

const LENGTH_LABELS = { short: '짧게', medium: '보통', long: '길게' };
const THICKNESS_LABELS = { thin: '얇게', medium: '보통', thick: '두껍게' };
const CUTICLE_LABELS = { low: '예민하지 않음', medium: '보통', high: '예민함' };

type LengthType = 'short' | 'medium' | 'long';
type ThicknessType = 'thin' | 'medium' | 'thick';
type CuticleType = 'low' | 'medium' | 'high';

interface DailyChecklistState {
  shape: NailShape | null;
  length: LengthType | null;
  thickness: ThicknessType | null;
  cuticleSensitivity: CuticleType | null;
  memo: string;
}

function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T | null;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
          style={{
            background: value === opt ? 'var(--color-primary)' : 'var(--color-background)',
            color: value === opt ? 'white' : 'var(--color-text-secondary)',
            border: `1.5px solid ${value === opt ? 'var(--color-primary)' : 'var(--color-border)'}`,
          }}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

export default function TreatmentSheetPage() {
  const router = useRouter();
  const { consultation, reset } = useConsultationStore();
  const { activeDesignerId, activeDesignerName } = useAuthStore();
  const [smallTalkText, setSmallTalkText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isFinalSaving, setIsFinalSaving] = useState(false);
  const addRecord = useRecordsStore((s) => s.addRecord);
  const [checklist, setChecklist] = useState<DailyChecklistState>({
    shape: (consultation.nailShape ?? null) as NailShape | null,
    length: null,
    thickness: null,
    cuticleSensitivity: null,
    memo: '',
  });

  const designer = MOCK_DESIGNERS.find(d => d.id === (consultation.designerId || activeDesignerId));
  const priceBreakdown = calculatePrice(consultation);
  const totalPrice = priceBreakdown.subtotal;
  const estimatedMinutes = estimateTime(consultation);
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // Build canvas selections for read-only display from canvasData
  const buildSelections = (handSide: 'left_hand' | 'right_hand'): Partial<Record<FingerPosition, FingerSelection>> => {
    const hand = consultation.canvasData?.find(d => d.handSide === handSide);
    if (!hand) return {};
    const sels: Partial<Record<FingerPosition, FingerSelection>> = {};
    for (const art of hand.fingerArts) {
      const finger = art.fingerId.replace(`${handSide}_`, '') as FingerPosition;
      sels[finger] = {
        finger,
        colorCode: art.colorCode,
        isPoint: art.isPoint ?? false,
        artType: art.artType as FingerSelection['artType'],
        note: art.note,
        memo: art.memo,
        parts: [],
      };
    }
    for (const part of hand.fingerParts) {
      const finger = part.fingerId.replace(`${handSide}_`, '') as FingerPosition;
      if (sels[finger]) {
        sels[finger]!.parts = Array.from({ length: part.quantity }, (_, i) => ({
          id: `${part.fingerId}-${part.partGrade}-${i}`,
          partType: 'other' as const,
          grade: part.partGrade,
          x: 0.3 + i * 0.1,
          y: 0.5,
        }));
      }
    }
    return sels;
  };

  const handleSaveSmallTalk = () => {
    if (!smallTalkText.trim()) return;

    // Find customer by name in MOCK_CUSTOMERS
    const customer = MOCK_CUSTOMERS.find(c => c.name === consultation.customerName);
    if (customer) {
      const newNote = {
        id: `stn-${Date.now()}`,
        customerId: customer.id,
        consultationRecordId: undefined,
        noteText: smallTalkText.trim(),
        createdAt: new Date().toISOString(),
        createdByDesignerId: activeDesignerId ?? designer?.id ?? 'unknown',
        createdByDesignerName: activeDesignerName ?? designer?.name ?? '디자이너',
      };
      customer.smallTalkNotes.unshift(newNote);
    }

    setIsSaved(true);
    setSmallTalkText('');
  };

  const handleComplete = async () => {
    setIsFinalSaving(true);

    // Save small talk memo if present
    if (smallTalkText.trim()) {
      handleSaveSmallTalk();
    }

    // Build & save consultation record
    const now = new Date().toISOString();
    const newId = `record-${Date.now()}`;
    const customerId = consultation.customerId || 'customer-001';
    const savedRecord = {
      id: newId,
      shopId: 'shop-001',
      designerId: consultation.designerId || activeDesignerId || 'designer-001',
      customerId,
      consultation: { ...consultation },
      totalPrice: totalPrice,
      estimatedMinutes,
      finalPrice: priceBreakdown.finalPrice,
      createdAt: now,
      updatedAt: now,
      notes: checklist.memo || undefined,
    };
    addRecord(savedRecord as any);

    await new Promise((r) => setTimeout(r, 400));
    reset();
    router.push('/home');
  };

  const hasCanvas = consultation.canvasData && consultation.canvasData.length > 0;
  const hasReferenceImages = consultation.referenceImages && consultation.referenceImages.length > 0;

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <h1 className="text-xl font-bold text-text">시술 확인서</h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm text-text-secondary">{consultation.customerName || '고객'}</span>
          <span className="text-text-muted">·</span>
          <span className="text-sm text-text-muted">{today}</span>
          {designer && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-sm text-text-muted">{designer.name}</span>
            </>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-5 flex flex-col gap-5 max-w-2xl md:max-w-4xl mx-auto w-full">
        {/* Checklist Summary */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold text-text mb-3">체크리스트</h3>
          <div className="grid grid-cols-2 gap-3">
            {consultation.nailShape && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-text-muted">쉐입</span>
                <span className="text-sm font-semibold text-text">{SHAPE_LABELS[consultation.nailShape] || consultation.nailShape}</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-text-muted">신체 부위</span>
              <span className="text-sm font-semibold text-text">{consultation.bodyPart === 'hand' ? '핸드' : '페디큐어'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-text-muted">디자인</span>
              <span className="text-sm font-semibold text-text">
                {consultation.designScope === 'solid_tone' ? '원컬러'
                  : consultation.designScope === 'solid_point' ? '단색+포인트'
                  : consultation.designScope === 'full_art' ? '풀아트'
                  : '이달의 아트'}
              </span>
            </div>
            {consultation.offType !== 'none' && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-text-muted">오프</span>
                <span className="text-sm font-semibold text-text">
                  {consultation.offType === 'same_shop' ? '자샵오프' : '타샵오프'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Daily Checklist - 당일 시술 체크 */}
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-text mb-0.5">당일 시술 체크</h3>
            <p className="text-xs text-text-muted">시술 시작 전 고객 상태를 확인해주세요</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">길이</span>
              <SegmentControl<LengthType>
                options={['short', 'medium', 'long']}
                value={checklist.length}
                onChange={(v) => setChecklist(prev => ({ ...prev, length: v }))}
                labels={LENGTH_LABELS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">두께감</span>
              <SegmentControl<ThicknessType>
                options={['thin', 'medium', 'thick']}
                value={checklist.thickness}
                onChange={(v) => setChecklist(prev => ({ ...prev, thickness: v }))}
                labels={THICKNESS_LABELS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">큐티클 상태</span>
              <SegmentControl<CuticleType>
                options={['low', 'medium', 'high']}
                value={checklist.cuticleSensitivity}
                onChange={(v) => setChecklist(prev => ({ ...prev, cuticleSensitivity: v }))}
                labels={CUTICLE_LABELS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">메모</span>
              <textarea
                value={checklist.memo}
                onChange={(e) => setChecklist(prev => ({ ...prev, memo: e.target.value }))}
                placeholder="특이사항 메모 (ex. 손톱이 얇음, 큐티클 주의)"
                rows={2}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Reference Images */}
        {hasReferenceImages && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="text-sm font-bold text-text mb-3">참고 이미지</h3>
            <div className="grid grid-cols-2 gap-3">
              {consultation.referenceImages!.map((url, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-auto object-contain" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas - Read only */}
        {hasCanvas && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="text-sm font-bold text-text mb-3">네일 디자인</h3>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs text-text-muted text-center mb-2">왼손</p>
                <HandIllustration
                  hand="left"
                  selections={buildSelections('left_hand')}
                  onFingerTap={() => {}}
                />
              </div>
              <div>
                <p className="text-xs text-text-muted text-center mb-2">오른손</p>
                <HandIllustration
                  hand="right"
                  selections={buildSelections('right_hand')}
                  onFingerTap={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Price & Time Summary */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold text-text mb-3">시술 내역</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">총 금액</span>
              <span className="text-lg font-extrabold text-primary">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">예상 소요 시간</span>
              <span className="text-sm font-semibold text-text">{estimatedMinutes}분</span>
            </div>
            {consultation.discount && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">할인</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-error, #ef4444)' }}>
                  -{consultation.discount.type === 'percent' ? `${consultation.discount.value}%` : formatPrice(consultation.discount.value)}
                </span>
              </div>
            )}
            {consultation.deposit && consultation.deposit > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">예약금</span>
                <span className="text-sm font-semibold text-text-secondary">-{formatPrice(consultation.deposit)}</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm font-bold text-text">최종 결제</span>
              <span className="text-lg font-extrabold text-text">{formatPrice(priceBreakdown.finalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Small Talk Memo */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold text-text mb-1">고객 메모</h3>
          <p className="text-[11px] text-text-muted mb-3">고객과 나눈 이야기를 기록해두면 다음 방문 때 활용할 수 있어요</p>

          {isSaved && (
            <div
              className="mb-3 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5"
              style={{ background: 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface))', color: 'var(--color-success)' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              저장됐어요
            </div>
          )}

          <textarea
            value={smallTalkText}
            onChange={(e) => setSmallTalkText(e.target.value)}
            placeholder="고객과 나눈 이야기를 메모해두세요 (취미, 관심사 등)"
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            onClick={handleSaveSmallTalk}
            disabled={!smallTalkText.trim()}
            className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: smallTalkText.trim() ? 'var(--color-primary)' : 'var(--color-border)',
              color: smallTalkText.trim() ? 'white' : 'var(--color-text-muted)',
            }}
          >
            메모 저장
          </button>
        </div>
      </main>

      {/* Footer */}
      <div className="sticky bottom-0 px-4 py-4 border-t border-border bg-background" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleComplete}
          disabled={isFinalSaving}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'var(--color-primary)' }}
        >
          {isFinalSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
