import Link from 'next/link';
import { ArrowRight, Compass, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeUp } from '@/components/ui/motion';
import { getTranslator } from '@/i18n/server';

export async function AiTeaser() {
  const t = await getTranslator('home');
  const examples = t.list('aiTeaser.examples');

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-soft sm:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/8 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
        <FadeUp className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border bg-secondary/60 px-3 py-1.5 text-xs font-medium">
            <Compass className="size-3.5 shrink-0 text-primary" />
            {t('aiTeaser.badge')}
          </span>

          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('aiTeaser.title')}
          </h2>

          <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('aiTeaser.description')}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/ai">
                <Search />
                {t('aiTeaser.cta')}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/catalog">
                {t('aiTeaser.manual')}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </FadeUp>

        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t('aiTeaser.examplesTitle')}
          </p>
          {examples.map((example, index) => (
            <FadeUp key={example} delay={0.05 * index}>
              <Link
                href={`/ai?q=${encodeURIComponent(example)}`}
                className="group flex items-center gap-3 rounded-2xl border bg-background/80 p-3.5 transition-all hover:border-primary/25 hover:bg-card hover:shadow-card"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Search className="size-4" />
                </span>
                <span className="flex-1 text-sm">«{example}»</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </div>
  );
}
