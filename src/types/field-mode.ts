import type { DesignCategory, RemovalPreference, LengthPreference, ExtensionLength, AddOnOption } from '@/types/pre-consultation';
import type { PaymentMethod } from '@/types/consultation';

export type FieldModePhase =
  | 'portfolio'
  | 'design-confirm'
  | 'options'
  | 'price-check'
  | 'treatment'
  | 'settlement'
  | 'wrap-up';

export interface FieldModeAddon {
  id: string;
  label: string;
  amount: number;
  addedAt: string;
}

export interface FieldModeConsultationData {
  mode: 'field_mode';
  portfolioPhotoId: string;
  portfolioPhotoUrl: string;
  designCategory: DesignCategory;
  removalType: RemovalPreference;
  lengthType: LengthPreference;
  extensionLength: ExtensionLength | null;
  addOns: AddOnOption[];
  inTreatmentAddons: FieldModeAddon[];
  treatmentDurationMinutes: number;
}
