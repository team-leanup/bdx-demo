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
import type { DesignScope } from '@/types/consultation';
import { getTodayInKorea } from '@/lib/format';
import { designCategoryToScope } from '@/lib/category-mapping';
import type { DesignCategory } from '@/types/pre-consultation';

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
    bookingId?: string;
    saleDate?: string;
    saleTime?: string;
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
        if (currentShopId === 'shop-demo') {
          const { DEMO_RECORDS } = await import('@/data/mock-demo-data');
          const demoMap = new Map(DEMO_RECORDS.map((r) => [r.id, r]));
          // demo-* IDs: DEMO_RECORDS canonical (매번 today 기준 재계산된 날짜 적용)
          const updated = dbRecords.map((r) => demoMap.get(r.id) ?? r);
          const existingIds = new Set(updated.map((r) => r.id));
          const merged = [
            ...updated,
            ...DEMO_RECORDS.filter((r) => !existingIds.has(r.id)),
          ];
          set({ records: merged, _dbReady: true });
          return;
        }
        set({ records: dbRecords, _dbReady: true });
      },

      addRecord: (record) => {
        set((state) => ({
          records: [record, ...state.records],
        }));
        return dbUpsertRecord(record).then((result) => {
          if (!result.success) {
            // N-6: DB 실패 시 로컬 롤백
            set((state) => ({
              records: state.records.filter((r) => r.id !== record.id),
            }));
            throw new Error('[records] DB insert failed for record ' + record.id);
          }
        });
      },

      addQuickSaleRecord: ({ id, shopId, designerId, customerId, customerName, customerPhone, serviceType, finalPrice, notes, paymentMethod, bookingId, saleDate, saleTime }) => {
        const now = getNowInKoreaIso();
        const today = getTodayInKorea();
        // 사용자가 날짜/시간을 지정한 경우 해당 값으로 createdAt 생성
        const effectiveCreatedAt = saleDate
          ? `${saleDate}T${saleTime || '12:00'}:00+09:00`
          : now;
        const effectiveDate = saleDate || today;

        const SERVICE_TO_CATEGORY: Record<string, DesignCategory> = {
          '원컬러': 'simple',
          '그라데이션': 'french',
          '프렌치': 'french',
          '아트': 'art',
          '자석젤': 'magnet',
          '자석': 'magnet',
          '케어': 'simple',
          '리페어': 'simple',
          '연장': 'simple',
          '기타': 'simple',
          '심플': 'simple',
        };
        const category: DesignCategory =
          (serviceType ? SERVICE_TO_CATEGORY[serviceType] : undefined) ?? 'simple';
        const designScope: DesignScope = designCategoryToScope(category);

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
            bookingId,
          },
          totalPrice: finalPrice,
          estimatedMinutes: 0,
          finalPrice,
          createdAt: effectiveCreatedAt,
          updatedAt: now,
          finalizedAt: effectiveCreatedAt,
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
          const designerName = useShopStore.getState().getDesignerName(designerId);
          customerStore.recordTreatmentCompletion(effectiveCustomerId, finalPrice, {
            recordId: id,
            date: effectiveDate,
            bodyPart: 'hand',
            designScope: serviceType ?? '기타',
            price: finalPrice,
            designerName,
            imageUrls: [],
          });
        }

        return dbUpsertRecord(recordWithEffectiveId).then((result) => {
          if (!result.success) {
            throw new Error('[records] DB insert failed for quick sale record ' + id);
          }
        });
      },

      updateRecord: (id, patch) => {
        const previous = get().records.find((r) => r.id === id);
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
          dbUpsertRecord(updated).then((result) => {
            if (!result.success && previous) {
              // Rollback on DB failure
              set((state) => ({
                records: state.records.map((r) => (r.id === id ? previous : r)),
              }));
              console.warn('[records] DB update failed, rolled back local change for', id);
            }
          });
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
      partialize: (state) => {
        const { _dbReady: _, ...rest } = state;
        return rest;
      },
    },
  ),
);
