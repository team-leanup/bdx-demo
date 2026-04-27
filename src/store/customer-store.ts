'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Customer, CustomerTag, SmallTalkNote, TagAccent, Membership, MembershipTransaction } from '@/types/customer';
import { useAuthStore } from '@/store/auth-store';
import { getNowInKoreaIso, getTodayInKorea } from '@/lib/format';
import {
  fetchCustomers,
  dbUpsertCustomer,
  dbUpsertCustomerTags,
  dbInsertSmallTalkNote,
  dbInsertMembershipTransaction,
} from '@/lib/db';
import { generateId } from '@/lib/generate-id';
import { getRemainingAmount } from '@/lib/membership';

interface LegacyCustomerTagAccent {
  accentColor?: TagAccent;
}

interface CustomerStore {
  customers: Customer[];
  _dbReady: boolean;
  /** 0428 P0-4: 최근 회원권 차감 DB sync 에러 (UI에서 toast 띄우는 용도) */
  membershipSyncError: { customerId: string; message: string; at: string } | null;

  hydrateFromDB: () => Promise<void>;
  clearMembershipSyncError: () => void;

  getById: (id: string) => Customer | undefined;
  findByPhoneNormalized: (phone: string) => Customer | undefined;

  createCustomer: (input: Partial<Customer>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  updateTags: (customerId: string, nextTags: CustomerTag[]) => void;

  toggleTagPinned: (customerId: string, tagId: string) => void;
  setTagAccent: (customerId: string, tagId: string, accent: TagAccent | undefined) => void;
  reorderPinnedTags: (customerId: string, orderedTagIds: string[]) => void;
  getPinnedTags: (customerId: string) => CustomerTag[];
  getPrimaryTags: (customerId: string) => CustomerTag[];

  appendSmallTalkNote: (customerId: string, note: SmallTalkNote) => void;

  addMembership: (customerId: string, membership: Membership) => void;
  /**
   * 시술 1건에 대한 회원권 차감.
   * - `amount`: 이번 시술에 회원권에서 실제 차감할 금액(원). 없으면 1회 단가로 추정(하위 호환).
   * - 횟수도 함께 1회 차감.
   */
  useMembershipSession: (customerId: string, recordId?: string, amount?: number) => void;
  manualDeductMembership: (customerId: string, count: number, note?: string) => void;
  updateMembership: (customerId: string, updates: Partial<Membership>) => void;

  recordTreatmentCompletion: (
    customerId: string,
    finalPrice: number,
    historyEntry?: {
      recordId: string;
      date: string;
      bodyPart: string;
      designScope: string;
      price: number;
      designerName?: string;
      imageUrls?: string[];
    },
  ) => void;
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function normalizePhoneRaw(phone: string | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

function sortTagsByPriority(tags: CustomerTag[]): CustomerTag[] {
  return [...tags].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }

    const sortDiff = (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER);
    if (sortDiff !== 0) {
      return sortDiff;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

function normalizeCustomerTags(tags: CustomerTag[] | undefined): CustomerTag[] {
  return (tags ?? []).map((tag) => {
    const legacyTag = tag as CustomerTag & LegacyCustomerTagAccent;
    if (legacyTag.accent || !legacyTag.accentColor) {
      return legacyTag;
    }

    return {
      ...legacyTag,
      accent: legacyTag.accentColor,
    };
  });
}

function normalizeCustomer(customer: Customer): Customer {
  return {
    ...customer,
    tags: normalizeCustomerTags(customer.tags),
  };
}

const DEMO_GOLDEN_TIME_CUSTOMERS: Customer[] = [
  {
    id: 'demo-golden-minji-001',
    shopId: 'shop-1773300748626-x8a073',
    name: '데모 골든 김민지',
    phone: '010-5512-3401',
    assignedDesignerId: 'designer-demo-002',
    assignedDesignerName: '민서',
    firstVisitDate: '2025-11-20',
    lastVisitDate: '2026-02-09',
    visitCount: 5,
    averageSpend: 89000,
    totalSpend: 445000,
    tags: [],
    smallTalkNotes: [],
    treatmentHistory: [
      {
        recordId: 'demo-golden-record-001',
        date: '2026-02-09',
        bodyPart: 'hand',
        designScope: '프리미엄 아트',
        price: 92000,
        designerName: '민서',
        imageUrls: [],
        colorLabels: ['밀크핑크', '실버'],
        partsUsed: ['진주 파츠'],
      },
      {
        recordId: 'demo-golden-record-000',
        date: '2026-01-10',
        bodyPart: 'hand',
        designScope: '이달의 아트',
        price: 86000,
        designerName: '민서',
        imageUrls: [],
        colorLabels: ['누드베이지'],
        partsUsed: [],
      },
    ],
    isRegular: true,
    regularSince: '2025-12-20',
    visitFrequency: 'monthly',
    preferredLanguage: 'ko',
    createdAt: '2026-03-15T12:00:00+09:00',
    updatedAt: '2026-03-15T12:00:00+09:00',
  },
  {
    id: 'demo-golden-yuna-001',
    shopId: 'shop-1773300748626-x8a073',
    name: '데모 골든 박유나',
    phone: '010-6734-1182',
    assignedDesignerId: 'designer-demo-003',
    assignedDesignerName: '하윤',
    firstVisitDate: '2025-12-03',
    lastVisitDate: '2026-02-12',
    visitCount: 3,
    averageSpend: 74000,
    totalSpend: 222000,
    tags: [],
    smallTalkNotes: [],
    treatmentHistory: [
      {
        recordId: 'demo-golden-record-002',
        date: '2026-02-12',
        bodyPart: 'foot',
        designScope: '원컬러',
        price: 73000,
        designerName: '하윤',
        imageUrls: [],
        colorLabels: ['딥레드'],
        partsUsed: [],
      },
      {
        recordId: 'demo-golden-record-001b',
        date: '2026-01-15',
        bodyPart: 'foot',
        designScope: '그라데이션',
        price: 76000,
        designerName: '하윤',
        imageUrls: [],
        colorLabels: ['와인'],
        partsUsed: [],
      },
    ],
    isRegular: true,
    regularSince: '2026-01-15',
    visitFrequency: 'monthly',
    preferredLanguage: 'ko',
    createdAt: '2026-03-15T12:00:00+09:00',
    updatedAt: '2026-03-15T12:00:00+09:00',
  },
  {
    id: 'demo-golden-sohee-001',
    shopId: 'shop-1773300748626-x8a073',
    name: '데모 골든 한소희',
    phone: '010-8891-5524',
    assignedDesignerId: '9a0ce791-7906-4476-811b-be48f7dee2c8',
    assignedDesignerName: '데모 원장',
    firstVisitDate: '2025-10-28',
    lastVisitDate: '2026-02-15',
    visitCount: 6,
    averageSpend: 101000,
    totalSpend: 606000,
    tags: [],
    smallTalkNotes: [],
    treatmentHistory: [
      {
        recordId: 'demo-golden-record-003',
        date: '2026-02-15',
        bodyPart: 'hand',
        designScope: '시그니처 아트',
        price: 109000,
        designerName: '데모 원장',
        imageUrls: [],
        colorLabels: ['로즈브라운', '골드'],
        partsUsed: ['메탈 파츠'],
      },
      {
        recordId: 'demo-golden-record-002b',
        date: '2026-01-18',
        bodyPart: 'hand',
        designScope: '프렌치',
        price: 93000,
        designerName: '데모 원장',
        imageUrls: [],
        colorLabels: ['누드핑크'],
        partsUsed: [],
      },
    ],
    isRegular: true,
    regularSince: '2025-12-01',
    visitFrequency: 'monthly',
    preferredLanguage: 'ko',
    createdAt: '2026-03-15T12:00:00+09:00',
    updatedAt: '2026-03-15T12:00:00+09:00',
  },
];

function mergeDemoGoldenTimeCustomers(customers: Customer[], shopId: string | null): Customer[] {
  if (shopId !== 'shop-1773300748626-x8a073') {
    return customers;
  }

  const existingIds = new Set(customers.map((customer) => customer.id));
  const missingDemoCustomers = DEMO_GOLDEN_TIME_CUSTOMERS.filter(
    (customer) => !existingIds.has(customer.id),
  );

  return [...customers, ...missingDemoCustomers];
}

function deduplicateByName(customers: Customer[]): Customer[] {
  const map = new Map<string, Customer>();
  for (const c of customers) {
    const key = c.name.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing || (c.visitCount ?? 0) > (existing.visitCount ?? 0)) {
      map.set(key, c);
    }
  }
  return Array.from(map.values());
}

async function loadDemoCustomers(customers: Customer[], shopId: string | null): Promise<Customer[]> {
  if (shopId !== 'shop-demo') return customers;
  const { DEMO_CUSTOMERS } = await import('@/data/mock-demo-data');
  const demoMap = new Map(DEMO_CUSTOMERS.map((c) => [c.id, c]));
  // Merge demo data into existing customers.
  // - preference / durationPreference: demo 값 우선
  // - tags: 기존 tags가 비어있으면 demo 시드를 채워넣음 (수동 추가한 태그는 유지)
  // - membership: 기존 membership이 없으면 demo 시드를 채워넣음 (데모 회원권 체험용)
  const merged = customers.map((c) => {
    const demo = demoMap.get(c.id);
    if (!demo) return c;
    return {
      ...c,
      preference: demo.preference ?? c.preference,
      durationPreference: demo.durationPreference ?? c.durationPreference,
      tags: (c.tags && c.tags.length > 0) ? c.tags : (demo.tags ?? []),
      membership: c.membership ?? demo.membership,
    };
  });
  const existingIds = new Set(merged.map((c) => c.id));
  const missing = DEMO_CUSTOMERS.filter((c) => !existingIds.has(c.id));
  return deduplicateByName([...merged, ...missing]);
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      _dbReady: false,
      membershipSyncError: null,

      clearMembershipSyncError: () => set({ membershipSyncError: null }),

      hydrateFromDB: async () => {
        const currentShopId = useAuthStore.getState().currentShopId;
        const dbCustomers = await fetchCustomers(currentShopId);
        const withGolden = mergeDemoGoldenTimeCustomers(
          dbCustomers.map(normalizeCustomer),
          currentShopId,
        );
        const withDemo = await loadDemoCustomers(withGolden, currentShopId);
        set({ customers: withDemo, _dbReady: true });
      },

      getById: (id) => get().customers.find((c) => c.id === id),

      findByPhoneNormalized: (phone) => {
        const key = normalizePhoneRaw(phone);
        return get().customers.find((c) => normalizePhoneRaw(c.phone) === key);
      },

      createCustomer: (input) => {
        const nowIso = getNowInKoreaIso();
        const today = getTodayInKorea();
        const id = input.id ?? `customer-${Date.now()}`;
        const activeShopId = input.shopId ?? useAuthStore.getState().currentShopId;

        if (!activeShopId) {
          throw new Error('No active shop session');
        }

        const next: Customer = {
          id,
          shopId: activeShopId,
          name: input.name ?? '새 고객',
          phone: input.phone ?? '',
          assignedDesignerId: input.assignedDesignerId,
          assignedDesignerName: input.assignedDesignerName,
          firstVisitDate: input.firstVisitDate ?? today,
          lastVisitDate: input.lastVisitDate ?? today,
          visitCount: input.visitCount ?? 0,
          averageSpend: input.averageSpend ?? 0,
          totalSpend: input.totalSpend ?? 0,
          tags: input.tags ? deepClone(input.tags) : [],
          smallTalkNotes: input.smallTalkNotes ? deepClone(input.smallTalkNotes) : [],
          preference: input.preference,
          treatmentHistory: input.treatmentHistory ? deepClone(input.treatmentHistory) : [],
          profileImageUrl: input.profileImageUrl,
          isRegular: input.isRegular,
          regularSince: input.regularSince,
          visitFrequency: input.visitFrequency,
          membership: input.membership,
          createdAt: input.createdAt ?? nowIso,
          updatedAt: input.updatedAt ?? nowIso,
        };

        set((state) => ({ customers: [...state.customers, next] }));

        dbUpsertCustomer(next).catch((err) => {
          console.error('[customer-store] createCustomer DB sync failed:', err);
        });
        dbUpsertCustomerTags(next.id, next.tags ?? []).catch((err) => {
          console.error('[customer-store] createCustomer tags DB sync failed:', err);
        });

        return next;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: getNowInKoreaIso() } : c,
          ),
        }));
        const updated = get().customers.find((c) => c.id === id);
        if (updated) {
          dbUpsertCustomer(updated).catch((err) => {
            console.error('[customer-store] updateCustomer DB sync failed:', err);
          });
        }
      },

      updateTags: (customerId, nextTags) => {
        set((state) => ({
          customers: state.customers.map((c) =>
              c.id === customerId
                ? { ...c, tags: deepClone(nextTags), updatedAt: getNowInKoreaIso() }
                : c,
            ),
        }));
        dbUpsertCustomerTags(customerId, nextTags).catch(console.error);
      },

      appendSmallTalkNote: (customerId, note) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const nextNotes = [...(c.smallTalkNotes ?? []), note];
            return { ...c, smallTalkNotes: nextNotes, updatedAt: getNowInKoreaIso() };
          }),
        }));
        dbInsertSmallTalkNote(note).catch(console.error);
      },

      toggleTagPinned: (customerId, tagId) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const tags = (c.tags ?? []).map((t) => {
              if (t.id !== tagId) return t;
              const nowPinned = !t.pinned;
              return {
                ...t,
                pinned: nowPinned,
                sortOrder: nowPinned ? (c.tags?.filter((x) => x.pinned).length ?? 0) : undefined,
                accent: t.accent,
              };
            });
            return { ...c, tags, updatedAt: getNowInKoreaIso() };
          }),
        }));
        const updated = get().customers.find((c) => c.id === customerId);
        if (updated) {
          dbUpsertCustomerTags(customerId, updated.tags ?? []).catch(console.error);
        }
      },

      setTagAccent: (customerId, tagId, accent) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const tags = (c.tags ?? []).map((t) =>
              t.id === tagId ? { ...t, accent } : t,
            );
            return { ...c, tags, updatedAt: getNowInKoreaIso() };
          }),
        }));
        const updated = get().customers.find((c) => c.id === customerId);
        if (updated) {
          dbUpsertCustomerTags(customerId, updated.tags ?? []).catch(console.error);
        }
      },

      reorderPinnedTags: (customerId, orderedTagIds) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const orderMap = new Map(orderedTagIds.map((id, i) => [id, i]));
            const tags = (c.tags ?? []).map((t) => {
              if (!t.pinned) return t;
              const newOrder = orderMap.get(t.id);
              return newOrder !== undefined ? { ...t, sortOrder: newOrder } : t;
            });
            return { ...c, tags, updatedAt: getNowInKoreaIso() };
          }),
        }));
        const updated = get().customers.find((c) => c.id === customerId);
        if (updated) {
          dbUpsertCustomerTags(customerId, updated.tags ?? []).catch(console.error);
        }
      },

      getPinnedTags: (customerId) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) return [];
        return sortTagsByPriority((customer.tags ?? []).filter((t) => t.pinned));
      },

      getPrimaryTags: (customerId) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) return [];
        return sortTagsByPriority(customer.tags ?? []);
      },

      addMembership: (customerId, membership) => {
        // 0428: 수정 케이스에서 기존 status / transactions 보존
        const existing = get().customers.find((c) => c.id === customerId)?.membership;
        const isUpdate = !!existing && existing.id === membership.id;
        // 0423 반영: 금액 기반 잔액이 누락된 경우 구매금액으로 초기화
        const normalized: Membership = {
          ...membership,
          usedAmount: membership.usedAmount ?? 0,
          remainingAmount: membership.remainingAmount ?? membership.purchaseAmount,
          // 0428 P0-3: 수정 시 호출자가 status를 명시 안 했으면 기존 status 유지
          status: isUpdate ? (membership.status ?? existing.status) : (membership.status ?? 'active'),
        };
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            return { ...c, membership: normalized, updatedAt: getNowInKoreaIso() };
          }),
        }));
        const updated = get().customers.find((c) => c.id === customerId);
        if (updated) {
          dbUpsertCustomer(updated).catch(console.error);
          const shopId = useAuthStore.getState().currentShopId;
          // 0428: 수정 케이스에서는 purchase 트랜잭션 중복 생성 방지
          if (shopId && !isUpdate) {
            dbInsertMembershipTransaction({
              id: generateId('txn'),
              customerId,
              shopId,
              date: getTodayInKorea(),
              type: 'purchase',
              sessionsDelta: normalized.totalSessions,
              amountDelta: normalized.purchaseAmount,
            }).catch(console.error);
          }
        }
      },

      useMembershipSession: (customerId, recordId, amount) => {
        // M-8: txnId를 한 번만 생성하여 로컬/DB 트랜잭션 ID 통일
        const txnId = generateId('txn');
        let deductedAmount = 0;
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const m = c.membership;
            if (!m) return c;
            // 0423: 잔액 기반 정책 — 횟수 카운터가 0이어도 잔액 남아있으면 허용
            const prevRemainingAmount = typeof m.remainingAmount === 'number'
              ? m.remainingAmount
              : (m.totalSessions > 0
                ? Math.round(m.purchaseAmount * (m.remainingSessions / m.totalSessions))
                : 0);
            if (prevRemainingAmount <= 0) return c;
            const prevUsedAmount = typeof m.usedAmount === 'number'
              ? m.usedAmount
              : Math.max(0, m.purchaseAmount - prevRemainingAmount);
            const estimateUnitPrice = m.totalSessions > 0
              ? Math.floor(m.purchaseAmount / m.totalSessions)
              : prevRemainingAmount;
            const requested = typeof amount === 'number' && Number.isFinite(amount) && amount >= 0
              ? amount
              : estimateUnitPrice;
            deductedAmount = Math.max(0, Math.min(prevRemainingAmount, Math.round(requested)));

            const transaction: MembershipTransaction = {
              id: txnId,
              date: getTodayInKorea(),
              type: 'use',
              sessionsDelta: -1,
              amountDelta: deductedAmount > 0 ? -deductedAmount : undefined,
              recordId,
            };

            // 0423: 횟수 카운터는 음수로 가지 않도록 clamp
            const remainingSessions = Math.max(0, m.remainingSessions - 1);
            const usedSessions = m.usedSessions + 1;
            const remainingAmount = Math.max(0, prevRemainingAmount - deductedAmount);
            const usedAmount = prevUsedAmount + deductedAmount;
            // 잔액 0원이면 소진 (횟수 카운터와 무관하게 금액 기준)
            const status: Membership['status'] =
              remainingAmount === 0 ? 'used_up' : m.status;

            const updatedMembership: Membership = {
              ...m,
              remainingSessions,
              usedSessions,
              remainingAmount,
              usedAmount,
              status,
              transactions: [...(m.transactions ?? []), transaction],
            };

            return { ...c, membership: updatedMembership, updatedAt: getNowInKoreaIso() };
          }),
        }));
        const updated = get().customers.find((c) => c.id === customerId);
        if (updated) {
          // 0428 P0-4: DB sync 에러를 store에 노출 (UI toast로 표시)
          const shopId = useAuthStore.getState().currentShopId;
          const dbCalls: Promise<unknown>[] = [dbUpsertCustomer(updated)];
          if (shopId) {
            dbCalls.push(
              dbInsertMembershipTransaction({
                id: txnId,
                customerId,
                shopId,
                date: getTodayInKorea(),
                type: 'use',
                sessionsDelta: -1,
                amountDelta: deductedAmount > 0 ? -deductedAmount : undefined,
                recordId,
              }),
            );
          }
          Promise.all(dbCalls).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : '회원권 차감 동기화 실패';
            console.error('[membership] sync failed:', err);
            set({
              membershipSyncError: {
                customerId,
                message,
                at: getNowInKoreaIso(),
              },
            });
          });
        }
      },

      manualDeductMembership: (customerId, count, note) => {
        if (!Number.isFinite(count) || count <= 0) return;
        const txnId = generateId('txn');
        const today = getTodayInKorea();
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const m = c.membership;
            if (!m) return c;
            // 0428: 잔액 기반 정책 통일 — useMembershipSession과 동일하게 잔액 0이면 차단
            if (getRemainingAmount(m) <= 0) return c;

            // 횟수 카운터가 이미 0이어도 잔액 남으면 1회만 사용한 것으로 처리
            const safeRemainingSessions = Math.max(1, m.remainingSessions);
            const actualDeduct = Math.min(count, safeRemainingSessions);
            // 0423: 금액도 비례 차감 (1회 단가 × 차감 횟수)
            const prevRemainingAmount = typeof m.remainingAmount === 'number'
              ? m.remainingAmount
              : (m.totalSessions > 0
                ? Math.round(m.purchaseAmount * (m.remainingSessions / m.totalSessions))
                : 0);
            const prevUsedAmount = typeof m.usedAmount === 'number'
              ? m.usedAmount
              : Math.max(0, m.purchaseAmount - prevRemainingAmount);
            const unitPrice = m.totalSessions > 0
              ? Math.floor(m.purchaseAmount / m.totalSessions)
              : 0;
            const deductedAmount = Math.min(prevRemainingAmount, unitPrice * actualDeduct);

            const transaction: MembershipTransaction = {
              id: txnId,
              date: today,
              type: 'manual_deduct',
              sessionsDelta: -actualDeduct,
              amountDelta: deductedAmount > 0 ? -deductedAmount : undefined,
              note: note?.trim() || undefined,
            };

            const remainingSessions = Math.max(0, m.remainingSessions - actualDeduct);
            const usedSessions = m.usedSessions + actualDeduct;
            const remainingAmount = Math.max(0, prevRemainingAmount - deductedAmount);
            const usedAmount = prevUsedAmount + deductedAmount;
            // 0423: 잔액 0원이면 소진 (횟수 카운터와 무관하게 금액 기준)
            const status: Membership['status'] =
              remainingAmount === 0 ? 'used_up' : m.status;

            const updatedMembership: Membership = {
              ...m,
              remainingSessions,
              usedSessions,
              remainingAmount,
              usedAmount,
              status,
              transactions: [...(m.transactions ?? []), transaction],
            };

            return { ...c, membership: updatedMembership, updatedAt: getNowInKoreaIso() };
          }),
        }));
        const updated = get().customers.find((c) => c.id === customerId);
        if (updated) {
          dbUpsertCustomer(updated).catch(console.error);
          const shopId = useAuthStore.getState().currentShopId;
          if (shopId) {
            const m = updated.membership;
            const txn = m?.transactions?.find((t) => t.id === txnId);
            const actualDeduct = txn?.sessionsDelta ?? 0;
            dbInsertMembershipTransaction({
              id: txnId,
              customerId,
              shopId,
              date: today,
              type: 'manual_deduct',
              sessionsDelta: actualDeduct,
              amountDelta: txn?.amountDelta,
              note: note?.trim() || undefined,
            }).catch(console.error);
          }
        }
      },

      updateMembership: (customerId, updates) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            if (!c.membership) return c;
            return {
              ...c,
              membership: { ...c.membership, ...updates },
              updatedAt: getNowInKoreaIso(),
            };
          }),
        }));
        const updated = get().customers.find((c) => c.id === customerId);
        if (updated) {
          dbUpsertCustomer(updated).catch(console.error);
        }
      },

      recordTreatmentCompletion: (customerId, finalPrice, historyEntry) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            if (historyEntry?.recordId) {
              const existing = c.treatmentHistory || [];
              if (existing.some((h) => h.recordId === historyEntry.recordId)) {
                return c;
              }
            }
            const newVisitCount = c.visitCount + 1;
            const newTotalSpend = c.totalSpend + finalPrice;
            const newAverageSpend = Math.round(newTotalSpend / newVisitCount);
            const today = getTodayInKorea();
            const nextHistory: import('@/types/customer').TreatmentHistory[] = historyEntry
              ? [
                  ...c.treatmentHistory,
                  {
                    recordId: historyEntry.recordId,
                    date: historyEntry.date,
                    bodyPart: historyEntry.bodyPart,
                    designScope: historyEntry.designScope,
                    price: historyEntry.price,
                    designerName: historyEntry.designerName ?? '',
                    imageUrls: historyEntry.imageUrls ?? [],
                  },
                ]
              : c.treatmentHistory;
            return {
              ...c,
              visitCount: newVisitCount,
              totalSpend: newTotalSpend,
              averageSpend: newAverageSpend,
              lastVisitDate: today,
              treatmentHistory: nextHistory,
              updatedAt: getNowInKoreaIso(),
            };
          }),
        }));
        const updated = get().customers.find((c) => c.id === customerId);
        if (updated) {
          dbUpsertCustomer(updated).catch((err) => {
            console.error('[customer-store] recordTreatmentCompletion DB sync failed:', err);
          });
        }
      },
    }),
    {
      name: 'bdx-customers',
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      merge: (persisted, current) => {
        const p = persisted as Partial<CustomerStore> | undefined;
        if (!p) return current;
        return {
          ...current,
          ...p,
          customers: (p.customers ?? current.customers).map(normalizeCustomer),
        } as CustomerStore;
      },
    },
  ),
);

export default useCustomerStore;
