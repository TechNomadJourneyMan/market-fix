'use client';

import Link from 'next/link';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { Icon } from '@/components/ui/icon';
import { Stagger, StaggerItem } from '@/components/ui/motion';

/** Плитки категорий — основной способ начать поиск без ввода текста. */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  const t = useT('common');

  return (
    <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((category, index) => (
        <StaggerItem key={category.id}>
          <Link
            href={`/catalog?category=${category.slug}`}
            className={cn(
              'group relative flex h-full overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-300',
              'hover:-translate-y-1 hover:border-primary/20 hover:shadow-lift',
              index < 2 && 'sm:col-span-1',
            )}
          >
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06]',
                category.gradient,
              )}
            />

            <div className="relative flex h-full flex-col gap-3">
              <span
                className={cn(
                  'flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft transition-all duration-300 group-hover:scale-105 group-hover:shadow-card',
                  category.gradient,
                )}
              >
                <Icon name={category.icon} className="size-5" />
              </span>

              <div className="mt-auto min-w-0">
                <p className="text-sm font-semibold leading-snug tracking-tight">
                  {category.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('counts.venues', { count: category.venueCount })}
                </p>
              </div>
            </div>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
