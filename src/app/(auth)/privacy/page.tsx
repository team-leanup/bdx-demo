import type { Metadata } from 'next';
import { LegalDocumentLayout } from '@/components/auth/LegalDocumentLayout';
import { LEGAL_EFFECTIVE_DATE, PRIVACY_SECTIONS } from '@/lib/legal-documents';

export const metadata: Metadata = {
  title: '개인정보 처리방침 | BDX',
  description: 'Beauty Decision eXperience 개인정보 처리방침',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <LegalDocumentLayout
      eyebrow="Privacy Policy"
      title="개인정보 처리방침"
      description="BDX가 수집하는 개인정보 항목, 이용 목적, 보관 기간, 정보주체 권리 및 보호조치를 안내합니다."
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      sections={PRIVACY_SECTIONS}
      numberingStyle="clause"
    />
  );
}
