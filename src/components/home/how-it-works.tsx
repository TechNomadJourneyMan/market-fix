import Link from 'next/link';
import { ArrowRight, CalendarCheck, PartyPopper, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTranslator } from '@/i18n/server';

const STEPS = [
  { icon: Search, key: 'describe' },
  { icon: CalendarCheck, key: 'time' },
  { icon: PartyPopper, key: 'come' },
];

export async function HowItWorks() {
  const t = await getTranslator('home');

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-10">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t('howItWorks.eyebrow')}
          </p>
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('howItWorks.title')}
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {t('howItWorks.description')}
          </p>
          <Button asChild size="lg">
            <Link href="/ai">
              {t('howItWorks.cta')}
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <ol className="relative space-y-4">
          {STEPS.map((step, index) => (
            <li
              key={step.key}
              className="relative flex gap-4 rounded-2xl border bg-background p-4 transition-shadow hover:shadow-card sm:p-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl brand-gradient text-white shadow-glow">
                <step.icon className="size-5" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="shrink-0 text-xs text-muted-foreground">0{index + 1}</span>
                  {t(`howItWorks.steps.${step.key}.title`)}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`howItWorks.steps.${step.key}.text`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
