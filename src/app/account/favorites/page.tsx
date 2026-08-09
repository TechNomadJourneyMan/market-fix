import type { Metadata } from 'next';
import { Heart, StickyNote } from 'lucide-react';

import { getFavoriteVenues } from '@/server/repositories/users';
import { formatVenues } from '@/lib/format';
import { VenueCard } from '@/components/venue/venue-card';
import { EmptyState } from '@/components/ui/empty-state';
import { requireSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Избранное' };

export default async function FavoritesPage() {
  const user = await requireSessionUser();
  const favorites = getFavoriteVenues(user.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Избранное</h1>
        <p className="text-sm text-muted-foreground">
          {favorites.length > 0
            ? `${formatVenues(favorites.length)} — сохранены, чтобы не искать заново`
            : 'Сохраняйте места, чтобы вернуться к ним позже'}
        </p>
      </header>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="В избранном пока пусто"
          description="Нажимайте на сердечко на карточке — место сохранится здесь. Так удобно собирать шорт-лист перед важным вечером."
          action={{ label: 'Смотреть каталог', href: '/catalog' }}
          secondaryAction={{ label: 'Подобрать с AI', href: '/ai' }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map((venue) => (
            <div key={venue.id} className="space-y-2">
              <VenueCard venue={venue} />
              {venue.note ? (
                <p className="flex items-start gap-1.5 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <StickyNote className="mt-0.5 size-3 shrink-0" />
                  {venue.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
