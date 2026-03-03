'use client';

import { useDaumPostcodePopup } from 'react-daum-postcode';
import { cn } from '@/lib/cn';

interface AddressValue {
  address: string;
  addressDetail: string;
}

interface AddressInputProps {
  value?: AddressValue;
  onChange?: (address: string, addressDetail: string) => void;
  label?: string;
  className?: string;
}

export function AddressInput({ value, onChange, label, className }: AddressInputProps) {
  const open = useDaumPostcodePopup();

  const handleAddressSearch = () => {
    open({
      onComplete: (data) => {
        const roadAddress = data.roadAddress || data.jibunAddress;
        onChange?.(roadAddress, value?.addressDetail ?? '');
      },
    });
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(value?.address ?? '', e.target.value);
  };

  const inputBase = cn(
    'w-full h-11 md:h-12 px-4 rounded-xl border bg-surface text-text text-base md:text-base placeholder:text-text-muted transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    'border-border hover:border-primary/40',
  );

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}

      {/* 도로명 주소 (readonly) + 검색 버튼 */}
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={value?.address ?? ''}
          placeholder="주소 검색을 눌러주세요"
          onClick={handleAddressSearch}
          className={cn(inputBase, 'flex-1 cursor-pointer')}
        />
        <button
          type="button"
          onClick={handleAddressSearch}
          className="h-11 md:h-12 px-4 rounded-xl border border-border bg-surface text-sm font-medium text-text-secondary hover:bg-surface-alt hover:border-primary/40 transition-all duration-200 flex-shrink-0"
        >
          주소 검색
        </button>
      </div>

      {/* 상세주소 */}
      <input
        type="text"
        value={value?.addressDetail ?? ''}
        onChange={handleDetailChange}
        placeholder="상세주소를 입력하세요"
        className={inputBase}
      />
    </div>
  );
}
