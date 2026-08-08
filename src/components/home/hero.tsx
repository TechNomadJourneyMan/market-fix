import Link from 'next/link';
import { ArrowRight, BadgePercent, PartyPopper, Sparkles, Star, Zap } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { SearchBar } from '@/components/search/search-bar';
import { Button } from '@/components/ui/button';

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
      {/* Фон: мягкие световые пятна + тонкая сетка. Умеренный glassmorphism по ТЗ. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-noise opacity-60" />
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-32 top-10 size-[30rem] rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container pb-14 pt-14 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/ai"
            className="group inline-flex items-center gap-2 rounded-full border bg-background/70 px-3.5 py-1.5 text-xs font-medium backdrop-blur transition-all hover:shadow-soft"
          >
            <Sparkles className="size-3.5 text-primary" />
            Новое: AI подбирает место под ваш повод
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Найдите место, куда{' '}
            <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              захочется вернуться
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Рестораны, кафе, бары и банкетные залы Алматы — с живыми отзывами, честными
            ценами и бронированием за 30 секунд. Без звонков и ожидания на линии.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar placeholder="Итальянская кухня, банкет на 50, кофейня рядом…" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3.5 py-2 text-xs font-medium backdrop-blur transition-all hover:border-primary/30 hover:bg-background hover:shadow-soft"
              >
                <link.icon className="size-3.5 text-primary" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="xl" className="w-full sm:w-auto">
              <Link href="/catalog">
                Смотреть все заведения
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
              <Link href="/ai">
                <Sparkles className="text-primary" />
                Подобрать с AI
              </Link>
            </Button>
          </div>

          <dl className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4">
            <Stat value={formatNumber(venueCount)} label="проверенных мест" />
            <Stat value={formatNumber(reviewCount)} label="живых отзывов" />
            <Stat value={String(categoryCount)} label="категорий" />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <dt className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</dt>
      <dd className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{label}</dd>
    </div>
  );
}
