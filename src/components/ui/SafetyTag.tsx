import { cn } from '@/lib/cn';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import type { CustomerTag } from '@/types/customer';

interface SafetyTagProps {
  tag: Pick<CustomerTag, 'category' | 'value'>;
  size?: 'xs' | 'sm' | 'md';
  showLevel?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<SafetyTagProps['size']>, string> = {
  xs: 'px-1.5 py-0.5 text-[9px] gap-1',
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-3 py-1 text-xs gap-1.5',
};

export function SafetyTag({
  tag,
  size = 'sm',
  showLevel = false,
  className,
}: SafetyTagProps): React.ReactElement {
  const meta = getSafetyTagMeta(tag);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        SIZE_CLASSES[size],
        meta.className,
        className,
      )}
    >
      <span>{tag.value}</span>
      {showLevel && (
        <span className="opacity-70">{meta.label}</span>
      )}
    </span>
  );
}

export default SafetyTag;
