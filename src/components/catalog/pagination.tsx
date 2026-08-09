'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { VenueQuery } from '@/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { useCatalogParams } from '@/hooks/use-catalog-params';

interface PaginationProps {
  query: VenueQuery;
  page: number;
  totalPages: number;
}

export function Pagination({ query, page, totalPages }: PaginationProps) {
  const { patch } = useCatalogParams(query);
  const t = useT('catalog');

  if (totalPages <= 1) return null;

  const goTo = (nextPage: number) => {
    patch({ page: nextPage }, { keepPage: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Показываем первую, последнюю, текущую и соседние; остальное — многоточием.
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1,
  );

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5 pt-8"
      aria-label={t('pagination.label')}
    >
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="flex size-9 items-center justify-center rounded-xl border transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        aria-label={t('pagination.previous')}
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((item, index) => {
        const previous = pages[index - 1];
        const showGap = previous !== undefined && item - previous > 1;

        return (
          <span key={item} className="flex items-center gap-1.5">
            {showGap ? <span className="px-1 text-muted-foreground">…</span> : null}
            <button
              type="button"
              onClick={() => goTo(item)}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'flex size-9 items-center justify-center rounded-xl border text-sm font-medium transition-colors',
                item === page
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-secondary',
              )}
            >
              {item}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="flex size-9 items-center justify-center rounded-xl border transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        aria-label={t('pagination.next')}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
