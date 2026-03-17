'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Customer, CustomerTag, SmallTalkNote, TagAccent } from '@/types/customer';
import { useAuthStore } from '@/store/auth-store';
import { getNowInKoreaIso, getTodayInKorea } from '@/lib/format';
import {
  fetchCustomers,
  dbUpsertCustomer,
  dbUpsertCustomerTags,
  dbInsertSmallTalkNote,
  dbDeleteCustomer,
} from '@/lib/db';

interface LegacyCustomerTagAccent {
  accentColor?: TagAccent;
}

interface CustomerStore {
  customers: Customer[];
  _dbReady: boolean;

  hydrateFromDB: () => Promise<void>;

  getById: (id: string) => Customer | undefined;
  findByPhoneNormalized: (phone: string) => Customer | undefined;

  createCustomer: (input: Partial<Customer>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  updateTags: (customerId: string, nextTags: CustomerTag[]) => void;
  setPinnedTraits: (customerId: string, pinnedValues: string[]) => void;

  toggleTagPinned: (customerId: string, tagId: string) => void;
  setTagAccent: (customerId: string, tagId: string, accent: TagAccent | undefined) => void;
  reorderPinnedTags: (customerId: string, orderedTagIds: string[]) => void;
  getPinnedTags: (customerId: string) => CustomerTag[];
  getPrimaryTags: (customerId: string) => CustomerTag[];

  appendSmallTalkNote: (customerId: string, note: SmallTalkNote) => void;
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
        designScope: 'full_art',
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
        designScope: 'monthly_art',
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
        designScope: 'solid_tone',
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
        designScope: 'monthly_art',
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
        designScope: 'solid_point',
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

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      _dbReady: false,

      hydrateFromDB: async () => {
        const currentShopId = useAuthStore.getState().currentShopId;
        const dbCustomers = await fetchCustomers(currentShopId);
        set({
          customers: mergeDemoGoldenTimeCustomers(
            dbCustomers.map(normalizeCustomer),
            currentShopId,
          ),
          _dbReady: true,
        });
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
          console.error('Failed to save customer to DB:', err);
          set((state) => ({ customers: state.customers.filter((c) => c.id !== next.id) }));
        });
        dbUpsertCustomerTags(next.id, next.tags ?? []).catch(console.error);

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
          dbUpsertCustomer(updated).catch(console.error);
        }
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
        dbDeleteCustomer(id).catch((err) => {
          console.error('Failed to delete customer from DB:', err);
        });
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

      setPinnedTraits: (customerId, pinnedValues) =>
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const pinnedSet = new Set(pinnedValues);
            const tags = c.tags ?? [];
            const pinned = tags.filter((t) => pinnedSet.has(t.value));
            const rest = tags.filter((t) => !pinnedSet.has(t.value));
            return { ...c, tags: [...pinned, ...rest], updatedAt: getNowInKoreaIso() };
          }),
        })),

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
