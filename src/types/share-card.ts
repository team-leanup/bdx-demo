import type { DesignScope, ExpressionType } from './consultation';

export interface ShareCardDesignInfo {
  designScope: DesignScope;
  expressions: ExpressionType[];
  hasParts: boolean;
  bodyPart: 'hand' | 'foot';
  nailShape?: string;
  /** 실제 시술 카테고리 ID (simple/french/magnet/art 또는 custom-*) */
  designCategory?: string;
  /** db.ts에서 미리 해석한 한국어 카테고리 라벨 (공개 페이지에서 shopSettings 불필요) */
  categoryLabelKo?: string;
}

export interface ShareCardPublicData {
  shopId: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  shopLogoUrl?: string;
  imageUrls: string[];
  design: ShareCardDesignInfo;
  estimatedMinutes?: number;
  createdAt?: string;
  kakaoTalkUrl?: string;
  naverReservationUrl?: string;
  recordId: string;
}
