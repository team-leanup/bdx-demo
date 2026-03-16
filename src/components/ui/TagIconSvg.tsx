'use client';

import React from 'react';

interface TagIconSvgProps {
  icon: string;
  className?: string;
}

const SVG_PATHS: Record<string, React.ReactElement> = {
  // 🎨 palette
  '🎨': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <circle cx="5.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="9" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="9" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  // 🖌️ brush
  '🖌️': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L4 8l-1.5 3.5L6 10l6-6-2-2z" />
      <path d="M4 8l2 2" />
      <path d="M2.5 11.5c0 1 .5 1.5 1.5 1.5s1-1 1-1" />
    </svg>
  ),
  // ✨ sparkles
  '✨': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
      <path d="M4.22 4.22l1.42 1.42M10.36 10.36l1.42 1.42M10.36 5.64l1.42-1.42M4.22 11.78l1.42-1.42" />
      <circle cx="8" cy="8" r="1.5" />
    </svg>
  ),
  // 💫 small star
  '💫': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3l1.5 3 3.5.5-2.5 2.5.5 3.5L8 11l-3 1.5.5-3.5L3 6.5l3.5-.5L8 3z" />
    </svg>
  ),
  // 💅 nail polish
  '💅': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="6" height="3" rx="1" />
      <path d="M5 5h6l1 7H4L5 5z" />
      <path d="M5 5h6" />
    </svg>
  ),
  // 📅 calendar
  '📅': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 7h12" />
      <path d="M5 2v2M11 2v2" />
      <circle cx="5.5" cy="10" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="8" cy="10" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="10" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  ),
  // 🌿 leaf
  '🌿': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3C13 3 9 3 6 6s-2 7-2 7 4 1 7-2 2-8 2-8z" />
      <path d="M3 13l4-4" />
    </svg>
  ),
  // ⬜ square outline
  '⬜': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="10" height="10" rx="1" />
    </svg>
  ),
  // 🔵 circle filled
  '🔵': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <circle cx="8" cy="8" r="6" />
    </svg>
  ),
  // 🥚 oval (세로 긴 타원)
  '🥚': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <ellipse cx="8" cy="8.5" rx="4.5" ry="5.5" />
    </svg>
  ),
  // ⬛ square filled
  '⬛': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <rect x="3" y="3" width="10" height="10" rx="1" />
    </svg>
  ),
  // 🔲 square outline rounded
  '🔲': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="10" height="10" rx="2" />
    </svg>
  ),
  // 🤌 almond shape
  '🤌': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M8 2C8 2 4 5 4 9.5C4 12 5.8 14 8 14C10.2 14 12 12 12 9.5C12 5 8 2 8 2Z" />
    </svg>
  ),
  // 💎 diamond
  '💎': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13L2 7l2-4h8l2 4-6 6z" />
      <path d="M2 7h12" />
      <path d="M5 3l1 4M11 3l-1 4" />
    </svg>
  ),
  // 🖤 coffin shape (심장/코핀)
  '🖤': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M5 2h6l2 3v6l-5 3-5-3V5l2-3z" />
    </svg>
  ),
  // ✂️ scissors
  '✂️': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4.5" cy="5" r="2" />
      <circle cx="4.5" cy="11" r="2" />
      <path d="M6.5 5.5L13 2" />
      <path d="M6.5 10.5L13 14" />
      <path d="M6.5 7.5L13 7.5" />
    </svg>
  ),
  // 📏 ruler
  '📏': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="5" width="13" height="6" rx="1" />
      <path d="M4 5v2M7 5v3M10 5v2M13 5v2" />
    </svg>
  ),
  // 🔹 small diamond
  '🔹': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M8 4L12 8L8 12L4 8L8 4Z" />
    </svg>
  ),
  // 🔄 rotate arrows
  '🔄': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3.5A6 6 0 0 0 2 8" />
      <path d="M3 12.5A6 6 0 0 0 14 8" />
      <path d="M13 3.5V7M13 3.5H9.5" />
      <path d="M3 12.5V9M3 12.5H6.5" />
    </svg>
  ),
  // ⭐ star
  '⭐': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4L8 11l-3.6 1.9.7-4L2.2 6.2l4-.6L8 2z" />
    </svg>
  ),
  // 🌈 rainbow
  '🌈': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12A6 6 0 0 1 14 12" />
      <path d="M4 12A4 4 0 0 1 12 12" />
      <path d="M6 12A2 2 0 0 1 10 12" />
    </svg>
  ),
  // 🌸 flower
  '🌸': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="1.5" />
      <ellipse cx="8" cy="4" rx="1.5" ry="2" />
      <ellipse cx="8" cy="12" rx="1.5" ry="2" />
      <ellipse cx="4" cy="8" rx="2" ry="1.5" />
      <ellipse cx="12" cy="8" rx="2" ry="1.5" />
    </svg>
  ),
  // 🐱 cat face
  '🐱': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10V5L5 2l1 3h4l1-3 2 3v5" />
      <path d="M3 10c0 2 2 4 5 4s5-2 5-4" />
      <circle cx="6" cy="8.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="10" cy="8.5" r="0.7" fill="currentColor" stroke="none" />
      <path d="M8 10c-.5 0-1 .3-1 .7s.5.3 1 .3 1 .1 1-.3-.5-.7-1-.7z" />
    </svg>
  ),
  // ❌ X mark
  '❌': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  // 🪬 charm (circle with cross)
  '🪬': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="7" r="4" />
      <circle cx="8" cy="7" r="1.5" fill="currentColor" stroke="none" />
      <path d="M8 11v3" />
      <path d="M6 13h4" />
    </svg>
  ),
  // ☀️ sun
  '☀️': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M4.22 4.22l1.06 1.06M10.72 10.72l1.06 1.06M10.72 5.28l1.06-1.06M4.22 11.78l1.06-1.06" />
    </svg>
  ),
  // 🌙 moon
  '🌙': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 9.5A6 6 0 0 1 6 3a6 6 0 1 0 7 6.5z" />
    </svg>
  ),
  // 🌫️ cloud/mist
  '🌫️': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h10M3 10h10M3 13h7" />
    </svg>
  ),
  // 🤍 heart outline
  '🤍': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5C8 13.5 2 9.5 2 5.5A3.5 3.5 0 0 1 8 4.1 3.5 3.5 0 0 1 14 5.5C14 9.5 8 13.5 8 13.5z" />
    </svg>
  ),
  // ❤️ heart filled
  '❤️': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M8 13.5C8 13.5 2 9.5 2 5.5A3.5 3.5 0 0 1 8 4.1 3.5 3.5 0 0 1 14 5.5C14 9.5 8 13.5 8 13.5z" />
    </svg>
  ),
  // 🩷 heart filled pink
  '🩷': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M8 13.5C8 13.5 2 9.5 2 5.5A3.5 3.5 0 0 1 8 4.1 3.5 3.5 0 0 1 14 5.5C14 9.5 8 13.5 8 13.5z" />
    </svg>
  ),
  // 🟤 circle filled brown
  '🟤': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <circle cx="8" cy="8" r="6" />
    </svg>
  ),
  // 💬 chat bubble
  '💬': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6L2 14V3z" />
    </svg>
  ),
  // 🤫 quiet (finger on lips → mute)
  '🤫': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M5 8h6" />
      <path d="M6 6.5c0-.5.9-.5.9 0s-.9.5-.9 0z" fill="currentColor" stroke="none" />
      <path d="M9.1 6.5c0-.5.9-.5.9 0s-.9.5-.9 0z" fill="currentColor" stroke="none" />
    </svg>
  ),
  // ⚡ lightning bolt
  '⚡': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2L4 9h4l-1 5 5-7H8l1-5z" />
    </svg>
  ),
  // 📱 mobile phone
  '📱': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="1.5" width="7" height="13" rx="1.5" />
      <circle cx="8" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  ),
  // 😊 smiley face
  '😊': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M5.5 9.5c.7 1 4.3 1 5 0" />
      <circle cx="6" cy="7" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  ),
  // ⚠️ warning triangle
  '⚠️': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2L1.5 13h13L8 2z" />
      <path d="M8 6v3.5" />
      <circle cx="8" cy="11" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  ),
  // 🚫 no sign
  '🚫': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M4 4l8 8" />
    </svg>
  ),
  // 🩹 bandaid
  '🩹': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="10" height="4" rx="2" transform="rotate(-45 8 8)" />
      <line x1="8" y1="5.5" x2="8" y2="10.5" transform="rotate(-45 8 8)" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  // 💔 broken heart
  '💔': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5C8 13.5 2 9.5 2 5.5A3.5 3.5 0 0 1 8 4.1 3.5 3.5 0 0 1 14 5.5C14 9.5 8 13.5 8 13.5z" />
      <path d="M9 5.5L7.5 7.5l1.5 1.5-1.5 2" />
    </svg>
  ),
  // ✅ checkmark circle
  '✅': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M5 8l2 2 4-4" />
    </svg>
  ),
  // 👉 right arrow
  '👉': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h8M9 5l3 3-3 3" />
    </svg>
  ),
  // 👈 left arrow
  '👈': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8H4M7 5L4 8l3 3" />
    </svg>
  ),
  // 🩸 droplet
  '🩸': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2C8 2 4 7 4 10a4 4 0 0 0 8 0C12 7 8 2 8 2z" />
    </svg>
  ),
  // 🌏 globe
  '🌏': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12" />
      <path d="M8 2a10 10 0 0 1 3 6 10 10 0 0 1-3 6 10 10 0 0 1-3-6 10 10 0 0 1 3-6z" />
    </svg>
  ),
  // ⭕ circle outline (round nail)
  '⭕': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5" />
    </svg>
  ),
  // 💧 water drop / almond
  '💧': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M8 2C8 2 4 7 4 10a4 4 0 0 0 8 0C12 7 8 2 8 2z" />
    </svg>
  ),
  // 📍 pin / stiletto
  '📍': (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M8 2L5 8v2l1 1v3h4v-3l1-1V8L8 2z" />
    </svg>
  ),
  // 🔘 radio button / thickness
  '🔘': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  // ✋ hand / cuticle
  '✋': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8V3.5a1 1 0 0 1 2 0V7" />
      <path d="M7 7V2.5a1 1 0 0 1 2 0V7" />
      <path d="M9 7V3.5a1 1 0 0 1 2 0V8" />
      <path d="M11 8V5.5a1 1 0 0 1 2 0V9a5 5 0 0 1-5 5H7a4 4 0 0 1-4-4V7.5a1 1 0 0 1 2 0V8" />
    </svg>
  ),
  // 🪵 wood / thickness
  '🪵': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="8" cy="4" rx="5" ry="2" />
      <path d="M3 4v8c0 1.1 2.24 2 5 2s5-.9 5-2V4" />
      <path d="M3 8c0 1.1 2.24 2 5 2s5-.9 5-2" />
    </svg>
  ),
  // 📝 notepad
  '📝': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="10" height="12" rx="1.5" />
      <path d="M5 6h6M5 9h6M5 12h3" />
    </svg>
  ),
};

export function TagIconSvg({ icon, className = 'w-3.5 h-3.5' }: TagIconSvgProps): React.ReactElement {
  const svgElement = SVG_PATHS[icon];

  if (!svgElement) {
    return <span className="text-[11px] leading-none">{icon}</span>;
  }

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      {React.cloneElement(svgElement as React.ReactElement<React.SVGProps<SVGSVGElement>>, { className: 'w-full h-full' })}
    </span>
  );
}
