'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Customer, CustomerTag, SmallTalkNote, TagAccent } from '@/types/customer';
import {
  fetchCustomers,
  dbUpsertCustomer,
  dbUpsertCustomerTags,
  dbInsertSmallTalkNote,
} from '@/lib/db';

interface CustomerStore {
  customers: Customer[];
  _dbReady: boolean;

  hydrateFromDB: () => Promise<void>;

  getById: (id: string) => Customer | undefined;
  findByPhoneNormalized: (phone: string) => Customer | undefined;

  createCustomer: (input: Partial<Customer>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  updateTags: (customerId: string, nextTags: CustomerTag[]) => void;
  setPinnedTraits: (customerId: string, pinnedValues: string[]) => void;

  toggleTagPinned: (customerId: string, tagId: string) => void;
  setTagAccent: (customerId: string, tagId: string, accent: TagAccent | undefined) => void;
  reorderPinnedTags: (customerId: string, orderedTagIds: string[]) => void;
  getPinnedTags: (customerId: string) => CustomerTag[];

  appendSmallTalkNote: (customerId: string, note: SmallTalkNote) => void;
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function normalizePhoneRaw(phone: string | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      _dbReady: false,

      hydrateFromDB: async () => {
        const customers = await fetchCustomers();
        set({ customers, _dbReady: true });
      },

      getById: (id) => get().customers.find((c) => c.id === id),

      findByPhoneNormalized: (phone) => {
        const key = normalizePhoneRaw(phone);
        return get().customers.find((c) => normalizePhoneRaw(c.phone) === key);
      },

      createCustomer: (input) => {
        const nowIso = new Date().toISOString();
        const today = nowIso.split('T')[0];
        const id = input.id ?? `customer-${Date.now()}`;

        const next: Customer = {
          id,
          shopId: input.shopId ?? 'shop-001',
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

        dbUpsertCustomer(next).catch(console.error);
        dbUpsertCustomerTags(next.id, next.tags ?? []).catch(console.error);

        return next;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c,
          ),
        }));
        const updated = get().customers.find((c) => c.id === id);
        if (updated) {
          dbUpsertCustomer(updated).catch(console.error);
        }
      },

      updateTags: (customerId, nextTags) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, tags: deepClone(nextTags), updatedAt: new Date().toISOString() }
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
            return { ...c, tags: [...pinned, ...rest], updatedAt: new Date().toISOString() };
          }),
        })),

      appendSmallTalkNote: (customerId, note) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const nextNotes = [...(c.smallTalkNotes ?? []), note];
            return { ...c, smallTalkNotes: nextNotes, updatedAt: new Date().toISOString() };
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
                accent: nowPinned ? t.accent : undefined,
              };
            });
            return { ...c, tags, updatedAt: new Date().toISOString() };
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
            return { ...c, tags, updatedAt: new Date().toISOString() };
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
            return { ...c, tags, updatedAt: new Date().toISOString() };
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
        return (customer.tags ?? [])
          .filter((t) => t.pinned)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
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
        return { ...current, ...p } as CustomerStore;
      },
    },
  ),
);

export default useCustomerStore;
