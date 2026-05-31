'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DesignCategory, RemovalPreference, LengthPreference, ExtensionLength, AddOnOption, WrappingPreference } from '@/types/pre-consultation';
import type { PaymentMethod, NailShape } from '@/types/consultation';
import type { FieldModePhase, FieldModeAddon } from '@/types/field-mode';

// ─── State & Actions interfaces ───────────────────────────────────────────────

interface FieldModeState {
  phase: FieldModePhase;

  // STEP 1~2: Design Selection
  selectedCategory: DesignCategory | null;
  selectedPhotoId: string | null;
  selectedPhotoUrl: string | null;
  /** 0528 C5 — 사진별 가격 (사전상담에서 손님이 선택한 가격을 유지) */
  selectedPhotoPrice: number | null;

  // STEP 3: Options
  removalType: RemovalPreference;
  lengthType: LengthPreference;
  extensionLength: ExtensionLength | null;
  addOns: AddOnOption[];
  /** 0531 — 사전상담 랩핑 선호. 'yes'면 정산에서 surcharges.wrapping 가산 (견적=계산대 일치) */
  wrappingPreference: WrappingPreference | null;
  /** 0531 — 사전상담에서 손님이 선택한 커스텀 파츠(이름→개수). settlement 견적 정합용 */
  customPartSelections: Record<string, number>;
  /** 0530 FM-2 — 사전상담에서 손님이 선택한 네일 쉐입 (매출 레코드 정합) */
  nailShape: NailShape | null;

  // STEP 5~6: Treatment
  treatmentStartedAt: string | null;
  inTreatmentAddons: FieldModeAddon[];

  // STEP 7~8: Settlement
  paymentMethod: PaymentMethod | null;

  // STEP 9: Customer Info
  customerName: string;
  customerPhone: string;
  customerId: string | null;

  // STEP 10: After Photos
  afterPhotoUrls: string[];

  // STEP 11: Record
  recordId: string | null;

  // Booking (예약에서 시작된 경우)
  bookingId: string | null;

  // Designer
  designerId: string;
}

interface FieldModeActions {
  setPhase: (phase: FieldModePhase) => void;
  selectDesign: (photoId: string, photoUrl: string, category: DesignCategory, optionalPrice?: number | null) => void;
  // 0529 이슈 #1: 포트폴리오 사진 없이 카테고리만으로 시술 진행
  selectCategoryOnly: (category: DesignCategory) => void;
  confirmDesign: () => void;
  setRemovalType: (type: RemovalPreference) => void;
  setLengthType: (type: LengthPreference) => void;
  setExtensionLength: (length: ExtensionLength) => void;
  toggleAddOn: (option: AddOnOption) => void;
  startTreatment: () => void;
  addInTreatmentAddon: (addon: { label: string; amount: number }) => void;
  removeInTreatmentAddon: (id: string) => void;
  completeTreatment: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCustomerInfo: (name: string, phone: string, id?: string) => void;
  addAfterPhoto: (url: string) => void;
  removeAfterPhoto: (url: string) => void;
  setRecordId: (id: string) => void;
  setBookingId: (id: string | null) => void;
  setDesignerId: (id: string) => void;
  reset: () => void;
  hydrateFromBooking: (data: {
    designCategory?: DesignCategory | null;
    selectedPhotoUrl?: string | null;
    selectedPhotoId?: string | null;
    /** 0528 C5 — 사진별 가격(손님이 선택한 카테고리 기본가보다 우선) */
    selectedPhotoPrice?: number | null;
    removalType?: RemovalPreference;
    lengthType?: LengthPreference;
    addOns?: AddOnOption[];
    /** 0531 — 사전상담 랩핑 선호 */
    wrappingPreference?: WrappingPreference | null;
    /** 0531 — 사전상담 커스텀 파츠 선택 */
    customPartSelections?: Record<string, number>;
    /** 0530 FM-2 — 사전상담 네일 쉐입 */
    nailShape?: NailShape | null;
    customerName?: string;
    customerPhone?: string;
    customerId?: string | null;
    designerId?: string;
    bookingId?: string | null;
    /** 0528 — 사전상담에서 손님이 선택한 커스텀 파츠를 inTreatmentAddons로 미리 채움 */
    initialInTreatmentAddons?: FieldModeAddon[];
  }) => void;
}

type FieldModeStore = FieldModeState & FieldModeActions;

// ─── Default state ─────────────────────────────────────────────────────────────

