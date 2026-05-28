'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCustomerStore } from '@/store/customer-store';
import usePortfolioStore from '@/store/portfolio-store';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import { useShopStore } from '@/store/shop-store';
import { useAuthStore, isAuthenticatingNow } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';

// 손님이 보는 공개 페이지 — 사장님 store hydrate 불필요 (localStorage 용량 초과 방지)
const PUBLIC_PATH_PREFIXES = ['/pre-consult', '/share', '/qr', '/intro', '/intro-demo'];

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const currentShopId = useAuthStore((s) => s.currentShopId);
  const syncShopSettingsFromShop = useAppStore((s) => s.syncShopSettingsFromShop);
  const isPublicPath = PUBLIC_PATH_PREFIXES.some((p) => pathname?.startsWith(p));

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

    // 손님 공개 페이지 — 사장님 store hydrate 스킵 (불필요 + quota 초과 방지)
    if (isPublicPath) {
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
    // localStorage QuotaExceeded는 사용자 데이터 양에 따라 발생할 수 있음 — 개별 catch로 다른 store 보호
    Promise.all([
      useShopStore.getState().hydrateFromDB().catch((e) => console.error('[hydrate] shop:', e)),
      useCustomerStore.getState().hydrateFromDB().catch((e) => console.error('[hydrate] customers:', e)),
      useRecordsStore.getState().hydrateFromDB().catch((e) => console.error('[hydrate] records:', e)),
      useReservationStore.getState().hydrateFromDB().catch((e) => console.error('[hydrate] reservations:', e)),
      usePortfolioStore.getState().hydrateFromDB().catch((e) => console.error('[hydrate] portfolio:', e)),
    ])
      .then(() => {
        // hydration 도중 shopId가 변경되었으면 syncShopSettings 스킵 (재실행됨)
        if (useAuthStore.getState().currentShopId !== shopIdSnapshot) return;
        syncShopSettingsFromShop(useShopStore.getState().shop);
      })
      .catch(console.error);
  }, [currentShopId, isInitialized, isPublicPath, syncShopSettingsFromShop]);

  return <>{children}</>;
}
