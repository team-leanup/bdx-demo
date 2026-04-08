'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

type MainTab = 'reservations' | 'consultations';

interface MainTabBarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  reservationsLabel?: string;
  consultationsLabel?: string;
}

export function MainTabBar({
  activeTab,
  onTabChange,
  reservationsLabel = '스케줄',
  consultationsLabel = '시술 기록',
}: MainTabBarProps): React.ReactElement {
  return (
    <div className="px-4 md:px-0">
      <div className="flex border-b border-border">
        <button
          onClick={() => onTabChange('reservations')}
          className={cn(
            'flex-1 py-3 text-sm font-medium text-center transition-colors relative',
            activeTab === 'reservations' ? 'text-primary' : 'text-text-secondary hover:text-text',
          )}
        >
          {reservationsLabel}
          {activeTab === 'reservations' && (
            <motion.div layoutId="mainTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => onTabChange('consultations')}
          className={cn(
            'flex-1 py-3 text-sm font-medium text-center transition-colors relative',
            activeTab === 'consultations' ? 'text-primary' : 'text-text-secondary hover:text-text',
          )}
        >
          {consultationsLabel}
          {activeTab === 'consultations' && (
            <motion.div layoutId="mainTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>
    </div>
  );
}
