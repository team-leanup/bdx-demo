'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/app-store';

const MAX_LENGTH = 120;

export default function NoticePage() {
  const router = useRouter();
  const { shopSettings, setShopSettings } = useAppStore();
  const [notice, setNotice] = useState(shopSettings.customerNotice);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_LENGTH) {
      setNotice(e.target.value);
    }
  };

  const handleComplete = async () => {
    await setShopSettings({ customerNotice: notice.trim() || shopSettings.customerNotice });
    router.push('/onboarding/complete');
  };

  const remaining = MAX_LENGTH - notice.length;
  const isNearLimit = remaining <= 20;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-112px)] px-5 pt-8 pb-8 max-w-xl mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-text mb-1.5">고객 안내 문구</h1>
        <p className="text-sm text-text-secondary">고객에게 보여질 안내 문구예요</p>
      </motion.div>

      {/* Customer preview card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6"
      >
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
          고객 화면 미리보기
        </p>

        {/* Simulated customer view */}
        <div className="rounded-2xl border border-border bg-surface p-4 relative overflow-hidden">
          {/* Decorative top stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />

          <div className="flex items-start gap-3 pt-1">
            {/* Icon */}
            <div
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
              style={{ backgroundColor: 'var(--color-primary-light, color-mix(in srgb, var(--color-primary) 12%, transparent))' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-muted mb-1">샵 안내</p>
              <motion.p
                key={notice}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-text leading-relaxed break-keep"
              >
                {notice || '안내 문구를 입력하세요'}
              </motion.p>
            </div>
          </div>

          {/* "Customer view" label */}
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-60" />
            <span className="text-[11px] text-text-muted">고객 화면에 이렇게 표시돼요</span>
          </div>
        </div>
      </motion.div>

      {/* Edit section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex-1 flex flex-col"
      >
        <label className="text-sm font-medium text-text mb-2 block">문구 수정하기</label>
        <div className="relative flex-1">
          <textarea
            value={notice}
            onChange={handleChange}
            rows={4}
            placeholder="고객에게 전달할 안내 문구를 입력하세요"
            className="w-full px-4 py-3 rounded-2xl border border-border bg-surface text-sm text-text placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 leading-relaxed"
          />
          <span
            className={`absolute bottom-3 right-3 text-[11px] tabular-nums transition-colors ${
              isNearLimit ? 'text-amber-500' : 'text-text-muted'
            }`}
          >
            {notice.length} / {MAX_LENGTH}
          </span>
        </div>

        {/* Helper text */}
        <p className="text-xs text-text-muted mt-2 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          이 문구는 설정에서 언제든 수정할 수 있어요
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-8"
      >
        <Button size="lg" fullWidth onClick={handleComplete}>
          완료하기
        </Button>
      </motion.div>
    </div>
  );
}
