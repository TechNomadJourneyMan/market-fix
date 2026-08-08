import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, ExternalLink } from 'lucide-react';

import { getCurrentBusiness, getBusinessVenues } from '@/server/repositories/business';
import { getBusinessBookings } from '@/server/repositories/bookings';
import { formatVenues } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BusinessNav } from '@/components/business/business-nav';

export const metadata: Metadata = {
  title: { default: 'Кабинет бизнеса', template: '%s · Бизнес · Мезгіл' },
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Бесплатный',
  pro: 'Pro',
  premium: 'Premium',
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const business = getCurrentBusiness();
  const venues = getBusinessVenues(business.id);
  const pendingCount = getBusinessBookings(business.id).filter(
    (booking) => booking.status === 'pending',
  ).length;

  return (
    <div className="container py-6 sm:py-10">
      <header className="flex flex-col gap-4 rounded-3xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={business.logo}
          alt={business.name}
          className="size-16 shrink-0 rounded-2xl object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {business.name}
            </h1>
            {business.isVerified ? (
              <Badge variant="success" className="gap-1">
                <BadgeCheck className="size-3" />
                Проверен
              </Badge>
            ) : null}
            <Badge variant="secondary">Тариф {PLAN_LABELS[business.plan]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatVenues(venues.length)} · комиссия {business.commissionPercent}% ·{' '}
            {business.legalName}
          </p>
        </div>

        {venues[0] ? (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/venue/${venues[0].slug}`}>
              <ExternalLink />
              Как видят гости
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BusinessNav pendingCount={pendingCount} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
