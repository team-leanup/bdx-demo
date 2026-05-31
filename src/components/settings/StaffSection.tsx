'use client';

import { useState } from 'react';
import { Card, Button, Input, Toggle, ProfileAvatar } from '@/components/ui';
import { useShopStore } from '@/store/shop-store';
import { useAuthStore } from '@/store/auth-store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { resizeImageToBase64 } from '@/lib/image-utils';

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <p className="mb-2 px-4 md:px-0 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

export function StaffSection(): React.ReactElement {
  const t = useT();
  const designers = useShopStore((s) => s.designers);
  const createDesigner = useShopStore((s) => s.createDesigner);
  const updateDesigner = useShopStore((s) => s.updateDesigner);
  const deleteDesigner = useShopStore((s) => s.deleteDesigner);
  const uploadDesignerProfileImage = useShopStore((s) => s.uploadDesignerProfileImage);
  const deleteDesignerProfileImage = useShopStore((s) => s.deleteDesignerProfileImage);
  const currentShopId = useAuthStore((s) => s.currentShopId);
  const setPassword = useAuthStore((s) => s.setPassword);

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

  // PIN 관리 상태
  const [pinEditingId, setPinEditingId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinBusyId, setPinBusyId] = useState<string | null>(null);

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

  const handlePinSave = async (designerId: string) => {
    if (!/^\d{4}$/.test(newPin)) {
      setFeedback({ tone: 'error', message: '숫자 4자리 PIN을 입력해 주세요.' });
      return;
    }
    if (!currentShopId) return;

    setPinBusyId(designerId);
    try {
      // setPassword 내부에서 해시 계산 + dbUpdateDesignerPin 호출까지 처리
      await setPassword(designerId, newPin);
      setPinEditingId(null);
      setNewPin('');
      setFeedback({ tone: 'success', message: 'PIN이 변경되었습니다.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PIN 저장 실패';
      setFeedback({ tone: 'error', message: msg });
    } finally {
      setPinBusyId(null);
    }
  };

  return (
    <Section title={t('settings.staff_title')}>
      <Card className="mx-4 md:mx-0">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text">{t('settings.staff_registered')}</span>
          <button
            onClick={() => {
              if (showAddForm) {
                resetAddForm();
              } else {
                setShowAddForm(true);
                setFeedback(null);
              }
            }}
            className="rounded-lg border border-primary px-3 py-1 text-xs font-medium text-primary"
          >
            {showAddForm ? '취소' : t('settings.staff_add')}
          </button>
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
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                          {t('settings.staff_owner')}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
                  <button
                    onClick={() => startEdit(d)}
                    className="rounded-lg border border-border px-2.5 py-2 text-xs font-semibold text-text-secondary hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all min-h-[44px]"
                    disabled={isBusy}
                  >
                    프로필 수정
                  </button>
                  <label
                    htmlFor={inputId}
                    className={cn(
                      'rounded-lg border border-border px-2.5 py-2 text-xs font-semibold text-text-secondary transition-all min-h-[44px] flex items-center',
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
                      className="rounded-lg border border-border px-2.5 py-2 text-xs font-semibold text-text-secondary hover:border-error/40 hover:bg-error/10 hover:text-error transition-all min-h-[44px]"
                      disabled={isBusy}
                    >
                      사진 삭제
                    </button>
                  )}
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text-secondary hover:bg-surface transition-colors"
                        disabled={isBusy}
                      >
                        취소
                      </button>
                      <button
                        onClick={() => void handleDelete(d)}
                        className="rounded-md border border-error/30 bg-error/10 px-2 py-1 text-xs font-semibold text-error hover:bg-error/20 transition-colors"
                        disabled={isBusy}
                      >
                        삭제
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleDelete(d)}
                      className="rounded-lg border border-border px-2.5 py-2 text-xs font-semibold text-text-secondary hover:border-error/40 hover:bg-error/10 hover:text-error transition-all disabled:opacity-40 min-h-[44px]"
                      disabled={isBusy || d.role === 'owner'}
                    >
                      프로필 삭제
                    </button>
                  )}
                </div>

                {/* PIN 관리 */}
                <div className="pl-11">
                  {pinEditingId === d.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="새 PIN 4자리"
                        className="w-28 rounded-lg border border-primary/40 bg-surface px-2.5 py-1.5 text-xs font-mono tracking-widest text-text focus:outline-none focus:ring-1 focus:ring-primary/60"
                        disabled={pinBusyId === d.id}
                        autoFocus
                      />
                      <button
                        onClick={() => void handlePinSave(d.id)}
                        disabled={pinBusyId === d.id || newPin.length !== 4}
                        className="rounded-lg bg-primary px-2.5 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {pinBusyId === d.id ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => { setPinEditingId(null); setNewPin(''); }}
                        disabled={pinBusyId === d.id}
                        className="rounded-lg border border-border px-2.5 py-2 text-xs font-semibold text-text-secondary"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">PIN: ••••</span>
                      <button
                        onClick={() => { setPinEditingId(d.id); setNewPin(''); setFeedback(null); }}
                        disabled={isBusy}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-text-secondary hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        변경
                      </button>
                    </div>
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
