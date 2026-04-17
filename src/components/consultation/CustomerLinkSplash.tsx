'use client';

import type React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface CustomerLinkSplashProps {
  shopName: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
}

export function CustomerLinkSplash({
  shopName,
  title,
  titleKo,
  description,
  descriptionKo,
}: CustomerLinkSplashProps): React.ReactElement {
  return (
    <div className="relative flex h-dvh items-center justify-center overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background px-6">
      <div className="pointer-events-none absolute right-[-5rem] top-[-5rem] h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-4rem] left-[-3rem] h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-[2rem] border border-white/60 bg-white/80 px-7 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <Image
            src="/bdx-logo/bdx-logo-vertical-pink.svg"
            alt="BDX — Beauty Decision eXperience"
            width={164}
            height={204}
            priority
            className="h-40 w-auto sm:h-44"
          />
          {shopName && (
            <div className="mt-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
              {shopName}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: 'easeOut' }}
          className="mt-6"
        >
          <p className="text-lg font-bold text-text">{title}</p>
          {titleKo !== title && (
            <p className="mt-1 text-xs font-semibold text-text-muted opacity-70">{titleKo}</p>
          )}
          <p className="mt-3 text-sm text-text-muted">{description}</p>
          {descriptionKo !== description && (
            <p className="mt-1 text-xs text-text-muted opacity-60">{descriptionKo}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="mt-7 flex gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.88, 1, 0.88] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              className="block h-2 w-2 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
