import Link from 'next/link';

interface LegalSection {
  title: string;
  body: string[];
}

interface LegalDocumentLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  sections: LegalSection[];
  numberingStyle?: 'badge' | 'clause';
}

export function LegalDocumentLayout({
  eyebrow,
  title,
  description,
  effectiveDate,
  sections,
  numberingStyle = 'badge',
}: LegalDocumentLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-text">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-6 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">{eyebrow}</p>
              <h1 className="mt-2 text-[28px] font-bold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
              <p className="mt-3 text-xs font-medium text-slate-400">시행일: {effectiveDate}</p>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d7dce3] bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-[#c6ccd5] hover:bg-slate-50"
            >
              회원가입으로 돌아가기
            </Link>
          </div>

          <div className="rounded-[24px] border border-[#e5e7eb] bg-white px-5 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6">
              {sections.map((section, index) => (
                <section key={section.title} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {numberingStyle === 'badge' && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                    )}
                    <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                  </div>
                  <div className={`space-y-3 text-sm leading-7 text-slate-600 ${numberingStyle === 'badge' ? 'pl-10' : ''}`}>
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
