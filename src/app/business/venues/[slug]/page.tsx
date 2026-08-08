import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';

import { getBusinessVenueBySlug, getCurrentBusiness } from '@/server/repositories/business';
import { VenueEditor } from '@/components/business/venue-editor';
import { Button } from '@/components/ui/button';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = getCurrentBusiness();
  const venue = getBusinessVenueBySlug(business.id, slug);
  return { title: venue ? `Редактирование · ${venue.name}` : 'Заведение не найдено' };
}

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = getCurrentBusiness();
  const venue = getBusinessVenueBySlug(business.id, slug);
  if (!venue) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/business/venues"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        К списку объектов
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{venue.name}</h1>
          <p className="text-sm text-muted-foreground">
            Изменения сразу отражаются в каталоге и на странице заведения
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/venue/${venue.slug}`}>
            <Eye />
            Открыть как гость
          </Link>
        </Button>
      </header>

      <VenueEditor venue={venue} />
    </div>
  );
}
