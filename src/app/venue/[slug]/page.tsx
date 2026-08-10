import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, ChevronRight, MapPin, Star, Users } from 'lucide-react';
import { ShareButton } from '@/components/venue/share-button';
import { TrackRecent } from '@/components/venue/track-recent';

import {
  getAllVenueSlugs,
  getSimilarVenues,
  getVenueBySlug,
  getVenueMenu,
  getVenueProducts,
  getVenueServices,
} from '@/server/repositories/venues';
import { getVenueReviews } from '@/server/repositories/reviews';
import { getCuisineNames } from '@/server/mappers';
import { CATEGORY_BY_ID } from '@/data/seed/categories';

import { formatPrice, formatRating, formatReviews, formatVenues } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/primitives';
import { ScrollRow } from '@/components/ui/section';
import { VenueGallery } from '@/components/venue/venue-gallery';
import { VenueServices, VenueProducts } from '@/components/venue/venue-services';
import { VenueMenu } from '@/components/venue/venue-menu';
import { VenueReviews } from '@/components/venue/venue-reviews';
import { ReviewForm } from '@/components/venue/review-form';
import {
  VenueContacts,
  VenueLocation,
  VenueWorkingHours,
} from '@/components/venue/venue-info';
import {
  VenueBookingCard,
  VenueMobileBar,
} from '@/components/venue/venue-booking-card';
import { VenueCardMini } from '@/components/venue/venue-card';
import { VenueMap } from '@/components/map/venue-map';
import { VenueOpenStatus } from '@/components/venue/venue-open-status';
import { toVenueListItem } from '@/server/mappers';

export async function generateStaticParams() {
  return getAllVenueSlugs().map((slug) => ({ slug }));
}

