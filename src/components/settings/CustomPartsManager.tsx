'use client';

import { useState, useEffect, useRef } from 'react';
import { usePartsStore } from '@/store/parts-store';
import { useAppStore } from '@/store/app-store';
import { useT } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';

export function CustomPartsManager(): React.ReactElement {
  const { customParts, addPart, removePart, updatePart } = usePartsStore();
  const setShopSettings = useAppStore((s) => s.setShopSettings);
  const t = useT();

  // 0528 H7: partsStore → shopSettings.customParts 동기화.
  // 매 렌더마다 setShopSettings 호출되면 DB write race 발생 → 직렬화로 변경 감지 후 1회만.
  const partsSyncedRef = useRef<string>('');
  useEffect(() => {
    const next = customParts.map((p) => ({ id: p.id, name: p.name, pricePerUnit: p.pricePerUnit }));
    const serialized = JSON.stringify(next);
    if (partsSyncedRef.current === serialized) return;
    partsSyncedRef.current = serialized;
    void setShopSettings({ customParts: next });
  }, [customParts, setShopSettings]);

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
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleEditSave(part.id)}
                  className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  {t('common.save')}
                </button>
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
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text-secondary hover:bg-surface transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleDelete(part.id)}
                  className="rounded-md bg-error/10 border border-error/30 px-2 py-1 text-xs font-semibold text-error hover:bg-error/20 transition-colors"
                >
                  {t('common.delete')}
                </button>
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
            <button
              onClick={() => { setShowAddForm(false); setNewPartName(''); setNewPartPrice(''); }}
              className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAdd}
              disabled={!newPartName.trim() || !newPartPrice.trim()}
              className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {t('settings.staff_add')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-1 flex items-center gap-1.5 rounded-xl border border-dashed border-primary/40 py-2 px-3 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {t('settings.service_addPart')}
        </button>
      )}

      {customParts.length === 0 && !showAddForm && (
        <p className="text-xs text-text-muted text-center py-2">{t('settings.service_noParts')}</p>
      )}
    </div>
  );
}
