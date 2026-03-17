'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, LanguageSelector, Toggle, TimeInput, AddressInput, ProfileAvatar } from '@/components/ui';
import { FeatureDiscovery } from '@/components/onboarding/FeatureDiscovery';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { IconShop, IconService, IconPalette, IconGear } from '@/components/icons';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { usePartsStore } from '@/store/parts-store';
import { useCustomerStore } from '@/store/customer-store';
import { useReservationStore } from '@/store/reservation-store';
import { useRecordsStore } from '@/store/records-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { getStorageUsage, formatBytes, clearAllDemoData } from '@/lib/storage-budget';
import { Modal } from '@/components/ui/Modal';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { useShopStore } from '@/store/shop-store';
import { DEFAULT_BASE_PRICES } from '@/data/service-options';
import { formatPrice } from '@/lib/format';
import { DesignPresetsManager } from '@/components/settings/DesignPresetsManager';
import { resizeImageToBase64 } from '@/lib/image-utils';

const DAY_LABEL_KEYS = ['days_mon', 'days_tue', 'days_wed', 'days_thu', 'days_fri', 'days_sat', 'days_sun'];

type TabId = 'shop' | 'service' | 'theme' | 'app';

const TAB_ICONS: Record<string, React.ReactNode> = {
  shop: <IconShop className="w-4 h-4" />,
  service: <IconService className="w-4 h-4" />,
  theme: <IconPalette className="w-4 h-4" />,
  app: <IconGear className="w-4 h-4" />,
};

const TAB_IDS: TabId[] = ['shop', 'service', 'theme', 'app'];

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const DEFAULT_DAY_SCHEDULES: DaySchedule[] = DAY_LABEL_KEYS.map((_, i) => ({
  isOpen: i !== 6,
  openTime: '10:00',
  closeTime: '20:00',
}));


