import Link from 'next/link';
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXAMPLES = [
  'Итальянская кухня, до 10 000 ₸, 8 человек, центр, вечером',
  'Тихое место для деловой встречи с Wi-Fi',
  'Банкет на 120 гостей с халяль-меню',
  'Кофейня рядом, где можно поработать с ноутбуком',
];

export function AiTeaser() {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/8 via-card to-accent/8 p-6 sm:p-10">
      <div className="pointer-events-none absolute -left-20 bottom-0 size-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -top-20 size-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            AI-подбор
          </span>

          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Опишите вечер словами — получите пять точных вариантов
          </h2>

          <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Ассистент учитывает кухню, бюджет, размер компании, район и время. И, что важнее,
            объясняет, почему выбрал именно эти места — а не просто выдаёт список.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/ai">
                <Wand2 />
                Подобрать место
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/catalog">
                Или искать вручную
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">Попробуйте так:</p>
          {EXAMPLES.map((example) => (
            <Link
              key={example}
              href={`/ai?q=${encodeURIComponent(example)}`}
              className="group flex items-center gap-3 rounded-2xl border bg-background/70 p-3.5 backdrop-blur transition-all hover:border-primary/30 hover:shadow-card"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <span className="flex-1 text-sm">«{example}»</span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
