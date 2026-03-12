import { StatusBar } from './StatusBar';
import { BottomTabBar } from './BottomTabBar';
import { SideNav } from './SideNav';
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
          className="flex-1 min-h-0 overflow-y-auto lg:!pt-0 lg:!pb-0"
          style={{
            paddingTop: hideStatusBar ? 0 : '3.5rem',
            paddingBottom: hideTabBar ? 0 : 'calc(4rem + env(safe-area-inset-bottom, 0px))',
          }}
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
