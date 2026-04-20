'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  PreConsultStep,
  DesignCategory,
  BodyPart,
  NailCurrentStatus,
  RemovalPreference,
  LengthPreference,
  ExtensionLength,
  WrappingPreference,
  DesignFeel,
  StylePreference,
  StyleKeyword,
  AddOnOption,
  ShopPublicData,
} from '@/types/pre-consultation';
import type { NailShape } from '@/types/consultation';
import type { PortfolioPhoto } from '@/types/portfolio';

// ─── State & Actions interfaces ───────────────────────────────────────────────

interface PreConsultState {
  // Shop data (loaded from server — NOT persisted)
  shopId: string | null;
  shopName: string;
  shopData: ShopPublicData | null;
  portfolioPhotos: PortfolioPhoto[];

  // Step tracking
  currentStep: PreConsultStep;

  // STEP 1: Design
  bodyPart: BodyPart;
  selectedCategory: DesignCategory | null;
  selectedPhotoUrl: string | null;
  selectedPhotoId: string | null;
  selectedPhotoPrice: number | null;

  // STEP 2: Consult
  referenceImageUrls: string[];
  nailStatus: NailCurrentStatus | null;
  removalPreference: RemovalPreference | null;
  lengthPreference: LengthPreference | null;
  extensionLength: ExtensionLength | null;
  nailShape: NailShape | null;
  wrappingPreference: WrappingPreference | null;
  designFeel: DesignFeel | null;
  stylePreference: StylePreference | null;
  styleKeywords: StyleKeyword[];
  addOns: AddOnOption[];

  // STEP 3: Booking
  customerName: string;
  customerPhone: string;

  // Booking link
  bookingId: string | null;

  // Shared consultation link (홈에서 사장님이 만든 링크)
  consultationLinkId: string | null;
  selectedSlotDate: string | null;
  selectedSlotTime: string | null;
  linkDesignerId: string | null;

  // Submission
  isSubmitting: boolean;
  isSubmitted: boolean;
  submittedId: string | null;
}

interface PreConsultActions {
  // Setters
  setShopId: (id: string) => void;
  setShopData: (data: ShopPublicData, photos: PortfolioPhoto[]) => void;
  setCurrentStep: (step: PreConsultStep) => void;
  setBodyPart: (part: BodyPart) => void;
  setSelectedCategory: (cat: DesignCategory) => void;
  setSelectedPhotoUrl: (url: string | null) => void;
  setSelectedPhoto: (id: string | null, url: string | null, price: number | null) => void;
  addReferenceImageUrl: (url: string) => void;
  removeReferenceImageUrl: (url: string) => void;
  setNailStatus: (status: NailCurrentStatus) => void;
  setRemovalPreference: (pref: RemovalPreference) => void;
  setLengthPreference: (pref: LengthPreference) => void;
  setExtensionLength: (len: ExtensionLength) => void;
  setNailShape: (shape: NailShape) => void;
  setWrappingPreference: (pref: WrappingPreference) => void;
  setDesignFeel: (feel: DesignFeel) => void;
  setStylePreference: (pref: StylePreference) => void;
  toggleStyleKeyword: (kw: StyleKeyword) => void;
  toggleAddOn: (opt: AddOnOption) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setBookingId: (id: string | null) => void;
  setConsultationLinkId: (id: string | null) => void;
  setSelectedSlot: (date: string | null, time: string | null) => void;
  setLinkDesignerId: (id: string | null) => void;

  // Actions
  setSubmitting: (v: boolean) => void;
  setSubmitted: (id: string) => void;
  reset: (shopId?: string) => void;
}

type PreConsultStore = PreConsultState & PreConsultActions;