const DEFAULT_STATE: FieldModeState = {
  phase: 'portfolio' as FieldModePhase,
  selectedCategory: null,
  selectedPhotoId: null,
  selectedPhotoUrl: null,
  selectedPhotoPrice: null,
  removalType: 'none' as RemovalPreference,
  lengthType: 'keep' as LengthPreference,
  extensionLength: null,
  addOns: [] as AddOnOption[],
  wrappingPreference: null,
  customPartSelections: {},
  nailShape: null,
  treatmentStartedAt: null,
  inTreatmentAddons: [] as FieldModeAddon[],
  paymentMethod: null,
  customerName: '',
  customerPhone: '',
  customerId: null,
  afterPhotoUrls: [] as string[],
  recordId: null,
  bookingId: null,
  designerId: '',
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFieldModeStore = create<FieldModeStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setPhase: (phase) => set({ phase }),

      selectDesign: (photoId, photoUrl, category, optionalPrice) =>
        set({
          selectedPhotoId: photoId,
          selectedPhotoUrl: photoUrl,
          // 0531 R3: 사진별 가격을 저장해야 직접경로(사전상담 없이) 정산이 카테고리 기본가 대신 사진 가격을 사용
          selectedPhotoPrice: optionalPrice ?? null,
          selectedCategory: category,
          phase: 'design-confirm',
        }),

      // 0529 이슈 #1: 신규 매장이 포트폴리오 사진 등록 전이라도 시술 진행할 수 있도록.
      selectCategoryOnly: (category) =>
        set({
          selectedPhotoId: null,
          selectedPhotoUrl: null,
          selectedCategory: category,
          phase: 'options',
        }),

      confirmDesign: () => set({ phase: 'options' }),

      setRemovalType: (type) => set({ removalType: type }),

      setLengthType: (type) =>
        set((s) => ({
          lengthType: type,
          extensionLength: type !== 'extend' ? null : s.extensionLength,
        })),

      setExtensionLength: (length) => set({ extensionLength: length }),

      toggleAddOn: (option) =>
        set((s) => ({
          addOns: s.addOns.includes(option)
            ? s.addOns.filter((a) => a !== option)
            : [...s.addOns, option],
        })),

      startTreatment: () =>
        set({
          treatmentStartedAt: new Date().toISOString(),
          phase: 'treatment',
        }),

      addInTreatmentAddon: (addon) =>
        set((s) => ({
          inTreatmentAddons: [
            ...s.inTreatmentAddons,
            {
              id: `fm-addon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              label: addon.label,
              amount: addon.amount,
              addedAt: new Date().toISOString(),
            },
          ],
        })),

      removeInTreatmentAddon: (id) =>
        set((s) => ({
          inTreatmentAddons: s.inTreatmentAddons.filter((a) => a.id !== id),
        })),

      completeTreatment: () => set({ phase: 'settlement' }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setCustomerInfo: (name, phone, id) =>
        set({
          customerName: name,
          customerPhone: phone,
          customerId: id ?? null,
        }),

      addAfterPhoto: (url) =>
        set((s) => ({
          afterPhotoUrls: s.afterPhotoUrls.length < 3
            ? [...s.afterPhotoUrls, url]
            : s.afterPhotoUrls,
        })),

      removeAfterPhoto: (url) =>
        set((s) => ({
          afterPhotoUrls: s.afterPhotoUrls.filter((u) => u !== url),
        })),

      setRecordId: (id) => set({ recordId: id }),

      setBookingId: (id) => set({ bookingId: id }),

      setDesignerId: (id) => set({ designerId: id }),

      reset: () => set({ ...DEFAULT_STATE }),

      hydrateFromBooking: (data) =>
        set({
          ...DEFAULT_STATE,
          selectedCategory: data.designCategory ?? null,
          selectedPhotoUrl: data.selectedPhotoUrl ?? null,
          selectedPhotoId: data.selectedPhotoId ?? null,
          selectedPhotoPrice: data.selectedPhotoPrice ?? null,
          removalType: data.removalType ?? 'none',
          lengthType: data.lengthType ?? 'keep',
          addOns: data.addOns ?? [],
          wrappingPreference: data.wrappingPreference ?? null,
          customPartSelections: data.customPartSelections ?? {},
          nailShape: data.nailShape ?? null,
          customerName: data.customerName ?? '',
          customerPhone: data.customerPhone ?? '',
          customerId: data.customerId ?? null,
          designerId: data.designerId ?? '',
          bookingId: data.bookingId ?? null,
          inTreatmentAddons: data.initialInTreatmentAddons ?? [],
          // 사전상담에서 디자인 카테고리가 이미 선택된 경우 options 단계부터 시작
          phase: data.designCategory ? 'options' : 'portfolio',
        }),
    }),
    {
      name: 'bdx-field-mode',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? sessionStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (state) => {
        const { afterPhotoUrls: _, ...rest } = state;
        return { ...rest, afterPhotoUrls: [] };
      },
    },
  ),
);
