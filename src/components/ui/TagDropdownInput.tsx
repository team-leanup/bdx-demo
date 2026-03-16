'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/cn';

export interface TagDropdownInputProps {
  value: string;
  onChange: (value: string) => void;
  presets: string[];
  storageKey: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

function loadCustomTags(storageKey: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function saveCustomTags(storageKey: string, tags: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(tags));
  } catch {
    // localStorage 쓰기 실패 시 무시
  }
}

export function TagDropdownInput({
  value,
  onChange,
  presets,
  storageKey,
  placeholder,
  disabled = false,
  id,
}: TagDropdownInputProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // disabled 전환 시 드롭다운 닫기
  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setQuery('');
    }
  }, [disabled]);

  // 마운트 시 localStorage에서 커스텀 태그 로드
  useEffect(() => {
    setCustomTags(loadCustomTags(storageKey));
  }, [storageKey]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const allTags = useMemo(() => {
    const combined = [...presets];
    for (const tag of customTags) {
      if (!combined.includes(tag)) {
        combined.push(tag);
      }
    }
    return combined;
  }, [presets, customTags]);

  const filteredTags = useMemo(() => {
    if (!query.trim()) return allTags;
    const lower = query.toLowerCase();
    return allTags.filter((tag) => tag.toLowerCase().includes(lower));
  }, [allTags, query]);

  const queryTrimmed = query.trim();
  const showAddButton = queryTrimmed.length > 0 && !allTags.includes(queryTrimmed);

  const handleInputClick = useCallback((): void => {
    if (disabled) return;
    setIsOpen(true);
    setQuery('');
  }, [disabled]);

  const handleSelect = useCallback(
    (tag: string): void => {
      onChange(tag);
      setIsOpen(false);
      setQuery('');
    },
    [onChange],
  );

  const handleAddCustom = useCallback((): void => {
    if (!queryTrimmed) return;
    const updated = [...customTags, queryTrimmed];
    setCustomTags(updated);
    saveCustomTags(storageKey, updated);
    onChange(queryTrimmed);
    setIsOpen(false);
    setQuery('');
  }, [queryTrimmed, customTags, storageKey, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (showAddButton) {
          handleAddCustom();
        } else if (filteredTags.length > 0) {
          handleSelect(filteredTags[0]);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    },
    [showAddButton, filteredTags, handleAddCustom, handleSelect],
  );

  // 표시할 값: 드롭다운이 열려 있으면 query, 닫혀 있으면 선택된 value
  const displayValue = isOpen ? query : value;

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        autoComplete="off"
        value={displayValue}
        placeholder={isOpen ? '검색...' : placeholder}
        disabled={disabled}
        onClick={handleInputClick}
        onChange={(e) => {
          if (!isOpen) setIsOpen(true);
          setQuery(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full h-12 px-4 rounded-xl border bg-surface text-text text-base placeholder:text-text-muted transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary',
          'border-border hover:border-text-muted',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        )}
      />

      {/* 드롭다운 화살표 */}
      {!disabled && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setQuery('');
            } else {
              setIsOpen(true);
              setQuery('');
              inputRef.current?.focus();
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
        >
          <svg
            className={cn('h-4 w-4 transition-transform duration-150', isOpen && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* 드롭다운 목록 */}
      {isOpen && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg"
        >
          {filteredTags.map((tag) => (
            <li key={tag} role="option" aria-selected={tag === value}>
              <button
                type="button"
                onMouseDown={(e) => {
                  // blur 이전에 선택 처리하기 위해 mousedown 사용
                  e.preventDefault();
                  handleSelect(tag);
                }}
                className={cn(
                  'flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors',
                  tag === value
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-text hover:bg-surface-alt',
                )}
              >
                {tag === value && (
                  <svg className="h-3.5 w-3.5 flex-shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className={cn(tag === value ? '' : 'pl-[22px]')}>{tag}</span>
                {!presets.includes(tag) && (
                  <span className="ml-auto flex-shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    커스텀
                  </span>
                )}
              </button>
            </li>
          ))}

          {showAddButton && (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddCustom();
                }}
                className="flex min-h-[44px] w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                &apos;{queryTrimmed}&apos; 추가
              </button>
            </li>
          )}

          {filteredTags.length === 0 && !showAddButton && (
            <li className="px-4 py-3 text-center text-sm text-text-muted">결과 없음</li>
          )}
        </ul>
      )}
    </div>
  );
}
