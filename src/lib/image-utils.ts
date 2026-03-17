export const MAX_PROFILE_IMAGE_KB = 150;

// Portfolio-specific settings
export const PORTFOLIO_MAX_DIMENSION = 1200;
export const PORTFOLIO_TARGET_KB = 500;

export function estimateBase64SizeKB(base64: string): number {
  // base64 data URL: "data:image/jpeg;base64,<data>"
  const idx = base64.indexOf(',');
  const data = idx >= 0 ? base64.slice(idx + 1) : base64;
  return Math.ceil((data.length * 3) / 4 / 1024);
}

export function resizeImageToBase64(
  file: File,
  maxSize = 200,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', quality);

      if (estimateBase64SizeKB(base64) > MAX_PROFILE_IMAGE_KB) {
        // retry with lower quality
        const lower = canvas.toDataURL('image/jpeg', 0.6);
        resolve(lower);
      } else {
        resolve(base64);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Resize image for portfolio with stricter limits
 * - Max dimension: 480px
 * - Target max KB: 120KB
 * - Output: JPEG
 */
export function resizePortfolioImage(
  file: File,
  maxDimension = PORTFOLIO_MAX_DIMENSION,
  targetKB = PORTFOLIO_TARGET_KB,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to meet target size
      const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];
      for (const q of qualities) {
        const base64 = canvas.toDataURL('image/jpeg', q);
        if (estimateBase64SizeKB(base64) <= targetKB) {
          resolve(base64);
          return;
        }
      }

      // Fallback: use lowest quality
      resolve(canvas.toDataURL('image/jpeg', 0.4));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
