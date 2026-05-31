'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';

import { ReferenceUpload } from '@/components/pre-consult/ReferenceUpload';
import { NailStatusSelector } from '@/components/pre-consult/NailStatusSelector';
import { LengthSelector } from '@/components/pre-consult/LengthSelector';
import { ShapePickerSimple } from '@/components/pre-consult/ShapePickerSimple';
import { VibeSelector } from '@/components/pre-consult/VibeSelector';
import { StyleSelector } from '@/components/pre-consult/StyleSelector';
import { AdditionalOptions } from '@/components/pre-consult/AdditionalOptions';
import { AdditionalRequest } from '@/components/pre-consult/AdditionalRequest';
import { ConsultReview } from '@/components/pre-consult/ConsultReview';
import { FatigueMessage } from '@/components/pre-consult/FatigueMessage';

type SectionId = 'upload' | 'nailStatus' | 'length' | 'shape' | 'vibe' | 'style' | 'addons' | 'additionalRequest' | 'review';

const SECTION_ORDER: SectionId[] = [
  'upload',
  'nailStatus',
  'length',
  'shape',
  'vibe',
  'style',
  'addons',
  'additionalRequest',
  'review',
];

// Show a fatigue message AFTER the section at this index completes (0-based)
// Index 2 = 'length' (~30%), Index 4 = 'vibe' (~60%), Index 5 = 'style' (~80%)
const FATIGUE_AFTER: Record<number, 'midMsg1' | 'midMsg2' | 'midMsg3'> = {
  2: 'midMsg1',
  4: 'midMsg2',
  5: 'midMsg3',
};

