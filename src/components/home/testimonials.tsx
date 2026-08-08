import Link from 'next/link';
import type { Review } from '@/types';
import { formatRelativeTime } from '@/lib/format';
import { truncate } from '@/lib/utils';
import { Stars } from '@/components/ui/rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/primitives';
import { getInitials } from '@/lib/utils';

type ShowcaseReview = Review & { venueSlug: string; venueName: string };

/** Отзывы гостей — социальное доказательство перед финальным CTA. */
export function Testimonials({ reviews }: { reviews: ShowcaseReview[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <figure
          key={review.id}
          className="flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-card"
        >
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
                {formatRelativeTime(review.createdAt)}
              </p>
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
