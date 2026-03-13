import type { Metadata } from 'next';
import { LegalDocumentLayout } from '@/components/auth/LegalDocumentLayout';
import { LEGAL_EFFECTIVE_DATE, TERMS_SECTIONS } from '@/lib/legal-documents';

export const metadata: Metadata = {
  title: '이용약관 | BDX',
  description: 'Beauty Decision eXperience 서비스 이용약관',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage(): React.ReactElement {
  return (
    <LegalDocumentLayout
      eyebrow="Terms of Service"
      title="서비스 이용약관"
      description="BDX 서비스 이용 전 반드시 확인해야 하는 회원가입, 계정, 서비스 이용, 책임 및 분쟁해결 기준을 안내합니다."
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      sections={TERMS_SECTIONS}
      numberingStyle="clause"
    />
  );
}
