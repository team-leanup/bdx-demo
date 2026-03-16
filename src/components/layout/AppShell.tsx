import { StatusBar } from './StatusBar';
import { BottomTabBar } from './BottomTabBar';
import { SideNav } from './SideNav';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  hideStatusBar?: boolean;
  hideTabBar?: boolean;
}

export function AppShell({ children, hideStatusBar, hideTabBar }: AppShellProps) {
  return (
    <div className="flex h-dvh bg-background">
      {!hideTabBar && <SideNav className="hidden lg:flex" />}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {!hideStatusBar && <StatusBar />}
        <main
          className={cn(
            'flex-1 min-h-0 overflow-y-auto overscroll-y-contain',
            !hideStatusBar && 'pt-14',
            !hideTabBar && 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]',
            'lg:pt-0 lg:pb-0',
          )}
        >
          <div className="max-w-2xl mx-auto w-full lg:max-w-none lg:px-8 lg:pt-10">
            {children}
          </div>
        </main>
        {!hideTabBar && <BottomTabBar />}
      </div>
    </div>
  );
}
