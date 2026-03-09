'use client';

import { useEffect, useRef } from 'react';
import { useCustomerStore } from '@/store/customer-store';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import { useShopStore } from '@/store/shop-store';

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    // Fire all hydration in parallel
    Promise.all([
      useShopStore.getState().hydrateFromDB(),
      useCustomerStore.getState().hydrateFromDB(),
      useRecordsStore.getState().hydrateFromDB(),
      useReservationStore.getState().hydrateFromDB(),
    ]).catch(console.error);
  }, []);

  return <>{children}</>;
}
