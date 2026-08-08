import type { Metadata } from 'next';
import { Plus, UtensilsCrossed } from 'lucide-react';

import {
  getBusinessMenus,
  getBusinessServices,
  getBusinessVenues,
  getCurrentBusiness,
} from '@/server/repositories/business';
import { formatPrice } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Меню и услуги' };

export default function BusinessMenuPage() {
  const business = getCurrentBusiness();
  const venues = getBusinessVenues(business.id);
  const menus = getBusinessMenus(business.id);
  const services = getBusinessServices(business.id);

  const venueById = new Map(venues.map((venue) => [venue.id, venue]));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Меню и услуги</h1>
          <p className="text-sm text-muted-foreground">
            Позиции, которые видят гости на страницах ваших заведений
          </p>
        </div>
        <Button size="sm">
          <Plus />
          Добавить позицию
        </Button>
      </header>

      <Tabs defaultValue="menu" className="space-y-5">
        <TabsList>
          <TabsTrigger value="menu">Меню</TabsTrigger>
          <TabsTrigger value="services">Услуги</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-6">
          {menus.length === 0 ? (
            <EmptyState
              icon={<UtensilsCrossed />}
              title="Меню ещё не заполнено"
              description="Гости чаще бронируют места с опубликованным меню — добавьте хотя бы основные позиции."
              action={{ label: 'Добавить позицию' }}
            />
          ) : (
            menus.map((menu) => {
              const venue = venueById.get(menu.venueId);
              if (!venue) return null;

              return (
                <section key={menu.venueId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{venue.name}</h2>
                    <Badge variant="secondary" size="sm">
                      {menu.items.length} позиций
                    </Badge>
                  </div>

                  <div className="overflow-hidden rounded-2xl border">
                    {menu.sections.map((section) => {
                      const items = menu.items.filter(
                        (item) => item.sectionId === section.id,
                      );
                      if (items.length === 0) return null;

                      return (
                        <div key={section.id}>
                          <p className="border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                            {section.name}
                          </p>
                          <ul className="divide-y">
                            {items.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="flex items-center gap-2 text-sm font-medium">
                                    {item.name}
                                    {item.isPopular ? (
                                      <Badge variant="warning" size="sm">
                                        Хит
                                      </Badge>
                                    ) : null}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {item.description}
                                  </p>
                                </div>
                                <span className="shrink-0 text-sm font-semibold">
                                  {formatPrice(item.price)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {venues.map((venue) => {
            const venueServices = services.filter((service) => service.venueId === venue.id);
            if (venueServices.length === 0) return null;

            return (
              <section key={venue.id} className="space-y-3">
                <h2 className="text-base font-semibold">{venue.name}</h2>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {venueServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex gap-3 rounded-2xl border p-3.5 transition-shadow hover:shadow-card"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                        <Icon name={service.icon} className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{service.name}</p>
                          {service.priceFrom !== null ? (
                            <span className="shrink-0 text-xs font-semibold">
                              от {formatPrice(service.priceFrom)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {service.description}
                        </p>
                        {!service.isAvailable ? (
                          <Badge variant="secondary" size="sm" className="mt-1.5">
                            Недоступно
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
