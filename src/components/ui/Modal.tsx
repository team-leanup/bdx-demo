'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-2xl',
              'max-h-[90vh] flex flex-col',
              'md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-lg md:rounded-3xl',
              className,
            )}
          >
            {/* handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
                <h2 className="font-bold text-base text-text">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full hover:bg-surface-alt flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
