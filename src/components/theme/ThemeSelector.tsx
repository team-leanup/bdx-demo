'use client';

import { motion } from 'framer-motion';
import { THEME_PRESETS } from '@/config/themes';
import { useThemeStore } from '@/store/theme-store';
import type { ThemeId } from '@/types/theme';

export function ThemeSelector() {
  const { themeId, setTheme } = useThemeStore();

  const handleSelect = (id: ThemeId) => {
    setTheme(id);
    document.documentElement.setAttribute('data-theme', id);
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
      {THEME_PRESETS.map((theme) => {
        const isActive = themeId === theme.id;

        return (
          <motion.button
            key={theme.id}
            onClick={() => handleSelect(theme.id)}
            whileTap={{ scale: 0.95 }}
            animate={isActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-all"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: isActive ? theme.colors.primary : theme.colors.border,
              boxShadow: isActive
                ? `0 0 0 1px ${theme.colors.primary}40`
                : undefined,
            }}
          >
            {/* Active checkmark */}
            {isActive && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                >
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            )}

            {/* Color palette preview */}
            <div className="flex gap-1.5">
              {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map(
                (color, i) => (
                  <div
                    key={i}
                    className="h-5 w-5 rounded-full border border-black/5"
                    style={{ backgroundColor: color }}
                  />
                ),
              )}
            </div>

            {/* Theme info */}
            <div className="w-full">
              <p
                className="text-xs font-semibold leading-tight"
                style={{ color: theme.colors.text }}
              >
                {theme.name}
              </p>
              <p
                className="mt-0.5 line-clamp-2 text-[10px] leading-tight"
                style={{ color: theme.colors.textMuted }}
              >
                {theme.description}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
