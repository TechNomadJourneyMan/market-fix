'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GitCompareArrows, X } from 'lucide-react';
import { useCompareStore } from '@/store/use-compare-store';
import { Button } from '@/components/ui/button';

export function CompareBar() {
  const pathname = usePathname();
  const ids = useCompareStore((state) => state.ids);
  const clear = useCompareStore((state) => state.clear);

  if (ids.length < 1) return null;
  if (pathname?.startsWith('/compare')) return null;

  return (
    <div className="fixed inset-x-0 bottom-[4.5rem] z-40 px-3 lg:bottom-6">
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border bg-card/95 p-3 shadow-lift backdrop-blur">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GitCompareArrows className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Сравнение · {ids.length}/4</p>
          <p className="text-xs text-muted-foreground">
            {ids.length < 2 ? 'Выберите ещё одно заведение' : 'Похожее и отличия — на странице сравнения'}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={clear} aria-label="Очистить">
          <X className="size-4" />
        </Button>
        {ids.length < 2 ? (
          <Button size="sm" disabled>
            Сравнить
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href={`/compare?ids=${ids.join(',')}`}>Сравнить</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
