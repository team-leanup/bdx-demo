export type TagCategory =
  | 'design'       // 디자인 선호
  | 'shape'        // 쉐입 선호
  | 'length'       // 길이 선호
  | 'expression'   // 표현 기법 선호
  | 'parts'        // 파츠 선호
  | 'color'        // 컬러 선호
  | 'etc';         // 특이사항

export interface CustomerTag {
  id: string;
  customerId: string;
  category: TagCategory;
  value: string;
  isCustom: boolean;
  createdAt: string;
}

export interface SmallTalkNote {
  id: string;
  customerId: string;
  consultationRecordId?: string;
  noteText: string;
  createdAt: string;
  createdByDesignerId: string;
  createdByDesignerName: string;
}

export interface CustomerPreference {
  customerId: string;
  preferredShape?: string;        // 선호 쉐입
  preferredLength?: string;       // 선호 길이
  preferredThickness?: string;    // 선호 두께
  cuticleSensitivity?: 'normal' | 'sensitive';  // 큐티클 민감도
  nailCondition?: string;         // 손톱 상태 메모
  memo?: string;                  // 기타 메모
  updatedAt: string;
}

export interface TreatmentHistory {
  recordId: string;
  date: string;
  bodyPart: string;
  designScope: string;
  price: number;
  designerName: string;
  imageUrls?: string[];
}

export type VisitFrequency = 'weekly' | 'biweekly' | 'monthly' | 'irregular';

export interface Membership {
  id: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  purchaseAmount: number;
  expiryDate: string;
  status: 'active' | 'expired' | 'used_up';
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  assignedDesignerId?: string;
  assignedDesignerName?: string;
  firstVisitDate: string;
  lastVisitDate: string;
  visitCount: number;
  averageSpend: number;
  totalSpend: number;
  tags: CustomerTag[];
  smallTalkNotes: SmallTalkNote[];
  preference?: CustomerPreference;
  treatmentHistory: TreatmentHistory[];
  profileImageUrl?: string;
  isRegular?: boolean;
  regularSince?: string;
  visitFrequency?: VisitFrequency;
  membership?: Membership;
  createdAt: string;
  updatedAt: string;
}
