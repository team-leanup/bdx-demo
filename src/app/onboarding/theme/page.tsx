'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ThemeSelector } from '@/components/theme/ThemeSelector';

export default function ThemePage() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/complete');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-8 min-h-[calc(100vh-64px)]"
    >
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-text">테마 선택</h1>
        <p className="text-sm text-text-muted">매장에 어울리는 테마를 선택해주세요.</p>
      </div>

      <div className="flex-1">
        <ThemeSelector />
      </div>

      <div className="pt-8">
        <Button size="lg" fullWidth onClick={handleNext}>
          다음
        </Button>
      </div>
    </motion.div>
  );
}
