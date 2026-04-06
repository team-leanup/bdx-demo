'use client';

import Image from 'next/image';

interface ShareCardImageTemplateProps {
  imageUrl: string;
  shopName: string;
  designLabel?: string;
  templateRef: React.RefObject<HTMLDivElement | null>;
}

export function ShareCardImageTemplate({
  imageUrl,
  shopName,
  designLabel,
  templateRef,
}: ShareCardImageTemplateProps): React.ReactElement {
  return (
    <div
      ref={templateRef}
      className="relative overflow-hidden bg-black"
      style={{ width: 1080, height: 1080, flexShrink: 0 }}
    >
      {/* Full-bleed nail photo */}
      <Image
        src={imageUrl}
        alt="네일 디자인"
        fill
        unoptimized
        className="object-cover"
        sizes="1080px"
      />

      {/* Subtle gradient overlay at bottom for text legibility */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Design label badge — bottom-left */}
      {designLabel && (
        <div className="absolute bottom-0 left-0 pb-12 pl-10">
          <span
            className="inline-block rounded-full px-5 py-2 text-white font-bold"
            style={{
              fontSize: 28,
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.30)',
              letterSpacing: '0.01em',
            }}
          >
            {designLabel}
          </span>
        </div>
      )}

      {/* Shop name watermark — bottom-right */}
      <div className="absolute bottom-0 right-0 pb-10 pr-10">
        <span
          className="text-white font-semibold"
          style={{
            fontSize: 22,
            opacity: 0.72,
            letterSpacing: '0.02em',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          {shopName}
        </span>
      </div>
    </div>
  );
}
