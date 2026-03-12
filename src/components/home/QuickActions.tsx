'use client';

import { motion } from 'framer-motion';
import type { ComponentType, SVGProps } from 'react';

interface QuickAction {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onNavigate: (href: string) => void;
  itemVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { duration: number; ease: number[] } };
  };
}

export function QuickActions({
  actions,
  onNavigate,
  itemVariants,
}: QuickActionsProps): React.ReactElement {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-4 gap-2">
      {actions.map(({ label, icon: Icon, href }) => (
        <button
          key={href}
          onClick={() => onNavigate(href)}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-surface border border-border p-3 active:scale-95 transition-transform hover:bg-surface-alt"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt">
            <Icon className="h-5 w-5 text-text-secondary" />
          </div>
          <span className="text-xs font-medium text-text-secondary leading-none">{label}</span>
        </button>
      ))}
    </motion.div>
  );
}
