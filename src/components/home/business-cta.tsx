import Link from 'next/link';
import { ArrowRight, BarChart3, CalendarRange, MessageSquareHeart, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BENEFITS = [
  {
    icon: CalendarRange,
    title: 'Брони без звонков',
    text: 'Заявки приходят в кабинет со всеми деталями — гости, время, комментарии.',
  },
  {
    icon: BarChart3,
    title: 'Аналитика, а не догадки',
    text: 'Просмотры, конверсия, доход и загрузка по часам — в одном дашборде.',
  },
  {
    icon: MessageSquareHeart,
    title: 'Работа с отзывами',
    text: 'Отвечайте на отзывы и возвращайте гостей, которые остались недовольны.',
  },
  {
    icon: Wallet,
    title: 'Прозрачная комиссия',
    text: 'Платите процент только за состоявшиеся брони. Никаких абонентских платежей.',
  },
];

export function BusinessCta() {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-50" />
      <div className="pointer-events-none absolute -right-24 top-1/2 size-80 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Для бизнеса
          </p>
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Заполните столы, которые сегодня пустуют
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Мы приводим гостей, которые уже выбрали формат и бюджет. Вам остаётся принять
            бронь — и хорошо встретить.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/business">
                Открыть кабинет бизнеса
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/business/analytics">Посмотреть аналитику</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border bg-background p-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <benefit.icon className="size-4" />
              </span>
              <p className="mt-3 text-sm font-semibold">{benefit.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
