import {
  AtSign,
  Globe,
  Instagram,
  MapPin,
  Navigation,
  Phone,
} from 'lucide-react';
import type { Venue } from '@/types';
import { cn } from '@/lib/utils';
import { getWeekdayShort } from '@/lib/format';
import { groupWorkingHours } from '@/lib/hours';
import { getDirectionsUrl, estimateTravel } from '@/lib/geo';
import { Button } from '@/components/ui/button';

/** Часы работы, сгруппированные по одинаковым дням. */
export function VenueWorkingHours({ venue }: { venue: Venue }) {
  const groups = groupWorkingHours(venue.workingHours);

  return (
    <ul className="divide-y rounded-2xl border">
      {groups.map((group, index) => {
        const days =
          group.days.length === 1
            ? getWeekdayShort(group.days[0])
            : `${getWeekdayShort(group.days[0])}–${getWeekdayShort(group.days[group.days.length - 1])}`;

        return (
          <li key={index} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium">{days}</span>
            <span
              className={cn(
                group.entry.isClosed ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {group.entry.isClosed
                ? 'Выходной'
                : `${group.entry.opensAt} — ${group.entry.closesAt}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Контакты заведения. */
export function VenueContacts({ venue }: { venue: Venue }) {
  const contacts = [
    { icon: Phone, label: venue.phone, href: `tel:${venue.phone.replace(/\s/g, '')}` },
    { icon: AtSign, label: venue.email, href: `mailto:${venue.email}` },
    venue.website
      ? { icon: Globe, label: venue.website.replace('https://', ''), href: venue.website }
      : null,
    venue.instagram
      ? { icon: Instagram, label: venue.instagram, href: `https://instagram.com/${venue.instagram.slice(1)}` }
      : null,
  ].filter(Boolean) as { icon: typeof Phone; label: string; href: string }[];

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {contacts.map((contact) => (
        <li key={contact.href}>
          <a
            href={contact.href}
            target={contact.href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-secondary"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <contact.icon className="size-4" />
            </span>
            <span className="min-w-0 truncate text-sm">{contact.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Локация: адрес, ориентир, оценка времени в пути и кнопка «Доехать». */
export function VenueLocation({ venue }: { venue: Venue }) {
  const travel = estimateTravel(3.4);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <MapPin className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">{venue.location.address}</p>
            <p className="text-xs text-muted-foreground">
              {venue.location.cityName}, {venue.location.districtName}
              {venue.location.landmark ? ` · ${venue.location.landmark}` : ''}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              ≈ {travel.driveMinutes} мин на авто · {travel.walkMinutes} мин пешком от центра
            </p>
          </div>
        </div>

        <Button asChild variant="outline" className="shrink-0">
          <a
            href={getDirectionsUrl(venue.location.coordinates, venue.name)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Navigation />
            Доехать
          </a>
        </Button>
      </div>
    </div>
  );
}
