'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export function PreConsultProgressBar(): React.ReactElement | null {
  const pathname = usePathname();

  const getProgress = (): number => {
    if (pathname.endsWith('/design')) return 25;
    if (pathname.endsWith('/consult')) return 50;
    if (pathname.endsWith('/confirm')) return 85;
    if (pathname.endsWith('/complete')) return 100;
    return 0;
  };

  const progress = getProgress();

  // Hide on start (0%) and complete (100%)
  if (progress === 0 || progress === 100) return null;

  return (
    <div className="w-full h-1 bg-border/50 flex-shrink-0">
      <motion.div
        layoutId="pre-consult-progress"
        className="h-full bg-primary rounded-r-full"
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
    </div>
  );
}
