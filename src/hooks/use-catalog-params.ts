'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { VenueQuery } from '@/types';
import { serializeVenueQuery } from '@/lib/query-params';

export type CatalogView = 'list' | 'map';

/**
 * Состояние каталога живёт в URL, а разбирает его сервер и передаёт вниз пропсами.
 *
 * Важно: намеренно не используем useSearchParams(). Этот хук переводит компонент
 * в client-side rendering до ближайшей Suspense-границы, из-за чего страница
 * каталога зависала бы на скелетоне. Читаем состояние из пропсов, а на клиенте
 * только строим новый URL и переходим.
 */
export function useCatalogParams(query: VenueQuery, view: CatalogView = 'list') {
  const router = useRouter();
  const pathname = usePathname();

  const buildHref = React.useCallback(
    (next: VenueQuery, nextView: CatalogView) => {
      const params = new URLSearchParams(serializeVenueQuery(next));
      if (nextView === 'map') params.set('view', 'map');
      const search = params.toString();
      return search ? `${pathname}?${search}` : pathname;
    },
    [pathname],
  );

  const apply = React.useCallback(
    (next: VenueQuery, options?: { keepPage?: boolean }) => {
      const merged: VenueQuery = { ...next };
      // Любое изменение фильтра возвращает на первую страницу.
      if (!options?.keepPage) merged.page = 1;
      router.push(buildHref(merged, view), { scroll: false });
    },
    [router, buildHref, view],
  );

  const patch = React.useCallback(
    (partial: Partial<VenueQuery>, options?: { keepPage?: boolean }) => {
      apply({ ...query, ...partial }, options);
    },
    [apply, query],
  );

  const toggleInList = React.useCallback(
    (key: 'categoryIds' | 'cuisineIds' | 'districtIds' | 'amenities', value: string) => {
      const current = (query[key] as string[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      patch({ [key]: next.length ? next : undefined } as Partial<VenueQuery>);
    },
    [query, patch],
  );

  const setView = React.useCallback(
    (nextView: CatalogView) => {
      router.push(buildHref(query, nextView), { scroll: false });
    },
    [router, buildHref, query],
  );

  const reset = React.useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return { query, view, apply, patch, toggleInList, setView, reset, buildHref };
}
