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
    const store = usePreConsultStore.getState();
    if (store.shopId !== shopId) {
      store.reset();
    }

    // Set shopId. shopData도 초기 설정 (단, 이미 photos가 있으면 보존)
    store.setShopId(shopId);
    if (store.portfolioPhotos.length === 0) {
      store.setShopData(shopData, []);
    }

    // Fetch portfolio photos client-side
    fetchPublicPortfolioPhotos(shopId)
      .then((photos) => {
        usePreConsultStore.getState().setShopData(shopData, photos);
      })
      .catch(() => {
        // Photos failed to load — store remains with empty array, graceful degradation
      });
    // shopData는 server component에서 매 render마다 새 object reference가 됨 → deps에서 제외
    // shopId만 추적해 useEffect 무한 재실행 방지 (photos가 빈 배열로 reset되는 문제 차단)
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
