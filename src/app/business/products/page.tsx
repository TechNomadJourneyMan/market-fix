import type { Metadata } from 'next';
import { Package, Plus } from 'lucide-react';

import {
  getBusinessProducts,
  getBusinessVenues,
  getCurrentBusiness,
} from '@/server/repositories/business';
import { formatPrice } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Товары' };

const KIND_LABELS: Record<string, string> = {
  certificate: 'Сертификат',
  merch: 'Мерч',
  set: 'Набор',
  deposit: 'Депозит',
};

export default function BusinessProductsPage() {
  const business = getCurrentBusiness();
  const venues = getBusinessVenues(business.id);
  const products = getBusinessProducts(business.id);
  const venueById = new Map(venues.map((venue) => [venue.id, venue]));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Товары</h1>
          <p className="text-sm text-muted-foreground">
            Сертификаты, наборы и депозиты — дополнительный доход между визитами
          </p>
        </div>
        <Button size="sm">
          <Plus />
          Добавить товар
        </Button>
      </header>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="Товаров пока нет"
          description="Подарочные сертификаты приносят до 15% выручки в декабре. Добавьте первый товар."
          action={{ label: 'Добавить товар' }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <ul className="divide-y">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex items-center gap-3 p-3.5 transition-colors hover:bg-secondary/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="size-14 shrink-0 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {product.name}
                    <Badge variant="secondary" size="sm">
                      {KIND_LABELS[product.kind]}
                    </Badge>
                    {product.isPopular ? (
                      <Badge variant="warning" size="sm">
                        Популярное
                      </Badge>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {venueById.get(product.venueId)?.name} · {product.description}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.inStock ? `в наличии: ${product.stockCount}` : 'нет в наличии'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
