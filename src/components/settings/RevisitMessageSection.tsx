'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { useAppStore } from '@/store/app-store';

const DEFAULT_TEMPLATE =
  '안녕하세요, {customerName}님! {shopName}입니다. 마지막 방문 이후 한 달이 지났네요. 예약을 도와드릴까요?';

const VARIABLES = [
  { key: '{customerName}', label: '고객 이름', sample: '김민지' },
  { key: '{shopName}', label: '매장 이름', sample: '' },
] as const;

/** 변수 치환: {customerName} → name, {shopName} → shopName */
export function renderRevisitMessage(
  template: string,
  vars: { customerName: string; shopName: string },
): string {
  return (template || DEFAULT_TEMPLATE)
    .replaceAll('{customerName}', vars.customerName)
    .replaceAll('{shopName}', vars.shopName);
}

export function RevisitMessageSection(): React.ReactElement {
  const shopSettings = useAppStore((s) => s.shopSettings);
  const setShopSettings = useAppStore((s) => s.setShopSettings);

  const storeTemplate = shopSettings.revisitMessageTemplate ?? DEFAULT_TEMPLATE;
  const [draft, setDraft] = useState(storeTemplate);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 스토어 템플릿이 외부에서 바뀐 경우 동기화
  useEffect(() => {
    setDraft(storeTemplate);
  }, [storeTemplate]);

  const dirty = draft !== storeTemplate;

  const preview = useMemo(() => {
    return renderRevisitMessage(draft, {
      customerName: '김민지',
      shopName: shopSettings.shopName || '우리 매장',
    });
  }, [draft, shopSettings.shopName]);

  const handleSave = async (): Promise<void> => {
    setStatus('saving');
    const result = await setShopSettings({ revisitMessageTemplate: draft });
    if (result.success) {
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1600);
    } else {
      setStatus('error');
    }
  };

  const handleReset = (): void => {
    setDraft(DEFAULT_TEMPLATE);
    textareaRef.current?.focus();
  };

  const insertVariable = (v: string): void => {
    const el = textareaRef.current;
    if (!el) {
      setDraft((prev) => `${prev}${v}`);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + v + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + v.length;
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <Card className="mx-4 md:mx-0 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">재방문 알림 기본 문구</p>
          <p className="mt-1 text-[11px] text-text-muted">
            홈 &middot; 재방문 알림에서 [복사] 누를 때 이 문구가 사용돼요. 필요에 맞게 바꿔서 저장하세요.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-muted">변수 삽입:</span>
        {VARIABLES.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => insertVariable(v.key)}
            aria-label={`${v.label} 변수(${v.key}) 삽입`}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-primary/40 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {v.label}
            <span className="font-mono text-[11px] text-text-muted">{v.key}</span>
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        placeholder={DEFAULT_TEMPLATE}
        aria-label="재방문 알림 기본 문구"
        className="w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-text placeholder:text-text-muted focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />

      <div className="rounded-xl bg-surface-alt border border-border p-3">
        <p className="text-[11px] font-medium text-text-muted mb-1">미리보기</p>
        <p className="text-sm text-text whitespace-pre-wrap break-words">{preview}</p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          disabled={draft === DEFAULT_TEMPLATE}
        >
          기본값으로
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { void handleSave(); }}
          disabled={!dirty || status === 'saving'}
        >
          {status === 'saving' ? '저장 중...' : status === 'saved' ? '저장 완료' : '저장'}
        </Button>
      </div>

      {status === 'error' && (
        <p className="text-xs text-error">저장에 실패했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
    </Card>
  );
}

export default RevisitMessageSection;
