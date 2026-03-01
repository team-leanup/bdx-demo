'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConsultationRecord } from '@/types/consultation';
import { MOCK_CONSULTATIONS } from '@/data/mock-consultations';

interface RecordsStore {
  additionalRecords: ConsultationRecord[];
  addRecord: (record: ConsultationRecord) => void;
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
      getAllRecords: () => [...get().additionalRecords, ...MOCK_CONSULTATIONS],
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
