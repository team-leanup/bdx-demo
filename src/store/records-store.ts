'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConsultationRecord } from '@/types/consultation';
import { ConsultationStep } from '@/types/consultation';
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
  addRecord: (record: ConsultationRecord) => Promise<void>;
  addQuickSaleRecord: (params: {
    id: string;
    shopId: string;
    designerId: string;
    customerId: string;
    finalPrice: number;
    notes?: string;
  }) => Promise<void>;
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
        set({ records: dbRecords, _dbReady: true });
      },

      addRecord: (record) => {
        set((state) => ({
          records: [record, ...state.records],
        }));
        return dbUpsertRecord(record).catch((err: unknown) => {
          console.error(err);
          throw err;
        });
      },

      addQuickSaleRecord: ({ id, shopId, designerId, customerId, finalPrice, notes }) => {
        const now = getNowInKoreaIso();
        const record: ConsultationRecord = {
          id,
          shopId,
          designerId,
          customerId,
          consultation: {
            bodyPart: 'hand',
            offType: 'none',
            extensionType: 'none',
            nailShape: 'round',
            designScope: 'solid_tone',
            expressions: [],
            hasParts: false,
            partsSelections: [],
            extraColorCount: 0,
            currentStep: ConsultationStep.SUMMARY,
          },
          totalPrice: finalPrice,
          estimatedMinutes: 0,
          finalPrice,
          createdAt: now,
          updatedAt: now,
          finalizedAt: now,
          isQuickSale: true,
          notes,
        };
        set((state) => ({
          records: [record, ...state.records],
        }));
        return dbUpsertRecord(record).catch((err: unknown) => {
          console.error(err);
          throw err;
        });
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
