'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import { useLocaleStore } from '@/store/locale-store';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { RoleBadge } from '@/components/auth/RoleBadge';
import { MOCK_SHOP } from '@/data/mock-shop';
import type { Locale } from '@/store/locale-store';

const TAB_DEFS = [
  {
    href: '/home',
    key: 'nav.home' as const,
    icon: () => (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/records',
    key: 'nav.records' as const,
    icon: () => (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/customers',
    key: 'nav.customers' as const,
    icon: () => (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    key: 'nav.dashboard' as const,
    icon: () => (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    href: '/portfolio',
    key: 'nav.portfolio' as const,
    icon: () => (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM10.5 8.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    key: 'nav.settings' as const,
    icon: () => (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const LOCALE_LABELS: { value: Locale; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
  const pathname = usePathname();
  const t = useT();
  const { locale, setLocale } = useLocaleStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { shopSettings } = useAppStore();
  const shopName = shopSettings.shopName || MOCK_SHOP.name;
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <aside
      className={cn(
        'w-[200px] h-full flex-shrink-0 flex flex-col bg-surface border-r border-border',
        className,
      )}
    >
      {/* Top: Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(244,114,182,0.15)' }}>
            <span className="text-sm font-extrabold" style={{ color: '#F472B6' }}>B</span>
          </div>
          <span className="text-base font-bold tracking-tight" style={{ color: '#F472B6' }}>BDX</span>
        </div>
      </div>

      {/* Middle: Navigation links */}
      <nav data-tour-id="tour-nav" className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {TAB_DEFS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-150',
                active
                  ? 'text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-alt',
              )}
            >
              {active && (
                <motion.span
                  layoutId="sideNavActive"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
               <span className="relative z-10 flex-shrink-0">{tab.icon()}</span>
              <span className="relative z-10 text-[13px]">{t(tab.key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="px-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu((v) => !v)}
              className="group flex w-full items-center justify-between rounded-xl border border-border bg-surface-alt/80 px-3 py-2.5 text-text-secondary transition-colors hover:border-primary/20 hover:bg-surface-alt"
              aria-label="언어 변경"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-background text-text-secondary ring-1 ring-border transition-colors group-hover:text-primary">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
                    />
                  </svg>
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">Language</span>
                  <span className="block truncate text-[13px] font-semibold text-text">
                    {LOCALE_LABELS.find((l) => l.value === locale)?.label ?? locale}
                  </span>
                </span>
              </span>
              <svg
                className={cn(
                  'h-4 w-4 flex-shrink-0 text-text-muted transition-transform duration-200',
                  showLangMenu && 'rotate-180',
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute left-0 right-0 bottom-full mb-2 z-50 rounded-xl border border-border bg-surface p-2 shadow-lg">
                  {LOCALE_LABELS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setLocale(opt.value);
                        setShowLangMenu(false);
                      }}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors',
                        locale === opt.value
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:bg-surface-alt',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 mt-2">
          <span className="font-bold text-sm tracking-tight text-primary truncate">{shopName}</span>
          {isLoggedIn() && <RoleBadge />}
          <button
            type="button"
            className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-alt transition-colors"
            aria-label="알림"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
