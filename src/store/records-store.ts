'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConsultationRecord } from '@/types/consultation';
import { MOCK_CONSULTATIONS } from '@/data/mock-consultations';

interface RecordsStore {
  additionalRecords: ConsultationRecord[];
  addRecord: (record: ConsultationRecord) => void;
  updateRecord: (id: string, patch: Partial<ConsultationRecord>) => void;
  removeRecord: (id: string) => void;
  getRecordById: (id: string) => ConsultationRecord | undefined;
  getAllRecords: () => ConsultationRecord[];
}

export const useRecordsStore = create<RecordsStore>()(
  persist(
    (set, get) => ({
      additionalRecords: [],
      addRecord: (record) =>
        set((state) => ({
          additionalRecords: [record, ...state.additionalRecords],
        })),
      updateRecord: (id, patch) =>
        set((state) => {
          const now = new Date().toISOString();
          const existing = state.additionalRecords.find((record) => record.id === id);

          if (existing) {
            return {
              additionalRecords: state.additionalRecords.map((record) =>
                record.id === id
                  ? { ...existing, ...patch, updatedAt: now }
                  : record,
              ),
            };
          }

          const mockRecord = MOCK_CONSULTATIONS.find((record) => record.id === id);
          if (!mockRecord) {
            return state;
          }

          const updatedRecord: ConsultationRecord = {
            ...mockRecord,
            ...patch,
            updatedAt: now,
          };

          return {
            additionalRecords: [
              updatedRecord,
              ...state.additionalRecords.filter((record) => record.id !== id),
            ],
          };
        }),
      removeRecord: (id) =>
        set((state) => ({
          additionalRecords: state.additionalRecords.filter((r) => r.id !== id),
        })),
      getRecordById: (id) =>
        get().additionalRecords.find((record) => record.id === id)
        ?? MOCK_CONSULTATIONS.find((record) => record.id === id),
      getAllRecords: () => {
        const additionalRecords = get().additionalRecords;
        const additionalIds = new Set(additionalRecords.map((record) => record.id));
        return [
          ...additionalRecords,
          ...MOCK_CONSULTATIONS.filter((record) => !additionalIds.has(record.id)),
        ];
      },
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
