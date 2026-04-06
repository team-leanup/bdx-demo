'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useAppStore } from '@/store/app-store';

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
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-text">{label}</span>
        {helper && <p className="text-xs text-text-muted mt-0.5">{helper}</p>}
      </div>
      <div className="relative flex items-center w-32 flex-shrink-0">
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
  const { shopSettings, setShopSettings } = useAppStore();
  const init = shopSettings.surcharges;

  const [selfRemoval, setSelfRemoval] = useState(init.selfRemoval);
  const [otherRemoval, setOtherRemoval] = useState(init.otherRemoval);

  const [extensionEnabled, setExtensionEnabled] = useState(init.extension > 0);
  const [extension, setExtension] = useState(init.extension || 20000);

  const [parts, setParts] = useState(init.partsExcessPer);
  const [glitter, setGlitter] = useState(init.largeParts);
  const [pointArt, setPointArt] = useState(init.pointArt);

  const handleNext = () => {
    setShopSettings({
      surcharges: {
        ...init,
        selfRemoval,
        otherRemoval,
        extension: extensionEnabled ? extension : 0,
        partsExcessPer: parts,
        largeParts: glitter,
        pointArt,
      },
    });
    router.push('/onboarding/notice');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-4 md:py-6"
    >
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text">추가 비용</h1>
        <p className="text-sm text-text-muted">추가 비용 기준을 설정해볼게요</p>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {/* Section 1: 제거 */}
        <SectionCard title="제거" delay={0}>
          <PriceInput
            label="자샵 제거"
            value={selfRemoval}
            onChange={setSelfRemoval}
          />
          <PriceInput
            label="타샵 제거"
            value={otherRemoval}
            onChange={setOtherRemoval}
          />
          <p className="text-xs text-text-muted pt-1">고객이 선택하게 돼요</p>
        </SectionCard>

        {/* Section 2: 연장 */}
        <SectionCard title="연장" delay={0.07}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text">사용 여부</span>
            <Toggle
              checked={extensionEnabled}
              onChange={setExtensionEnabled}
              size="sm"
            />
          </div>
          {extensionEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PriceInput
                label="연장 추가금"
                value={extension}
                onChange={setExtension}
              />
            </motion.div>
          )}
        </SectionCard>

        {/* Section 3: 추가 옵션 */}
        <SectionCard title="추가 옵션" delay={0.14}>
          <PriceInput label="파츠" value={parts} onChange={setParts} />
          <PriceInput label="글리터" value={glitter} onChange={setGlitter} />
          <PriceInput label="포인트아트" value={pointArt} onChange={setPointArt} />
        </SectionCard>
      </div>

      <p className="text-xs text-text-muted text-center mt-5 mb-3">
        간단하게만 설정해도 충분해요
      </p>

      <Button size="lg" fullWidth onClick={handleNext}>
        다음
      </Button>
    </motion.div>
  );
}
