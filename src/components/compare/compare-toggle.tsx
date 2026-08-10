'use client';

import { Check, GitCompareArrows } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompareStore, MAX_COMPARE_VENUES } from '@/store/use-compare-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CompareToggle({
  venueId,
  venueName,
  className,
}: {
  venueId: string;
  venueName?: string;
  className?: string;
}) {
  const ids = useCompareStore((state) => state.ids);
  const toggle = useCompareStore((state) => state.toggle);
  const selected = ids.includes(venueId);

  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? 'default' : 'outline'}
      className={cn('gap-1.5', className)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!selected && ids.length >= MAX_COMPARE_VENUES) {
          toast.message('Можно сравнить до 4 заведений — самое старое заменится');
        }
        toggle(venueId);
        toast.success(
          selected
            ? `${venueName ?? 'Заведение'} убрано из сравнения`
            : `${venueName ?? 'Заведение'} добавлено к сравнению`,
        );
      }}
    >
      {selected ? <Check className="size-3.5" /> : <GitCompareArrows className="size-3.5" />}
      {selected ? 'В сравнении' : 'Сравнить'}
    </Button>
  );
}
