'use client';

import Link from 'next/link';
import { ArrowRight, BadgePercent, Compass, PartyPopper, Search, Star, Zap } from 'lucide-react';
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

const QUICK_LINKS = [
  { label: 'Свободно сейчас', href: '/catalog?availableNow=1', icon: Zap },
  { label: 'Ужин на двоих', href: '/catalog?q=свидание', icon: Star },
  { label: 'Банкет и той', href: '/catalog?banquet=1', icon: PartyPopper },
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

      <div className="container pb-14 pt-14 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <Link
              href="/ai"
              className="group inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/80 px-3.5 py-1.5 text-xs font-medium shadow-soft backdrop-blur transition-all hover:border-primary/30 hover:shadow-card"
            >
              <Compass className="size-3.5 text-primary" />
              Умный подбор места под ваш повод
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </FadeUp>

          <FadeUp delay={0.05}>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Найдите место, куда{' '}
              <span className="text-primary">захочется вернуться</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Рестораны, кафе, бары и банкетные залы Алматы — с живыми отзывами, честными
              ценами и бронированием за 30 секунд. Без звонков и ожидания на линии.
            </p>
          </FadeUp>

          <FadeUp delay={0.15} className="mx-auto mt-8 max-w-2xl">
            <SearchBar placeholder="Итальянская кухня, банкет на 50, кофейня рядом…" />
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {QUICK_LINKS.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.05, duration: 0.35 }}
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
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="xl" className="w-full sm:w-auto">
                <Link href="/catalog">
                  Смотреть все заведения
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
                <Link href="/ai">
                  <Search className="text-primary" />
                  Подобрать место
                </Link>
              </Button>
            </div>
          </FadeUp>

          <FadeUp delay={0.3}>
            <dl className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4">
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
    <div className="rounded-2xl border bg-card/60 px-3 py-4 text-center backdrop-blur transition-colors hover:bg-card">
      <dt className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</dt>
      <dd className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{label}</dd>
    </div>
  );
}
