import Link from 'next/link';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';
import { formatVenues } from '@/lib/format';
import { Icon } from '@/components/ui/icon';

/** Плитки категорий — основной способ начать поиск без ввода текста. */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/catalog?category=${category.slug}`}
          className={cn(
            'group relative overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-300',
            'hover:-translate-y-1 hover:border-foreground/10 hover:shadow-lift',
            // Первые две плитки крупнее — задают визуальный ритм сетке.
            index < 2 && 'sm:col-span-1',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-[0.07]',
              category.gradient,
            )}
          />

          <div className="relative flex h-full flex-col gap-3">
            <span
              className={cn(
                'flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft transition-transform duration-300 group-hover:scale-110',
                category.gradient,
              )}
            >
              <Icon name={category.icon} className="size-5" />
            </span>

            <div className="mt-auto">
              <p className="text-sm font-semibold tracking-tight">{category.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatVenues(category.venueCount)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
