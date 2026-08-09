import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Star } from 'lucide-react';

import { getPersonalRecommendations } from '@/server/repositories/users';
import { getVenuesWithPromotions, getNewVenues } from '@/server/repositories/venues';
import { CATEGORY_BY_ID, CUISINE_BY_ID } from '@/data/seed/categories';
import { formatPrice } from '@/lib/format';
import { VenueCard } from '@/components/venue/venue-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Рекомендации' };

export default async function RecommendationsPage() {
  const user = await requireSessionUser();
  const personal = getPersonalRecommendations(user.id, 9);
  const promotions = getVenuesWithPromotions(3);
  const fresh = getNewVenues(3);

  const preferenceChips = [
    ...user.preferences.favoriteCategoryIds.map((id) => CATEGORY_BY_ID.get(id)?.name),
    ...user.preferences.favoriteCuisineIds.map((id) => CUISINE_BY_ID.get(id)?.name),
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Рекомендации для вас</h1>
          <p className="text-sm text-muted-foreground">
            Подобраны по истории визитов, избранному и предпочтениям профиля
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/30 p-3">
          <span className="text-xs text-muted-foreground">Учитываем:</span>
          {preferenceChips.map((chip) => (
            <Badge key={chip} variant="secondary" size="sm">
              {chip}
            </Badge>
          ))}
          <Badge variant="secondary" size="sm">
            бюджет {formatPrice(user.preferences.budgetPerPerson)}
          </Badge>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link href="/account/settings">Настроить</Link>
          </Button>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Star className="size-4 text-primary" />
          Точное попадание
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {personal.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </section>

      {promotions.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Со скидкой прямо сейчас</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {promotions.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Стоит попробовать</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {fresh.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-dashed bg-muted/30 p-5 text-center">
        <p className="flex items-center justify-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          Нужен вариант под конкретный вечер?
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Опишите повод, бюджет и компанию — AI-подбор соберёт список под задачу и объяснит
          выбор.
        </p>
        <Button asChild className="mt-3">
          <Link href="/ai">Открыть AI-подбор</Link>
        </Button>
      </div>
    </div>
  );
}
