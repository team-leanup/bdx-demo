'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useLocaleStore } from '@/store/locale-store';
import { useAppStore } from '@/store/app-store';
import { useShopStore } from '@/store/shop-store';
import { NotificationBellButton } from '@/components/layout/NotificationBellButton';
import type { Locale } from '@/store/locale-store';
import { cn } from '@/lib/cn';

interface StatusBarProps {
  shopName?: string;
}

const LOCALE_LABELS: { value: Locale; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

export function StatusBar({ shopName: shopNameProp }: StatusBarProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { locale, setLocale } = useLocaleStore();
  const { shopSettings } = useAppStore();
  const storeShopName = useShopStore((s) => s.shop?.name);
  const shopName = shopNameProp || shopSettings.shopName || (storeShopName ?? '네일숲');
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-surface border-b border-border safe-top lg:hidden">
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto lg:max-w-none lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="font-bold text-base tracking-tight text-primary">{shopName}</span>
        </div>

        {/* Right: lang toggle + bell */}
        <div className="flex items-center gap-1 relative">
          {/* Language toggle */}
          <button
            type="button"
            onClick={() => setShowLangMenu((v) => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-alt transition-colors"
            aria-label="언어 변경"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
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
          </button>

          {/* Bell */}
          <NotificationBellButton />

          {/* Language dropdown */}
          {showLangMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowLangMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[110px]">
                {LOCALE_LABELS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setLocale(opt.value);
                      setShowLangMenu(false);
                    }}
                    className={cn(
                      'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-left',
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
    </header>
  );
}
