export interface PriceItem {
  label: string;
  labelEn?: string;
  amount: number;
  isDiscount?: boolean;
}

export interface PriceBreakdown {
  basePrice: number;           // 기본가 (핸드/페디큐어)
  offSurcharge: number;        // 오프 추가금
  extensionSurcharge: number;  // 연장/리페어 추가금
  designSurcharge: number;     // 디자인 범위 추가금
  expressionSurcharge: number; // 표현 기법 추가금
  partsSurcharge: number;      // 파츠 추가금
  colorSurcharge: number;      // 컬러 추가금
  subtotal: number;            // 소계 (할인 전)
  discountAmount: number;      // 할인액
  depositAmount: number;       // 예약금 (선결제)
  finalPrice: number;          // 최종 결제
  estimatedMinutes: number;    // 예상 시간(분)
  items: PriceItem[];          // 항목별 내역
}

export interface ServicePricing {
  // 기본가
  handBase: number;            // 핸드 기본가 (기본 60,000)
  footBase: number;            // 페디큐어 기본가 (기본 70,000)

  // 오프
  offSameShop: number;         // 자샵오프 (기본 5,000)
  offOtherShop: number;        // 타샵오프 (기본 10,000)

  // 연장/리페어
  repairPerNail: number;       // 리페어 1개당 (기본 3,000)
  extensionBase: number;       // 연장 기본 (기본 20,000)

  // 디자인 범위
  solidTone: number;           // 원컬러 (기본 0 - 포함)
  solidPoint: number;          // 단색+포인트 (기본 10,000)
  fullArt: number;             // 풀아트 (기본 20,000)
  monthlyArt: number;          // 이달의 아트 (기본 25,000)

  // 표현 기법
  gradient: number;            // 그라데이션 (기본 5,000)
  french: number;              // 프렌치 (기본 5,000)
  magnetic: number;            // 마그네틱 (기본 5,000)

  // 컬러 추가 (1색당)
  extraColorPerUnit: number;   // 컬러 추가 1색당 (기본 3,000)
}

import type { CustomPart } from './canvas';

export interface PartsPricing {
  gradeS: number;  // S등급 파츠 1개 (기본 3,000)
  gradeA: number;  // A등급 파츠 1개 (기본 2,000)
  gradeB: number;  // B등급 파츠 1개 (기본 1,000)
  customParts?: CustomPart[];  // 커스텀 파츠 목록 (사장님 직접 등록)
}
