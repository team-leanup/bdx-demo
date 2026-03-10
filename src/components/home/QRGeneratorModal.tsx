'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface QRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId?: string;
}

const CONSULTATION_URL_PATH = '/consultation/customer?entry=customer-link';

export function QRGeneratorModal({ isOpen, onClose, shopId }: QRGeneratorModalProps): React.ReactElement | null {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const consultationUrl = origin
    ? `${origin}${CONSULTATION_URL_PATH}${shopId ? `&shopId=${shopId}` : ''}`
    : CONSULTATION_URL_PATH;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(consultationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = consultationUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm mx-4 mb-safe rounded-3xl bg-surface overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-text">상담 링크 QR</h2>
                <p className="text-xs text-text-muted mt-0.5">고객이 스캔하면 사전 상담을 시작해요</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-alt hover:bg-border transition-colors"
              >
                <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 px-5 py-6">
              <div className="w-44 h-44 rounded-2xl border-2 border-border bg-white flex items-center justify-center p-3 shadow-sm">
                <QRCodeSVG
                  value={consultationUrl}
                  size={152}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="text-xs text-text-muted text-center px-4">
                스마트폰 카메라로 QR 코드를 스캔하세요
              </p>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-alt border border-border">
                <svg className="w-3 h-3 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <span className="text-xs text-text-secondary font-medium truncate max-w-[220px]">{consultationUrl}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
                style={{
                  background: copied ? 'color-mix(in srgb, var(--color-success) 15%, var(--color-surface))' : 'var(--color-primary)',
                  color: copied ? 'var(--color-success)' : 'white',
                }}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    복사됨!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    링크 복사
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
