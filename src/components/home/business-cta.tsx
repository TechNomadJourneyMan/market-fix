import Link from 'next/link';
import { ArrowRight, BarChart3, CalendarRange, MessageSquareHeart, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTranslator } from '@/i18n/server';

const BENEFITS = [
  { icon: CalendarRange, key: 'bookings' },
  { icon: BarChart3, key: 'analytics' },
  { icon: MessageSquareHeart, key: 'reviews' },
  { icon: Wallet, key: 'commission' },
];

export async function BusinessCta() {
  const t = await getTranslator('home');

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-50" />
      <div className="pointer-events-none absolute -right-24 top-1/2 size-80 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t('businessCta.eyebrow')}
          </p>
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('businessCta.title')}
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {t('businessCta.description')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/auth/register?role=business&next=/business">
                {t('businessCta.join')}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login?role=business&next=/business">
                {t('businessCta.login')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <div key={benefit.key} className="rounded-2xl border bg-background p-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <benefit.icon className="size-4" />
              </span>
              <p className="mt-3 text-sm font-semibold">
                {t(`businessCta.benefits.${benefit.key}.title`)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t(`businessCta.benefits.${benefit.key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
