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
import { useCustomerStore } from '@/store/customer-store';
import { useShopStore } from '@/store/shop-store';
import type { TreatmentHistory } from '@/types/customer';
import type { DesignScope } from '@/types/consultation';
import { getTodayInKorea } from '@/lib/format';

interface RecordsStore {
  records: ConsultationRecord[];
  _dbReady: boolean;

  hydrateFromDB: () => Promise<void>;
  addRecord: (record: ConsultationRecord) => Promise<void>;
  addQuickSaleRecord: (params: {
    id: string;
    shopId: string;
    designerId: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    serviceType?: string;
    finalPrice: number;
    notes?: string;
    paymentMethod?: import('@/types/consultation').PaymentMethod;
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
          // N-6: DB 실패 시 로컬 롤백
          set((state) => ({
            records: state.records.filter((r) => r.id !== record.id),
          }));
          console.error(err);
          throw err;
        });
      },

      addQuickSaleRecord: ({ id, shopId, designerId, customerId, customerName, customerPhone, serviceType, finalPrice, notes, paymentMethod }) => {
        const now = getNowInKoreaIso();
        const today = getTodayInKorea();

        const SERVICE_TO_DESIGN_SCOPE: Record<string, DesignScope> = {
          '원컬러': 'solid_tone',
          '그라데이션': 'solid_point',
          '프렌치': 'solid_point',
          '아트': 'full_art',
          '자석젤': 'solid_tone',
          '케어': 'solid_tone',
          '리페어': 'solid_tone',
          '연장': 'solid_tone',
          '기타': 'solid_tone',
        };
        const designScope: DesignScope =
          (serviceType ? SERVICE_TO_DESIGN_SCOPE[serviceType] : undefined) ?? 'solid_tone';

        const record: ConsultationRecord = {
          id,
          shopId,
          designerId,
          customerId: customerId ?? '',
          consultation: {
            bodyPart: 'hand',
            offType: 'none',
            extensionType: 'none',
            nailShape: 'round',
            designScope,
            expressions: [],
            hasParts: false,
            partsSelections: [],
            extraColorCount: 0,
            currentStep: ConsultationStep.SUMMARY,
            customerName,
            customerPhone,
          },
          totalPrice: finalPrice,
          estimatedMinutes: 0,
          finalPrice,
          createdAt: now,
          updatedAt: now,
          finalizedAt: now,
          isQuickSale: true,
          notes,
          paymentMethod,
        };
        // N-15: customerId 없고 customerName 있으면 전화→이름 순으로 매칭, 없으면 신규 고객 생성
        let effectiveCustomerId = customerId;
        if (!customerId && customerName) {
          const customerStore = useCustomerStore.getState();
          const matchedByPhone = customerPhone
            ? customerStore.findByPhoneNormalized(customerPhone)
            : undefined;
          if (matchedByPhone) {
            effectiveCustomerId = matchedByPhone.id;
          } else {
            const matchedByName = customerStore.customers.find((c) => c.name === customerName);
            if (matchedByName) {
              effectiveCustomerId = matchedByName.id;
            } else {
              const newCustomer = customerStore.createCustomer({
                name: customerName,
                phone: customerPhone || undefined,
              });
              effectiveCustomerId = newCustomer.id;
            }
          }
        }

        const recordWithEffectiveId: ConsultationRecord = effectiveCustomerId !== customerId
          ? { ...record, customerId: effectiveCustomerId ?? '' }
          : record;

        set((state) => ({
          records: [recordWithEffectiveId, ...state.records],
        }));

        // 고객 통계 갱신
        if (effectiveCustomerId) {
          const customerStore = useCustomerStore.getState();
          const customer = customerStore.getById(effectiveCustomerId);
          if (customer) {
            const newVisitCount = customer.visitCount + 1;
            const newTotalSpend = customer.totalSpend + finalPrice;
            const newAverageSpend = Math.round(newTotalSpend / newVisitCount);
            const designerName = useShopStore.getState().getDesignerName(designerId);
            const historyEntry: TreatmentHistory = {
              recordId: id,
              date: today,
              bodyPart: 'hand',
              designScope: serviceType ?? '기타',
              price: finalPrice,
              designerName,
              imageUrls: [],
            };
            customerStore.updateCustomer(effectiveCustomerId, {
              visitCount: newVisitCount,
              totalSpend: newTotalSpend,
              averageSpend: newAverageSpend,
              lastVisitDate: today,
              treatmentHistory: [...customer.treatmentHistory, historyEntry],
            });
          }
        }

        return dbUpsertRecord(recordWithEffectiveId).catch((err: unknown) => {
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
        const record = get().records.find((r) => r.id === id);
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
        if (record?.customerId && record.finalizedAt) {
          const customerStore = useCustomerStore.getState();
          const customer = customerStore.getById(record.customerId);
          if (customer) {
            customerStore.updateCustomer(record.customerId, {
              totalSpend: Math.max(0, customer.totalSpend - record.finalPrice),
              visitCount: Math.max(0, (customer.visitCount ?? 0) - 1),
            });
          }
        }
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
