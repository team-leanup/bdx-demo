import { cn } from '@/lib/cn';
import { getCustomerTagChipClasses } from '@/lib/customer-tags';
import type { CustomerTag } from '@/types/customer';
import { TagIconSvg } from '@/components/ui/TagIconSvg';

interface CustomerTagChipProps {
  tag: Pick<CustomerTag, 'accent' | 'category' | 'value'>;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showPin?: boolean;
  icon?: string;
}

const SIZE_CLASSES: Record<NonNullable<CustomerTagChipProps['size']>, string> = {
  xs: 'px-1.5 py-0.5 text-[9px]',
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1.5 text-sm',
};

export function CustomerTagChip({
  tag,
  size = 'sm',
  className,
  showPin = false,
  icon,
}: CustomerTagChipProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        SIZE_CLASSES[size],
        getCustomerTagChipClasses(tag),
        className,
      )}
    >
      {showPin && <span className="text-[10px]">📌</span>}
      {icon && <TagIconSvg icon={icon} className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{tag.value}</span>
    </span>
  );
}
