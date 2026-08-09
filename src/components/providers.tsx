'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useFavoritesStore } from '@/store/use-favorites-store';
import { I18nProvider } from '@/i18n/client';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/translate';

/** Гидратация клиентских сторов данными, посчитанными на сервере. */
function StoreHydration({ favoriteVenueIds }: { favoriteVenueIds: string[] }) {
  const hydrate = useFavoritesStore((state) => state.hydrate);

  React.useEffect(() => {
    hydrate(favoriteVenueIds);
  }, [favoriteVenueIds, hydrate]);

  return null;
}

export function Providers({
  children,
  favoriteVenueIds = [],
  locale = DEFAULT_LOCALE,
  dictionary = {},
}: {
  children: React.ReactNode;
  favoriteVenueIds?: string[];
  locale?: Locale;
  dictionary?: Dictionary;
}) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Демо-данные детерминированы — агрессивно кэшируем и не дёргаем при фокусе.
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale={locale} dictionary={dictionary}>
        <StoreHydration favoriteVenueIds={favoriteVenueIds} />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              'rounded-2xl border bg-background text-foreground shadow-lift text-sm',
          }}
        />
      </I18nProvider>
    </QueryClientProvider>
  );
}
