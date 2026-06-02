import type { CustomPartSetting } from '@/types/shop';

/**
 * 모든 샵의 기본 커스텀 파츠 8종 (SSOT).
 *
 * 설정 > 서비스 > 커스텀 파츠의 초기값이자, 설정을 한 번도 손대지 않아
 * DB `settings.customParts`가 비어 있는(null/미설정) 샵에서 고객 사전상담·현장모드
 * 화면에 노출되는 fallback 값.
 *
 * 주의: 원장이 의도적으로 전부 삭제한 경우(`[]`)는 존중한다.
 * 따라서 소비처에서 `settings.customParts ?? DEFAULT_CUSTOM_PARTS`로 써서
 * null/undefined(미설정)일 때만 기본값을 노출하고, 빈 배열은 그대로 둔다.
 */
export const DEFAULT_CUSTOM_PARTS: CustomPartSetting[] = [
  { id: 'preset-cubic', name: '큐빅', pricePerUnit: 2000 },
  { id: 'preset-swarovski', name: '스와로브스키', pricePerUnit: 3000 },
  { id: 'preset-pearl', name: '진주', pricePerUnit: 2000 },
  { id: 'preset-glitter', name: '글리터', pricePerUnit: 2000 },
  { id: 'preset-shell', name: '쉘', pricePerUnit: 2000 },
  { id: 'preset-foil', name: '호일', pricePerUnit: 1500 },
  { id: 'preset-sticker', name: '스티커', pricePerUnit: 1000 },
  { id: 'preset-charm', name: '참', pricePerUnit: 2500 },
];
