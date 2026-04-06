'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/app-store';
import type { CategoryPricing } from '@/store/app-store';

function PriceInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative flex items-center flex-1 min-w-0">
      <span className="absolute left-3 text-text-muted text-sm select-none pointer-events-none">₩</span>
      <input
        type="text"
        inputMode="numeric"
        value={value === 0 ? '' : value.toLocaleString('ko-KR')}
        placeholder="0"
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '');
          onChange(raw === '' ? 0 : parseInt(raw, 10));
        }}
        className="w-full h-10 pl-7 pr-3 rounded-xl border bg-background text-text text-sm border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:border-primary/40 transition-all duration-200 text-right"
      />
    </div>
  );
}

function TimeInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative flex items-center w-20 flex-shrink-0">
      <input
        type="text"
        inputMode="numeric"
        value={value === 0 ? '' : String(value)}
        placeholder="0"
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '');
          onChange(raw === '' ? 0 : parseInt(raw, 10));
        }}
        className="w-full h-10 pl-3 pr-6 rounded-xl border bg-background text-text text-sm border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:border-primary/40 transition-all duration-200 text-right"
      />
      <span className="absolute right-2.5 text-text-muted text-xs select-none pointer-events-none">분</span>
    </div>
  );
}

const CATEGORIES: {
  key: keyof CategoryPricing;
  label: string;
  dotColor: string;
}[] = [
  { key: 'simple', label: '심플', dotColor: 'bg-pink-300' },
  { key: 'french', label: '프렌치', dotColor: 'bg-amber-300' },
  { key: 'magnet', label: '자석', dotColor: 'bg-violet-400' },
  { key: 'art', label: '아트', dotColor: 'bg-teal-400' },
];

export default function PricingPage() {
  const router = useRouter();
  const { shopSettings, setShopSettings } = useAppStore();

  const [pricing, setPricing] = useState<CategoryPricing>({
    ...shopSettings.categoryPricing,
  });

  const update = (
    key: keyof CategoryPricing,
    field: 'price' | 'time',
    value: number,
  ) => {
    setPricing((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleNext = () => {
    setShopSettings({ categoryPricing: pricing });
    router.push('/onboarding/surcharges');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-4 md:py-6"
    >
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text">가격 &amp; 시간</h1>
        <p className="text-sm text-text-muted">가격과 시간을 설정해볼게요</p>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.07 }}
            className="rounded-2xl p-4 border border-border bg-surface"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${cat.dotColor} flex-shrink-0`} />
              <span className="text-sm font-semibold text-text">{cat.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted w-7 flex-shrink-0">가격</span>
              <PriceInput
                value={pricing[cat.key].price}
                onChange={(v) => update(cat.key, 'price', v)}
              />
              <span className="text-xs text-text-muted w-7 flex-shrink-0 ml-1">시간</span>
              <TimeInput
                value={pricing[cat.key].time}
                onChange={(v) => update(cat.key, 'time', v)}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-text-muted text-center mt-5 mb-3">
        시작 기준이에요, 상황에 따라 달라질 수 있어요
      </p>

      <Button size="lg" fullWidth onClick={handleNext}>
        다음
      </Button>
    </motion.div>
  );
}
