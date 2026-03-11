'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { ConsultationSummaryCard } from '@/components/consultation/ConsultationSummaryCard';
import { useConsultationStore } from '@/store/consultation-store';

function SaveCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultationId') ?? 'record-001';
  const customerId = searchParams.get('customerId') ?? '';
  const mode = searchParams.get('mode') ?? 'default';
  const sourceShopName = useConsultationStore((s) => s.consultation.sourceShopName);
  const customerLinkEntryHref = `/consultation/customer?entry=customer-link${sourceShopName ? `&shopName=${encodeURIComponent(sourceShopName)}` : ''}`;

  if (mode === 'preconsultation') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mb-4 flex flex-col items-center gap-3"
        >
          <img
            src="/bdx-logo/bdx-symbol-flower.svg"
            alt="BDX"
            className="h-20 w-20"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text">사전 상담이 저장됐어요</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              예약 카드에 디자인 확정 상태로 표시됩니다.
            </p>
          </div>
        </motion.div>

        {sourceShopName && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="w-full max-w-sm mb-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Consultation Link</p>
            <p className="mt-1 text-sm font-bold text-text">{sourceShopName}</p>
            <p className="mt-1 text-xs text-text-muted">{sourceShopName}에 전달된 사전 상담으로 저장됐어요.</p>
          </motion.div>
        )}

        {/* 매장 도착 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="w-full max-w-sm mb-4 flex items-start gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349M3.75 21H6m0 0h2.25m0-11.177v-.958c0-.568.422-1.048.987-1.106a48.554 48.554 0 019.526 0 1.114 1.114 0 01.987 1.106v.958" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">
            <span className="font-bold text-text">매장 도착 후 이 화면을 보여주시면</span><br />담당 디자이너가 바로 확인할 수 있어요.
          </p>
        </motion.div>

        {/* 상담 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="w-full max-w-sm mb-4"
        >
          <ConsultationSummaryCard />
        </motion.div>

        <div className="w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={() => router.push(customerLinkEntryHref)}
            className="w-full rounded-2xl bg-primary px-5 py-4 text-left text-white transition-all active:scale-[0.98]"
          >
            <p className="text-base font-bold">새 상담 다시 작성하기</p>
            <p className="mt-1 text-sm opacity-85">필요하면 정보를 수정해서 다시 제출할 수 있어요</p>
          </button>
        </div>
      </div>
    );
  }

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
          style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, var(--color-surface))' }}
        >
          <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--color-primary)' }}>
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
