'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/auth/intro');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4 md:gap-8 md:max-w-lg md:mx-auto w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <span
            className="text-7xl md:text-8xl font-black tracking-tight text-primary"
          >
            BDX
          </span>
          <span
            className="text-base md:text-lg font-medium mt-2 tracking-widest uppercase text-primary/50"
            style={{ letterSpacing: '0.18em' }}
          >
            Beauty Decision eXperience
          </span>
          <span className="text-sm md:text-base font-medium mt-4 text-text-secondary">
            상담을 정리하는 가장 쉬운 방법
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex gap-1.5 mt-6"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
              className="block w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
