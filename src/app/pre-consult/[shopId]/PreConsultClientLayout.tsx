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
    // shopId가 변경되면 이전 선택값 오염 방지를 위해 리셋
    const currentShopId = usePreConsultStore.getState().shopId;
    if (currentShopId !== shopId) {
      usePreConsultStore.getState().reset();
    }

    // Set shopId and initial shopData (without photos yet)
    usePreConsultStore.getState().setShopId(shopId);
    usePreConsultStore.getState().setShopData(shopData, []);

    // Fetch portfolio photos client-side
    fetchPublicPortfolioPhotos(shopId)
      .then((photos) => {
        usePreConsultStore.getState().setShopData(shopData, photos);
      })
      .catch(() => {
        // Photos failed to load — store remains with empty array, graceful degradation
      });
  }, [shopData, shopId]);

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
