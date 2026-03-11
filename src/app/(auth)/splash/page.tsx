'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/intro');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        '--color-primary': '#F48DC4',
        '--color-primary-light': '#FDF2F8',
        '--color-primary-dark': '#F48DC4',
        '--color-background': '#FAFAFA',
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, var(--color-primary-light) 0%, var(--color-background) 70%)',
      } as React.CSSProperties}
    >
      {/* Decorative blurred orbs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.18, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: 'var(--color-primary)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
        className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full blur-3xl"
        style={{ backgroundColor: 'var(--color-primary-dark)' }}
      />

      {/* Main content */}
      <div className="flex flex-col items-center gap-4 md:gap-8 md:max-w-lg md:mx-auto w-full px-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <img
            src="/bdx-logo/bdx-logo-vertical-pink.svg"
            alt="BDX — Beauty Decision eXperience"
            className="h-64 md:h-80"
          />
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
            className="text-sm md:text-base font-semibold -mt-3 tracking-[0.14em] text-primary"
          >
            상담을 정리하는 가장 쉬운 방법
          </motion.span>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="flex gap-2 mt-6"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.28, ease: 'easeInOut' }}
              className="block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
