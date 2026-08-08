import type { Metadata } from 'next';
import Link from 'next/link';
import { ImagePlus, Info } from 'lucide-react';

import { getBusinessVenues, getCurrentBusiness } from '@/server/repositories/business';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Фотографии' };

export default function BusinessPhotosPage() {
  const business = getCurrentBusiness();
  const venues = getBusinessVenues(business.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Фотографии</h1>
        <p className="text-sm text-muted-foreground">
          Галереи всех объектов. Первое фото становится обложкой в каталоге.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-dashed bg-muted/30 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Заведения с 8 и более фотографиями получают в среднем на 40% больше броней.
          Показывайте зал, подачу блюд и террасу — гости решают глазами.
        </p>
      </div>

      {venues.map((venue) => (
        <section key={venue.id} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{venue.name}</h2>
              <Badge variant="secondary" size="sm">
                {venue.photos.length} фото
              </Badge>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/business/venues/${venue.slug}`}>Управлять галереей →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
            {venue.photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-xl border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.alt}
                  loading="lazy"
                  className="size-full object-cover"
                />
                {index === 0 ? (
                  <Badge variant="overlay" size="sm" className="absolute left-1.5 top-1.5">
                    Обложка
                  </Badge>
                ) : null}
              </div>
            ))}

            <Link
              href={`/business/venues/${venue.slug}`}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ImagePlus className="size-5" />
              <span className="text-[10px] font-medium">Добавить</span>
            </Link>
          </div>
        </section>
      ))}
    </div>
  );
}
