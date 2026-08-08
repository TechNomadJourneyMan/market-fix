'use client';

import Link from 'next/link';
import Image from 'next/image';
import { History } from 'lucide-react';
import { useRecentStore } from '@/store/use-recent-store';
import { Section, SectionHeader, ScrollRow } from '@/components/ui/section';
import { Button } from '@/components/ui/button';

export function RecentVenues() {
  const items = useRecentStore((state) => state.items);
  const clear = useRecentStore((state) => state.clear);

  if (items.length === 0) return null;

  return (
    <Section className="pt-0">
      <SectionHeader
        eyebrow="Продолжить"
        title="Недавно смотрели"
        description="Вернитесь к местам, которые уже приметили."
        action={{ label: 'В каталог', href: '/catalog' }}
      />
      <ScrollRow>
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/venue/${item.slug}`}
            className="group w-56 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/40"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              {item.coverImage ? (
                <Image
                  src={item.coverImage}
                  alt={item.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="224px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <History className="size-8 opacity-40" />
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate font-medium leading-tight">{item.name}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{item.tagline}</p>
            </div>
          </Link>
        ))}
      </ScrollRow>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Очистить историю
        </Button>
      </div>
    </Section>
  );
}
