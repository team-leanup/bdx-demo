'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  direction?: 'forward' | 'back';
}

const variants = {
  forward: {
    enter: { x: '100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: '-30%', opacity: 0 },
  },
  back: {
    enter: { x: '-100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: '30%', opacity: 0 },
  },
};

export function PageTransition({ children, direction = 'forward' }: PageTransitionProps) {
  const v = variants[direction];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={v.enter}
        animate={v.center}
        exit={v.exit}
        transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