// ─── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_STATE: PreConsultState = {
  shopId: null,
  shopName: '',
  shopData: null,
  portfolioPhotos: [],

  currentStep: 'start',

  bodyPart: 'hand',
  selectedCategory: null,
  selectedPhotoUrl: null,
  selectedPhotoId: null,
  selectedPhotoPrice: null,

  referenceImageUrls: [],
  nailStatus: null,
  removalPreference: null,
  lengthPreference: null,
  extensionLength: null,
  nailShape: null,
  wrappingPreference: null,
  designFeel: null,
  stylePreference: null,
  styleKeywords: [],
  addOns: [],

  customerName: '',
  customerPhone: '',

  bookingId: null,

  consultationLinkId: null,
  selectedSlotDate: null,
  selectedSlotTime: null,
  linkDesignerId: null,

  isSubmitting: false,
  isSubmitted: false,
  submittedId: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePreConsultStore = create<PreConsultStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setShopId: (id) => set({ shopId: id }),

      setShopData: (data, photos) =>
        set({ shopData: data, shopName: data.name, portfolioPhotos: photos }),

      setCurrentStep: (step) => set({ currentStep: step }),

      setBodyPart: (part) => set({ bodyPart: part }),

      setSelectedCategory: (cat) => set({ selectedCategory: cat }),

      setSelectedPhotoUrl: (url) => set({ selectedPhotoUrl: url }),

      setSelectedPhoto: (id, url, price) => set({ selectedPhotoId: id, selectedPhotoUrl: url, selectedPhotoPrice: price }),

      addReferenceImageUrl: (url) =>
        set((s) => ({ referenceImageUrls: [...s.referenceImageUrls, url] })),

      removeReferenceImageUrl: (url) =>
        set((s) => ({ referenceImageUrls: s.referenceImageUrls.filter((u) => u !== url) })),

      setNailStatus: (status) => set({ nailStatus: status }),

      setRemovalPreference: (pref) => set({ removalPreference: pref }),

      setLengthPreference: (pref) => set({ lengthPreference: pref }),

      setExtensionLength: (len) => set({ extensionLength: len }),

      setNailShape: (shape) => set({ nailShape: shape }),

      setWrappingPreference: (pref) => set({ wrappingPreference: pref }),

      setDesignFeel: (feel) => set({ designFeel: feel }),

      setStylePreference: (pref) => set({ stylePreference: pref }),

      toggleStyleKeyword: (kw) =>
        set((s) => ({
          styleKeywords: s.styleKeywords.includes(kw)
            ? s.styleKeywords.filter((k) => k !== kw)
            : [...s.styleKeywords, kw],
        })),

      toggleAddOn: (opt) =>
        set((s) => ({
          addOns: s.addOns.includes(opt)
            ? s.addOns.filter((a) => a !== opt)
            : [...s.addOns, opt],
        })),

      setCustomerName: (name) => set({ customerName: name }),

      setCustomerPhone: (phone) => set({ customerPhone: phone }),

      setBookingId: (id) => set({ bookingId: id }),

      setConsultationLinkId: (id) => set({ consultationLinkId: id }),

      setSelectedSlot: (date, time) => set({ selectedSlotDate: date, selectedSlotTime: time }),

      setLinkDesignerId: (id) => set({ linkDesignerId: id }),

      setSubmitting: (v) => set({ isSubmitting: v }),

      setSubmitted: (id) =>
        set({ isSubmitted: true, submittedId: id, isSubmitting: false }),

      reset: (shopId) =>
        set({
          ...INITIAL_STATE,
          ...(shopId !== undefined ? { shopId } : {}),
        }),
    }),
    {
      name: 'bdx-pre-consult',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      // shopData and portfolioPhotos are runtime-loaded; don't persist them
      // isSubmitting은 network fail 복구 여지 위해 제외
      // isSubmitted/submittedId는 sessionStorage에 보존 → 새로고침 후 재제출 차단
      partialize: (state) => {
        const {
          shopData: _shopData,
          portfolioPhotos: _portfolioPhotos,
          isSubmitting: _isSubmitting,
          ...persistedState
        } = state;
        return {
          ...persistedState,
          referenceImageUrls: state.referenceImageUrls.filter((url) => url.startsWith('http')),
        };
      },
    },
  ),
);
