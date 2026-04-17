'use client';

import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const DOMAIN = 'https://beauty-decision.com';

const QR_ITEMS = [
  {
    key: 'app',
    title: 'BDX 앱',
    subtitle: '네일샵 스케줄·고객·매출 관리',
    url: DOMAIN,
    hint: 'beauty-decision.com',
  },
  {
    key: 'guide',
    title: 'BDX 사용 가이드',
    subtitle: '기능별 상세 설명',
    url: `${DOMAIN}/guide`,
    hint: 'beauty-decision.com/guide',
  },
] as const;

export default function QRPage(): React.ReactElement {
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const handleDownload = (key: string, title: string): void => {
    const canvas = refs.current[key];
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `bdx-qr-${title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (): void => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="min-h-dvh bg-[#FAF8F5] py-10 px-4 md:py-16">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        {/* 헤더 */}
        <header className="flex flex-col items-center text-center gap-3 print:hidden">
          <img src="/bdx-logo/bdx-symbol.svg" alt="BDX" className="h-14 w-14" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            BDX QR 코드
          </h1>
          <p className="text-sm text-slate-500">
            QR 코드를 스캔하면 BDX 홈 또는 사용 가이드로 바로 이동합니다.
          </p>
          <button
            type="button"
            onClick={handlePrint}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            프린트
          </button>
        </header>

        {/* QR 2-up 그리드 */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {QR_ITEMS.map((item) => (
            <article
              key={item.key}
              className="flex flex-col items-center gap-4 rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm print:shadow-none print:border-slate-300"
            >
              <div className="flex flex-col items-center gap-1">
                <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-primary">
                  {item.key === 'guide' ? 'GUIDE' : 'APP'}
                </p>
                <h2 className="text-lg md:text-xl font-bold text-slate-900">{item.title}</h2>
                <p className="text-xs text-slate-500">{item.subtitle}</p>
              </div>

              <div className="relative rounded-2xl bg-white p-3 border border-slate-100">
                <QRCodeCanvas
                  value={item.url}
                  size={220}
                  level="H"
                  marginSize={2}
                  bgColor="#FFFFFF"
                  fgColor="#191F28"
                  imageSettings={{
                    src: '/bdx-logo/bdx-symbol.svg',
                    height: 48,
                    width: 48,
                    excavate: true,
                  }}
                  ref={(el: HTMLCanvasElement | null) => {
                    refs.current[item.key] = el;
                  }}
                />
              </div>

              <div className="flex flex-col items-center gap-1 w-full">
                <p className="text-[11px] font-mono text-slate-400 tracking-tight break-all text-center">
                  {item.hint}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(item.key, item.key === 'guide' ? 'guide' : 'app')}
                className="mt-1 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition print:hidden"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PNG 다운로드
              </button>
            </article>
          ))}
        </section>

        {/* 푸터 */}
        <footer className="flex flex-col items-center gap-2 text-center text-xs text-slate-400 print:hidden">
          <p>카메라 앱으로 QR을 비추면 자동으로 링크가 열립니다.</p>
          <p className="font-mono tracking-[0.08em]">beauty-decision.com</p>
        </footer>
      </div>

      {/* 프린트 전용 간단 스타일 */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          @page { margin: 16mm; }
        }
      `}</style>
    </div>
  );
}
