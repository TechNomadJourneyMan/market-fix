'use client';

import Link from 'next/link';
import type { Review } from '@/types';
import { formatDateI18n } from '@/i18n/format';
import { useLocale } from '@/i18n/client';
import { truncate, getInitials } from '@/lib/utils';
import { Stars } from '@/components/ui/rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/primitives';
import { Stagger, StaggerItem } from '@/components/ui/motion';

type ShowcaseReview = Review & { venueSlug: string; venueName: string };

/** Отзывы гостей — социальное доказательство перед финальным CTA. */
export function Testimonials({ reviews }: { reviews: ShowcaseReview[] }) {
  const locale = useLocale();

  return (
    <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <StaggerItem key={review.id} as="article">
          <figure className="flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
            <Stars value={review.rating} size={15} />

            <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
              <p className="font-medium">{review.title}</p>
              <p className="mt-1.5 text-muted-foreground">{truncate(review.text, 190)}</p>
            </blockquote>

            <figcaption className="flex items-center gap-3 border-t pt-4">
              <Avatar className="size-9">
                <AvatarImage src={review.author.avatar} alt={review.author.name} />
                <AvatarFallback>{getInitials(review.author.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{review.author.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <Link
                    href={`/venue/${review.venueSlug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {review.venueName}
                  </Link>
                  {' · '}
                  {formatDateI18n(review.createdAt, locale)}
                </p>
              </div>
            </figcaption>
          </figure>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
