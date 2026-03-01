'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/cn';
import type { ServiceStructure } from '@/types/shop';

interface Service {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Category {
  label: string;
  services: Service[];
}

const CATEGORIES: Category[] = [
  {
    label: '네일 (Nail)',
    services: [
      { id: 'gel', name: '젤네일', icon: '💅', description: '기본 젤 네일 시술' },
      { id: 'acrylic', name: '아크릴', icon: '💎', description: '아크릴 네일' },
      { id: 'art', name: '네일아트', icon: '🎨', description: '아트 디자인' },
      { id: 'care', name: '케어', icon: '✨', description: '네일 케어/영양' },
      { id: 'remove', name: '제거', icon: '🔧', description: '젤/아크릴 제거' },
    ],
  },
  {
    label: '페디 (Pedi)',
    services: [
      { id: 'pedi', name: '페디큐어', icon: '🦶', description: '발 네일 시술' },
    ],
  },
  {
    label: '추가 서비스 (Additional)',
    services: [
      { id: 'extension', name: '연장', icon: '🔗', description: '네일 연장' },
      { id: 'repair', name: '리페어', icon: '🛠️', description: '부러진 네일 수리' },
      { id: 'overlay', name: '오버레이', icon: '🪄', description: '자연손톱 위 오버레이' },
    ],
  },
];

// Map service IDs to serviceStructure keys
function buildServiceStructure(selectedIds: string[]): Partial<ServiceStructure> {
  const has = (id: string) => selectedIds.includes(id);
  return {
    removal: has('remove'),
    repair: has('repair'),
    overlay: has('overlay'),
    extension: has('extension'),
    // These surcharge categories are always shown when their art types apply;
    // keep existing values from store — but we update based on service selections:
    gradation: true,
    french: true,
    magnet: true,
    pointFullArt: true,
    parts: true,
  };
}

export default function ServicesPage() {
  const router = useRouter();
  const { setShopSettings, shopSettings } = useAppStore();

  const initialSelected: string[] =
    shopSettings.selectedServices.length > 0
      ? shopSettings.selectedServices
      : CATEGORIES.flatMap((c) => c.services.map((s) => s.id));

  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelected);
  const [showAlert, setShowAlert] = useState(false);

  const toggle = (id: string) => {
    if (selectedItems.includes(id)) {
      if (selectedItems.length <= 1) {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 2000);
        return;
      }
      setSelectedItems((prev) => prev.filter((s) => s !== id));
    } else {
      setSelectedItems((prev) => [...prev, id]);
    }
  };

  const handleNext = () => {
    const newServiceStructure = buildServiceStructure(selectedItems);
    setShopSettings({
      selectedServices: selectedItems,
      serviceStructure: {
        ...shopSettings.serviceStructure,
        ...newServiceStructure,
      },
    });
    router.push('/onboarding/pricing');
  };

  let animIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-4 md:py-6"
    >
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-3 flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-3"
          >
            <span className="text-sm">⚠️</span>
            <span className="text-sm font-medium text-error">최소 1개 이상의 서비스를 선택해야 합니다</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2 mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-text">제공 서비스를 선택해주세요</h1>
        <p className="text-sm text-text-muted">제공하는 서비스를 선택하세요.</p>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {CATEGORIES.map((category) => (
          <div key={category.label}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              {category.label}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.services.map((service) => {
                const isOn = selectedItems.includes(service.id);
                const delay = animIdx++ * 0.04;

                return (
                  <motion.button
                    key={service.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay }}
                    onClick={() => toggle(service.id)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left w-full',
                      isOn ? 'border-primary' : 'border-border',
                    )}
                    style={
                      isOn
                        ? { backgroundColor: 'var(--color-primary-light)' }
                        : { backgroundColor: 'var(--color-surface)' }
                    }
                  >
                    <span className="text-2xl flex-shrink-0">{service.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-semibold',
                        isOn ? 'text-text' : 'text-text-secondary',
                      )}>
                        {service.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{service.description}</p>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                        isOn ? 'border-primary bg-primary' : 'border-border bg-transparent',
                      )}
                    >
                      {isOn && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <Button size="lg" fullWidth onClick={handleNext}>
          다음
        </Button>
      </div>
    </motion.div>
  );
}
