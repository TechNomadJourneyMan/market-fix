'use client';

import * as React from 'react';
import { Flame, Leaf, Star } from 'lucide-react';
import type { Menu } from '@/types';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { Badge } from '@/components/ui/badge';

/** Меню с переключением разделов. Популярные позиции подсвечены. */
export function VenueMenu({ menu }: { menu: Menu }) {
  const [activeSection, setActiveSection] = React.useState(menu.sections[0]?.id);

  const items = menu.items.filter((item) => item.sectionId === activeSection);

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {menu.sections.map((section) => {
          const isActive = section.id === activeSection;
          const count = menu.items.filter((item) => item.sectionId === section.id).length;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'hover:border-foreground/20 hover:bg-secondary',
              )}
            >
              {section.name}
              <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <ul className="divide-y rounded-2xl border">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 p-4">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="size-20 shrink-0 rounded-xl object-cover"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                    {item.name}
                    {item.isPopular ? (
                      <Badge variant="warning" size="sm" className="gap-1">
                        <Star className="size-2.5 fill-current" /> Хит
                      </Badge>
                    ) : null}
                    {item.isVegetarian ? (
                      <Leaf className="size-3.5 text-emerald-500" aria-label="Вегетарианское" />
                    ) : null}
                    {item.isSpicy ? (
                      <Flame className="size-3.5 text-orange-500" aria-label="Острое" />
                    ) : null}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold">{formatPrice(item.price)}</p>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {item.weight ? <span>{item.weight}</span> : null}
                {item.allergens.length ? (
                  <span>Аллергены: {item.allergens.join(', ')}</span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Меню и цены могут отличаться. Актуальный состав уточняйте у заведения.
      </p>
    </div>
  );
}
