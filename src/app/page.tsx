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
import { RecentVenues } from '@/components/home/recent-venues';
import { ServicesShowcase } from '@/components/home/services-showcase';
import { CityMapExplorer } from '@/components/map/city-map-explorer';
import { getTranslator } from '@/i18n/server';

import { getCategories } from '@/server/repositories/taxonomy';
import {
  getFeaturedVenues,
  getNewVenues,
  getTopRatedVenues,
  getVenueCount,
  getVenuesWithPromotions,
  searchVenues,
} from '@/server/repositories/venues';
import { getShowcaseReviews, getTotalReviewCount } from '@/server/repositories/reviews';
import {
  getMarketplaceCategories,
  getPopularMarketplaceListings,
} from '@/server/repositories/marketplace';

export default async function HomePage() {
  const [tMap, tHome] = await Promise.all([
    getTranslator('map'),
    getTranslator('home'),
  ]);
  const categories = getCategories();
  const featured = getFeaturedVenues(6);
  const topRated = getTopRatedVenues(8);
  const promotions = getVenuesWithPromotions(6);
  const fresh = getNewVenues(8);
  const reviews = getShowcaseReviews(3);
  const mapVenues = searchVenues({ sort: 'popularity', perPage: 40 }).allMatches;
  const marketplaceCategories = getMarketplaceCategories();
  const marketplaceListings = getPopularMarketplaceListings(8);

  return (
    <>
      <Hero
        venueCount={getVenueCount()}
        reviewCount={getTotalReviewCount()}
        categoryCount={categories.length}
      />

      <Section id="city-map" className="scroll-mt-24 pt-4 sm:pt-6">
        <SectionHeader
          eyebrow={tMap('section.eyebrow')}
          title={tMap('section.title')}
          description={tMap('section.description')}
          action={{ label: tMap('section.action'), href: '/catalog?view=map' }}
        />
        <CityMapExplorer venues={mapVenues} services={marketplaceListings} />
      </Section>

      <Section className="pt-0">
        <SectionHeader
          eyebrow={tHome('sections.categories.eyebrow')}
          title={tHome('sections.categories.title')}
          description={tHome('sections.categories.description')}
          action={{ label: tHome('sections.categories.action'), href: '/catalog' }}
        />
        <CategoryGrid categories={categories} />
      </Section>

      <ServicesShowcase
        categories={marketplaceCategories}
        listings={marketplaceListings}
      />

      <RecentVenues />

      <Section className="pt-0">
        <SectionHeader
          eyebrow={tHome('sections.featured.eyebrow')}
          title={tHome('sections.featured.title')}
          description={tHome('sections.featured.description')}
          action={{ label: tHome('sections.featured.action'), href: '/catalog?sort=rating' }}
        />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map((venue, index) => (
            <VenueCard key={venue.id} venue={venue} priority={index < 3} />
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <SectionHeader
          eyebrow={tHome('sections.availableNow.eyebrow')}
          title={tHome('sections.availableNow.title')}
          description={tHome('sections.availableNow.description')}
          action={{
            label: tHome('sections.availableNow.action'),
            href: '/catalog?availableNow=1',
          }}
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
              {tHome('sections.availableNow.cta')}
            </Link>
          </Button>
        </div>
      </Section>

      <Section className="pt-0">
        <AiTeaser />
      </Section>

      {promotions.length > 0 ? (
        <Section className="pt-0">
          <SectionHeader
            eyebrow={tHome('sections.promo.eyebrow')}
            title={tHome('sections.promo.title')}
            description={tHome('sections.promo.description')}
            action={{ label: tHome('sections.promo.action'), href: '/catalog?promo=1' }}
          />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {promotions.slice(0, 3).map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
          {promotions.length > 3 ? (
            <div className="mt-6 flex justify-center">
              <Button asChild variant="ghost">
                <Link href="/catalog?promo=1">
                  <BadgePercent className="text-primary" />
                  {tHome('sections.promo.more', { count: promotions.length - 3 })}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          ) : null}
        </Section>
      ) : null}

      <Section className="pt-0">
        <HowItWorks />
      </Section>

      <Section className="pt-0">
        <SectionHeader
          eyebrow={tHome('sections.fresh.eyebrow')}
          title={tHome('sections.fresh.title')}
          description={tHome('sections.fresh.description')}
          action={{ label: tHome('sections.fresh.action'), href: '/catalog' }}
        />
        <ScrollRow>
          {fresh.map((venue) => (
            <VenueCardMini key={venue.id} venue={venue} />
          ))}
        </ScrollRow>
      </Section>

      <Section className="pt-0">
        <SectionHeader
          eyebrow={tHome('sections.reviews.eyebrow')}
          title={tHome('sections.reviews.title')}
          description={tHome('sections.reviews.description')}
          align="center"
        />
        <Testimonials reviews={reviews} />
      </Section>

      <Section className="pt-0">
        <BusinessCta />
      </Section>

      <Section className="pt-0">
        <div className="relative overflow-hidden rounded-3xl border bg-primary px-6 py-14 text-center text-white sm:px-10 sm:py-20">
          <div className="pointer-events-none absolute inset-0 grid-noise opacity-15" />
          <div className="pointer-events-none absolute -right-20 top-0 size-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-2xl space-y-5">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {tHome('sections.finalCta.title')}
            </h2>
            <p className="text-pretty text-base text-white/85">
              {tHome('sections.finalCta.description')}
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button asChild size="xl" variant="glass" className="w-full sm:w-auto">
                <Link href="/catalog">
                  <Calendar />
                  {tHome('sections.finalCta.catalog')}
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
                  {tHome('sections.finalCta.ai')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
