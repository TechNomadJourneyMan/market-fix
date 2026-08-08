import type { Product, Service } from '@/types';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

const GROUP_LABELS: Record<string, string> = {
  dining: 'Кухня и стол',
  events: 'Мероприятия',
  delivery: 'Доставка',
  entertainment: 'Развлечения',
  comfort: 'Комфорт',
};

/** Блок «Услуги» из ТЗ: меню, товары, банкет, кейтеринг, доставка, VIP, музыка и т.д. */
export function VenueServices({ services }: { services: Service[] }) {
  const groups = services.reduce<Record<string, Service[]>>((acc, service) => {
    (acc[service.group] ||= []).push(service);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {GROUP_LABELS[group] ?? group}
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {items.map((service) => (
              <div
                key={service.id}
                className={cn(
                  'flex gap-3 rounded-2xl border p-3.5 transition-shadow hover:shadow-card',
                  service.isHighlighted && 'border-primary/25 bg-primary/[0.03]',
                  !service.isAvailable && 'opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    service.isHighlighted
                      ? 'brand-gradient text-white'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  <Icon name={service.icon} className="size-[18px]" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{service.name}</p>
                    {service.priceFrom !== null ? (
                      <p className="shrink-0 text-right text-xs">
                        <span className="font-semibold">от {formatPrice(service.priceFrom)}</span>
                        {service.priceUnit ? (
                          <span className="block text-[10px] text-muted-foreground">
                            {service.priceUnit}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  {!service.isAvailable ? (
                    <Badge variant="secondary" size="sm" className="mt-1.5">
                      Временно недоступно
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Товары заведения: сертификаты, наборы, мерч, депозиты. */
export function VenueProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="group flex flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-card"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {product.oldPrice ? (
              <Badge variant="promo" className="absolute left-2.5 top-2.5">
                −{Math.round((1 - product.price / product.oldPrice) * 100)}%
              </Badge>
            ) : null}
            {!product.inStock ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <Badge variant="secondary">Нет в наличии</Badge>
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-1.5 p-3.5">
            <p className="text-sm font-medium">{product.name}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
            <div className="mt-auto flex items-baseline gap-2 pt-2">
              <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
              {product.oldPrice ? (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
