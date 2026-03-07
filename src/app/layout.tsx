import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { pretendard } from '@/lib/fonts';
import { STORAGE_KEYS } from '@/constants/storage-keys';

const themeBootstrapScript = `
  (() => {
    try {
      var rawTheme = localStorage.getItem('${STORAGE_KEYS.theme}');
      if (!rawTheme) {
        return;
      }

      var parsedTheme = JSON.parse(rawTheme);
      var themeId = parsedTheme && parsedTheme.state && parsedTheme.state.themeId;
      if (themeId) {
        document.documentElement.setAttribute('data-theme', themeId);
      }
    } catch (error) {
      void error;
    }
  })();
`;

export const metadata: Metadata = {
  title: 'BDX — Beauty Decision eXperience',
  description: '네일샵 현장 상담 & 고객 관리 플랫폼',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BDX',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning className={pretendard.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-screen bg-background text-text font-pretendard">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
