import type { TagCategory } from '@/types/customer';

export interface TagPreset {
  category: TagCategory;
  categoryLabel: string;
  icon: string;
  options: string[];
}

export const TAG_PRESETS: TagPreset[] = [
  {
    category: 'design',
    categoryLabel: '디자인 선호',
    icon: '🎨',
    options: [
      '풀아트선호',
      '단색선호',
      '포인트선호',
      '심플',
      '화려한스타일',
      '이달의아트선호',
      '내추럴',
      '미니멀',
    ],
  },
  {
    category: 'shape',
    categoryLabel: '쉐입 선호',
    icon: '💅',
    options: [
      '라운드',
      '오발',
      '스퀘어',
      '스퀘어오프',
      '아몬드',
      '스틸레토',
      '코핀',
    ],
  },
  {
    category: 'length',
    categoryLabel: '길이 선호',
    icon: '📏',
    options: [
      '짧은네일',
      '보통길이',
      '긴네일',
      '아주짧게',
      '기장변경잦음',
    ],
  },
  {
    category: 'expression',
    categoryLabel: '표현 기법 선호',
    icon: '✨',
    options: [
      '기본',
      '그라데이션',
      '프렌치',
      '마그네틱/캣아이',
      '프렌치선호',
      '그라데선호',
    ],
  },
  {
    category: 'parts',
    categoryLabel: '파츠 선호',
    icon: '💎',
    options: [
      '파츠좋아함',
      '파츠안함',
      '미니멀파츠',
      '스톤선호',
      '참선호',
      '글리터선호',
    ],
  },
  {
    category: 'color',
    categoryLabel: '컬러 선호',
    icon: '🎨',
    options: [
      '밝은컬러',
      '어두운컬러',
      '차분한컬러',
      '누드톤',
      '비비드',
      '파스텔',
      '레드계열',
      '핑크계열',
      '베이지계열',
      '블랙/다크',
    ],
  },
  {
    category: 'etc',
    categoryLabel: '특이사항',
    icon: '📝',
    options: [
      '큐티클민감',
      '손톱얇음',
      '알러지주의',
      '손톱약함',
      '손톱잘부러짐',
      '젤알러지없음',
      '연장이력있음',
      '리페어자주함',
      '오른손잡이',
      '왼손잡이',
    ],
  },
];

export function getAllTagOptions(): string[] {
  return TAG_PRESETS.flatMap((preset) => preset.options);
}

export function getTagPresetByCategory(category: TagCategory): TagPreset | undefined {
  return TAG_PRESETS.find((p) => p.category === category);
}
