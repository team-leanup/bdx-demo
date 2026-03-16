import type { PartGrade, CustomPart } from '@/types/canvas';

// ============================================================
// 서비스 옵션 레이블 및 가격
// ============================================================

export interface ServiceOption<T extends string = string> {
  value: T;
  label: string;
  labelEn: string;
  description?: string;
  price?: number;
  imageKey?: string;
}

// 시술 부위
export const BODY_PART_OPTIONS: ServiceOption<'hand' | 'foot'>[] = [
  { value: 'hand', label: '핸드', labelEn: 'Hand', price: 60000 },
  { value: 'foot', label: '페디큐어', labelEn: 'Pedicure', price: 70000 },
];

// 오프 (제거)
export const OFF_TYPE_OPTIONS: ServiceOption<'none' | 'same_shop' | 'other_shop'>[] = [
  { value: 'none', label: '없음', labelEn: 'None', price: 0 },
  { value: 'same_shop', label: '자샵오프', labelEn: 'In-shop Off', price: 5000 },
  { value: 'other_shop', label: '타샵오프', labelEn: 'Other-shop Off', price: 10000 },
];

// 연장/리페어
export const EXTENSION_TYPE_OPTIONS: ServiceOption<'none' | 'repair' | 'extension'>[] = [
  { value: 'none', label: '없음', labelEn: 'None', price: 0 },
  { value: 'repair', label: '리페어', labelEn: 'Repair', price: 3000, description: '1개당 3,000원' },
  { value: 'extension', label: '연장', labelEn: 'Extension', price: 20000 },
];

// 쉐입 (7종)
export const NAIL_SHAPE_OPTIONS: ServiceOption<
  'round' | 'oval' | 'square' | 'squoval' | 'almond' | 'stiletto' | 'coffin'
>[] = [
  {
    value: 'round',
    label: '라운드',
    labelEn: 'Round',
    description: '손톱 끝이 둥글게 마감',
    imageKey: 'round',
  },
  {
    value: 'oval',
    label: '오발',
    labelEn: 'Oval',
    description: '라운드보다 길고 타원형',
    imageKey: 'oval',
  },
  {
    value: 'square',
    label: '스퀘어',
    labelEn: 'Square',
    description: '직각으로 각진 형태',
    imageKey: 'square',
  },
  {
    value: 'squoval',
    label: '스퀘오벌',
    labelEn: 'Squoval',
    description: '스퀘어 + 오발 결합',
    imageKey: 'squoval',
  },
  {
    value: 'almond',
    label: '아몬드',
    labelEn: 'Almond',
    description: '아몬드 모양으로 뾰족',
    imageKey: 'almond',
  },
  {
    value: 'stiletto',
    label: '스틸레토',
    labelEn: 'Stiletto',
    description: '매우 뾰족한 형태',
    imageKey: 'stiletto',
  },
  {
    value: 'coffin',
    label: '코핀/발레리나',
    labelEn: 'Coffin',
    description: '관 형태의 평평한 끝',
    imageKey: 'coffin',
  },
];

// 디자인 범위 (4종)
export const DESIGN_SCOPE_OPTIONS: ServiceOption<
  'solid_tone' | 'solid_point' | 'full_art' | 'monthly_art'
>[] = [
  {
    value: 'solid_tone',
    label: '원컬러',
    labelEn: 'Solid Tone',
    description: '심플하고 깔끔한 단색',
    price: 0,
  },
  {
    value: 'solid_point',
    label: '단색+포인트',
    labelEn: 'Solid+Point',
    description: '단색에 포인트 아트 추가',
    price: 10000,
  },
  {
    value: 'full_art',
    label: '풀아트',
    labelEn: 'Full Art',
    description: '모든 손가락 아트 시술',
    price: 20000,
  },
  {
    value: 'monthly_art',
    label: '이달의 아트',
    labelEn: "Monthly Art",
    description: '이달의 추천 디자인',
    price: 25000,
  },
];

// 표현 기법 (4종)
export const EXPRESSION_OPTIONS: ServiceOption<
  'solid' | 'gradient' | 'french' | 'magnetic'
>[] = [
  { value: 'solid', label: '기본', labelEn: 'Solid', price: 0 },
  { value: 'gradient', label: '그라데이션', labelEn: 'Gradient', price: 5000 },
  { value: 'french', label: '프렌치', labelEn: 'French', price: 5000 },
  { value: 'magnetic', label: '마그네틱/캣아이', labelEn: 'Magnetic/Cat Eye', price: 5000 },
];

// 파츠 등급별 정보
export interface PartGradeOption {
  grade: PartGrade;
  label: string;
  labelEn: string;
  pricePerUnit: number;
  description: string;
  examples: string[];
}

export const PARTS_GRADE_OPTIONS: PartGradeOption[] = [
  {
    grade: 'S',
    label: 'S등급 파츠',
    labelEn: 'Grade S Parts',
    pricePerUnit: 3000,
    description: '3,000원 / 개',
    examples: ['큐빅', '귀한 스톤', '특수 참'],
  },
  {
    grade: 'A',
    label: 'A등급 파츠',
    labelEn: 'Grade A Parts',
    pricePerUnit: 2000,
    description: '2,000원 / 개',
    examples: ['일반 스톤', '참', '호일 포인트'],
  },
  {
    grade: 'B',
    label: 'B등급 파츠',
    labelEn: 'Grade B Parts',
    pricePerUnit: 1000,
    description: '1,000원 / 개',
    examples: ['글리터', '쉘', '스티커'],
  },
];

// 커스텀 파츠 기본 프리셋 (사장님 직접 등록 방식)
export const DEFAULT_CUSTOM_PARTS: CustomPart[] = [
  { id: 'swarovski', name: '스와로브스키 큐빅', pricePerUnit: 3000, isActive: true },
  { id: 'pearl', name: '진주 파츠', pricePerUnit: 2000, isActive: true },
  { id: 'basic-stone', name: '기본 스톤', pricePerUnit: 1000, isActive: true },
  { id: 'charm', name: '참 파츠', pricePerUnit: 2500, isActive: true },
  { id: 'foil', name: '호일', pricePerUnit: 1500, isActive: true },
];

// 기본 가격표
export const DEFAULT_BASE_PRICES = {
  hand: 60000,
  foot: 70000,
  offSameShop: 5000,
  offOtherShop: 10000,
  repair: 3000,   // per nail
  extension: 20000,
  solidTone: 0,
  solidPoint: 10000,
  fullArt: 20000,
  monthlyArt: 25000,
  gradient: 5000,
  french: 5000,
  magnetic: 5000,
  extraColor: 3000,  // per color
  partsS: 3000,
  partsA: 2000,
  partsB: 1000,
};
