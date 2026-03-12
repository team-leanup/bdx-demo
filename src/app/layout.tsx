import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import SupabaseProvider from '@/components/SupabaseProvider';
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
  icons: {
    icon: '/bdx-logo/bdx-symbol.svg',
    shortcut: '/bdx-logo/bdx-symbol.svg',
    apple: '/bdx-logo/bdx-symbol.svg',
  },
  openGraph: {
    title: 'BDX — Beauty Decision eXperience',
    description: '네일샵 현장 상담 & 고객 관리 플랫폼',
    images: [{ url: '/bdx-og-image2.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BDX — Beauty Decision eXperience',
    description: '네일샵 현장 상담 & 고객 관리 플랫폼',
    images: ['/bdx-og-image2.png'],
  },
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
      <body suppressHydrationWarning className="min-h-screen bg-background text-text font-pretendard">
        <ThemeProvider>
          <SupabaseProvider>{children}</SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
