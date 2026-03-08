export const PORTFOLIO_MAX_PHOTOS = 30;
export const PORTFOLIO_MAX_BYTES = 3 * 1024 * 1024;
export const PORTFOLIO_MAX_DIMENSION = 480;
export const PORTFOLIO_TARGET_KB = 120;

export interface StorageUsageInfo {
  key: string;
  bytes: number;
  label: string;
}

// Unified helper. If `keys` is provided, returns usage for those keys.
// If omitted, returns usage for the demo app keys with Korean labels.
export function getStorageUsage(keys?: string[]): StorageUsageInfo[] {
  if (typeof window === 'undefined') return [];

  const defaultKeys: { key: string; label: string }[] = [
    { key: 'bdx-customers', label: '고객' },
    { key: 'bdx-reservations', label: '예약' },
    { key: 'bdx-records', label: '상담기록' },
    { key: 'bdx-portfolio', label: '포트폴리오' },
  ];

  const target = keys && keys.length > 0 ? keys.map((k) => ({ key: k, label: k })) : defaultKeys;

  return target.map(({ key, label }) => {
    const item = localStorage.getItem(key);
    const bytes = item ? new Blob([item]).size : 0;
    return {
      key,
      bytes,
      label,
    };
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function estimatePortfolioSize(photos: { imageDataUrl: string }[]): number {
  return photos.reduce((acc, p) => {
    if (!p.imageDataUrl) return acc;
    const idx = p.imageDataUrl.indexOf(',');
    const data = idx >= 0 ? p.imageDataUrl.slice(idx + 1) : p.imageDataUrl;
    return acc + Math.ceil((data.length * 3) / 4);
  }, 0);
}

export function checkPortfolioLimits(
  currentPhotos: { imageDataUrl: string; createdAt: string }[],
  newPhotoSize: number,
): { allowed: boolean; mustEvict: number; reason?: string } {
  const currentSize = estimatePortfolioSize(currentPhotos);
  const newTotal = currentSize + newPhotoSize;

  if (currentPhotos.length >= PORTFOLIO_MAX_PHOTOS) {
    return {
      allowed: true,
      mustEvict: 1,
      reason: `최대 ${PORTFOLIO_MAX_PHOTOS}장 초과`,
    };
  }

  if (newTotal > PORTFOLIO_MAX_BYTES) {
    let sizeToFree = newTotal - PORTFOLIO_MAX_BYTES;
    let evictCount = 0;
    const sorted = [...currentPhotos].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    for (const photo of sorted) {
      if (sizeToFree <= 0) break;
      const idx = photo.imageDataUrl.indexOf(',');
      const data = idx >= 0 ? photo.imageDataUrl.slice(idx + 1) : photo.imageDataUrl;
      const size = Math.ceil((data.length * 3) / 4);
      sizeToFree -= size;
      evictCount++;
    }

    return {
      allowed: evictCount < currentPhotos.length,
      mustEvict: evictCount,
      reason: '저장 공간 부족',
    };
  }

  return { allowed: true, mustEvict: 0 };
}

export function clearStorageKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export function clearAllDemoData(): void {
  if (typeof window === 'undefined') return;
  const demoKeys = [
    'bdx-customers',
    'bdx-reservations',
    'bdx-records',
    'bdx-portfolio',
    'bdx-consultation',
  ];
  demoKeys.forEach((key) => localStorage.removeItem(key));
}

export function safeSetItem(key: string, value: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'SSR' };

  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return { success: false, error: '저장 공간이 부족합니다. 설정에서 데이터를 정리해주세요.' };
    }
    return { success: false, error: '저장 실패' };
  }
}
