'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Counter } from '@/components/ui/Counter';
import { useAppStore } from '@/store/app-store';
import type { SurchargeSettings } from '@/types/shop';

function PriceInput({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  helper?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <label className="text-sm font-medium text-text">{label}</label>
        {helper && <p className="text-xs text-text-muted mt-0.5">{helper}</p>}
      </div>
      <div className="relative flex items-center w-32 md:w-40 flex-shrink-0">
        <span className="absolute left-3 text-text-muted text-sm select-none">₩</span>
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? '' : value.toLocaleString('ko-KR')}
          placeholder="0"
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            onChange(raw === '' ? 0 : parseInt(raw, 10));
          }}
          className="w-full h-10 pl-7 pr-3 rounded-xl border bg-surface text-text text-sm border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-primary/40 transition-all duration-200 text-right"
        />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-2xl p-4 border border-border bg-surface"
    >
      <h2 className="text-sm font-semibold text-text mb-4">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </motion.div>
  );
}

export default function SurchargesPage() {
  const router = useRouter();
  const { setShopSettings, shopSettings } = useAppStore();
  const { serviceStructure } = shopSettings;

  const init = shopSettings.surcharges;

  const [gradation, setGradation] = useState(init.gradation);
  const [french, setFrench] = useState(init.french);
  const [magnet, setMagnet] = useState(init.magnet);
  const [pointArt, setPointArt] = useState(init.pointArt);
  const [fullArt, setFullArt] = useState(init.fullArt);
  const [parts1000included, setParts1000Included] = useState(init.parts1000included);
  const [parts2000included, setParts2000Included] = useState(init.parts2000included);
  const [parts3000included, setParts3000Included] = useState(init.parts3000included);
  const [partsExcessPer, setPartsExcessPer] = useState(init.partsExcessPer);
  const [largeParts, setLargeParts] = useState(init.largeParts);
  const [repairPer, setRepairPer] = useState(init.repairPer);
  const [overlay, setOverlay] = useState(init.overlay);

  const handleNext = () => {
    const surcharges: SurchargeSettings = {
      selfRemoval: init.selfRemoval,
      otherRemoval: init.otherRemoval,
      gradation,
      french,
      magnet,
      pointArt,
      fullArt,
      parts1000included,
      parts2000included,
      parts3000included,
      partsExcessPer,
      largeParts,
      repairPer,
      overlay,
    };
    setShopSettings({ surcharges });
    router.push('/onboarding/time');
  };

  let sectionDelay = 0;
  const nextDelay = () => {
    sectionDelay += 0.06;
    return sectionDelay;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-4 md:py-6"
    >
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-text">추가금 설정</h1>
        <p className="text-sm text-text-muted">각 항목의 추가금을 입력하세요. 비워두면 미설정으로 처리됩니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* 1. 그라데이션 */}
        {serviceStructure.gradation && (
          <SectionCard title="그라데이션" delay={nextDelay()}>
            <PriceInput label="그라데이션" value={gradation} onChange={setGradation} />
          </SectionCard>
        )}

        {/* 2. 프렌치 */}
        {serviceStructure.french && (
          <SectionCard title="프렌치" delay={nextDelay()}>
            <PriceInput label="프렌치" value={french} onChange={setFrench} />
          </SectionCard>
        )}

        {/* 3. 마그네틱 */}
        {serviceStructure.magnet && (
          <SectionCard title="마그네틱" delay={nextDelay()}>
            <PriceInput label="자석" value={magnet} onChange={setMagnet} />
          </SectionCard>
        )}

        {/* 4. 포인트아트 + 풀아트 */}
        {serviceStructure.pointFullArt && (
          <SectionCard title="아트" delay={nextDelay()}>
            <PriceInput label="포인트아트" value={pointArt} onChange={setPointArt} />
            <PriceInput label="풀아트" value={fullArt} onChange={setFullArt} />
          </SectionCard>
        )}

        {/* 5. 연장 (extension 선택 시) */}
        {serviceStructure.extension && (
          <SectionCard title="연장" delay={nextDelay()}>
            <p className="text-xs text-text-muted -mt-2">연장 추가금은 상담 시 개별 설정됩니다.</p>
          </SectionCard>
        )}

        {/* 6. 리페어 */}
        {serviceStructure.repair && (
          <SectionCard title="리페어" delay={nextDelay()}>
            <PriceInput label="개당" value={repairPer} onChange={setRepairPer} helper="손톱 1개 기준" />
          </SectionCard>
        )}

        {/* 7. 오버레이 */}
        {serviceStructure.overlay && (
          <SectionCard title="오버레이" delay={nextDelay()}>
            <PriceInput label="오버레이 추가금" value={overlay} onChange={setOverlay} />
          </SectionCard>
        )}

        {/* 8. 파츠 */}
        {serviceStructure.parts && (
          <SectionCard title="파츠" delay={nextDelay()}>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-text flex-1">1,000원 포함 개수</span>
              <Counter
                value={parts1000included}
                onChange={setParts1000Included}
                min={0}
                max={20}
                step={1}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-text flex-1">2,000원 포함 개수</span>
              <Counter
                value={parts2000included}
                onChange={setParts2000Included}
                min={0}
                max={20}
                step={1}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-text flex-1">3,000원 포함 개수</span>
              <Counter
                value={parts3000included}
                onChange={setParts3000Included}
                min={0}
                max={20}
                step={1}
              />
            </div>
            <div className="h-px bg-border" />
            <PriceInput label="초과 개당" value={partsExcessPer} onChange={setPartsExcessPer} helper="포함 개수 초과 시" />
            <PriceInput label="대형파츠 추가금" value={largeParts} onChange={setLargeParts} helper="큰 파츠 사용 시" />
          </SectionCard>
        )}
      </div>

      <div className="pt-6">
        <Button size="lg" fullWidth onClick={handleNext}>
          다음
        </Button>
      </div>
    </motion.div>
  );
}
