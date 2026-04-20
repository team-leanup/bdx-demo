'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MembershipPlan } from '@/types/customer';
import { useAuthStore } from '@/store/auth-store';
import { getNowInKoreaIso } from '@/lib/format';
import {
  dbFetchMembershipPlans,
  dbUpsertMembershipPlan,
  dbDeleteMembershipPlan,
} from '@/lib/db';

interface MembershipPlanStore {
  plans: MembershipPlan[];
  _dbReady: boolean;

  hydrateFromDB: () => Promise<void>;

  getActive: () => MembershipPlan[];
  getById: (id: string) => MembershipPlan | undefined;

  addPlan: (input: {
    name: string;
    price: number;
    totalSessions: number;
    validDays: number | null;
  }) => MembershipPlan | null;

  updatePlan: (id: string, updates: Partial<Omit<MembershipPlan, 'id' | 'shopId' | 'createdAt'>>) => void;

  togglePlanActive: (id: string) => void;

  removePlan: (id: string) => void;

  reset: () => void;
}

export const useMembershipPlanStore = create<MembershipPlanStore>()(
  persist(
    (set, get) => ({
      plans: [],
      _dbReady: false,

      hydrateFromDB: async () => {
        const shopId = useAuthStore.getState().currentShopId;
        if (!shopId) {
          set({ plans: [], _dbReady: true });
          return;
        }
        const rows = await dbFetchMembershipPlans(shopId);
        set({ plans: rows, _dbReady: true });
      },

      getActive: () => get().plans.filter((p) => p.isActive),

      getById: (id) => get().plans.find((p) => p.id === id),

      addPlan: (input) => {
        const shopId = useAuthStore.getState().currentShopId;
        if (!shopId) return null;
        const now = getNowInKoreaIso();
        const plan: MembershipPlan = {
          id: `mp-${Date.now()}`,
          shopId,
          name: input.name,
          price: input.price,
          totalSessions: input.totalSessions,
          validDays: input.validDays,
          isActive: true,
          sortOrder: get().plans.length,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ plans: [...state.plans, plan] }));
        void dbUpsertMembershipPlan(plan).catch(console.error);
        return plan;
      },

      updatePlan: (id, updates) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: getNowInKoreaIso() } : p,
          ),
        }));
        const updated = get().plans.find((p) => p.id === id);
        if (updated) {
          void dbUpsertMembershipPlan(updated).catch(console.error);
        }
      },

      togglePlanActive: (id) => {
        const target = get().plans.find((p) => p.id === id);
        if (!target) return;
        get().updatePlan(id, { isActive: !target.isActive });
      },

      removePlan: (id) => {
        set((state) => ({ plans: state.plans.filter((p) => p.id !== id) }));
        void dbDeleteMembershipPlan(id).catch(console.error);
      },

      reset: () => set({ plans: [], _dbReady: false }),
    }),
    {
      name: 'bdx-membership-plans',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ plans: state.plans }),
    },
  ),
);
