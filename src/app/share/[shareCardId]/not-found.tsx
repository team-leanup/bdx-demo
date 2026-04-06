'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';

export default function ShareCardNotFound(): React.ReactElement {
  const t = useT();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
          <svg
            className="w-8 h-8 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold text-text">
            {t('shareCard.notFound')}
          </h1>
          <p className="text-sm text-text-muted">
            {t('shareCard.notFoundDesc')}
          </p>
        </div>

        <Link
          href="/"
          className="mt-2 text-sm text-primary font-medium underline underline-offset-4"
        >
          {t('nav.home')}
        </Link>
      </motion.div>
    </div>
  );
}
