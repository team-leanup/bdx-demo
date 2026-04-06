import type { DesignScope, ExpressionType } from './consultation';

export interface ShareCardDesignInfo {
  designScope: DesignScope;
  expressions: ExpressionType[];
  hasParts: boolean;
  bodyPart: 'hand' | 'foot';
}

export interface ShareCardPublicData {
  shopId: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  shopLogoUrl?: string;
  imageUrls: string[];
  design: ShareCardDesignInfo;
  kakaoTalkUrl?: string;
  naverReservationUrl?: string;
  recordId: string;
}
