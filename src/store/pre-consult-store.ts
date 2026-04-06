'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  PreConsultStep,
  DesignCategory,
  NailCurrentStatus,
  RemovalPreference,
  LengthPreference,
  ExtensionLength,
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
  selectedCategory: DesignCategory | null;
  selectedPhotoUrl: string | null;

  // STEP 2: Consult
  referenceImageUrls: string[];
  nailStatus: NailCurrentStatus | null;
  removalPreference: RemovalPreference | null;
  lengthPreference: LengthPreference | null;
  extensionLength: ExtensionLength | null;
  nailShape: NailShape | null;
  designFeel: DesignFeel | null;
  stylePreference: StylePreference | null;
  styleKeywords: StyleKeyword[];
  addOns: AddOnOption[];

  // STEP 3: Booking
  customerName: string;
  customerPhone: string;

  // Booking link
  bookingId: string | null;

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
  setSelectedCategory: (cat: DesignCategory) => void;
  setSelectedPhotoUrl: (url: string | null) => void;
  addReferenceImageUrl: (url: string) => void;
  removeReferenceImageUrl: (url: string) => void;
  setNailStatus: (status: NailCurrentStatus) => void;
  setRemovalPreference: (pref: RemovalPreference) => void;
  setLengthPreference: (pref: LengthPreference) => void;
  setExtensionLength: (len: ExtensionLength) => void;
  setNailShape: (shape: NailShape) => void;
  setDesignFeel: (feel: DesignFeel) => void;
  setStylePreference: (pref: StylePreference) => void;
  toggleStyleKeyword: (kw: StyleKeyword) => void;
  toggleAddOn: (opt: AddOnOption) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setBookingId: (id: string | null) => void;

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

  selectedCategory: null,
  selectedPhotoUrl: null,

  referenceImageUrls: [],
  nailStatus: null,
  removalPreference: null,
  lengthPreference: null,
  extensionLength: null,
  nailShape: null,
  designFeel: null,
  stylePreference: null,
  styleKeywords: [],
  addOns: [],

  customerName: '',
  customerPhone: '',

  bookingId: null,

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

      setSelectedCategory: (cat) => set({ selectedCategory: cat }),

      setSelectedPhotoUrl: (url) => set({ selectedPhotoUrl: url }),

      addReferenceImageUrl: (url) =>
        set((s) => ({ referenceImageUrls: [...s.referenceImageUrls, url] })),

      removeReferenceImageUrl: (url) =>
        set((s) => ({ referenceImageUrls: s.referenceImageUrls.filter((u) => u !== url) })),

      setNailStatus: (status) => set({ nailStatus: status }),

      setRemovalPreference: (pref) => set({ removalPreference: pref }),

      setLengthPreference: (pref) => set({ lengthPreference: pref }),

      setExtensionLength: (len) => set({ extensionLength: len }),

      setNailShape: (shape) => set({ nailShape: shape }),

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
      // isSubmitting, isSubmitted and submittedId are session-only; don't persist them
      partialize: (state) => {
        const {
          shopData: _shopData,
          portfolioPhotos: _portfolioPhotos,
          isSubmitting: _isSubmitting,
          isSubmitted: _isSubmitted,
          submittedId: _submittedId,
          ...persistedState
        } = state;
        return persistedState;
      },
    },
  ),
);
