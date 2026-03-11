'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCustomerStore } from '@/store/customer-store';
import usePortfolioStore from '@/store/portfolio-store';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import { useShopStore } from '@/store/shop-store';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const currentShopId = useAuthStore((s) => s.currentShopId);
  const syncShopSettingsFromShop = useAppStore((s) => s.syncShopSettingsFromShop);

  useEffect(() => {
    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') {
        void initializeAuth();
      }
      if (event === 'SIGNED_IN' && !useAuthStore.getState().currentShopId) {
        void initializeAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!currentShopId) {
      useShopStore.setState({ shop: null, designers: [], _dbReady: true });
      useCustomerStore.setState({ customers: [], _dbReady: true });
      useRecordsStore.setState({ records: [], _dbReady: true });
      useReservationStore.setState({ reservations: [], _dbReady: true });
      usePortfolioStore.setState({ photos: [], _dbReady: true, migrationNotice: null });
      return;
    }

    Promise.all([
      useShopStore.getState().hydrateFromDB(),
      useCustomerStore.getState().hydrateFromDB(),
      useRecordsStore.getState().hydrateFromDB(),
      useReservationStore.getState().hydrateFromDB(),
      usePortfolioStore.getState().hydrateFromDB(),
    ])
      .then(() => {
        syncShopSettingsFromShop(useShopStore.getState().shop);
      })
      .catch(console.error);
  }, [currentShopId, isInitialized, syncShopSettingsFromShop]);

  return <>{children}</>;
}
