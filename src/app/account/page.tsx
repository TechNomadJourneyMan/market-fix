import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  Coins,
  Heart,
  MessageSquare,
  Sparkles,
  Wallet,
} from 'lucide-react';

import {
  getCurrentUser,
  getFavoriteVenues,
  getPersonalRecommendations,
  getUserStats,
} from '@/server/repositories/users';
import { getUserBookings } from '@/server/repositories/bookings';
import { getAIAdvice } from '@/server/ai/advice';
import { CUISINE_BY_ID, CATEGORY_BY_ID } from '@/data/seed/categories';
import { DISTRICT_BY_ID } from '@/data/seed/geo';
import { formatPrice, formatNumber } from '@/lib/format';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollRow } from '@/components/ui/section';
import { EmptyState } from '@/components/ui/empty-state';
import { VenueCardMini } from '@/components/venue/venue-card';
import { BookingCard } from '@/components/account/booking-card';

export default function AccountOverviewPage() {
  const user = getCurrentUser();
  const stats = getUserStats(user.id);
  const bookings = getUserBookings(user.id);
  const favorites = getFavoriteVenues(user.id).slice(0, 6);
  const recommendations = getPersonalRecommendations(user.id, 6);
  const advice = getAIAdvice(user.id).slice(0, 2);

  return (
    <div className="space-y-8">
      {/* ——— Метрики ——— */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={CalendarCheck}
          value={String(stats.upcomingBookings)}
          label="предстоящих визитов"
        />
        <StatTile icon={Heart} value={String(stats.favorites)} label="в избранном" />
        <StatTile
          icon={MessageSquare}
          value={String(stats.reviews)}
          label="оставлено отзывов"
        />
        <StatTile
          icon={Wallet}
          value={formatPrice(stats.savedAmount)}
          label="сэкономлено на акциях"
        />
      </section>

      {/* ——— Ближайшие брони ——— */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Ближайшие визиты</h2>
            <p className="text-sm text-muted-foreground">
              Подтверждённые брони — не пропустите
            </p>
          </div>
          <Link
            href="/account/bookings"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Все брони →
          </Link>
        </div>

        {bookings.upcoming.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck />}
            title="Пока ничего не запланировано"
            description="Выберите место — и вечер перестанет быть вопросом. Бронь занимает 30 секунд."
            action={{ label: 'Найти заведение', href: '/catalog' }}
            secondaryAction={{ label: 'Подобрать с AI', href: '/ai' }}
            compact
          />
        ) : (
          <div className="space-y-3">
            {bookings.upcoming.slice(0, 2).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      {/* ——— AI-советы ——— */}
      {advice.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Sparkles className="size-4 text-primary" />
                Персональные советы
              </h2>
              <p className="text-sm text-muted-foreground">
                Собраны из вашей истории визитов и предпочтений
              </p>
            </div>
            <Link
              href="/account/ai"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Все советы →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {advice.map((item) => (
              <div key={item.id} className="rounded-2xl border bg-card p-4">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
                {item.actionHref ? (
                  <Button asChild variant="ghost" size="sm" className="mt-2 -ml-2">
                    <Link href={item.actionHref}>
                      {item.actionLabel}
                      <ArrowRight />
                    </Link>
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ——— Рекомендации ——— */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Вам может понравиться</h2>
            <p className="text-sm text-muted-foreground">
              На основе ваших визитов и вкусов в профиле
            </p>
          </div>
          <Link
            href="/account/recommendations"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Показать все →
          </Link>
        </div>
        <ScrollRow>
          {recommendations.map((venue) => (
            <VenueCardMini key={venue.id} venue={venue} />
          ))}
        </ScrollRow>
      </section>

      {/* ——— Избранное ——— */}
      {favorites.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Избранное</h2>
            <Link
              href="/account/favorites"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Все {favorites.length} →
            </Link>
          </div>
          <ScrollRow>
            {favorites.map((venue) => (
              <VenueCardMini key={venue.id} venue={venue} />
            ))}
          </ScrollRow>
        </section>
      ) : null}

      {/* ——— Предпочтения ——— */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Ваши предпочтения</h2>
            <p className="text-sm text-muted-foreground">
              Мы учитываем их в рекомендациях и AI-подборе
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/account/settings">Изменить</Link>
          </Button>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <PreferenceRow
            label="Любимые категории"
            values={user.preferences.favoriteCategoryIds.map(
              (id) => CATEGORY_BY_ID.get(id)?.name ?? '',
            )}
          />
          <PreferenceRow
            label="Любимые кухни"
            values={user.preferences.favoriteCuisineIds.map(
              (id) => CUISINE_BY_ID.get(id)?.name ?? '',
            )}
          />
          <PreferenceRow
            label="Предпочитаемые районы"
            values={user.preferences.preferredDistrictIds.map(
              (id) => DISTRICT_BY_ID.get(id)?.name ?? '',
            )}
          />
          <div>
            <dt className="text-xs text-muted-foreground">Комфортный бюджет</dt>
            <dd className="mt-1.5 flex items-center gap-2 text-sm font-medium">
              <Coins className="size-4 text-muted-foreground" />
              {formatPrice(user.preferences.budgetPerPerson)} на человека · обычно{' '}
              {formatNumber(user.preferences.typicalPartySize)} чел.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function PreferenceRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5">
        {values.filter(Boolean).length === 0 ? (
          <span className="text-sm text-muted-foreground">не указано</span>
        ) : (
          values.filter(Boolean).map((value) => (
            <Badge key={value} variant="secondary">
              {value}
            </Badge>
          ))
        )}
      </dd>
    </div>
  );
}
