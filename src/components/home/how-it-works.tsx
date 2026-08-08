import Link from 'next/link';
import { ArrowRight, CalendarCheck, PartyPopper, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: Search,
    title: 'Опишите повод',
    text: 'Кухня, бюджет, район, размер компании. Или просто напишите «ужин вдвоём в центре» — поймём с полуслова.',
  },
  {
    icon: CalendarCheck,
    title: 'Выберите время',
    text: 'Видно, где реально есть свободные столы прямо сейчас. Бронь подтверждается за 15 минут, без звонков.',
  },
  {
    icon: PartyPopper,
    title: 'Приходите',
    text: 'Стол ждёт, комментарии переданы, депозит засчитан в счёт. Останется только получить удовольствие.',
  },
];

export function HowItWorks() {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-10">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Как это работает
          </p>
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Три шага между «хочу куда-нибудь» и «мы за столом»
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Больше не нужно обзванивать пять мест, чтобы узнать, есть ли столик на восемь
            человек в пятницу. Мы уже знаем.
          </p>
          <Button asChild size="lg">
            <Link href="/ai">
              Описать повод в AI
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <ol className="relative space-y-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative flex gap-4 rounded-2xl border bg-background p-4 transition-shadow hover:shadow-card sm:p-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl brand-gradient text-white shadow-glow">
                <step.icon className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-xs text-muted-foreground">0{index + 1}</span>
                  {step.title}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
