'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

interface InstagramHashtagsProps {
  tags?: string[];
  colorLabels?: string[];
  serviceType?: string;
  designType?: string;
  price?: number;
  className?: string;
}

function toHashtag(value: string): string {
  return '#' + value.replace(/[\s/+,.·#]+/g, '').replace(/[^\w가-힣]/g, '');
}

export function InstagramHashtags({
  tags,
  colorLabels,
  serviceType,
  designType,
  price,
  className,
}: InstagramHashtagsProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const hashtags = useMemo(() => {
    const parts: string[] = ['#네일', '#젤네일', '#네일아트'];
    if (serviceType) parts.push(toHashtag(serviceType));
    if (designType) parts.push(toHashtag(designType));
    if (tags) tags.forEach((t) => parts.push(toHashtag(t)));
    if (colorLabels) colorLabels.forEach((c) => parts.push(toHashtag(c)));
    if (price != null) {
      if (price < 70000) parts.push('#7만원이하네일');
      else if (price < 90000) parts.push('#8만원대네일');
      else parts.push('#9만원이상네일');
    }
    parts.push('#BDX', '#네일샵', '#젤네일추천');
    // 중복 제거
    return [...new Set(parts)].filter((h) => h.length > 1);
  }, [tags, colorLabels, serviceType, designType, price]);

  const hashtagText = hashtags.join(' ');

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(hashtagText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
    }
  };

  return (
    <div className={cn('flex flex-col gap-3 p-4', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary">인스타 해시태그</p>
        <Button
          variant={copied ? 'primary' : 'secondary'}
          size="sm"
          onClick={handleCopy}
        >
          {copied ? '✓ 복사됨' : '복사하기'}
        </Button>
      </div>
      <div className="rounded-xl bg-surface-alt p-3">
        <p className="text-xs text-text-secondary leading-relaxed break-all select-all">
          {hashtagText}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {hashtags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default InstagramHashtags;
