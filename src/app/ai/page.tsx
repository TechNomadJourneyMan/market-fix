import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Brain, Scale, Sparkles, Timer } from 'lucide-react';

import { getCategories, getCuisines, getDistricts } from '@/server/repositories/taxonomy';
import { AiWizard } from '@/components/ai/ai-wizard';

export const metadata: Metadata = {
  title: 'AI-подбор заведения',
  description:
    'Опишите повод, бюджет, компанию и район — ассистент подберёт места и объяснит, почему выбрал именно их.',
};

const FEATURES = [
  {
    icon: Brain,
    title: 'Понимает контекст',
    text: 'Разбирает кухню, бюджет, размер компании, район и время из обычной фразы.',
  },
  {
    icon: Scale,
    title: 'Объясняет выбор',
    text: 'Показывает, из чего сложился процент совпадения — и что может не подойти.',
  },
  {
    icon: Timer,
    title: 'Проверяет расписание',
    text: 'Не предложит место, которое закрыто в нужное вам время.',
  },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AiPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const initialQuery = typeof params.q === 'string' ? params.q : undefined;

  const categories = getCategories();
  const cuisines = getCuisines();
  const districts = getDistricts();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96">
        <div className="absolute -left-32 top-0 size-96 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute -right-24 top-16 size-80 rounded-full bg-accent/15 blur-[120px]" />
      </div>

      <div className="container max-w-4xl py-10 sm:py-14">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3.5 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            Демонстрационный AI · работает на mock-логике
          </span>

          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Расскажите про вечер — подберём место
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Не нужно перебирать десятки карточек. Ассистент учтёт кухню, бюджет, компанию,
            район и время — и объяснит каждый выбор.
          </p>
        </header>

        <div className="mt-8">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-muted/40" />}>
            <AiWizard
              categories={categories}
              cuisines={cuisines}
              districts={districts}
              initialQuery={initialQuery}
            />
          </Suspense>
        </div>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="size-[18px]" />
              </span>
              <p className="mt-3 text-sm font-semibold">{feature.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {feature.text}
              </p>
            </div>
          ))}
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          В MVP подбор работает на прозрачном алгоритме скоринга без обращения к языковой
          модели. Интерфейс и контракт API готовы к подключению OpenAI — заменяется только
          движок.
        </p>
      </div>
    </div>
  );
}
