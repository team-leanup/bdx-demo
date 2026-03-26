'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConsultationType, DiscountConfig } from '@/types/consultation';
import { ConsultationStep } from '@/types/consultation';

const INITIAL_CONSULTATION: ConsultationType = {
  bodyPart: 'hand',
  offType: 'same_shop',
  extensionType: 'none',
  nailShape: 'round',
  designScope: 'solid_tone',
  expressions: ['solid'],
  hasParts: false,
  partsSelections: [],
  extraColorCount: 0,
  referenceImages: [] as string[],
  selectedTraitValues: [] as string[],
  currentStep: ConsultationStep.START,
};

interface ConsultationStore {
  consultation: ConsultationType;

  // 고객 정보
  setCustomerInfo: (name: string, phone: string, customerId?: string) => void;

  // STEP1: 기본 조건
  setBodyPart: (part: ConsultationType['bodyPart']) => void;
  setOffType: (type: ConsultationType['offType']) => void;
  setExtensionType: (type: ConsultationType['extensionType']) => void;
  setRepairCount: (count: number) => void;
  setNailShape: (shape: ConsultationType['nailShape']) => void;

  // STEP2: 디자인 범위
  setDesignScope: (scope: ConsultationType['designScope']) => void;

  // STEP3: 추가 옵션
  setExpressions: (expressions: ConsultationType['expressions']) => void;
  toggleExpression: (expr: ConsultationType['expressions'][number]) => void;
  setHasParts: (hasParts: boolean) => void;
  setPartsSelections: (selections: ConsultationType['partsSelections']) => void;
  setExtraColorCount: (count: number) => void;

  // Pro 모드
  setPointFingerCount: (count: number) => void;
  setBaseType: (baseType: string) => void;

  // 할인 & 예약금
  setDiscount: (discount: DiscountConfig | undefined) => void;
  setDeposit: (amount: number) => void;

  // 참고 이미지
  addReferenceImage: (url: string) => void;
  removeReferenceImage: (url: string) => void;

  // 고객 특성
  setSelectedTraitValues: (values: string[]) => void;
  toggleTraitValue: (value: string) => void;

  // 무드 태그
  setMoodTags: (tags: string[]) => void;
  toggleMoodTag: (tag: string) => void;

  // 담당 선생님
  setDesignerId: (id: string) => void;

  // 연결된 예약 ID
  setBookingId: (id: string) => void;
  setEntryPoint: (entryPoint: NonNullable<ConsultationType['entryPoint']>) => void;
  setSourceShopId: (shopId: string | undefined) => void;
  setSourceShopName: (shopName: string | undefined) => void;
  hydrateConsultation: (draft: Partial<ConsultationType>) => void;

  // 단계 이동
  setStep: (step: ConsultationStep) => void;
  goNext: () => void;
  goPrev: () => void;

  // 초기화
  reset: () => void;
}

export const STEP_ORDER: ConsultationStep[] = [
  ConsultationStep.START,
  ConsultationStep.CUSTOMER_INFO,
  ConsultationStep.STEP1_BASIC,
  ConsultationStep.STEP2_DESIGN,
  ConsultationStep.CANVAS,
  ConsultationStep.TRAITS,
  ConsultationStep.SUMMARY,
];

const RETURN_VISIT_STEP_ORDER: ConsultationStep[] = [
  ConsultationStep.START,
  ConsultationStep.CUSTOMER_INFO,
  ConsultationStep.SUMMARY,
];

