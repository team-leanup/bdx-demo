import { MOCK_DESIGNERS } from '@/data/mock-shop';

export const BODY_PART_LABEL: Record<string, string> = {
  hand: '핸드',
  foot: '페디큐어',
};

export const DESIGN_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원컬러',
  solid_point: '단색+포인트',
  full_art: '풀아트',
  monthly_art: '이달의 아트',
};

export const EXPRESSION_LABEL: Record<string, string> = {
  solid: '기본',
  gradient: '그라데이션',
  french: '프렌치',
  magnetic: '마그네틱/캣아이',
};

export const OFF_TYPE_LABEL: Record<string, string> = {
  none: '없음',
  same_shop: '자샵오프',
  other_shop: '타샵오프',
};

export function getDesignerName(designerId: string): string {
  return MOCK_DESIGNERS.find((d) => d.id === designerId)?.name ?? '미정';
}
