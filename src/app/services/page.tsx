import Link from 'next/link';
import type { MarketplaceVertical } from '@/types';
import {
  getMarketplaceCategories,
  getMarketplaceListings,
} from '@/server/repositories/marketplace';
import { Section, SectionHeader } from '@/components/ui/section';
import { ServiceCard } from '@/components/services/service-card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const VERTICALS: { id?: MarketplaceVertical; label: string; href: string }[] = [
  { label: 'Все', href: '/services' },
  { id: 'delivery', label: 'Доставка', href: '/services?vertical=delivery' },
  { id: 'rental', label: 'Аренда', href: '/services?vertical=rental' },
  { id: 'services', label: 'Услуги', href: '/services?vertical=services' },
  { id: 'gifts', label: 'Подарки', href: '/services?vertical=gifts' },
  { id: 'catering', label: 'Кейтеринг', href: '/services?vertical=catering' },
  { id: 'transport', label: 'Транспорт', href: '/services?vertical=transport' },
  { id: 'events', label: 'События', href: '/services?vertical=events' },
  { id: 'other', label: 'Другое', href: '/services?vertical=other' },
];

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const vertical = params.vertical as MarketplaceVertical | undefined;
  const categories = getMarketplaceCategories();
  const listings = getMarketplaceListings({
    vertical,
    categorySlug: params.category,
    q: params.q,
  });

  return (
    <div className="container py-8 sm:py-10">
      <SectionHeader
        eyebrow="Маркетплейс сервисов"
        title="Доставка, аренда, услуги и подарки"
        description="Помимо бронирования столов — закажите курьера, арендуйте зал, наймите ведущего или подберите подарок."
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {VERTICALS.map((item) => {
          const active =
            (!vertical && !params.category && item.href === '/services') ||
            (vertical && item.id === vertical) ||
            (params.category && item.href.includes(params.category));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/services?category=${category.slug}`}
            className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary/30"
          >
            <span
              className={cn(
                'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                category.gradient,
              )}
            >
              <Icon name={category.icon} className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{category.name}</p>
              <p className="text-xs text-muted-foreground">{category.listingCount} предложений</p>
            </div>
          </Link>
        ))}
      </div>

      <Section className="pt-0">
        <p className="mb-4 text-sm text-muted-foreground">
          Найдено {listings.length} предложений
        </p>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ServiceCard key={listing.id} listing={listing} />
          ))}
        </div>
      </Section>
    </div>
  );
}
