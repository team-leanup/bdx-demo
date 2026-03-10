import type { TagCategory } from '@/types/customer';

export interface TagOption {
  value: string;
  icon?: string;
}

export interface TagPreset {
  category: TagCategory;
  categoryLabel: string;
  icon: string;
  options: TagOption[];
}

export const TAG_PRESETS: TagPreset[] = [
  {
    category: 'design',
    categoryLabel: '디자인 선호',
    icon: '🎨',
    options: [
      { value: '풀아트선호', icon: '🎨' },
      { value: '단색선호', icon: '🖌️' },
      { value: '포인트선호', icon: '✨' },
      { value: '심플', icon: '💫' },
      { value: '화려한스타일', icon: '💅' },
      { value: '이달의아트선호', icon: '📅' },
      { value: '내추럴', icon: '🌿' },
      { value: '미니멀', icon: '⬜' },
    ],
  },
  {
    category: 'shape',
    categoryLabel: '쉐입 선호',
    icon: '💅',
    options: [
      { value: '라운드', icon: '🔵' },
      { value: '오발', icon: '🥚' },
      { value: '스퀘어', icon: '⬛' },
      { value: '스퀘어오프', icon: '🔲' },
      { value: '아몬드', icon: '🤌' },
      { value: '스틸레토', icon: '💎' },
      { value: '코핀', icon: '🖤' },
    ],
  },
  {
    category: 'length',
    categoryLabel: '길이 선호',
    icon: '📏',
    options: [
      { value: '짧은네일', icon: '✂️' },
      { value: '보통길이', icon: '📏' },
      { value: '긴네일', icon: '💅' },
      { value: '아주짧게', icon: '🔹' },
      { value: '기장변경잦음', icon: '🔄' },
    ],
  },
  {
    category: 'expression',
    categoryLabel: '표현 기법 선호',
    icon: '✨',
    options: [
      { value: '기본', icon: '⭐' },
      { value: '그라데이션', icon: '🌈' },
      { value: '프렌치', icon: '🌸' },
      { value: '마그네틱/캣아이', icon: '🐱' },
      { value: '프렌치선호', icon: '🌸' },
      { value: '그라데선호', icon: '🌈' },
    ],
  },
  {
    category: 'parts',
    categoryLabel: '파츠 선호',
    icon: '💎',
    options: [
      { value: '파츠좋아함', icon: '💎' },
      { value: '파츠안함', icon: '❌' },
      { value: '미니멀파츠', icon: '🔹' },
      { value: '스톤선호', icon: '💎' },
      { value: '참선호', icon: '🪬' },
      { value: '글리터선호', icon: '✨' },
    ],
  },
  {
    category: 'color',
    categoryLabel: '컬러 선호',
    icon: '🎨',
    options: [
      { value: '밝은컬러', icon: '☀️' },
      { value: '어두운컬러', icon: '🌙' },
      { value: '차분한컬러', icon: '🌫️' },
      { value: '누드톤', icon: '🤍' },
      { value: '비비드', icon: '🌈' },
      { value: '파스텔', icon: '🌸' },
      { value: '레드계열', icon: '❤️' },
      { value: '핑크계열', icon: '🩷' },
      { value: '베이지계열', icon: '🟤' },
      { value: '블랙/다크', icon: '🖤' },
    ],
  },
  {
    category: 'etc',
    categoryLabel: '특이사항',
    icon: '📝',
    options: [
      { value: '큐티클민감', icon: '💅' },
      { value: '손톱얇음', icon: '⚠️' },
      { value: '알러지주의', icon: '🚫' },
      { value: '손톱약함', icon: '🩹' },
      { value: '손톱잘부러짐', icon: '💔' },
      { value: '젤알러지없음', icon: '✅' },
      { value: '연장이력있음', icon: '📏' },
      { value: '리페어자주함', icon: '🔄' },
      { value: '오른손잡이', icon: '👉' },
      { value: '왼손잡이', icon: '👈' },
    ],
  },
];

export function getAllTagOptions(): string[] {
  return TAG_PRESETS.flatMap((preset) => preset.options.map((o) => o.value));
}

export function getTagPresetByCategory(category: TagCategory): TagPreset | undefined {
  return TAG_PRESETS.find((p) => p.category === category);
}
