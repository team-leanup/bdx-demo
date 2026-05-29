'use client';

import { useEffect } from 'react';
import { useLocaleStore } from '@/store/locale-store';

/**
 * locale 변경 시 document.documentElement.lang을 동기화.
 * SSR에서는 html[lang="ko"]가 고정되고, 클라이언트 하이드레이션 후 이 컴포넌트가 갱신.
 */
export function LocaleLangSync(): null {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
