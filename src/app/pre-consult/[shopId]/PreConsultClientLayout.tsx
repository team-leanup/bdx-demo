'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { fetchPublicPortfolioPhotos } from '@/lib/db';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { PreConsultProgressBar } from '@/components/pre-consult/PreConsultProgressBar';
import type { ShopPublicData } from '@/types/pre-consultation';

interface PreConsultClientLayoutProps {
  shopData: ShopPublicData;
  shopId: string;
  children: ReactNode;
}

export function PreConsultClientLayout({
  shopData,
  shopId,
  children,
}: PreConsultClientLayoutProps): React.ReactElement {
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Reset scroll on route change
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    console.log('[PreConsultLayout] useEffect fired', { shopId });
    // shopId가 변경되면 이전 선택값 오염 방지를 위해 리셋
    const store = usePreConsultStore.getState();
    if (store.shopId !== shopId) {
      console.log('[PreConsultLayout] reset store');
      store.reset();
    }

    // Set shopId. shopData도 초기 설정 (단, 이미 photos가 있으면 보존)
    store.setShopId(shopId);
    if (store.portfolioPhotos.length === 0) {
      console.log('[PreConsultLayout] setShopData with empty photos');
      store.setShopData(shopData, []);
    }

    // Fetch portfolio photos client-side
    console.log('[PreConsultLayout] fetch start');
    fetchPublicPortfolioPhotos(shopId)
      .then((photos) => {
        console.log('[PreConsultLayout] fetch SUCCESS, photos count:', photos.length);
        usePreConsultStore.getState().setShopData(shopData, photos);
        console.log('[PreConsultLayout] setShopData called, store now:', usePreConsultStore.getState().portfolioPhotos.length);
      })
      .catch((err) => {
        console.error('[PreConsultLayout] fetch FAILED:', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Language selector — top right */}
      <div className="flex-shrink-0 flex justify-end px-4 pt-3 pb-1">
        <LanguageSelector />
      </div>

      {/* Progress bar */}
      <PreConsultProgressBar />

      {/* Page content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto flex flex-col">
        {children}
      </div>
    </div>
  );
}
