import { notFound } from 'next/navigation';
import { fetchShopPublicData } from '@/lib/db';
import { PreConsultClientLayout } from './PreConsultClientLayout';
import type { ReactNode } from 'react';
import type { ShopPublicData } from '@/types/pre-consultation';

const DEMO_SHOP_DATA: ShopPublicData = {
  id: 'shop-demo',
  name: 'BDX Demo Nail',
  phone: '02-555-0147',
  categoryPricing: {
    simple: { price: 50000, time: 60 },
    french: { price: 55000, time: 70 },
    magnet: { price: 60000, time: 80 },
    art: { price: 70000, time: 90 },
  },
  surcharges: {
    selfRemoval: 5000, otherRemoval: 10000, gradation: 10000,
    french: 10000, magnet: 10000, pointArt: 20000, fullArt: 40000,
    parts1000included: 2, parts2000included: 2, parts3000included: 2,
    partsExcessPer: 1000, largeParts: 3000, repairPer: 5000,
    extension: 20000, overlay: 10000,
  },
  customerNotice: '선택하신 디자인을 기준으로 가격과 시간은 변동될 수 있어요',
  kakaoTalkUrl: 'https://pf.kakao.com/_xBDXdemo',
  naverReservationUrl: 'https://m.booking.naver.com/booking/13/bizes/1234567',
};

export default async function PreConsultLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ shopId: string }>;
}): Promise<React.ReactElement> {
  const { shopId } = await params;

  // 데모 모드 폴백: shopId가 'shop-'으로 시작하고 DB 조회 실패 시 데모 데이터 사용
  let shopData = await fetchShopPublicData(shopId);

  if (!shopData) {
    if (shopId === 'shop-demo') {
      shopData = { ...DEMO_SHOP_DATA, id: shopId };
    } else {
      notFound();
    }
  }

  return (
    <PreConsultClientLayout shopData={shopData} shopId={shopId}>
      {children}
    </PreConsultClientLayout>
  );
}
