import Link from 'next/link';
import type { MarketplaceCategory, MarketplaceListing } from '@/types';
import { Section, SectionHeader } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ServiceCard } from '@/components/services/service-card';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function ServicesShowcase({
  categories,
  listings,
}: {
  categories: MarketplaceCategory[];
  listings: (MarketplaceListing & { distanceKm?: number })[];
}) {
  return (
    <Section className="pt-0">
      <SectionHeader
        eyebrow="Сервисы"
        title="Не только бронь — доставка, аренда, подарки"
        description="Соберите вечер целиком: стол, трансфер, декор, кейтеринг и подарок — в одном месте."
        action={{ label: 'Все сервисы', href: '/services' }}
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/services?category=${category.slug}`}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium transition-colors',
              'hover:border-primary/30 hover:bg-secondary',
            )}
          >
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br text-white',
                category.gradient,
              )}
            >
              <Icon name={category.icon} className="size-4" />
            </span>
            {category.name}
            <span className="text-xs text-muted-foreground">{category.listingCount}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {listings.slice(0, 4).map((listing) => (
          <ServiceCard key={listing.id} listing={listing} />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/services">
            Смотреть все сервисы
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
