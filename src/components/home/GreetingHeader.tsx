'use client';

import { motion } from 'framer-motion';

interface GreetingHeaderProps {
  shopName: string;
  activeDesignerName: string | null;
  greeting: string;
  role: 'owner' | 'staff' | null;
  todayDateStr: string;
  logoPublicUrl?: string | null;
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
  logoPublicUrl,
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
      {/* 로고 / 이니셜 뱃지 */}
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
        {logoPublicUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoPublicUrl}
            alt={shopName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold text-primary">
            {activeDesignerName?.slice(0, 1) ?? shopName.slice(0, 1)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
