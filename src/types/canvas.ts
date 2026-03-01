export type HandSide = 'left_hand' | 'right_hand' | 'left_foot' | 'right_foot';

/** @deprecated S/A/B 등급 시스템은 CustomPart 방식으로 대체됩니다. */
export type PartGrade = 'S' | 'A' | 'B';

export interface CustomPart {
  id: string;
  name: string;         // "스와로브스키 큐빅", "진주 파츠" 등
  pricePerUnit: number; // 개당 가격
  isActive: boolean;
}

export type PartType =
  | 'stone'         // 스톤
  | 'charm'         // 참
  | 'foil'          // 호일
  | 'glitter'       // 글리터
  | 'shell'         // 쉘
  | 'pearl'         // 펄
  | 'sticker'       // 스티커
  | 'other';        // 기타

export type FingerPosition =
  | 'thumb'         // 엄지
  | 'index'         // 검지
  | 'middle'        // 중지
  | 'ring'          // 약지
  | 'pinky';        // 소지

export interface PartPlacement {
  id: string;
  partType: PartType;
  grade: PartGrade;
  customPartId?: string;  // CustomPart 기반 선택 시 사용
  x: number;  // 0.0 ~ 1.0 normalized position
  y: number;  // 0.0 ~ 1.0 normalized position
}

export interface FingerSelection {
  finger: FingerPosition;
  isPoint: boolean;
  artType?: 'solid' | 'gradient' | 'art' | 'french' | 'magnetic';
  colorCode?: string;
  parts: PartPlacement[];
  note?: string;
  memo?: string;
}

export interface CanvasState {
  handSide: HandSide;
  fingers: Record<FingerPosition, FingerSelection>;
}
