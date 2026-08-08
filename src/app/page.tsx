import Link from 'next/link';
import { ArrowRight, BadgePercent, Calendar, Search, Zap } from 'lucide-react';

import { Section, SectionHeader, ScrollRow } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { VenueCard, VenueCardMini } from '@/components/venue/venue-card';
import { Hero } from '@/components/home/hero';
import { CategoryGrid } from '@/components/home/category-grid';
import { HowItWorks } from '@/components/home/how-it-works';
import { AiTeaser } from '@/components/home/ai-teaser';
import { Testimonials } from '@/components/home/testimonials';
import { BusinessCta } from '@/components/home/business-cta';

import { getCategories } from '@/server/repositories/taxonomy';
import {
  getFeaturedVenues,
  getNewVenues,
  getTopRatedVenues,
  getVenueCount,
  getVenuesWithPromotions,
} from '@/server/repositories/venues';
import { getShowcaseReviews, getTotalReviewCount } from '@/server/repositories/reviews';

export default function HomePage() {
  const categories = getCategories();
  const featured = getFeaturedVenues(6);
  const topRated = getTopRatedVenues(8);
  const promotions = getVenuesWithPromotions(6);
  const fresh = getNewVenues(8);
  const reviews = getShowcaseReviews(3);

  return (
    <>
      <Hero
        venueCount={getVenueCount()}
        reviewCount={getTotalReviewCount()}
        categoryCount={categories.length}
      />

      {/* ——— Категории ——— */}
      <Section className="pt-4 sm:pt-6">
        <SectionHeader
          eyebrow="Куда пойдём"
          title="Выберите формат вечера"
          description="От утреннего кофе до тоя на 300 гостей — каждая категория собрана из проверенных мест."
          action={{ label: 'Все категории', href: '/catalog' }}
        />
        <CategoryGrid categories={categories} />
      </Section>

      {/* ——— Выбор редакции ——— */}
      <Section className="pt-0">
        <SectionHeader
          eyebrow="Выбор редакции"
          title="Места, которые не разочаровывают"
          description="Мы сходили сами, прочитали сотни отзывов и оставили только те, куда возвращаются."
          action={{ label: 'Смотреть все', href: '/catalog?sort=rating' }}
        />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map((venue, index) => (
            <VenueCard key={venue.id} venue={venue} priority={index < 3} />
          ))}
        </div>
      </Section>

      {/* ——— Свободно сейчас ——— */}
      <Section className="pt-0">
        <SectionHeader
          eyebrow="Без планирования"
          title="Свободно прямо сейчас"
          description="Открыто, столы есть, ехать недалеко. Идеально, когда решили спонтанно."
          action={{ label: 'Все свободные', href: '/catalog?availableNow=1' }}
        />
        <ScrollRow>
          {topRated.map((venue) => (
            <VenueCardMini key={venue.id} venue={venue} />
          ))}
        </ScrollRow>
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/catalog?availableNow=1">
              <Zap className="text-primary" />
              Показать, где есть места сегодня
            </Link>
          </Button>
        </div>
      </Section>

      {/* ——— AI ——— */}
      <Section className="pt-0">
        <AiTeaser />
      </Section>

      {/* ——— Акции ——— */}
      {promotions.length > 0 ? (
        <Section className="pt-0">
          <SectionHeader
            eyebrow="Выгодно"
            title="Акции недели"
            description="Те же места, только дешевле. Предложения действуют ограниченное время."
            action={{ label: 'Все акции', href: '/catalog?promo=1' }}
          />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {promotions.slice(0, 3).map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Button asChild variant="ghost">
              <Link href="/catalog?promo=1">
                <BadgePercent className="text-primary" />
                Ещё {promotions.length - 3} предложения
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </Section>
      ) : null}

      {/* ——— Как это работает ——— */}
      <Section className="pt-0">
        <HowItWorks />
      </Section>

      {/* ——— Новинки ——— */}
      <Section className="pt-0">
        <SectionHeader
          eyebrow="Новое на платформе"
          title="Открылись недавно"
          description="Свежие места с высоким рейтингом, о которых ещё не все знают."
          action={{ label: 'В каталог', href: '/catalog' }}
        />
        <ScrollRow>
          {fresh.map((venue) => (
            <VenueCardMini key={venue.id} venue={venue} />
          ))}
        </ScrollRow>
      </Section>

      {/* ——— Отзывы ——— */}
      <Section className="pt-0">
        <SectionHeader
          eyebrow="Гости говорят"
          title="Отзывы тех, кто уже сходил"
          description="Только от гостей, которые бронировали через платформу. Без накруток."
          align="center"
        />
        <Testimonials reviews={reviews} />
      </Section>

      {/* ——— Для бизнеса ——— */}
      <Section className="pt-0">
        <BusinessCta />
      </Section>

      {/* ——— Финальный CTA ——— */}
      <Section className="pt-0">
        <div className="relative overflow-hidden rounded-3xl border bg-[hsl(18_72%_46%)] px-6 py-14 text-center text-white sm:px-10 sm:py-20">
          <div className="pointer-events-none absolute inset-0 grid-noise opacity-15" />
          <div className="pointer-events-none absolute -right-20 top-0 size-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-2xl space-y-5">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Ужин в пятницу не забронирует себя сам
            </h2>
            <p className="text-pretty text-base text-white/85">
              Лучшие столы разбирают за три дня. Выберите место сейчас — потратите минуту,
              а вечер спасёте.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button asChild size="xl" variant="glass" className="w-full sm:w-auto">
                <Link href="/catalog">
                  <Calendar />
                  Выбрать заведение
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="ghost"
                className="w-full text-white hover:bg-white/15 hover:text-white sm:w-auto"
              >
                <Link href="/ai">
                  <Search />
                  Подобрать по сценарию
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
