import { Skeleton, VenueGridSkeleton } from '@/components/ui/skeleton';

export default function CatalogLoading() {
  return (
    <div className="container py-6 sm:py-8">
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <Skeleton className="h-10 max-w-2xl" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-36 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[268px_minmax(0,1fr)]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
        <div className="space-y-5">
          <Skeleton className="h-9 w-full" />
          <VenueGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
