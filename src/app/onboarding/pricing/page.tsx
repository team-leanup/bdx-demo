'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/app-store';

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) onChange(num);
    else onChange(0);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-4 text-text-muted font-medium text-base select-none">₩</span>
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? '' : value.toLocaleString('ko-KR')}
          placeholder="0"
          onChange={handleChange}
          className="w-full h-11 md:h-12 pl-9 pr-4 rounded-xl border bg-surface text-text text-base border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:border-primary/40 transition-all duration-200"
        />
      </div>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const { shopSettings, setShopSettings } = useAppStore();

  const [handPrice, setHandPrice] = useState(shopSettings.baseHandPrice || 60000);
  const [footPrice, setFootPrice] = useState(shopSettings.baseFootPrice || 70000);
  const [offSamePrice, setOffSamePrice] = useState(shopSettings.baseOffSameShop || 5000);
  const [offOtherPrice, setOffOtherPrice] = useState(shopSettings.baseOffOtherShop || 10000);

  const handleNext = () => {
    setShopSettings({
      baseHandPrice: handPrice,
      baseFootPrice: footPrice,
      baseOffSameShop: offSamePrice,
      baseOffOtherShop: offOtherPrice,
    });
    router.push('/onboarding/surcharges');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-4 md:py-6"
    >
      <div className="flex flex-col gap-2 mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-text">기본 가격을 설정해주세요</h1>
        <p className="text-sm text-text-muted">기본 시술 가격과 오프 가격을 입력하세요.</p>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">기본 시술가</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PriceInput
              label="핸드 기본가"
              value={handPrice}
              onChange={setHandPrice}
            />
            <PriceInput
              label="페디큐어 기본가"
              value={footPrice}
              onChange={setFootPrice}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">오프 가격</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PriceInput
              label="자샵오프"
              value={offSamePrice}
              onChange={setOffSamePrice}
            />
            <PriceInput
              label="타샵오프"
              value={offOtherPrice}
              onChange={setOffOtherPrice}
            />
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Button size="lg" fullWidth onClick={handleNext}>
          다음
        </Button>
      </div>
    </motion.div>
  );
}
