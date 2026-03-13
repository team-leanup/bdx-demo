'use client';

import Link from 'next/link';

interface SignupConsentSectionProps {
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  onAgreeToTermsChange: (checked: boolean) => void;
  onAgreeToPrivacyChange: (checked: boolean) => void;
}

export function SignupConsentSection({
  agreedToTerms,
  agreedToPrivacy,
  onAgreeToTermsChange,
  onAgreeToPrivacyChange,
}: SignupConsentSectionProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2 text-slate-500">
      <div className="flex items-start gap-2.5 text-[12px] leading-5 sm:text-[13px]">
          <input
            id="signup-consent-terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => onAgreeToTermsChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#cfd5dd] bg-white text-primary focus:ring-primary/20"
          />
          <label htmlFor="signup-consent-terms" className="min-w-0 cursor-pointer text-slate-500">
            <span className="mr-1 font-medium text-slate-700">[필수]</span>
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-800 underline decoration-slate-400 underline-offset-3 hover:text-primary"
            >
              이용약관
            </Link>
            <span>에 동의합니다.</span>
          </label>
      </div>

      <div className="flex items-start gap-2.5 text-[12px] leading-5 sm:text-[13px]">
          <input
            id="signup-consent-privacy"
            type="checkbox"
            checked={agreedToPrivacy}
            onChange={(event) => onAgreeToPrivacyChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#cfd5dd] bg-white text-primary focus:ring-primary/20"
          />
          <label htmlFor="signup-consent-privacy" className="min-w-0 cursor-pointer text-slate-500">
            <span className="mr-1 font-medium text-slate-700">[필수]</span>
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-800 underline decoration-slate-400 underline-offset-3 hover:text-primary"
            >
              개인정보 수집 및 이용
            </Link>
            <span>에 동의합니다.</span>
          </label>
      </div>
    </div>
  );
}
