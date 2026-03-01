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
        'grid gap-4',
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
      whileHover={isInteractive ? { y: -4, scale: 1.015, transition: { duration: 0.2 } } : undefined}
      whileTap={isInteractive ? { scale: 0.98, transition: { duration: 0.1 } } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-3xl overflow-hidden transition-shadow duration-300',
        SPAN_CLASSES[span],
        variant === 'default' && 'bg-surface-elevated border border-border shadow-[var(--shadow-bento)] hover:shadow-[var(--shadow-bento-hover)]',
        variant === 'hero' && 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-[var(--shadow-bento-hero)]',
        variant === 'accent' && 'bg-primary/10 border border-primary/20',
        variant === 'glass' && 'bg-surface/80 backdrop-blur-xl border border-border/50 shadow-[var(--shadow-bento)]',
        isInteractive && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
