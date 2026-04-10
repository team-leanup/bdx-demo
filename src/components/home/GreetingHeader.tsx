'use client';

import { motion } from 'framer-motion';

interface GreetingHeaderProps {
  shopName: string;
  activeDesignerName: string | null;
  greeting: string;
  role: 'owner' | 'staff' | null;
  todayDateStr: string;
  itemVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { duration: number; ease: number[] } };
  };
}

export function GreetingHeader({
  shopName,
  activeDesignerName,
  greeting,
  role,
  todayDateStr,
  itemVariants,
}: GreetingHeaderProps): React.ReactElement {
  return (
    <motion.div variants={itemVariants} className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-secondary">{shopName}</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-text">
          {activeDesignerName ? `${activeDesignerName}님, ` : ''}{greeting} <span className="text-primary">✦</span>
        </h1>
        <p className="mt-0.5 text-xs text-text-muted">
          {role === 'owner' ? '원장' : role === 'staff' ? '선생님' : ''}{role ? ' · ' : ''}{todayDateStr}
        </p>
      </div>
      {/* 알림 / 아바타 자리 */}
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <span className="text-sm font-semibold text-primary">
          {activeDesignerName?.slice(0, 1) ?? shopName.slice(0, 1)}
        </span>
      </div>
    </motion.div>
  );
}
