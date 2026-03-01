'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Counter } from '@/components/ui/Counter';
import { useAppStore } from '@/store/app-store';
import { formatMinutes } from '@/lib/format';
import type { TimeSettings, ServiceStructure } from '@/types/shop';

interface TimeItem {
  key: keyof TimeSettings;
  label: string;
  sublabel?: string;
  defaultVal: number;
  min: number;
  max: number;
  serviceKey?: keyof ServiceStructure;
  alwaysEnabled?: boolean;
}

const TIME_ITEMS: TimeItem[] = [
  {
    key: 'baseHand',
    label: '기본 손 원톤',
    defaultVal: 60,
    min: 15,
    max: 180,
    alwaysEnabled: true,
  },
  {
    key: 'gradation',
    label: '그라데이션 추가',
    defaultVal: 10,
    min: 0,
    max: 60,
    serviceKey: 'gradation',
  },
  {
    key: 'french',
    label: '프렌치 추가',
    defaultVal: 15,
    min: 0,
    max: 60,
    serviceKey: 'french',
  },
  {
    key: 'magnet',
    label: '자석 추가',
    defaultVal: 10,
    min: 0,
    max: 60,
    serviceKey: 'magnet',
  },
  {
    key: 'point',
    label: '포인트 아트 추가',
    defaultVal: 15,
    min: 0,
    max: 60,
    serviceKey: 'pointFullArt',
  },
  {
    key: 'fullArt',
    label: '풀아트 추가',
    defaultVal: 40,
    min: 0,
    max: 120,
    serviceKey: 'pointFullArt',
  },
  {
    key: 'repairPer',
    label: '리페어 개당',
    defaultVal: 10,
    min: 0,
    max: 60,
    serviceKey: 'repair',
  },
  {
    key: 'parts',
    label: '파츠 추가',
    defaultVal: 5,
    min: 0,
    max: 60,
    serviceKey: 'parts',
  },
];

export default function TimePage() {
  const router = useRouter();
  const { setShopSettings, shopSettings } = useAppStore();
  const { serviceStructure } = shopSettings;
  const init = shopSettings.timeSettings;

  const [times, setTimes] = useState<TimeSettings>({
    baseHand: init.baseHand,
    gradation: init.gradation,
    french: init.french,
    magnet: init.magnet,
    point: init.point,
    fullArt: init.fullArt,
    repairPer: init.repairPer,
    parts: init.parts,
  });

  const setTime = (key: keyof TimeSettings, val: number) => {
    setTimes((prev) => ({ ...prev, [key]: val }));
  };

  const isEnabled = (item: TimeItem): boolean => {
    if (item.alwaysEnabled) return true;
    if (!item.serviceKey) return true;
    return serviceStructure[item.serviceKey] === true;
  };

  const handleNext = () => {
    setShopSettings({ timeSettings: times });
    router.push('/onboarding/complete');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-4 md:py-6"
    >
      <div className="flex flex-col gap-2 mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-text">시술 시간 설정</h1>
        <p className="text-sm text-text-muted">평균 시술 시간을 설정해주세요.</p>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {TIME_ITEMS.filter((item) => isEnabled(item)).map((item, idx, filtered) => {
            const isLast = idx === filtered.length - 1;
            return (
              <div key={item.key}>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text">{item.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{formatMinutes(times[item.key])}</p>
                  </div>
                  <Counter
                    value={times[item.key]}
                    onChange={(v) => setTime(item.key, v)}
                    min={item.min}
                    max={item.max}
                    step={5}
                  />
                </motion.div>
                {!isLast && <div className="h-px bg-border mx-4" />}
              </div>
            );
          })}
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