export const useConsultationStore = create<ConsultationStore>()(
  persist(
    (set, get) => ({
      consultation: { ...INITIAL_CONSULTATION },

      setCustomerInfo: (name, phone, customerId) =>
        set((state) => ({
          consultation: {
            ...state.consultation,
            customerName: name,
            customerPhone: phone,
            customerId,
          },
        })),

      setBodyPart: (part) =>
        set((state) => ({ consultation: { ...state.consultation, bodyPart: part } })),

      setOffType: (type) =>
        set((state) => ({ consultation: { ...state.consultation, offType: type } })),

      setExtensionType: (type) =>
        set((state) => ({ consultation: { ...state.consultation, extensionType: type } })),

      setRepairCount: (count) =>
        set((state) => ({ consultation: { ...state.consultation, repairCount: count } })),

      setNailShape: (shape) =>
        set((state) => ({ consultation: { ...state.consultation, nailShape: shape } })),

      setDesignScope: (scope) =>
        set((state) => ({ consultation: { ...state.consultation, designScope: scope } })),

      setExpressions: (expressions) =>
        set((state) => ({ consultation: { ...state.consultation, expressions } })),

      toggleExpression: (expr) =>
        set((state) => {
          const current = state.consultation.expressions;
          const next = current.includes(expr)
            ? current.filter((e) => e !== expr)
            : [...current, expr];
          return { consultation: { ...state.consultation, expressions: next } };
        }),

      setHasParts: (hasParts) =>
        set((state) => ({
          consultation: {
            ...state.consultation,
            hasParts,
            partsSelections: hasParts ? state.consultation.partsSelections : [],
          },
        })),

      setPartsSelections: (selections) =>
        set((state) => ({
          consultation: { ...state.consultation, partsSelections: selections },
        })),

      setExtraColorCount: (count) =>
        set((state) => ({
          consultation: { ...state.consultation, extraColorCount: count },
        })),

      setPointFingerCount: (count) =>
        set((state) => ({
          consultation: { ...state.consultation, pointFingerCount: count },
        })),

      setBaseType: (baseType) =>
        set((state) => ({ consultation: { ...state.consultation, baseType } })),

      setDiscount: (discount) =>
        set((state) => ({ consultation: { ...state.consultation, discount } })),

      setDeposit: (amount) =>
        set((state) => ({ consultation: { ...state.consultation, deposit: amount } })),

      addReferenceImage: (url) =>
        set((state) => ({
          consultation: {
            ...state.consultation,
            referenceImages: [...(state.consultation.referenceImages || []), url],
          },
        })),

      removeReferenceImage: (url) =>
        set((state) => ({
          consultation: {
            ...state.consultation,
            referenceImages: (state.consultation.referenceImages || []).filter((u) => u !== url),
          },
        })),

      setSelectedTraitValues: (values) =>
        set((state) => ({
          consultation: { ...state.consultation, selectedTraitValues: values },
        })),

      toggleTraitValue: (value) =>
        set((state) => {
          const current = state.consultation.selectedTraitValues || [];
          const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
          return { consultation: { ...state.consultation, selectedTraitValues: next } };
        }),

      setMoodTags: (tags) =>
        set((state) => ({
          consultation: { ...state.consultation, moodTags: tags },
        })),

      toggleMoodTag: (tag) =>
        set((state) => {
          const current = state.consultation.moodTags || [];
          const next = current.includes(tag)
            ? current.filter((t) => t !== tag)
            : [...current, tag];
          return { consultation: { ...state.consultation, moodTags: next } };
        }),

      setDesignerId: (id) =>
        set((state) => ({ consultation: { ...state.consultation, designerId: id } })),

      setBookingId: (id) =>
        set((s) => ({ consultation: { ...s.consultation, bookingId: id } })),

      setEntryPoint: (entryPoint) =>
        set((s) => ({ consultation: { ...s.consultation, entryPoint } })),

      setSourceShopId: (shopId) =>
        set((s) => ({ consultation: { ...s.consultation, sourceShopId: shopId } })),

      setSourceShopName: (shopName) =>
        set((s) => ({ consultation: { ...s.consultation, sourceShopName: shopName } })),

      hydrateConsultation: (draft) =>
        set({
          consultation: {
            ...INITIAL_CONSULTATION,
            ...draft,
          },
        }),

      setStep: (step) =>
        set((state) => ({
          consultation: { ...state.consultation, currentStep: step },
        })),

      goNext: () => {
        const state = get();
        const current = state.consultation.currentStep;
        const entryPoint = state.consultation.entryPoint;
        const order = entryPoint === 'return_visit' ? RETURN_VISIT_STEP_ORDER : STEP_ORDER;
        const idx = order.indexOf(current);
        if (idx === -1) return;
        if (idx < order.length - 1) {
          set((s) => ({
            consultation: {
              ...s.consultation,
              currentStep: order[idx + 1],
            },
          }));
        }
      },

      goPrev: () => {
        const state = get();
        const current = state.consultation.currentStep;
        const entryPoint = state.consultation.entryPoint;
        const order = entryPoint === 'return_visit' ? RETURN_VISIT_STEP_ORDER : STEP_ORDER;
        const idx = order.indexOf(current);
        if (idx === -1) return;
        if (idx > 0) {
          set((s) => ({
            consultation: {
              ...s.consultation,
              currentStep: order[idx - 1],
            },
          }));
        }
      },

      reset: () =>
        set({ consultation: { ...INITIAL_CONSULTATION } }),
    }),
    {
      name: 'bdx-consultation',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    },
  ),
);
