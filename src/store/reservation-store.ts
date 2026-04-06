'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BookingRequest } from '@/types/consultation';
import { useAuthStore } from '@/store/auth-store';
import { useCustomerStore } from '@/store/customer-store';
import {
  fetchBookingRequests,
  dbUpsertReservation,
  dbUpsertCustomer,
  dbDeleteReservation,
} from '@/lib/db';
import { getNowInKoreaIso, getTodayInKorea } from '@/lib/format';

interface ReservationStore {
  reservations: BookingRequest[];
  _dbReady: boolean;

  hydrateFromDB: () => Promise<void>;
  addReservation: (reservation: Omit<BookingRequest, 'id' | 'createdAt' | 'status' | 'shopId'>) => void;
  updateReservation: (id: string, updates: Partial<BookingRequest>) => void;
  removeReservation: (id: string) => void;
  getByDate: (date: string) => BookingRequest[];
  getByMonth: (year: number, month: number) => BookingRequest[];
  getToday: () => BookingRequest[];
  getByWeek: (startDate: string) => BookingRequest[];
  getByDesigner: (designerId: string) => BookingRequest[];
}

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => ({
      reservations: [],
      _dbReady: false,

      hydrateFromDB: async () => {
        const currentShopId = useAuthStore.getState().currentShopId;
        const dbReservations = await fetchBookingRequests(currentShopId);
        if (currentShopId === 'shop-demo') {
          const { DEMO_RESERVATIONS } = await import('@/data/mock-demo-data');
          const existingIds = new Set(dbReservations.map((r) => r.id));
          const merged = [
            ...dbReservations,
            ...DEMO_RESERVATIONS.filter((r) => !existingIds.has(r.id)),
          ];
          set({ reservations: merged, _dbReady: true });
          return;
        }
        set({ reservations: dbReservations, _dbReady: true });
      },

      addReservation: (reservation) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          console.error('[reservation-store] addReservation called without active shop');
          return;
        }

        // 고객 자동 생성/연결: 예약에 customerId가 없으면 이름/전화로 매칭 또는 신규 생성
        let resolvedCustomerId = reservation.customerId;
        let newlyCreatedCustomer: import('@/types/customer').Customer | null = null;
        if (!resolvedCustomerId && reservation.customerName) {
          const customerStore = useCustomerStore.getState();
          // 전화번호로 먼저 매칭
          const byPhone = reservation.phone ? customerStore.findByPhoneNormalized(reservation.phone) : undefined;
          if (byPhone) {
            resolvedCustomerId = byPhone.id;
          } else {
            // 이름으로 매칭
            const byName = customerStore.customers.find((c) => c.name === reservation.customerName);
            if (byName) {
              resolvedCustomerId = byName.id;
            } else {
              // 신규 고객 생성
              const newCustomer = customerStore.createCustomer({
                name: reservation.customerName,
                phone: reservation.phone,
                preferredLanguage: reservation.language,
                assignedDesignerId: reservation.designerId,
              });
              resolvedCustomerId = newCustomer.id;
              newlyCreatedCustomer = newCustomer;
            }
          }
        }

        const newEntry: BookingRequest = {
          ...reservation,
          id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          shopId: currentShopId,
          customerId: resolvedCustomerId,
          status: 'pending' as const,
          createdAt: getNowInKoreaIso(),
        };
        set((state) => ({
          reservations: [...state.reservations, newEntry],
        }));
        // 신규 고객 생성 시: DB에 고객 먼저 저장 → 예약 저장 (FK 충돌 방지)
        const dbSync = newlyCreatedCustomer
          ? dbUpsertCustomer(newlyCreatedCustomer).then(() => dbUpsertReservation(newEntry))
          : dbUpsertReservation(newEntry);
        dbSync.catch(console.error);
      },

      updateReservation: (id, updates) => {
        set((state) => ({
          reservations: state.reservations.map((r) =>
            r.id === id ? { ...r, ...updates } : r,
          ),
        }));
        const updated = get().reservations.find((r) => r.id === id);
        if (updated) {
          dbUpsertReservation(updated).catch(console.error);
        }
      },

      removeReservation: (id) => {
        const currentShopId = useAuthStore.getState().currentShopId ?? undefined;
        set((state) => ({
          reservations: state.reservations.filter((r) => r.id !== id),
        }));
        dbDeleteReservation(id, currentShopId).catch(console.error);
      },

      getByDate: (date) => {
        return get().reservations
          .filter((r) => r.reservationDate === date)
          .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
      },

      getByMonth: (year, month) => {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        return get().reservations
          .filter((r) => r.reservationDate.startsWith(prefix))
          .sort((a, b) =>
            a.reservationDate.localeCompare(b.reservationDate) ||
            a.reservationTime.localeCompare(b.reservationTime),
          );
      },

      getToday: () => {
        const today = getTodayInKorea();
        return get().reservations
          .filter((r) => r.reservationDate === today)
          .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
      },

      getByWeek: (startDate: string) => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return get().reservations
          .filter((r) => {
            const d = new Date(r.reservationDate);
            return d >= start && d <= end;
          })
          .sort((a, b) =>
            a.reservationDate.localeCompare(b.reservationDate) ||
            a.reservationTime.localeCompare(b.reservationTime),
          );
      },

      getByDesigner: (designerId: string) => {
        return get().reservations.filter((r) => r.designerId === designerId);
      },
    }),
    {
      name: 'bdx-reservations',
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