export default function PreConsultConsultPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ shopId: string }>();
  const t = useT();
  const setCurrentStep = usePreConsultStore((s) => s.setCurrentStep);

  // Guard: selectedCategory가 없으면 사전상담 시작 페이지로 redirect
  const selectedCategory = usePreConsultStore((s) => s.selectedCategory);
  useEffect(() => {
    if (!selectedCategory) {
      router.replace(`/pre-consult/${params.shopId}`);
    }
  }, [selectedCategory, params.shopId, router]);

  // 0528 H3: 새로고침 시 store 스냅샷 기반으로 진행 상태 복원
  const [completedSections, setCompletedSections] = useState<Set<SectionId>>(() => {
    if (typeof window === 'undefined') return new Set();
    const snap = usePreConsultStore.getState();
    const completed = new Set<SectionId>();
    // upload 단계 — referenceImageUrls가 있거나, 사용자가 명시적으로 건너뛴 경우는 unknown이므로
    // 다음 섹션 데이터가 있으면 upload는 자동 완료된 것으로 간주
    if (snap.nailStatus) completed.add('upload');
    if (snap.nailStatus && snap.wrappingPreference) completed.add('nailStatus');
    if (snap.lengthPreference) completed.add('length');
    if (snap.nailShape) completed.add('shape');
    if (snap.designFeel) completed.add('vibe');
    if (snap.stylePreference) completed.add('style');
    // addons / additionalRequest 는 optional이라 명시적 진행 확인 불가
    return completed;
  });
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Determine which sections are visible: show up to the first uncompleted one
  const getVisibleSections = (): SectionId[] => {
    const visible: SectionId[] = ['upload'];
    for (let i = 0; i < SECTION_ORDER.length - 1; i++) {
      if (completedSections.has(SECTION_ORDER[i])) {
        visible.push(SECTION_ORDER[i + 1]);
      } else {
        break;
      }
    }
    return visible;
  };

  const visibleSections = getVisibleSections();

  const handleSectionComplete = useCallback((sectionId: SectionId): void => {
    setCompletedSections((prev) => {
      const next = new Set([...prev, sectionId]);
      return next;
    });

    // Auto-scroll to next section after short delay
    const currentIndex = SECTION_ORDER.indexOf(sectionId);
    const nextIndex = currentIndex + 1;
    if (nextIndex < SECTION_ORDER.length) {
      setTimeout(() => {
        const nextId = SECTION_ORDER[nextIndex];
        sectionRefs.current[nextId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
  }, []);

  const handleConfirm = useCallback((): void => {
    setCurrentStep('confirm');
    router.push(`/pre-consult/${params.shopId}/confirm`);
  }, [router, params.shopId, setCurrentStep]);

  const handleModify = useCallback((section: string): void => {
    const idx = SECTION_ORDER.indexOf(section as SectionId);

    // Section ID가 SECTION_ORDER에 없는 경우(예: "wrapping"은 nailStatus 섹션 내 필드)
    // completedSections 변경 없이 해당 섹션의 부모 섹션으로 스크롤만.
    if (idx === -1) {
      // wrapping은 nailStatus 섹션 소속
      const parentSection = section === 'wrapping' ? 'nailStatus' : null;
      if (parentSection) {
        const parentIdx = SECTION_ORDER.indexOf(parentSection as SectionId);
        setCompletedSections((prev) => {
          const next = new Set<SectionId>();
          for (let i = 0; i < parentIdx; i++) {
            if (prev.has(SECTION_ORDER[i])) {
              next.add(SECTION_ORDER[i]);
            }
          }
          return next;
        });
        setTimeout(() => {
          sectionRefs.current[parentSection]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      return;
    }

    // Scroll to the specified section and reset completedSections from that point
    setCompletedSections((prev) => {
      const next = new Set<SectionId>();
      for (let i = 0; i < idx; i++) {
        if (prev.has(SECTION_ORDER[i])) {
          next.add(SECTION_ORDER[i]);
        }
      }
      return next;
    });

    setTimeout(() => {
      sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const setSectionRef = useCallback((id: string, el: HTMLDivElement | null): void => {
    sectionRefs.current[id] = el;
  }, []);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-24">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-lg font-bold text-text">{t('preConsult.consultTitle')}</h2>
      </motion.div>

      {/* Sections */}
      {SECTION_ORDER.map((sectionId, index) => {
        const isVisible = visibleSections.includes(sectionId);
        const isCompleted = completedSections.has(sectionId);
        const currentSectionIndex = SECTION_ORDER.indexOf(sectionId);
        const showFatigue = isCompleted && FATIGUE_AFTER[currentSectionIndex] !== undefined;

        return (
          <div key={sectionId}>
            <AnimatePresence>
              {isVisible && (
                <motion.div
                  key={sectionId}
                  ref={(el) => setSectionRef(sectionId, el)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={[
                    'rounded-2xl bg-surface border border-border p-4 transition-all duration-300',
                    isCompleted ? 'opacity-70' : '',
                  ].join(' ')}
                >
                  {sectionId === 'upload' && (
                    <ReferenceUpload onComplete={() => handleSectionComplete('upload')} />
                  )}
                  {sectionId === 'nailStatus' && (
                    <NailStatusSelector onComplete={() => handleSectionComplete('nailStatus')} />
                  )}
                  {sectionId === 'length' && (
                    <LengthSelector onComplete={() => handleSectionComplete('length')} />
                  )}
                  {sectionId === 'shape' && (
                    <ShapePickerSimple onComplete={() => handleSectionComplete('shape')} />
                  )}
                  {sectionId === 'vibe' && (
                    <VibeSelector onComplete={() => handleSectionComplete('vibe')} />
                  )}
                  {sectionId === 'style' && (
                    <StyleSelector onComplete={() => handleSectionComplete('style')} />
                  )}
                  {sectionId === 'addons' && (
                    <AdditionalOptions onComplete={() => handleSectionComplete('addons')} />
                  )}
                  {sectionId === 'additionalRequest' && (
                    <AdditionalRequest onComplete={() => handleSectionComplete('additionalRequest')} />
                  )}
                  {sectionId === 'review' && (
                    <ConsultReview onConfirm={handleConfirm} onModify={handleModify} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fatigue message inserted after specific sections */}
            <AnimatePresence>
              {showFatigue && isVisible && (
                <motion.div
                  key={`fatigue-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <FatigueMessage message={t(`preConsult.${FATIGUE_AFTER[currentSectionIndex]}`)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
