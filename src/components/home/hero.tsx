'use client';

import Link from 'next/link';
import { ArrowRight, BadgePercent, Bike, KeyRound, PartyPopper, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/format';
import { SearchBar } from '@/components/search/search-bar';
import { Button } from '@/components/ui/button';
import { FadeUp } from '@/components/ui/motion';

interface HeroProps {
  venueCount: number;
  reviewCount: number;
  categoryCount: number;
}

/** Один primary job: поиск. Остальное — лёгкие сценарии, не конкурирующие XL-кнопки. */
const QUICK_LINKS = [
  { label: 'Свободно сейчас', href: '/catalog?availableNow=1', icon: Zap },
  { label: 'Банкет и той', href: '/catalog?banquet=1', icon: PartyPopper },
  { label: 'Доставка', href: '/services?vertical=delivery', icon: Bike },
  { label: 'Аренда', href: '/services?vertical=rental', icon: KeyRound },
  { label: 'Со скидкой', href: '/catalog?promo=1', icon: BadgePercent },
];

export function Hero({ venueCount, reviewCount, categoryCount }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-noise opacity-40" />
        <div className="absolute -left-32 top-0 size-[28rem] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -right-24 top-24 size-[22rem] rounded-full bg-accent/8 blur-[90px]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container pb-12 pt-14 sm:pb-16 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Market Fix · Алматы
            </p>
          </FadeUp>

          <FadeUp delay={0.05}>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Бронь, аренда и доставка —{' '}
              <span className="text-primary">в одном месте</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Найдите заведение, закажите доставку или арендуйте зал. Живые отзывы, честные цены,
              без звонков.
            </p>
          </FadeUp>

          <FadeUp delay={0.15} className="mx-auto mt-8 max-w-2xl">
            <SearchBar placeholder="Ресторан, доставка, аренда зала, подарок…" />
            <p className="mt-2.5 text-xs text-muted-foreground">
              Начните с поиска — или откройте{' '}
              <Link href="#city-map" className="font-medium text-foreground underline-offset-2 hover:underline">
                карту города
              </Link>
              .
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {QUICK_LINKS.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.04, duration: 0.35 }}
                >
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3.5 py-2 text-xs font-medium shadow-soft backdrop-blur transition-all hover:border-primary/25 hover:shadow-card"
                  >
                    <link.icon className="size-3.5 text-primary" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.25}>
            <div className="mt-8 flex justify-center">
              <Button asChild size="xl" className="w-full sm:w-auto">
                <Link href="/catalog">
                  Смотреть каталог
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Нужен сценарий?{' '}
              <Link href="/ai" className="font-medium text-foreground underline-offset-2 hover:underline">
                AI-подбор
              </Link>
              {' · '}
              <Link
                href="/services"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Все сервисы
              </Link>
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <dl className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3">
              <Stat value={formatNumber(venueCount)} label="проверенных мест" />
              <Stat value={formatNumber(reviewCount)} label="живых отзывов" />
              <Stat value={String(categoryCount)} label="категорий" />
            </dl>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border bg-card/60 px-3 py-3.5 text-center backdrop-blur transition-colors hover:bg-card">
      <dt className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</dt>
      <dd className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{label}</dd>
    </div>
  );
}
