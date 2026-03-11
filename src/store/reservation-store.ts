'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BookingRequest } from '@/types/consultation';
import { useAuthStore } from '@/store/auth-store';
import {
  fetchBookingRequests,
  dbUpsertReservation,
  dbDeleteReservation,
} from '@/lib/db';
import { getNowInKoreaIso, getTodayInKorea } from '@/lib/format';

interface ReservationStore {
  reservations: BookingRequest[];
  _dbReady: boolean;

  hydrateFromDB: () => Promise<void>;
  addReservation: (reservation: Omit<BookingRequest, 'id' | 'createdAt' | 'status' | 'shopId'>) => void;
  updateReservation: (id: string, updates: Partial<BookingRequest>) => void;
  updateReservationLocally: (id: string, updates: Partial<BookingRequest>) => void;
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
        if (currentShopId === 'demo-shop') {
          const { MOCK_RESERVATIONS } = await import('@/data/mock-reservations');
          set({ reservations: MOCK_RESERVATIONS, _dbReady: true });
          return;
        }
        const dbReservations = await fetchBookingRequests(currentShopId);
        set({ reservations: dbReservations, _dbReady: true });
      },

      addReservation: (reservation) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          console.error('[reservation-store] addReservation called without active shop');
          return;
        }

        const newEntry: BookingRequest = {
          ...reservation,
          id: `booking-${Date.now()}`,
          shopId: currentShopId,
          status: 'pending' as const,
          createdAt: getNowInKoreaIso(),
        };
        set((state) => ({
          reservations: [...state.reservations, newEntry],
        }));
        dbUpsertReservation(newEntry).catch(console.error);
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

      updateReservationLocally: (id, updates) => {
        set((state) => ({
          reservations: state.reservations.map((r) =>
            r.id === id ? { ...r, ...updates } : r,
          ),
        }));
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
    },
  ),
);
