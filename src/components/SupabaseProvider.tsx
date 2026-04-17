'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCustomerStore } from '@/store/customer-store';
import usePortfolioStore from '@/store/portfolio-store';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import { useShopStore } from '@/store/shop-store';
import { useAuthStore, isAuthenticatingNow } from '@/store/auth-store';
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
      // signup/login 진행 중이면 재초기화 스킵 — setSession 으로 트리거되는 SIGNED_IN race 방지
      if (isAuthenticatingNow()) return;
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && !useAuthStore.getState().currentShopId)) {
        // OAuth 콜백 후 SIGNED_IN 이벤트가 올 때 _initDone 리셋하여 재초기화 보장
        useAuthStore.getState().resetInitFlag();
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

    // M6 fix: shopId 스냅샷 캡처 → hydration 완료 후 stale 체크
    const shopIdSnapshot = currentShopId;
    Promise.all([
      useShopStore.getState().hydrateFromDB(),
      useCustomerStore.getState().hydrateFromDB(),
      useRecordsStore.getState().hydrateFromDB(),
      useReservationStore.getState().hydrateFromDB(),
      usePortfolioStore.getState().hydrateFromDB(),
    ])
      .then(() => {
        // hydration 도중 shopId가 변경되었으면 syncShopSettings 스킵 (재실행됨)
        if (useAuthStore.getState().currentShopId !== shopIdSnapshot) return;
        syncShopSettingsFromShop(useShopStore.getState().shop);
      })
      .catch(console.error);
  }, [currentShopId, isInitialized, syncShopSettingsFromShop]);

  return <>{children}</>;
}