/**
 * Страницы заведений статические, но демо-данные привязаны к текущей дате
 * (отзывы, «сегодня открыто»). Обновляем раз в час, чтобы относительные даты
 * не устаревали после сборки.
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: 'Заведение не найдено' };

  return {
    title: `${venue.name} — ${venue.tagline}`,
    description: venue.description.slice(0, 160),
    openGraph: {
      title: venue.name,
      description: venue.tagline,
      images: [venue.coverImage],
    },
  };
}

const SECTIONS = [
  { id: 'about', label: 'О месте' },
  { id: 'services', label: 'Услуги' },
  { id: 'menu', label: 'Меню' },
  { id: 'photos', label: 'Фото' },
  { id: 'reviews', label: 'Отзывы' },
  { id: 'location', label: 'Карта и контакты' },
];

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) notFound();

  const category = CATEGORY_BY_ID.get(venue.categoryId);
  const services = getVenueServices(venue.id);
  const menu = getVenueMenu(venue.id);
  const products = getVenueProducts(venue.id);
  const reviews = getVenueReviews({ venueId: venue.id, limit: 100 });
  const similar = getSimilarVenues(venue, 8);
  const cuisines = getCuisineNames(venue.cuisineIds);

  return (
    <div className="pb-28 lg:pb-0">
      {/* ——— Hero ——— */}
      <div className="container pt-5">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Главная
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/catalog" className="transition-colors hover:text-foreground">
            Каталог
          </Link>
          <ChevronRight className="size-3" />
          {category ? (
            <>
              <Link
                href={`/catalog?category=${category.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {category.name}
              </Link>
              <ChevronRight className="size-3" />
            </>
          ) : null}
          <span className="truncate text-foreground">{venue.name}</span>
        </nav>

        <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {category ? <Badge variant="secondary">{category.name}</Badge> : null}
              {cuisines.map((cuisine) => (
                <Badge key={cuisine} variant="outline">
                  {cuisine}
                </Badge>
              ))}
              {venue.promotion ? (
                <Badge variant="promo">−{venue.promotion.discountPercent}% по акции</Badge>
              ) : null}
            </div>

            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {venue.name}
              {venue.isVerified ? (
                <BadgeCheck className="ml-2 inline size-6 text-primary" aria-label="Проверено" />
              ) : null}
            </h1>

            <p className="text-pretty text-base text-muted-foreground">{venue.tagline}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Star className="size-4 fill-amber-400 text-amber-400" strokeWidth={0} />
                {formatRating(venue.rating.score)}
                <a href="#reviews" className="font-normal text-muted-foreground hover:underline">
                  {formatReviews(venue.rating.count)}
                </a>
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" />
                {venue.location.districtName}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" />
                до {venue.capacity} гостей
              </span>
              <VenueOpenStatus workingHours={venue.workingHours} />
            </div>
          </div>

          <ShareButton
            title={venue.name}
            slug={venue.slug}
            className="hidden shrink-0 sm:inline-flex"
          />
        </header>
        <TrackRecent
          id={venue.id}
          slug={venue.slug}
          name={venue.name}
          coverImage={venue.photos[0]?.url ?? ''}
          tagline={venue.tagline}
        />
      </div>

      {/* ——— Галерея ——— */}
      <div className="container mt-5">
        <VenueGallery photos={venue.photos} venueName={venue.name} />
      </div>

      {/* ——— Быстрая навигация ——— */}
      <div className="sticky top-16 z-20 mt-6 border-y glass-strong sm:top-[72px]">
        <div className="container">
          <nav className="no-scrollbar flex gap-1 overflow-x-auto py-2">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        {/* ——— Основная колонка ——— */}
        <div className="min-w-0 space-y-12">
          <section id="about" className="scroll-mt-32 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">О заведении</h2>
            <p className="whitespace-pre-line text-pretty leading-relaxed text-muted-foreground">
              {venue.description}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {venue.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>

            <dl className="grid gap-3 pt-2 sm:grid-cols-3">
              <InfoTile
                label="Средний чек"
                value={formatPrice(venue.averagePrice)}
                hint="на одного гостя"
              />
              <InfoTile
                label="Вместимость"
                value={`${venue.capacity} гостей`}
                hint={`${venue.tables.length} столов`}
              />
              <InfoTile
                label="Броней за месяц"
                value={String(venue.stats.bookings30d)}
                hint="через платформу"
              />
            </dl>
          </section>

          <Separator />

          <section id="services" className="scroll-mt-32 space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Услуги</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Всё, что заведение может организовать помимо обычного ужина.
              </p>
            </div>
            <VenueServices services={services} />
          </section>

          {products.length > 0 ? (
            <>
              <Separator />
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Товары</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Сертификаты, наборы и депозиты — можно купить заранее.
                  </p>
                </div>
                <VenueProducts products={products} />
              </section>
            </>
          ) : null}

          {menu && menu.items.length > 0 ? (
            <>
              <Separator />
              <section id="menu" className="scroll-mt-32 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Меню и цены</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {menu.items.length} позиций в {menu.sections.length} разделах
                  </p>
                </div>
                <VenueMenu menu={menu} />
              </section>
            </>
          ) : null}

          <Separator />

          <section id="photos" className="scroll-mt-32 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Фотографии</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {venue.photos.map((photo) => (
                <div key={photo.id} className="aspect-square overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section id="reviews" className="scroll-mt-32 space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Отзывы гостей</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Только от тех, кто действительно был. Заведение отвечает на отзывы.
              </p>
            </div>
            <ReviewForm venueId={venue.id} />
            <VenueReviews rating={venue.rating} reviews={reviews.items} />
          </section>

          <Separator />

          <section id="location" className="scroll-mt-32 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Как добраться</h2>
            <VenueLocation venue={venue} />
            <VenueMap
              venues={[toVenueListItem(venue)]}
              className="h-[320px]"
              compact
              showLocateControl={false}
            />

            <div className="grid gap-6 pt-2 sm:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Часы работы</h3>
                <VenueWorkingHours venue={venue} />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Контакты</h3>
                <VenueContacts venue={venue} />
              </div>
            </div>
          </section>
        </div>

        {/* ——— Боковая колонка ——— */}
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <VenueBookingCard venue={venue} categoryName={category?.name ?? ''} />
          </div>
        </aside>
      </div>

      {/* ——— Похожие ——— */}
      {similar.length > 0 ? (
        <section className="container mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Похожие места рядом
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Если это не подойдёт — посмотрите ещё {formatVenues(similar.length)}
              </p>
            </div>
            <Link
              href={`/catalog?category=${category?.slug ?? ''}`}
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Все похожие →
            </Link>
          </div>
          <ScrollRow>
            {similar.map((item) => (
              <VenueCardMini key={item.id} venue={item} />
            ))}
          </ScrollRow>
        </section>
      ) : null}

      <VenueMobileBar venue={venue} categoryName={category?.name ?? ''} />
    </div>
  );
}

function InfoTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tracking-tight">{value}</dd>
      <dd className="text-xs text-muted-foreground">{hint}</dd>
    </div>
  );
}
