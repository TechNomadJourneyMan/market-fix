import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Clock, MapPin, Star } from 'lucide-react';
import {
  getAllMarketplaceSlugs,
  getMarketplaceListingBySlug,
  getMarketplaceCategories,
} from '@/server/repositories/marketplace';
import { formatRating } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ServiceOrderForm } from '@/components/services/service-order-form';

export function generateStaticParams() {
  return getAllMarketplaceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = getMarketplaceListingBySlug(slug);
  if (!listing) return { title: 'Сервис' };
  return {
    title: `${listing.name} · Market Fix`,
    description: listing.tagline,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = getMarketplaceListingBySlug(slug);
  if (!listing) notFound();

  const category = getMarketplaceCategories().find((item) => item.id === listing.categoryId);

  return (
    <div className="container py-8 sm:py-10">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/services" className="hover:text-foreground">
          Сервисы
        </Link>
        <span>/</span>
        {category ? (
          <Link
            href={`/services?category=${category.slug}`}
            className="hover:text-foreground"
          >
            {category.name}
          </Link>
        ) : null}
        <span>/</span>
        <span className="text-foreground">{listing.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border bg-muted">
            <Image
              src={listing.coverImage}
              alt={listing.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{category?.name ?? listing.vertical}</Badge>
              {listing.isVerified ? (
                <Badge variant="secondary" className="gap-1">
                  <BadgeCheck className="size-3.5" />
                  Проверенный поставщик
                </Badge>
              ) : null}
              {listing.isPopular ? <Badge variant="secondary">Популярное</Badge> : null}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {listing.name}
            </h1>
            <p className="text-lg text-muted-foreground">{listing.tagline}</p>

            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Star className="size-4 fill-amber-400 text-amber-400" strokeWidth={0} />
                {formatRating(listing.rating.score)}
                <span className="font-normal text-muted-foreground">
                  ({listing.rating.count} отзывов)
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" />
                {listing.location.districtName} · {listing.location.address}
              </span>
              {listing.deliveryEtaMinutes ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-4" />~{listing.deliveryEtaMinutes} мин
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">О сервисе</h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
            <p className="text-sm text-muted-foreground">
              Поставщик: <span className="font-medium text-foreground">{listing.providerName}</span>
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Что включено</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {listing.features.map((feature) => (
                <li
                  key={feature}
                  className="rounded-xl border bg-card px-3 py-2.5 text-sm"
                >
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {listing.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <Button asChild variant="outline">
            <Link href="/services">← Все сервисы</Link>
          </Button>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <ServiceOrderForm listing={listing} />
        </div>
      </div>
    </div>
  );
}
