import type { Metadata } from 'next';
import { MessageSquare } from 'lucide-react';

import { getCurrentBusiness, getDashboardMetrics } from '@/server/repositories/business';
import { getBusinessReviews } from '@/server/repositories/reviews';
import { formatRating } from '@/lib/format';
import { MetricCard } from '@/components/business/metric-card';
import { ReviewsManager } from '@/components/business/reviews-manager';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Отзывы' };

export default function BusinessReviewsPage() {
  const business = getCurrentBusiness();
  const metrics = getDashboardMetrics(business.id);
  const reviews = getBusinessReviews(business.id, 40);

  const unanswered = reviews.filter((review) => !review.reply).length;
  const negative = reviews.filter((review) => review.rating <= 3).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Отзывы</h1>
        <p className="text-sm text-muted-foreground">
          Ответ на отзыв повышает вероятность повторного визита почти вдвое
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Средний рейтинг" value={formatRating(metrics.rating)} hint="по всем объектам" />
        <MetricCard label="Всего отзывов" value={String(metrics.reviewsCount)} />
        <MetricCard label="Без ответа" value={String(unanswered)} hint="стоит ответить" />
        <MetricCard label="Негативные" value={String(negative)} hint="оценка 3 и ниже" />
      </section>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="Отзывов пока нет"
          description="Они появятся после первых визитов гостей, забронировавших через платформу."
        />
      ) : (
        <ReviewsManager reviews={reviews} />
      )}
    </div>
  );
}
