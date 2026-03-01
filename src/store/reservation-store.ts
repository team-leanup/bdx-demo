'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BookingRequest } from '@/types/consultation';
import { MOCK_RESERVATIONS } from '@/data/mock-reservations';

interface ReservationStore {
  reservations: BookingRequest[];

  addReservation: (reservation: Omit<BookingRequest, 'id' | 'createdAt' | 'status'>) => void;
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
      reservations: [...MOCK_RESERVATIONS],

      addReservation: (reservation) =>
        set((state) => ({
          reservations: [
            ...state.reservations,
            {
              ...reservation,
              id: `booking-${Date.now()}`,
              status: 'pending' as const,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateReservation: (id, updates) =>
        set((state) => ({
          reservations: state.reservations.map((r) =>
            r.id === id ? { ...r, ...updates } : r,
          ),
        })),

      removeReservation: (id) =>
        set((state) => ({
          reservations: state.reservations.filter((r) => r.id !== id),
        })),

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
        const today = new Date().toISOString().split('T')[0];
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
