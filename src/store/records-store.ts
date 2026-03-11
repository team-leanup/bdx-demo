'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConsultationRecord } from '@/types/consultation';
import { useAuthStore } from '@/store/auth-store';
import { getNowInKoreaIso } from '@/lib/format';
import {
  fetchConsultationRecords,
  dbUpsertRecord,
  dbDeleteRecord,
} from '@/lib/db';

interface RecordsStore {
  records: ConsultationRecord[];
  _dbReady: boolean;

  hydrateFromDB: () => Promise<void>;
  addRecord: (record: ConsultationRecord) => void;
  updateRecord: (id: string, patch: Partial<ConsultationRecord>) => void;
  removeRecord: (id: string) => void;
  getRecordById: (id: string) => ConsultationRecord | undefined;
  getAllRecords: () => ConsultationRecord[];
}

export const useRecordsStore = create<RecordsStore>()(
  persist(
    (set, get) => ({
      records: [],
      _dbReady: false,

      hydrateFromDB: async () => {
        const currentShopId = useAuthStore.getState().currentShopId;
        const dbRecords = await fetchConsultationRecords(currentShopId);
        const isDemo = currentShopId === 'demo-shop';
        if (isDemo) {
          const { MOCK_CONSULTATIONS } = await import('@/data/mock-consultations');
          const dbIds = new Set(dbRecords.map((r) => r.id));
          const mockOnly = MOCK_CONSULTATIONS.filter((r) => !dbIds.has(r.id));
          set({ records: [...dbRecords, ...mockOnly], _dbReady: true });
        } else {
          set({ records: dbRecords, _dbReady: true });
        }
      },

      addRecord: (record) => {
        set((state) => ({
          records: [record, ...state.records],
        }));
        dbUpsertRecord(record).catch(console.error);
      },

      updateRecord: (id, patch) => {
        set((state) => {
          const now = getNowInKoreaIso();
          const existing = state.records.find((r) => r.id === id);
          if (!existing) return state;
          const updated: ConsultationRecord = { ...existing, ...patch, updatedAt: now };
          return {
            records: state.records.map((r) => (r.id === id ? updated : r)),
          };
        });
        const updated = get().records.find((r) => r.id === id);
        if (updated) {
          dbUpsertRecord(updated).catch(console.error);
        }
      },

      removeRecord: (id) => {
        const currentShopId = useAuthStore.getState().currentShopId ?? undefined;
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
        dbDeleteRecord(id, currentShopId).catch(console.error);
      },

      getRecordById: (id) => get().records.find((r) => r.id === id),

      getAllRecords: () => get().records,
    }),
    {
      name: 'bdx-records',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);
