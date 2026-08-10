'use client';

import type { VenueListItem } from '@/types';
import { Button } from '@/components/ui/button';
import { useBookingStore, venueToBookingTarget } from '@/store/use-booking-store';
import { cn } from '@/lib/utils';

export function BookVenueButton({
  venue,
  label = 'Забронировать',
  size = 'sm',
  className,
}: {
  venue: VenueListItem;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const openBooking = useBookingStore((state) => state.open);

  return (
    <Button
      type="button"
      size={size}
      className={cn(className)}
      onClick={() => openBooking(venueToBookingTarget(venue))}
    >
      {label}
    </Button>
  );
}
