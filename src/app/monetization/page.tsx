import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  Building2,
  Megaphone,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FadeUp } from '@/components/ui/motion';

export const metadata: Metadata = {
  title: 'Монетизация',
  description:
    'Как Market Fix зарабатывает: комиссия с чека B2B, плата за приведённых гостей, реклама в сервисе и продажа аналитики.',
};

const STREAMS = [
  {
    id: 'commission',
    icon: Receipt,
    eyebrow: 'B2B · комиссия',
    title: 'Комиссия от чека партнёров',
    summary:
      'Площадки платят процент только с состоявшихся визитов. Мы зарабатываем, когда гость реально пришёл и оставил деньги в заведении.',
    points: [
      'Комиссия считается от подтверждённого чека или среднего чека категории',
      'Нет абонентской платы на старте — партнёр платит за результат',
      'Прозрачный кабинет: бронь → визит → комиссия',
    ],
    metric: '8–12%',
    metricLabel: 'от чека визита',
  },
  {
    id: 'guests',
    icon: Users,
    eyebrow: 'Performance',
    title: 'Оплата за приведённых гостей',
    summary:
      'CPA-модель для партнёров, которым важнее поток, а не процент: платят за каждого уникального гостя, дошедшего до брони или визита.',
    points: [
      'Фиксированная ставка за квалифицированного гостя',
      'Подходит для новых площадок и сезонных запусков',
      'Антифрод: один гость = один биллинг-событие',
    ],
    metric: 'от 900 ₸',
    metricLabel: 'за приведённого гостя',
  },
  {
    id: 'ads',
    icon: Megaphone,
    eyebrow: 'Media',
    title: 'Реклама внутри сервиса',
    summary:
      'Продвижение в каталоге, на карте и в AI-подборе: спонсорские плейсменты, которые не ломают UX и выглядят как естественные рекомендации.',
    points: [
      'Закрепление в выдаче района и категории',
      'Спонсорские пины на карте Алматы',
      'Буст в AI-подборе с пометкой «продвигается»',
    ],
    metric: 'CPM / CPC',
    metricLabel: 'пакеты размещения',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    eyebrow: 'Data',
    title: 'Продажа аналитики',
    summary:
      'Агрегированные отчёты для сетей, поставщиков и инвесторов: спрос по районам, средний чек, загрузка вечеров, конверсия AI → бронь.',
    points: [
      'Обезличенные датасеты и еженедельные дашборды',
      'Кастомные исследования под бренд или район',
      'API-доступ для крупных B2B-клиентов',
    ],
    metric: 'от 150 000 ₸',
    metricLabel: 'за отчёт / месяц',
  },
] as const;

const FUNNEL = [
  { step: '01', title: 'Гость находит место', text: 'Каталог, карта, AI или Merge Menu' },
  { step: '02', title: 'Бронь или заказ', text: 'Стол, доставка, аренда, сервис' },
  { step: '03', title: 'Визит и чек', text: 'Партнёр подтверждает визит' },
  { step: '04', title: 'Доход Market Fix', text: 'Комиссия, CPA, реклама или data' },
] as const;

export default function MonetizationPage() {
  return (
    <>
      {/* Компактный экран для mobile/tablet — полный разбор экономики на desktop */}
      <section className="container space-y-5 py-10 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Монетизация
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Полная модель выручки удобнее смотреть на большом экране
        </h1>
        <p className="text-muted-foreground">
          Комиссия с чека, CPA за гостей, реклама и аналитика — откройте эту страницу на
          компьютере или сразу зайдите в демо-кабинет партнёра.
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href="/auth/login?role=business&next=/business">Демо B2B · business@demo.kz</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/register?role=business&next=/business">Стать партнёром</Link>
          </Button>
        </div>
      </section>

      <div className="hidden lg:block">
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 grid-noise opacity-40" />
          <div className="absolute -left-24 top-0 size-[28rem] rounded-full bg-primary/10 blur-[110px]" />
          <div className="absolute -right-16 bottom-0 size-[22rem] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="container grid gap-10 py-16 xl:grid-cols-[1.1fr_0.9fr] xl:items-end xl:py-20">
          <FadeUp className="max-w-2xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Монетизация · Desktop
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight xl:text-5xl">
              Четыре способа, как Market Fix зарабатывает на маркетплейсе Алматы
            </h1>
            <p className="max-w-xl text-pretty text-lg text-muted-foreground">
              Комиссия с чека B2B-партнёров, оплата за приведённых гостей, реклама в сервисе
              и продажа аналитики — единая экономика вокруг бронирования, аренды и доставки.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/auth/register?role=business&next=/business">
                  Подключить бизнес
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login?role=business&next=/business">
                  <Building2 />
                  Войти в кабинет партнёра
                </Link>
              </Button>
            </div>
          </FadeUp>

          <FadeUp delay={0.08} className="rounded-3xl border bg-card/80 p-6 shadow-soft backdrop-blur">
            <p className="text-sm font-medium text-muted-foreground">Сводка модели</p>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <Metric tile="Комиссия" value="8–12%" hint="от чека" />
              <Metric tile="CPA" value="от 900 ₸" hint="за гостя" />
              <Metric tile="Реклама" value="CPM/CPC" hint="в выдаче и на карте" />
              <Metric tile="Аналитика" value="B2B data" hint="отчёты и API" />
            </dl>
            <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              Демо-вход партнёра: <span className="font-mono text-foreground">business@demo.kz / demo1234</span>
            </p>
          </FadeUp>
        </div>
      </section>

      <section className="container py-14">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">Потоки выручки</h2>
          <p className="mt-2 text-muted-foreground">
            Каждый поток закрывает свой сценарий партнёра — от оплаты за результат до медиа и data.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {STREAMS.map((stream, index) => (
            <FadeUp
              key={stream.id}
              delay={index * 0.04}
              className="rounded-3xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <stream.icon className="size-5" />
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold tracking-tight">{stream.metric}</p>
                  <p className="text-xs text-muted-foreground">{stream.metricLabel}</p>
                </div>
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {stream.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{stream.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stream.summary}</p>
              <ul className="mt-4 space-y-2">
                {stream.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm">
                    <BadgePercent className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </FadeUp>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="container py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Как деньги проходят через продукт</h2>
              <p className="mt-2 text-muted-foreground">От поиска гостя до начисления партнёру и комиссии платформе.</p>
            </div>
            <Wallet className="hidden size-8 text-primary xl:block" />
          </div>
          <ol className="grid gap-4 xl:grid-cols-4">
            {FUNNEL.map((item) => (
              <li key={item.step} className="rounded-3xl border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {item.step}
                </p>
                <p className="mt-3 text-lg font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container py-16">
        <div className="relative overflow-hidden rounded-3xl border bg-primary px-8 py-12 text-primary-foreground xl:px-12">
          <div className="pointer-events-none absolute inset-0 grid-noise opacity-15" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">
                Готовы подключить площадку и считать юнит-экономику?
              </h2>
              <p className="text-primary-foreground/85">
                Откройте демо-кабинет бизнеса или зарегистрируйте партнёра — комиссия, CPA и рекламные
                слоты видны в одной аналитике.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl" variant="glass">
                <Link href="/auth/login?role=business&next=/business">
                  Демо B2B-кабинет
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="ghost"
                className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
              >
                <Link href="/auth/register?role=business&next=/business">Стать партнёром</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

function Metric({
  tile,
  value,
  hint,
}: {
  tile: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-4">
      <dt className="text-xs text-muted-foreground">{tile}</dt>
      <dd className="mt-1 text-lg font-semibold tracking-tight">{value}</dd>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
