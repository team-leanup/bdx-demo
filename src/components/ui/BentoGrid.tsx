'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}

export function BentoGrid({ children, className, cols = 4 }: BentoGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'grid gap-3 sm:gap-4',
        cols === 4 && 'grid-cols-2 md:grid-cols-4',
        cols === 3 && 'grid-cols-2 md:grid-cols-3',
        cols === 2 && 'grid-cols-1 md:grid-cols-2',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

type BentoCardVariant = 'default' | 'hero' | 'accent' | 'glass';
type BentoCardSpan = '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | '4x1';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  variant?: BentoCardVariant;
  span?: BentoCardSpan;
  onClick?: () => void;
  hoverable?: boolean;
}

const SPAN_CLASSES: Record<BentoCardSpan, string> = {
  '1x1': 'col-span-1 row-span-1',
  '2x1': 'col-span-2 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x2': 'col-span-2 row-span-2',
  '3x1': 'col-span-3 row-span-1',
  '4x1': 'col-span-2 md:col-span-4 row-span-1',
};

export function BentoCard({
  children,
  className,
  variant = 'default',
  span = '1x1',
  onClick,
  hoverable = false,
}: BentoCardProps) {
  const isInteractive = hoverable || !!onClick;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={isInteractive ? { scale: 1.01, transition: { duration: 0.15 } } : undefined}
      whileTap={isInteractive ? { scale: 0.98, transition: { duration: 0.1 } } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl overflow-hidden transition-colors duration-150',
        SPAN_CLASSES[span],
        variant === 'default' && 'bg-surface border border-border hover:bg-surface-alt',
        variant === 'hero' && 'bg-primary text-white',
        variant === 'accent' && 'bg-primary-light border border-primary/10',
        variant === 'glass' && 'bg-surface/90 backdrop-blur-sm border border-border',
        isInteractive && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