// ── 커스텀 파츠 관리 컴포넌트 ──
function CustomPartsManager() {
  const { customParts, addPart, removePart, updatePart } = usePartsStore();
  const t = useT();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartPrice, setNewPartPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    const price = parseInt(newPartPrice, 10);
    if (!newPartName.trim() || isNaN(price) || price < 0) return;
    addPart(newPartName.trim(), price);
    setNewPartName('');
    setNewPartPrice('');
    setShowAddForm(false);
  };

  const startEdit = (id: string, name: string, price: number) => {
    setEditingId(id);
    setEditName(name);
    setEditPrice(String(price));
    setConfirmDeleteId(null);
  };

  const handleEditSave = (id: string) => {
    const price = parseInt(editPrice, 10);
    if (!editName.trim() || isNaN(price) || price < 0) return;
    updatePart(id, { name: editName.trim(), pricePerUnit: price });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      removePart(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {customParts.map((part) => {
        const isEditing = editingId === part.id;
        const isConfirmingDelete = confirmDeleteId === part.id;

        if (isEditing) {
          return (
            <div
              key={part.id}
              className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('settings.service_partName')}
                  className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder={t('settings.service_partPrice')}
                  min={0}
                  className="w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditingId(null)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="primary" size="sm" className="flex-1" onClick={() => handleEditSave(part.id)}>
                  {t('common.save')}
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={part.id}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface-alt px-3 py-2"
          >
            <button
              onClick={() => startEdit(part.id, part.name, part.pricePerUnit)}
              className="flex flex-1 items-center justify-between text-sm"
            >
              <span className="font-medium text-text">{part.name}</span>
              <span className="text-text-secondary">{formatPrice(part.pricePerUnit)} {t('settings.service_perUnit')}</span>
            </button>
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDelete(part.id)}>
                  {t('common.delete')}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => handleDelete(part.id)}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border text-text-muted hover:border-error/40 hover:bg-error/10 hover:text-error transition-all"
                aria-label="삭제"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        );
      })}

      {/* Add form */}
      {showAddForm ? (
        <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 mt-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder={t('settings.service_partName')}
              autoFocus
              className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            <input
              type="number"
              value={newPartPrice}
              onChange={(e) => setNewPartPrice(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder={t('settings.service_partPrice')}
              min={0}
              className="w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setShowAddForm(false); setNewPartName(''); setNewPartPrice(''); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" className="flex-1" disabled={!newPartName.trim() || !newPartPrice.trim()} onClick={handleAdd}>
              {t('settings.staff_add')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="mt-1" onClick={() => setShowAddForm(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {t('settings.service_addPart')}
        </Button>
      )}

      {customParts.length === 0 && !showAddForm && (
        <p className="text-xs text-text-muted text-center py-2">{t('settings.service_noParts')}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-4 md:px-0 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

// ── 선생님 관리 섹션 ──
function StaffSection() {
  const t = useT();
  const designers = useShopStore((s) => s.designers);
  const createDesigner = useShopStore((s) => s.createDesigner);
  const updateDesigner = useShopStore((s) => s.updateDesigner);
  const deleteDesigner = useShopStore((s) => s.deleteDesigner);
  const uploadDesignerProfileImage = useShopStore((s) => s.uploadDesignerProfileImage);
  const deleteDesignerProfileImage = useShopStore((s) => s.deleteDesignerProfileImage);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const resetAddForm = () => {
    setNewName('');
    setNewPhone('');
    setShowAddForm(false);
  };

  const startEdit = (designer: { id: string; name: string; phone?: string; isActive: boolean }) => {
    setEditingId(designer.id);
    setEditName(designer.name);
    setEditPhone(designer.phone ?? '');
    setEditIsActive(designer.isActive);
    setConfirmDeleteId(null);
    setFeedback(null);
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      setFeedback({ tone: 'error', message: '이름을 입력해 주세요.' });
      return;
    }

    setIsAdding(true);
    const result = await createDesigner({ name: newName, phone: newPhone });
    setIsAdding(false);

    if (!result.success) {
      setFeedback({ tone: 'error', message: result.error ?? '선생님 추가에 실패했습니다.' });
      return;
    }

    resetAddForm();
    setFeedback({ tone: 'success', message: '새 선생님 프로필을 추가했습니다.' });
  };

  const handleEditSave = async (designerId: string) => {
    if (!editName.trim()) {
      setFeedback({ tone: 'error', message: '이름을 입력해 주세요.' });
      return;
    }

    setBusyId(designerId);
    const result = await updateDesigner(designerId, {
      name: editName,
      phone: editPhone,
      isActive: editIsActive,
    });
    setBusyId(null);

    if (!result.success) {
      setFeedback({ tone: 'error', message: result.error ?? '선생님 정보 수정에 실패했습니다.' });
      return;
    }

    setEditingId(null);
    setFeedback({ tone: 'success', message: '선생님 프로필을 수정했습니다.' });
  };

  const handleDelete = async (designer: { id: string; role: 'owner' | 'staff'; name: string }) => {
    if (designer.role === 'owner') {
      setFeedback({ tone: 'error', message: '원장 프로필은 삭제할 수 없습니다.' });
      return;
    }

    if (confirmDeleteId !== designer.id) {
      setConfirmDeleteId(designer.id);
      setFeedback(null);
      return;
    }

    setBusyId(designer.id);
    const result = await deleteDesigner(designer.id);

    if (!result.success && result.error?.includes('먼저 담당을 변경한 뒤 삭제')) {
      const deactivateResult = await updateDesigner(designer.id, { isActive: false });
      setBusyId(null);
      setConfirmDeleteId(null);

      if (!deactivateResult.success) {
        setFeedback({ tone: 'error', message: deactivateResult.error ?? result.error });
        return;
      }

      if (editingId === designer.id) {
        setEditingId(null);
      }
      setFeedback({
        tone: 'success',
        message: `${designer.name} 프로필은 연결된 이력이 있어 삭제 대신 비활성화했습니다.`,
      });
      return;
    }

    setBusyId(null);
    setConfirmDeleteId(null);

    if (!result.success) {
      setFeedback({ tone: 'error', message: result.error ?? '선생님 삭제에 실패했습니다.' });
      return;
    }

    if (editingId === designer.id) {
      setEditingId(null);
    }
    setFeedback({ tone: 'success', message: `${designer.name} 프로필을 삭제했습니다.` });
  };

  const handleDeleteProfileImage = async (designerId: string) => {
    setBusyId(designerId);
    const result = await deleteDesignerProfileImage(designerId);
    setBusyId(null);

    if (!result.success) {
      setFeedback({ tone: 'error', message: result.error ?? '프로필 이미지 삭제에 실패했습니다.' });
      return;
    }

    setFeedback({ tone: 'success', message: '프로필 이미지를 삭제했습니다.' });
  };

  const handleFileChange = async (designerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImageToBase64(file);
      setBusyId(designerId);
      const result = await uploadDesignerProfileImage(designerId, base64);
      setBusyId(null);

      if (!result.success) {
        setFeedback({ tone: 'error', message: result.error ?? '프로필 이미지 업로드에 실패했습니다.' });
        return;
      }

      setFeedback({ tone: 'success', message: '프로필 이미지를 업데이트했습니다.' });
    } catch {
      setBusyId(null);
      setFeedback({ tone: 'error', message: '프로필 이미지 업로드에 실패했습니다.' });
    }
    e.target.value = '';
  };

  return (
    <Section title={t('settings.staff_title')}>
      <Card className="mx-4 md:mx-0">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text">{t('settings.staff_registered')}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (showAddForm) {
                resetAddForm();
              } else {
                setShowAddForm(true);
                setFeedback(null);
              }
            }}
          >
            {showAddForm ? '취소' : t('settings.staff_add')}
          </Button>
        </div>

        {feedback && (
          <div
            className={cn(
              'mb-3 rounded-xl border px-3 py-2 text-xs font-medium',
              feedback.tone === 'success'
                ? 'border-success/20 bg-success/10 text-success'
                : 'border-error/20 bg-error/10 text-error',
            )}
          >
            {feedback.message}
          </div>
        )}

        {showAddForm && (
          <div className="mb-3 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                label="이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="선생님 이름"
                className="h-10 rounded-lg px-3 text-sm"
              />
              <Input
                label="연락처"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="h-10 rounded-lg px-3 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={resetAddForm}
                disabled={isAdding}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => void handleAdd()}
                disabled={isAdding || !newName.trim()}
              >
                {isAdding ? '추가 중...' : '프로필 추가'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {designers.map((d) => {
            const hasImage = Boolean(d.profileImageUrl);
            const inputId = `profile-upload-${d.id}`;
            const isEditing = editingId === d.id;
            const isConfirmingDelete = confirmDeleteId === d.id;
            const isBusy = busyId === d.id;

            if (isEditing) {
              return (
                <div
                  key={d.id}
                  className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3"
                >
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      label="이름"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="선생님 이름"
                      className="h-10 rounded-lg px-3 text-sm"
                    />
                    <Input
                      label="연락처"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="h-10 rounded-lg px-3 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-text">활성 상태</p>
                      <p className="text-xs text-text-secondary">비활성화하면 선생님 선택 목록에서 숨길 수 있습니다.</p>
                    </div>
                    <Toggle checked={editIsActive} onChange={setEditIsActive} size="sm" disabled={isBusy} />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingId(null)}
                      disabled={isBusy}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => void handleEditSave(d.id)}
                      disabled={isBusy || !editName.trim()}
                    >
                      {isBusy ? '저장 중...' : '프로필 저장'}
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={d.id}
                className="flex flex-col gap-2 rounded-xl bg-surface-alt p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <ProfileAvatar designerId={d.id} name={d.name} size="sm" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-text truncate min-w-0">{d.name}</span>
                      {d.role === 'owner' && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {t('settings.staff_owner')}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          d.isActive
                            ? 'bg-success/15 text-success'
                            : 'bg-error/15 text-error'
                        }`}
                      >
                        {d.isActive ? t('settings.staff_active') : t('settings.staff_inactive')}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{d.phone}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pl-11">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(d)} disabled={isBusy}>
                    프로필 수정
                  </Button>
                  <label
                    htmlFor={inputId}
                    className={cn(
                      'rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary transition-all',
                      isBusy
                        ? 'cursor-not-allowed opacity-40'
                        : 'cursor-pointer hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
                    )}
                  >
                    {hasImage ? '사진 변경' : '사진 업로드'}
                  </label>
                  <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(d.id, e)}
                    disabled={isBusy}
                  />
                  {hasImage && (
                    <button
                      onClick={() => void handleDeleteProfileImage(d.id)}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary hover:border-error/40 hover:bg-error/10 hover:text-error transition-all"
                      disabled={isBusy}
                    >
                      사진 삭제
                    </button>
                  )}
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)} disabled={isBusy}>
                        취소
                      </Button>
                      <Button variant="ghost" size="sm" className="text-error" onClick={() => void handleDelete(d)} disabled={isBusy}>
                        삭제
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-error" onClick={() => void handleDelete(d)} disabled={isBusy || d.role === 'owner'}>
                      프로필 삭제
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {designers.length === 0 && !showAddForm && (
            <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
              아직 등록된 선생님이 없습니다.
            </p>
          )}
        </div>
      </Card>
    </Section>
  );
}

// 운영 정보 섹션 (매장 탭 내부)
function OperatingHoursSection() {
  const t = useT();
  const { shopSettings, setShopSettings } = useAppStore();
  const storedHours = shopSettings.businessHours;
  const DAY_LABELS = DAY_LABEL_KEYS.map((k) => t(`settings.${k}`));
  const [bulkMode, setBulkMode] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(() => {
    const openDay = storedHours.find((h) => h.isOpen);
    return openDay?.openTime ?? '10:00';
  });
  const [bulkClose, setBulkClose] = useState(() => {
    const openDay = storedHours.find((h) => h.isOpen);
    return openDay?.closeTime ?? '20:00';
  });
  const [bulkClosedDays, setBulkClosedDays] = useState<boolean[]>(() =>
    DAY_LABEL_KEYS.map((_, uiIdx) => {
      const dow = (uiIdx + 1) % 7;
      const h = storedHours.find((bh) => bh.dayOfWeek === dow);
      return h ? !h.isOpen : false;
    }),
  );
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(() =>
    DAY_LABEL_KEYS.map((_, uiIdx) => {
      const dow = (uiIdx + 1) % 7;
      const h = storedHours.find((bh) => bh.dayOfWeek === dow);
      return {
        isOpen: h?.isOpen ?? (uiIdx !== 6),
        openTime: h?.openTime ?? '10:00',
        closeTime: h?.closeTime ?? '20:00',
      };
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const toggleBulkClosedDay = (index: number) => {
    setBulkClosedDays((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const updateDaySchedule = (index: number, patch: Partial<DaySchedule>) => {
    setDaySchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    const businessHours = DAY_LABEL_KEYS.map((_, uiIdx) => {
      const dow = (uiIdx + 1) % 7;
      if (bulkMode) {
        const isClosed = bulkClosedDays[uiIdx];
        return {
          dayOfWeek: dow,
          isOpen: !isClosed,
          ...(!isClosed ? { openTime: bulkOpen, closeTime: bulkClose } : {}),
        };
      }
      const s = daySchedules[uiIdx];
      return {
        dayOfWeek: dow,
        isOpen: s.isOpen,
        ...(s.isOpen ? { openTime: s.openTime, closeTime: s.closeTime } : {}),
      };
    });

    const result = await setShopSettings({ businessHours });
    setIsSaving(false);

    if (!result.success) {
      setFeedback({ tone: 'error', message: result.error ?? '운영 정보 저장에 실패했습니다.' });
      return;
    }

    setFeedback({ tone: 'success', message: '운영 정보가 저장되었습니다.' });
  };

  return (
    <Section title={t('settings.hours_title')}>
      <Card className="mx-4 md:mx-0">
        {/* 모드 토글 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text">{t('settings.hours_businessHours')}</span>
          <div className="flex items-center gap-1 rounded-xl bg-surface-alt border border-border p-1">
            <button
              onClick={() => setBulkMode(true)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
                bulkMode
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {t('settings.hours_bulk')}
            </button>
            <button
              onClick={() => setBulkMode(false)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
                !bulkMode
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {t('settings.hours_byDay')}
            </button>
          </div>
        </div>

        {bulkMode ? (
          /* 일괄 설정 */
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary w-10 flex-shrink-0">{t('settings.hours_time')}</span>
              <div className="flex items-center gap-2 flex-1">
                <TimeInput value={bulkOpen} onChange={setBulkOpen} />
                <span className="text-text-muted text-xs">~</span>
                <TimeInput value={bulkClose} onChange={setBulkClose} />
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-2">{t('settings.hours_closedDays')}</p>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => toggleBulkClosedDay(i)}
                    className={cn(
                      'w-9 h-9 rounded-full text-sm font-semibold transition-all duration-150',
                      bulkClosedDays[i]
                        ? 'bg-error/15 text-error'
                        : 'bg-surface-alt text-text-secondary border border-border',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted mt-2">{t('settings.hours_closedNote')}</p>
            </div>
          </div>
        ) : (
          /* 요일별 설정 */
          <div className="rounded-xl border border-border/60 overflow-hidden -mx-1">
            {DAY_LABELS.map((label, i) => {
              const s = daySchedules[i];
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5',
                    i !== DAY_LABELS.length - 1 && 'border-b border-border/40',
                  )}
                >
                  <span className="w-5 text-sm font-semibold text-text flex-shrink-0">
                    {label}
                  </span>
                  <Toggle
                    size="sm"
                    checked={s.isOpen}
                    onChange={(v) => updateDaySchedule(i, { isOpen: v })}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium w-7 flex-shrink-0',
                      s.isOpen ? 'text-success' : 'text-error',
                    )}
                  >
                    {s.isOpen ? t('settings.hours_open') : t('settings.hours_closed')}
                  </span>
                  <div className="flex items-center gap-1 flex-1">
                    <TimeInput
                      value={s.openTime}
                      onChange={(v) => updateDaySchedule(i, { openTime: v })}
                      disabled={!s.isOpen}
                    />
                    <span className="text-text-muted text-[10px]">~</span>
                    <TimeInput
                      value={s.closeTime}
                      onChange={(v) => updateDaySchedule(i, { closeTime: v })}
                      disabled={!s.isOpen}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {feedback && (
          <div
            className={cn(
              'mt-3 rounded-xl border px-3 py-2 text-xs font-medium',
              feedback.tone === 'success'
                ? 'border-success/20 bg-success/10 text-success'
                : 'border-error/20 bg-error/10 text-error',
            )}
          >
            {feedback.message}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? '저장 중...' : t('settings.hours_save')}
          </Button>
        </div>
      </Card>
    </Section>
  );
}

function StorageManagementSection() {
  const t = useT();
  const [storageInfo, setStorageInfo] = useState<{ key: string; label: string; bytes: number }[]>([]);
  const [confirmClearPortfolio, setConfirmClearPortfolio] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  const portfolioClearAll = usePortfolioStore((s) => s.clearAll);

  const refreshStorageInfo = React.useCallback(() => {
    const info = getStorageUsage();
    setStorageInfo(info.map((i) => ({ key: i.key, label: i.label, bytes: i.bytes })));
  }, []);

  React.useEffect(() => {
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  const totalBytes = storageInfo.reduce((acc, item) => acc + (item.bytes || 0), 0);

  const handleClearPortfolio = () => {
    void (async () => {
      const result = await portfolioClearAll();

      setConfirmClearPortfolio(false);

      if (!result.success) {
        setClearSuccess(result.error ?? '포트폴리오 초기화에 실패했습니다');
        setTimeout(() => setClearSuccess(null), 2500);
        return;
      }

      setClearSuccess(t('settings.storage_cleared'));
      refreshStorageInfo();
      setTimeout(() => setClearSuccess(null), 2000);
    })();
  };

  const handleClearAll = () => {
    void (async () => {
      const portfolioResult = await portfolioClearAll();
      if (!portfolioResult.success) {
        setConfirmClearAll(false);
        setClearSuccess(portfolioResult.error ?? '포트폴리오 초기화에 실패했습니다');
        setTimeout(() => setClearSuccess(null), 2500);
        return;
      }

      ['bdx-customers', 'bdx-reservations', 'bdx-records', 'bdx-portfolio'].forEach((k) => {
        try { localStorage.removeItem(k); } catch { /* noop */ }
      });

      try { useCustomerStore.setState({ customers: [] }); } catch {}
      try { useReservationStore.setState({ reservations: [] }); } catch {}
      try { useRecordsStore.setState({ records: [] }); } catch {}
      try { usePortfolioStore.setState({ photos: [] }); } catch {}

      setConfirmClearAll(false);
      setClearSuccess(t('settings.storage_cleared'));
      refreshStorageInfo();
      setTimeout(() => {
        setClearSuccess(null);
        try { window.location.reload(); } catch {}
      }, 1000);
    })();
  };

  return (
    <Section title={t('settings.storage_title')}>
      <Card className="mx-4 md:mx-0">
        <div className="mb-4">
          <p className="text-sm font-medium text-text mb-3">{t('settings.storage_usage')}</p>
          <div className="flex flex-col gap-2">
            {storageInfo.map((item) => (
              <div key={item.key} className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="font-medium text-text">{formatBytes(item.bytes)}</span>
              </div>
            ))}
            <div className="border-t border-border/50 pt-2 mt-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-text">{t('settings.storage_total')}</span>
                <span className="font-bold text-primary">{formatBytes(totalBytes)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setConfirmClearPortfolio(true)}
            className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-left transition-colors hover:bg-surface-alt"
          >
            <svg className="h-5 w-5 flex-shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <div className="flex-1">
              <span className="text-sm font-medium text-text block">{t('settings.storage_clearPortfolio')}</span>
              <span className="text-xs text-text-muted">{t('settings.storage_clearPortfolioDesc')}</span>
            </div>
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <Modal
            isOpen={confirmClearPortfolio}
            onClose={() => setConfirmClearPortfolio(false)}
            title="포트폴리오 초기화"
          >
            <div className="p-5">
              <p className="text-sm text-text-secondary mb-4">포트폴리오의 모든 사진이 삭제됩니다. 계속하시겠습니까?</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmClearPortfolio(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={() => { handleClearPortfolio(); }}>
                  포트폴리오 초기화
                </Button>
              </div>
            </div>
          </Modal>

          <button
            onClick={() => setConfirmClearAll(true)}
            className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-left transition-colors hover:bg-surface-alt"
          >
            <svg className="h-5 w-5 flex-shrink-0 text-error/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <div className="flex-1">
              <span className="text-sm font-medium text-error block">{t('settings.storage_clearAll')}</span>
              <span className="text-xs text-text-muted">{t('settings.storage_clearAllDesc')}</span>
            </div>
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <Modal
            isOpen={confirmClearAll}
            onClose={() => setConfirmClearAll(false)}
            title="전체 데이터 초기화"
          >
            <div className="p-5">
              <p className="text-sm text-text-secondary mb-4">로컬 캐시 데이터(예약, 고객, 기록)가 초기화됩니다. 서버에 저장된 데이터는 앱 재시작 시 복원될 수 있습니다. 계속하시겠습니까?</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmClearAll(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={() => { handleClearAll(); }}>
                  전체 데이터 초기화
                </Button>
              </div>
            </div>
          </Modal>
        </div>

        {clearSuccess && (
          <div className="mt-3 rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-center">
            <span className="text-sm font-medium text-success">{clearSuccess}</span>
          </div>
        )}
      </Card>
    </Section>
  );
}


// ── 시술 항목 관리 섹션 ──
const SERVICE_STRUCTURE_LABELS: Record<string, string> = {
  removal: '제거',
  gradation: '그라데이션',
  french: '프렌치',
  magnet: '마그네틱',
  pointFullArt: '포인트/풀아트',
  parts: '파츠',
  repair: '리페어',
  overlay: '오버레이',
  extension: '연장',
};

function ServiceStructureSection() {
  const { shopSettings, setShopSettings } = useAppStore();
  const serviceStructure = shopSettings.serviceStructure;
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const handleToggle = async (key: string, value: boolean) => {
    const result = await setShopSettings({
      serviceStructure: { ...serviceStructure, [key]: value },
    });
    if (!result.success) {
      setFeedback({ tone: 'error', message: result.error ?? '시술 항목 변경에 실패했습니다.' });
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <Section title="시술 항목 관리">
      <Card className="mx-4 md:mx-0">
        <p className="text-sm text-text-muted mb-3">현재 시술 중인 항목을 ON/OFF 할 수 있습니다</p>
        {feedback && (
          <div
            className={cn(
              'mb-3 rounded-xl border px-3 py-2 text-xs font-medium',
              feedback.tone === 'success'
                ? 'border-success/20 bg-success/10 text-success'
                : 'border-error/20 bg-error/10 text-error',
            )}
          >
            {feedback.message}
          </div>
        )}
        <div className="flex flex-col">
          {Object.entries(SERVICE_STRUCTURE_LABELS).map(([key, label], index, arr) => (
            <div
              key={key}
              className={cn(
                'flex items-center justify-between py-3',
                index !== arr.length - 1 && 'border-b border-border/50',
              )}
            >
              <span className="text-sm font-medium text-text">{label}</span>
              <Toggle
                size="sm"
                checked={serviceStructure[key as keyof typeof serviceStructure]}
                onChange={(v) => void handleToggle(key, v)}
              />
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const t = useT();
  const { shopSettings, setShopSettings } = useAppStore();
  const { role, logout, currentShopId } = useAuthStore();
  const isDemoMode = currentShopId === 'shop-demo';
  const shop = useShopStore((s) => s.shop);
  const updateShop = useShopStore((s) => s.updateShop);

  const [activeTab, setActiveTab] = useState<TabId>('shop');

  

  // 매장 정보 편집
  const [editingShop, setEditingShop] = useState(false);
  const [isSavingShop, setIsSavingShop] = useState(false);
  const [shopFeedback, setShopFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [shopName, setShopName] = useState(shopSettings.shopName || shop?.name || '');
  const [shopPhone, setShopPhone] = useState(shopSettings.shopPhone || shop?.phone || '');
  const [shopAddress, setShopAddress] = useState(shopSettings.shopAddress || shop?.address || '');
  const [shopAddressDetail, setShopAddressDetail] = useState(shopSettings.shopAddressDetail || '');

  // 서비스 가격 인라인 편집
  const [editingPrices, setEditingPrices] = useState(false);
  const [priceHand, setPriceHand] = useState(String(shopSettings.baseHandPrice || DEFAULT_BASE_PRICES.hand));
  const [priceFoot, setPriceFoot] = useState(String(shopSettings.baseFootPrice || DEFAULT_BASE_PRICES.foot));
  const [priceOffSame, setPriceOffSame] = useState(String(shopSettings.baseOffSameShop || DEFAULT_BASE_PRICES.offSameShop));
  const [priceOffOther, setPriceOffOther] = useState(String(shopSettings.baseOffOtherShop || DEFAULT_BASE_PRICES.offOtherShop));
  const [priceRepair, setPriceRepair] = useState(String(shopSettings.surcharges.repairPer ?? DEFAULT_BASE_PRICES.repair));
  const [priceExtension, setPriceExtension] = useState(String(shopSettings.surcharges.extension ?? DEFAULT_BASE_PRICES.extension));
  const [priceSolidPoint, setPriceSolidPoint] = useState(String(shopSettings.baseSolidPointPrice ?? DEFAULT_BASE_PRICES.solidPoint));
  const [priceFullArt, setPriceFullArt] = useState(String(shopSettings.baseFullArtPrice ?? DEFAULT_BASE_PRICES.fullArt));
  const [priceMonthlyArt, setPriceMonthlyArt] = useState(String(shopSettings.baseMonthlyArtPrice ?? DEFAULT_BASE_PRICES.monthlyArt));
  const [savedPrices, setSavedPrices] = useState({
    hand: shopSettings.baseHandPrice || DEFAULT_BASE_PRICES.hand,
    foot: shopSettings.baseFootPrice || DEFAULT_BASE_PRICES.foot,
    offSameShop: shopSettings.baseOffSameShop || DEFAULT_BASE_PRICES.offSameShop,
    offOtherShop: shopSettings.baseOffOtherShop || DEFAULT_BASE_PRICES.offOtherShop,
    repair: shopSettings.surcharges.repairPer ?? DEFAULT_BASE_PRICES.repair,
    extension: shopSettings.surcharges.extension ?? DEFAULT_BASE_PRICES.extension,
    solidPoint: shopSettings.baseSolidPointPrice ?? DEFAULT_BASE_PRICES.solidPoint,
    fullArt: shopSettings.baseFullArtPrice ?? DEFAULT_BASE_PRICES.fullArt,
    monthlyArt: shopSettings.baseMonthlyArtPrice ?? DEFAULT_BASE_PRICES.monthlyArt,
  });

  const handleSavePrices = () => {
    const hand = parseInt(priceHand, 10);
    const foot = parseInt(priceFoot, 10);
    const offSameShop = parseInt(priceOffSame, 10);
    const offOtherShop = parseInt(priceOffOther, 10);
    const repair = parseInt(priceRepair, 10);
    const extension = parseInt(priceExtension, 10);
    const solidPoint = parseInt(priceSolidPoint, 10);
    const fullArt = parseInt(priceFullArt, 10);
    const monthlyArt = parseInt(priceMonthlyArt, 10);
    if ([hand, foot, offSameShop, offOtherShop, repair, extension, solidPoint, fullArt, monthlyArt].some((v) => isNaN(v) || v < 0)) return;
    setSavedPrices({ hand, foot, offSameShop, offOtherShop, repair, extension, solidPoint, fullArt, monthlyArt });
    setShopSettings({
      baseHandPrice: hand,
      baseFootPrice: foot,
      baseOffSameShop: offSameShop,
      baseOffOtherShop: offOtherShop,
      baseSolidPointPrice: solidPoint,
      baseFullArtPrice: fullArt,
      baseMonthlyArtPrice: monthlyArt,
      surcharges: {
        ...shopSettings.surcharges,
        repairPer: repair,
        extension,
      },
    });
    setEditingPrices(false);
  };

  const handleCancelPrices = () => {
    setPriceHand(String(savedPrices.hand));
    setPriceFoot(String(savedPrices.foot));
    setPriceOffSame(String(savedPrices.offSameShop));
    setPriceOffOther(String(savedPrices.offOtherShop));
    setPriceRepair(String(savedPrices.repair));
    setPriceExtension(String(savedPrices.extension));
    setPriceSolidPoint(String(savedPrices.solidPoint));
    setPriceFullArt(String(savedPrices.fullArt));
    setPriceMonthlyArt(String(savedPrices.monthlyArt));
    setEditingPrices(false);
  };

  const handleSaveShop = async () => {
    if (!shopName.trim()) {
      setShopFeedback({ tone: 'error', message: '매장명을 입력해 주세요.' });
      return;
    }

    setIsSavingShop(true);
    setShopFeedback(null);

    const [shopResult, settingsResult] = await Promise.all([
      updateShop({
        name: shopName.trim(),
        phone: shopPhone.trim() || undefined,
        address: shopAddress.trim() || undefined,
      }),
      setShopSettings({
        shopName: shopName.trim(),
        shopPhone: shopPhone.trim(),
        shopAddress: shopAddress.trim(),
        shopAddressDetail: shopAddressDetail.trim(),
      }),
    ]);

    setIsSavingShop(false);

    if (!shopResult.success || !settingsResult.success) {
      setShopFeedback({
        tone: 'error',
        message: shopResult.error ?? settingsResult.error ?? '운영 정보 저장에 실패했습니다. 다시 시도해 주세요.',
      });
      return;
    }

    setEditingShop(false);
    setShopFeedback({ tone: 'success', message: '운영 정보가 저장되었습니다.' });
  };

  const handleLogout = () => {
    void logout().then(() => {
      router.push('/login');
    });
  };

  const TABS: { id: TabId; label: string }[] = TAB_IDS.map((id) => ({
    id,
    label: t(`settings.tabs_${id}`),
  }));

  // Staff can only see 테마/앱 tabs
  const visibleTabs = role === 'staff'
    ? TABS.filter((tab) => ['theme', 'app'].includes(tab.id))
    : TABS;

  // If current active tab is not visible (staff restriction), reset
  const effectiveTab = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : visibleTabs[0]?.id ?? 'theme';

  const tabContent = (
    <>
      {isDemoMode && (
        <div className="mx-4 md:mx-0 mb-3 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
          <svg className="h-4 w-4 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-700">
            현재 데모 모드로 이용 중이에요. 설정을 변경하셔도 실제 데이터에는 반영되지 않으니 참고해 주세요.
          </p>
        </div>
      )}
      {/* ── 매장 탭 ── */}
      {effectiveTab === 'shop' && (
        <>
          {/* 매장 정보 */}
          <Section title={t('settings.shop_title')}>
            <Card className="mx-4 md:mx-0">
              {shopFeedback && (
                <div
                  className={cn(
                    'mb-3 rounded-xl border px-3 py-2 text-xs font-medium',
                    shopFeedback.tone === 'success'
                      ? 'border-success/20 bg-success/10 text-success'
                      : 'border-error/20 bg-error/10 text-error',
                  )}
                >
                  {shopFeedback.message}
                </div>
              )}

              {!editingShop ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">{shopName}</h2>
                      <p className="mt-0.5 text-sm text-text-secondary">{shopPhone}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShopFeedback(null);
                        setEditingShop(true);
                      }}
                    >
                      {t('settings.shop_edit')}
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 text-sm">
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 text-text-muted">{t('settings.shop_address')}</span>
                      <span className="break-words min-w-0 flex-1 text-text">
                        {shopAddress}
                        {shopAddressDetail && ` ${shopAddressDetail}`}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">{t('settings.shop_name')}</label>
                    <Input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder={t('settings.shop_name')}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">{t('settings.shop_phone')}</label>
                    <Input
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      placeholder={t('settings.shop_phone')}
                    />
                  </div>
                  <AddressInput
                    label={t('settings.shop_address')}
                    value={{ address: shopAddress, addressDetail: shopAddressDetail }}
                    onChange={(addr, detail) => {
                      setShopAddress(addr);
                      setShopAddressDetail(detail);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setShopName(shopSettings.shopName || shop?.name || '');
                        setShopPhone(shopSettings.shopPhone || shop?.phone || '');
                        setShopAddress(shopSettings.shopAddress || shop?.address || '');
                        setShopAddressDetail(shopSettings.shopAddressDetail || '');
                        setEditingShop(false);
                      }}
                      disabled={isSavingShop}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => void handleSaveShop()} disabled={isSavingShop}>
                      {isSavingShop ? '저장 중...' : '운영 정보 저장'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </Section>

          {/* 선생님 관리 */}
          <StaffSection />

          {/* 운영 정보 (영업시간 + 휴무일 통합) */}
          <OperatingHoursSection />
        </>
      )}

      {/* ── 서비스 탭 ── */}
      {effectiveTab === 'service' && (
        <>
        {/* 시술 항목 관리 */}
        <ServiceStructureSection />

        <Section title={t('settings.service_title')}>
          <Card className="mx-4 md:mx-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-text">{t('settings.service_priceTable')}</span>
              {!editingPrices ? (
                <Button variant="secondary" size="sm" onClick={() => setEditingPrices(true)}>
                  {t('settings.shop_edit')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCancelPrices}>
                    {t('common.cancel')}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSavePrices}>
                    {t('common.save')}
                  </Button>
                </div>
              )}
            </div>

            {!editingPrices ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('settings.service_hand')}</span>
                  <span className="font-medium text-text">{formatPrice(savedPrices.hand)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('settings.service_foot')}</span>
                  <span className="font-medium text-text">{formatPrice(savedPrices.foot)}</span>
                </div>
                <div className="my-1 border-t border-border/50" />
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">자샵오프</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.offSameShop)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">타샵오프</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.offOtherShop)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">리페어 개당</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.repair)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">연장 추가금</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.extension)}</span>
                </div>
                <div className="my-1 border-t border-border/50" />
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('settings.service_solidPoint')}</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.solidPoint)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('settings.service_fullArt')}</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.fullArt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('settings.service_monthlyArt')}</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.monthlyArt)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {[
                  { labelKey: 'service_hand', value: priceHand, onChange: setPriceHand },
                  { labelKey: 'service_foot', value: priceFoot, onChange: setPriceFoot },
                  { label: '자샵오프', value: priceOffSame, onChange: setPriceOffSame },
                  { label: '타샵오프', value: priceOffOther, onChange: setPriceOffOther },
                  { label: '리페어 개당', value: priceRepair, onChange: setPriceRepair },
                  { label: '연장 추가금', value: priceExtension, onChange: setPriceExtension },
                  { labelKey: 'service_solidPoint', value: priceSolidPoint, onChange: setPriceSolidPoint },
                  { labelKey: 'service_fullArt', value: priceFullArt, onChange: setPriceFullArt },
                  { labelKey: 'service_monthlyArt', value: priceMonthlyArt, onChange: setPriceMonthlyArt },
                ].map(({ labelKey, label, value, onChange }: {
                  labelKey?: string;
                  label?: string;
                  value: string;
                  onChange: (nextValue: string) => void;
                }) => (
                  <div key={labelKey || label} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-text-secondary">{labelKey ? t(`settings.${labelKey}`) : label}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        min={0}
                        step={1000}
                        className="w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-right text-text focus:outline-none focus:border-primary transition-colors"
                      />
                      <span className="text-xs text-text-muted">{t('home.stat_won')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="my-3 border-t border-border" />

            <div className="mb-2">
              <p className="text-xs font-medium text-text-secondary">{t('settings.service_customParts')}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{t('settings.service_customPartsDesc')}</p>
            </div>
            <CustomPartsManager />

            <div className="my-3 border-t border-border" />

            <DesignPresetsManager />
          </Card>
        </Section>
        </>
      )}

      {/* ── 테마 탭 ── */}
      {effectiveTab === 'theme' && (
        <Section title={t('settings.theme_title')}>
          <Card className="mx-4 md:mx-0">
            <p className="mb-3 text-sm font-medium text-text">{t('settings.theme_select')}</p>
            <ThemeSelector />
          </Card>
        </Section>
      )}

      {/* ── 앱 탭 ── */}
      {effectiveTab === 'app' && (
        <div className="flex flex-col gap-6">
          {/* 언어 설정 */}
          <Section title={t('settings.language')}>
            <Card className="mx-4 md:mx-0">
              <LanguageSelector />
            </Card>
          </Section>

          {/* 앱 정보 */}
          <Section title={t('settings.app_title')}>
            <Card className="mx-4 md:mx-0">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('settings.version')}</span>
                  <span className="font-medium text-text">1.0.0</span>
                </div>

                {isDemoMode ? (
                  <button
                    onClick={async () => {
                      await logout();
                      router.push('/login');
                    }}
                    className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-3 text-left transition-colors hover:bg-primary/10"
                  >
                    <svg className="h-5 w-5 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">데모 모드 나가기</p>
                      <p className="mt-0.5 text-xs text-text-muted">로그인 화면으로 돌아갑니다</p>
                    </div>
                    <svg className="h-4 w-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await logout();
                      const { loginAsDemo } = useAuthStore.getState();
                      await loginAsDemo();
                      router.push('/home');
                    }}
                    className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-left transition-colors hover:bg-surface-alt"
                  >
                    <svg className="h-5 w-5 flex-shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">데모 모드로 전환</p>
                      <p className="mt-0.5 text-xs text-text-muted">Mock 데이터로 전체 기능을 체험합니다</p>
                    </div>
                    <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                <div className="border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={handleLogout}
                    className="text-error hover:bg-error/10"
                  >
                    {t('settings.logout')}
                  </Button>
                </div>
              </div>
            </Card>
          </Section>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col pb-8">
      <FeatureDiscovery
        featureId="settings-intro"
        icon={
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        title={t('settings.title')}
        description={"매장 정보, 서비스 가격, 파츠 등록, 테마 변경 등을\n관리하세요."}
      />
      {/* 헤더 */}
      <div className="px-4 md:px-0 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-text">{t('settings.title')}</h1>
      </div>

      {/* Tablet: side-by-side layout */}
      <div className="md:flex md:flex-row md:gap-6">
        {/* Mobile horizontal tab bar (hidden on md) */}
        <div className="md:hidden sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex overflow-x-auto scrollbar-hide px-4 gap-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors duration-150',
                  effectiveTab === tab.id
                    ? 'border-primary text-primary shadow-sm'
                    : 'border-transparent text-text-muted',
                )}
              >
                <span className="leading-none">{TAB_ICONS[tab.id]}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tablet vertical tab list (hidden on mobile) */}
        <div className="hidden md:flex md:flex-col md:w-44 md:flex-shrink-0 md:pt-2 md:gap-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors duration-150 text-left',
                effectiveTab === tab.id
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-text-muted hover:bg-surface-alt hover:text-text',
              )}
            >
              <span className="leading-none">{TAB_ICONS[tab.id]}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 flex flex-col gap-6 pt-5 md:pt-0 md:min-w-0">
          {tabContent}
        </div>
      </div>
    </div>
  );
}
