'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { PortfolioPhoto } from '@/types/portfolio';

interface TreatmentPhotoCarouselProps {
  photos: PortfolioPhoto[];
  maxItems?: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function TreatmentPhotoCarousel({
  photos,
  maxItems = 5,
}: TreatmentPhotoCarouselProps): React.ReactElement {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const displayed = photos.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-xl bg-surface-alt border border-border">
        <span className="text-xs text-text-muted">시술 사진이 없습니다</span>
      </div>
    );
  }

  return (
    <div ref={constraintsRef} className="overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        className="flex gap-3 cursor-grab active:cursor-grabbing"
        style={{ width: 'max-content' }}
      >
        {displayed.map((photo) => (
          <div
            key={photo.id}
            className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-surface-alt border border-border select-none"
          >
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.imageDataUrl}
              alt={photo.serviceType ?? '시술 사진'}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />

            {/* Bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
              <p className="text-white text-[10px] font-bold leading-tight truncate">
                {photo.serviceType ?? photo.designType ?? '시술'}
              </p>
              <p className="text-white/70 text-[9px] leading-tight">
                {formatDate(photo.takenAt ?? photo.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default TreatmentPhotoCarousel;
