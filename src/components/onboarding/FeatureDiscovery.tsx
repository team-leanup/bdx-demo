'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/store/onboarding-store';

interface Step {
  icon: string;
  title: string;
  description: string;
}

interface FeatureDiscoveryProps {
  featureId: string;
  icon: string | React.ReactNode;
  title: string;
  description?: string;
  steps?: Step[];
  onDismiss?: () => void;
  onComplete?: () => void;
}

// ── Mode A: Simple Intro ──────────────────────────────────────────────────────
function SimpleModal({
  icon,
  title,
  description,
  onConfirm,
}: {
  icon: string | React.ReactNode;
  title: string;
  description?: string;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      key="simple"
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm mx-auto rounded-3xl border border-border bg-surface shadow-xl p-6 flex flex-col items-center text-center gap-4"
    >
      {/* Icon circle */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: 'var(--color-primary-subtle, color-mix(in srgb, var(--color-primary) 12%, transparent))' }}
      >
        {typeof icon === 'string' ? (
          <span className="text-4xl leading-none select-none" aria-hidden="true">{icon}</span>
        ) : (
          <span aria-hidden="true">{icon}</span>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-bold text-text">{title}</h2>
        {description && (
          <p className="text-sm leading-relaxed text-text-secondary">
            {description.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onConfirm}
        className="mt-1 w-full rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white active:scale-[0.97] transition-transform"
      >
        확인했어요
      </button>
    </motion.div>
  );
}

// ── Mode B: Multi-Step ────────────────────────────────────────────────────────
function MultiStepModal({
  icon,
  title,
  steps,
  onComplete,
  onDismiss,
}: {
  icon: string | React.ReactNode;
  title: string;
  steps: Step[];
  onComplete: () => void;
  onDismiss: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLast = currentStep === steps.length - 1;

  return (
    <motion.div
      key="multistep"
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm mx-auto rounded-3xl border border-border bg-surface shadow-xl p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
        >
          {typeof icon === 'string' ? (
            <span className="text-2xl leading-none select-none" aria-hidden="true">{icon}</span>
          ) : (
            <span aria-hidden="true">{icon}</span>
          )}
        </div>
        <h2 className="text-base font-bold text-text">{title}</h2>
      </div>

      {/* Step cards 2x2 grid */}
      <div className="grid grid-cols-2 gap-2">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          return (
            <motion.div
              key={idx}
              animate={isActive ? { scale: 1.02 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative flex flex-col gap-1.5 rounded-2xl border p-3 transition-colors"
              style={{
                borderColor: isActive
                  ? 'var(--color-primary)'
                  : isDone
                  ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
                  : 'var(--color-border)',
                background: isActive
                  ? 'color-mix(in srgb, var(--color-primary) 7%, transparent)'
                  : isDone
                  ? 'color-mix(in srgb, var(--color-primary) 4%, transparent)'
                  : 'transparent',
              }}
            >
              {/* Step number badge */}
              <div className="flex items-center gap-1.5">
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
                  style={{
                    background: isActive || isDone ? 'var(--color-primary)' : 'var(--color-border)',
                    color: isActive || isDone ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <span className="text-base leading-none" aria-hidden="true">{step.icon}</span>
              </div>
              <p
                className="text-xs font-bold leading-tight"
                style={{ color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
              >
                {step.title}
              </p>
              <p className="text-[11px] leading-snug text-text-muted">{step.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className="rounded-full transition-all duration-300"
            style={{
              width: idx === currentStep ? '20px' : '6px',
              height: '6px',
              background:
                idx <= currentStep ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onDismiss}
          className="rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary active:scale-[0.97] transition-transform"
        >
          건너뛰기
        </button>
        <button
          onClick={() => {
            if (isLast) {
              onComplete();
            } else {
              setCurrentStep((s) => s + 1);
            }
          }}
          className="flex-1 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white active:scale-[0.97] transition-transform"
        >
          {isLast ? '시작하기' : '다음'}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function FeatureDiscovery({
  featureId,
  icon,
  title,
  description,
  steps,
  onDismiss,
  onComplete,
}: FeatureDiscoveryProps) {
  const { hasSeen, markSeen } = useOnboardingStore();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // SSR safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show after 300ms delay if not seen
  useEffect(() => {
    if (!mounted) return;
    if (hasSeen(featureId)) return;
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, [mounted, featureId, hasSeen]);

  const dismiss = () => {
    markSeen(featureId);
    setVisible(false);
    onDismiss?.();
  };

  const complete = () => {
    markSeen(featureId);
    setVisible(false);
    onComplete?.();
  };

  // Don't render anything if not mounted (SSR) or already seen
  if (!mounted || (!visible && hasSeen(featureId))) return null;

  const portal = (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-5"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
            onClick={dismiss}
          >
            {/* Prevent click-through on modal */}
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
              {steps && steps.length > 0 ? (
                <MultiStepModal
                  icon={icon}
                  title={title}
                  steps={steps}
                  onComplete={complete}
                  onDismiss={dismiss}
                />
              ) : (
                <SimpleModal
                  icon={icon}
                  title={title}
                  description={description}
                  onConfirm={complete}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(portal, document.body) : null;
}
