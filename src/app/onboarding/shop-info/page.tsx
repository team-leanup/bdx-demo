'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/app-store';

export default function ShopInfoPage() {
  const router = useRouter();
  const { shopSettings, setShopSettings } = useAppStore();

  const [shopName, setShopName] = useState(shopSettings.shopName || '');
  const [phone, setPhone] = useState(shopSettings.shopPhone || '');

  const canProceed = shopName.trim().length > 0;

  const handleNext = () => {
    if (!canProceed) return;
    setShopSettings({ shopName: shopName.trim(), shopPhone: phone });
    router.push('/onboarding/portfolio-upload');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-4 md:py-6"
    >
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text">기본 정보</h1>
        <p className="text-sm text-text-secondary">고객과 연결되는 기본 정보예요</p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <Input
          label="매장명"
          placeholder="매장명을 입력하세요"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
        <Input
          label="연락처"
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="pt-6">
        <Button size="lg" fullWidth onClick={handleNext} disabled={!canProceed}>
          다음
        </Button>
      </div>
    </motion.div>
  );
}
