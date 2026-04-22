import type { DesignScope, ExpressionType } from './consultation';

export interface ShareCardDesignInfo {
  designScope: DesignScope;
  expressions: ExpressionType[];
  hasParts: boolean;
  bodyPart: 'hand' | 'foot';
  nailShape?: string;
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
