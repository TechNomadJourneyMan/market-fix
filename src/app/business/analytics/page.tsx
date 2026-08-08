import type { Metadata } from 'next';
import { Eye, Lightbulb, Percent, Users, Wallet } from 'lucide-react';

import {
  getBusinessAnalytics,
  getCurrentBusiness,
  getDashboardMetrics,
} from '@/server/repositories/business';
import {
  formatNumber,
  formatPercent,
  formatPrice,
  formatPriceCompact,
} from '@/lib/format';
import { MetricCard } from '@/components/business/metric-card';
import { AreaChart, BarChart, BarList } from '@/components/business/charts';

export const metadata: Metadata = { title: 'Аналитика' };

export default function BusinessAnalyticsPage() {
  const business = getCurrentBusiness();
  const metrics = getDashboardMetrics(business.id);
  const analytics = getBusinessAnalytics(business.id, 30);

  const peakHour = analytics.hourlyLoad.reduce((best, current) =>
    current.value > best.value ? current : best,
  );
  const quietHour = analytics.hourlyLoad
    .filter((item) => item.hour >= 11 && item.hour <= 22)
    .reduce((best, current) => (current.value < best.value ? current : best));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Аналитика</h1>
        <p className="text-sm text-muted-foreground">
          Просмотры, доход и конверсия за последние 30 дней
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Просмотры"
          value={formatNumber(metrics.views)}
          delta={metrics.viewsDelta}
          icon={Eye}
        />
        <MetricCard
          label="Доход"
          value={formatPriceCompact(metrics.revenue)}
          delta={metrics.revenueDelta}
          icon={Wallet}
        />
        <MetricCard
          label="Конверсия"
          value={formatPercent(metrics.conversionRate, 1)}
          delta={metrics.conversionDelta}
          hint="просмотр → бронь"
          icon={Percent}
        />
        <MetricCard
          label="Средний чек"
          value={formatPrice(metrics.averageCheck)}
          hint="на бронь"
          icon={Users}
        />
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-base font-semibold">Просмотры карточек</h2>
        <p className="text-sm text-muted-foreground">
          Сколько раз гости открывали ваши заведения
        </p>
        <AreaChart data={analytics.views} className="mt-5" height={200} />
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-base font-semibold">Доход по дням</h2>
        <p className="text-sm text-muted-foreground">
          Оплаченные депозиты и подтверждённые брони
        </p>
        <AreaChart data={analytics.revenue} className="mt-5" height={200} format="money" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-base font-semibold">Загрузка по часам</h2>
          <p className="text-sm text-muted-foreground">
            Когда гости чаще всего бронируют столы
          </p>
          <BarChart
            data={analytics.hourlyLoad.map((item) => ({
              label: String(item.hour),
              value: item.value,
            }))}
            className="mt-5"
          />
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-base font-semibold">Источники трафика</h2>
          <p className="text-sm text-muted-foreground">Откуда приходят гости</p>
          <BarList data={analytics.sources} className="mt-5" />
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-base font-semibold">Объекты</h2>
        <p className="text-sm text-muted-foreground">
          Сравнение по броням и доходу за период
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="pb-2 text-left font-medium">Объект</th>
                <th className="pb-2 text-right font-medium">Брони</th>
                <th className="pb-2 text-right font-medium">Доход</th>
                <th className="pb-2 text-right font-medium">Средний чек</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analytics.topVenues.map((venue) => (
                <tr key={venue.venueId}>
                  <td className="py-3 font-medium">{venue.name}</td>
                  <td className="py-3 text-right">{formatNumber(venue.bookings)}</td>
                  <td className="py-3 text-right">{formatPriceCompact(venue.revenue)}</td>
                  <td className="py-3 text-right text-muted-foreground">
                    {formatPrice(Math.round(venue.revenue / Math.max(venue.bookings, 1)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Практические выводы — аналитика, которая говорит, что делать */}
      <section className="rounded-2xl border bg-gradient-to-br from-primary/[0.05] to-accent/[0.05] p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Lightbulb className="size-4 text-warning" />
          Что с этим делать
        </h2>

        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex gap-2.5">
            <span className="text-primary">•</span>
            <span>
              Пик приходится на <b>{peakHour.hour}:00</b>. В это время столы разбирают
              быстрее всего — увеличьте число слотов или добавьте посадку на террасе.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="text-primary">•</span>
            <span>
              Самый тихий час — <b>{quietHour.hour}:00</b>. Запустите предложение на это
              время: скидка 20% поднимает загрузку в среднем на треть.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="text-primary">•</span>
            <span>
              Конверсия {formatPercent(metrics.conversionRate, 1)}. Добавьте фотографии и
              заполните меню — карточки с полным контентом конвертируют вдвое лучше.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="text-primary">•</span>
            <span>
              AI-подбор уже даёт {analytics.sources[2]?.value ?? 0}% визитов. Точные теги и
              удобства в карточке напрямую увеличивают этот поток.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
