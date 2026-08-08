'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { VenueQuery } from '@/types';
import { cn } from '@/lib/utils';
import { useCatalogParams } from '@/hooks/use-catalog-params';

interface PaginationProps {
  query: VenueQuery;
  page: number;
  totalPages: number;
}

export function Pagination({ query, page, totalPages }: PaginationProps) {
  const { patch } = useCatalogParams(query);

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
    <nav className="flex items-center justify-center gap-1.5 pt-8" aria-label="Страницы">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="flex size-9 items-center justify-center rounded-xl border transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        aria-label="Предыдущая страница"
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
        aria-label="Следующая страница"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
