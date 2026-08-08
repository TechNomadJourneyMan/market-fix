'use client';

import type { VenueQuery } from '@/types';
import { QUICK_FILTERS } from '@/types';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { useCatalogParams } from '@/hooks/use-catalog-params';

/** Быстрые фильтры-чипы из ТЗ: свободно сейчас, сегодня открыто, акции, банкет, с животными. */
export function QuickFilters({
  query,
  className,
}: {
  query: VenueQuery;
  className?: string;
}) {
  const { patch } = useCatalogParams(query);

  return (
    <div className={cn('no-scrollbar flex gap-2 overflow-x-auto', className)}>
      {QUICK_FILTERS.map((filter) => {
        const isActive = Boolean(query[filter.key]);
        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => patch({ [filter.key]: isActive ? undefined : true })}
            aria-pressed={isActive}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
              isActive
                ? 'border-primary bg-primary/10 text-primary shadow-soft'
                : 'bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground',
            )}
          >
            <Icon name={filter.icon} className="size-3.5" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
