export const MAX_PROFILE_IMAGE_KB = 150;

/**
 * 이미지를 인스타그램 규격으로 리사이즈하여 다운로드
 * - 9:16 (1080×1920): 스토리/릴스
 * - 4:5 (1080×1350): 피드
 * Canvas API를 직접 사용 (html2canvas 불필요)
 */
export async function downloadForInstagram(
  imageUrl: string,
  ratio: '9:16' | '4:5' = '4:5',
): Promise<void> {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('이미지 로딩 실패'));
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  if (ratio === '9:16') {
    canvas.width = 1080;
    canvas.height = 1920;
  } else {
    canvas.width = 1080;
    canvas.height = 1350;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context 생성 실패');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // cover 방식으로 중앙 배치
  const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
  const x = (canvas.width - img.width * scale) / 2;
  const y = (canvas.height - img.height * scale) / 2;
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

  const link = document.createElement('a');
  link.download = `nail_design_${Date.now()}.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 0.95);
  link.click();
}

// Portfolio-specific settings
export const PORTFOLIO_MAX_DIMENSION = 480;
export const PORTFOLIO_TARGET_KB = 120;

// 시술 사진(현장모드 wrap-up·포트폴리오 업로드)용 — 표시 품질 유지하면서 버킷 2MB 제한 내로 압축
export const TREATMENT_PHOTO_MAX_DIMENSION = 1600;
export const TREATMENT_PHOTO_TARGET_KB = 400;

/**
 * base64 dataURL 을 받아 시술 사진용으로 리사이즈/압축한다.
 * - 최대 변(1600px) 초과 시 비율 유지 축소
 * - 목표 용량(400KB) 이하가 되도록 품질 단계적 하향
 * - File 없이 dataURL(카메라 캡처/FileReader 결과)에서 바로 사용 가능
 * - 입력이 이미지가 아니거나 디코드 실패 시 원본 반환(안전)
 */
export function resizeTreatmentPhoto(
  dataUrl: string,
  maxDimension = TREATMENT_PHOTO_MAX_DIMENSION,
  targetKB = TREATMENT_PHOTO_TARGET_KB,
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
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
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];
      for (const q of qualities) {
        const out = canvas.toDataURL('image/jpeg', q);
        if (estimateBase64SizeKB(out) <= targetKB) {
          resolve(out);
          return;
        }
      }
      resolve(canvas.toDataURL('image/jpeg', 0.4));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

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
