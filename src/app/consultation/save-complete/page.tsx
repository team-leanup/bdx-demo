'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';

function SaveCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultationId') ?? 'record-001';
  const customerId = searchParams.get('customerId') ?? '';

  const primaryOptions = [
    {
      icon: '📋',
      title: '당일 시술 체크리스트 작성',
      badge: '30초',
      subtitle: '쉐입, 길이, 두께감을 기록해요',
      href: `/records/${consultationId}?tab=checklist`,
      accent: true,
    },
    {
      icon: '📄',
      title: '시술 확인서 보기',
      badge: null,
      subtitle: '네일 디자인 요약과 금액을 확인해요',
      href: `/consultation/treatment-sheet?consultationId=${consultationId}&customerId=${customerId}`,
      accent: false,
    },
  ];

  const secondaryOptions = [
    {
      icon: '👤',
      title: '고객 선호 프로필 저장',
      subtitle: '다음 방문에 자동으로 불러와요',
      href: customerId ? `/customers/${customerId}?tab=preference` : '/customers',
    },
    {
      icon: '🏠',
      title: '홈으로 돌아가기',
      subtitle: '나중에 기록 탭에서 정리할 수 있어요',
      href: '/home',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* 완료 아이콘 + 타이틀 */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="mb-6 flex flex-col items-center gap-3"
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: 'color-mix(in srgb, var(--color-success) 15%, var(--color-surface))' }}
        >
          <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--color-success)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">저장 완료</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            30초만 더 정리하면 재방문 때 훨씬 편해져요
          </p>
        </div>
      </motion.div>

      {/* 메인 CTA 카드 (체크리스트 + 시술 확인서) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="w-full max-w-sm flex flex-col gap-3 mb-4"
      >
        {primaryOptions.map(({ icon, title, badge, subtitle, href, accent }, idx) => (
          <motion.button
            key={href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + idx * 0.08, duration: 0.25 }}
            onClick={() => router.push(href)}
            className={`w-full rounded-2xl p-5 text-left transition-all active:scale-[0.98] ${
              accent
                ? 'bg-text text-white'
                : 'bg-surface border-2 border-text text-text'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base leading-snug">{title}</p>
                  {badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0 ${
                        accent ? 'bg-white/25 text-white' : 'bg-text text-white'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm mt-0.5 ${
                    accent ? 'opacity-85' : 'text-text-secondary'
                  }`}
                >
                  {subtitle}
                </p>
              </div>
              <svg
                className={`h-5 w-5 flex-shrink-0 ${
                  accent ? 'opacity-80' : 'text-text'
                }`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* 보조 옵션 (고객 프로필, 홈) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.25 }}
        className="w-full max-w-sm flex flex-col gap-2"
      >
        {secondaryOptions.map(({ icon, title, subtitle, href }, idx) => (
          <motion.button
            key={href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 + idx * 0.07, duration: 0.22 }}
            onClick={() => router.push(href)}
            className="flex items-center gap-4 rounded-2xl border p-4 text-left transition-all active:scale-[0.98]"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ background: 'var(--color-surface-alt)' }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-text">{title}</span>
              <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
            </div>
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              style={{ color: 'var(--color-text-muted)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

export default function SaveCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SaveCompleteContent />
    </Suspense>
  );
}
