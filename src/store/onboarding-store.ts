import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  seenFeatures: Record<string, boolean>;
  markSeen: (featureId: string) => void;
  hasSeen: (featureId: string) => boolean;
  resetAll: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      seenFeatures: {},
      markSeen: (featureId) =>
        set((s) => ({ seenFeatures: { ...s.seenFeatures, [featureId]: true } })),
      hasSeen: (featureId) => !!get().seenFeatures[featureId],
      resetAll: () => set({ seenFeatures: {} }),
    }),
    { name: 'bdx-onboarding' },
  ),
);
