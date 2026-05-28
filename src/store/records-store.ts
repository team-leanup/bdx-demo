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
  dbUpsertCustomer,
  dbDeleteRecord,
} from '@/lib/db';
import type { Customer } from '@/types/customer';
import { useCustomerStore } from '@/store/customer-store';
import { useShopStore } from '@/store/shop-store';
import type { DesignScope } from '@/types/consultation';
import { getTodayInKorea } from '@/lib/format';
import { designCategoryToScope } from '@/lib/category-mapping';
import type { DesignCategory } from '@/types/pre-consultation';
import { estimateTime } from '@/lib/time-calculator';

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
    secondaryPaymentMethod?: 'cash' | 'card';
    secondaryAmount?: number;
    /**
     * 0428 P1-1: 회원권에서 차감된 금액 (있을 경우).
     * totalSpend 누적 시 finalPrice + membershipApplied로 시술 전액을 기록.
     */
    membershipApplied?: number;
    /** 0528 N2 — 업셀링 매출 (사전상담 추가옵션 + 시술 중 추가) */
    upsellAmount?: number;
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

      addQuickSaleRecord: ({ id, shopId, designerId, customerId, customerName, customerPhone, serviceType, finalPrice, notes, paymentMethod, secondaryPaymentMethod, secondaryAmount, membershipApplied, upsellAmount, bookingId, saleDate, saleTime }) => {
        const now = getNowInKoreaIso();
        const today = getTodayInKorea();
        // 0529 MED-6: saleTime 미지정 시 12:00 고정 → 현재 KST 시각으로 변경.
        // 시간대 분포 차트에서 12시 카운트가 부풀려지는 문제 해결.
        const nowKstHHmm = (() => {
          const m = now.match(/T(\d{2}):(\d{2})/);
          return m ? `${m[1]}:${m[2]}` : '12:00';
        })();
        const effectiveCreatedAt = saleDate
          ? `${saleDate}T${saleTime || nowKstHHmm}:00+09:00`
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

        const consultationSnapshot = {
          bodyPart: 'hand' as const,
          offType: 'none' as const,
          extensionType: 'none' as const,
          nailShape: 'round' as const,
          designScope,
          // N3: 원본 카테고리 보존 — 통계 라벨 정확도
          designCategory: category,
          expressions: [],
          hasParts: false,
          partsSelections: [],
          extraColorCount: 0,
          currentStep: ConsultationStep.SUMMARY,
          customerName,
          customerPhone,
          bookingId,
        };
        const record: ConsultationRecord = {
          id,
          shopId,
          designerId,
          customerId: customerId ?? '',
          consultation: consultationSnapshot,
          totalPrice: finalPrice,
          estimatedMinutes: estimateTime(consultationSnapshot),
          finalPrice,
          createdAt: effectiveCreatedAt,
          updatedAt: now,
          finalizedAt: effectiveCreatedAt,
          isQuickSale: true,
          notes,
          paymentMethod,
          secondaryPaymentMethod,
          secondaryAmount,
          membershipApplied,
          upsellAmount,
        };
        // 0528 — customer FK 보장: customerId 없으면 무조건 customer 자동 생성/매칭
        // (consultation_records.customer_id NOT NULL + FK 위반 방지)
        let effectiveCustomerId = customerId;
        let pendingCustomerInsert: Customer | null = null;
        if (!customerId) {
          const customerStore = useCustomerStore.getState();
          const matchedByPhone = customerPhone
            ? customerStore.findByPhoneNormalized(customerPhone)
            : undefined;
          if (matchedByPhone) {
            effectiveCustomerId = matchedByPhone.id;
          } else if (customerName) {
            const matchedByName = customerStore.customers.find((c) => c.name === customerName);
            if (matchedByName) {
              effectiveCustomerId = matchedByName.id;
            } else {
              const newCustomer = customerStore.createCustomer({
                name: customerName,
                phone: customerPhone || undefined,
              });
              effectiveCustomerId = newCustomer.id;
              pendingCustomerInsert = newCustomer;
            }
          } else {
            // 워크인 손님 — 기존 '워크인 손님' customer 있으면 재사용 (매출 누적)
            const existingWalkIn = customerStore.customers.find((c) => c.name === '워크인 손님');
            if (existingWalkIn) {
              effectiveCustomerId = existingWalkIn.id;
            } else {
              const newCustomer = customerStore.createCustomer({
                name: '워크인 손님',
                phone: customerPhone || undefined,
              });
              effectiveCustomerId = newCustomer.id;
              pendingCustomerInsert = newCustomer;
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
        // 0428 P1-1: 회원권 차감분(membershipApplied) + finalPrice = 시술 전액으로 totalSpend 누적
        if (effectiveCustomerId) {
          const customerStore = useCustomerStore.getState();
          const designerName = useShopStore.getState().getDesignerName(designerId);
          const totalServicePrice = finalPrice + (membershipApplied ?? 0);
          customerStore.recordTreatmentCompletion(effectiveCustomerId, totalServicePrice, {
            recordId: id,
            date: effectiveDate,
            bodyPart: 'hand',
            designScope: serviceType ?? '기타',
            price: totalServicePrice,
            designerName,
            imageUrls: [],
          });
        }

        // 0528 N4: 신규 customer는 DB에 먼저 저장 보장 (race condition 방지)
        // customer-store의 dbUpsertCustomer는 fire-and-forget이라 record insert가 먼저 실행되면 FK 위반.
        const ensureCustomerInDB = pendingCustomerInsert
          ? dbUpsertCustomer(pendingCustomerInsert)
          : Promise.resolve({ success: true } as { success: boolean; error?: string });

        return ensureCustomerInDB.then(() => dbUpsertRecord(recordWithEffectiveId)).then((result) => {
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
            const filteredHistory = (customer.treatmentHistory ?? []).filter(
              (h) => h.recordId !== id,
            );
            const newVisitCount = Math.max(0, (customer.visitCount ?? 0) - 1);
            // 0529 CRIT-1: addQuickSaleRecord에서 totalSpend는 finalPrice + membershipApplied로 누적되므로
            // 삭제 롤백도 동일하게 finalPrice + membershipApplied를 차감해야 함
            const rollbackAmount = record.finalPrice + (record.membershipApplied ?? 0);
            const newTotalSpend = Math.max(0, customer.totalSpend - rollbackAmount);
            customerStore.updateCustomer(record.customerId, {
              totalSpend: newTotalSpend,
              visitCount: newVisitCount,
              averageSpend: newVisitCount > 0 ? Math.round(newTotalSpend / newVisitCount) : 0,
              treatmentHistory: filteredHistory,
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
