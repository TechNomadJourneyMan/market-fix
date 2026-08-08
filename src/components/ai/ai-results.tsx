'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ChevronDown,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { AIRecommendation, AIRecommendationResult } from '@/types';
import { cn } from '@/lib/utils';
import { formatPrice, formatRating, formatReviews } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { FavoriteButton } from '@/components/venue/favorite-button';
import { useBookingStore, venueToBookingTarget } from '@/store/use-booking-store';

export function AiResults({
  result,
  onRestart,
}: {
  result: AIRecommendationResult;
  onRestart: () => void;
}) {
  if (result.recommendations.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles />}
        title="Под такие условия ничего не нашлось"
        description="Скорее всего, слишком узкий бюджет или район. Ослабьте одно условие — и мы найдём варианты."
        action={{ label: 'Изменить запрос', onClick: onRestart }}
        secondaryAction={{ label: 'Открыть каталог', href: '/catalog' }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl brand-gradient text-white">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight">{result.headline}</p>
            <p className="text-xs text-muted-foreground">
              Подобрано за {(result.elapsedMs / 1000).toFixed(1).replace('.', ',')} с ·
              демонстрационный движок без LLM
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={onRestart} className="shrink-0">
          <RotateCcw />
          Новый запрос
        </Button>
      </div>

      <div className="space-y-4">
        {result.recommendations.map((recommendation, index) => (
          <motion.div
            key={recommendation.venue.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <RecommendationCard recommendation={recommendation} rank={index + 1} />
          </motion.div>
        ))}
      </div>

      {result.tips.length > 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="size-4 text-warning" />
            Как получить более точную подборку
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {result.tips.map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  rank,
}: {
  recommendation: AIRecommendation;
  rank: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(rank === 1);
  const openBooking = useBookingStore((state) => state.open);
  const { venue } = recommendation;

  return (
    <article className="overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-card">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <Link href={`/venue/${venue.slug}`} className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={venue.coverImage}
            alt={venue.name}
            loading="lazy"
            className="h-40 w-full rounded-xl object-cover sm:size-32"
          />
          <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-lg bg-black/55 text-xs font-semibold text-white backdrop-blur">
            {rank}
          </span>
        </Link>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {venue.categoryName} · {venue.location.districtName}
              </p>
              <Link href={`/venue/${venue.slug}`}>
                <h3 className="truncate text-lg font-semibold tracking-tight hover:text-primary">
                  {venue.name}
                </h3>
              </Link>
            </div>

            <MatchScore score={recommendation.matchScore} />
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {recommendation.summary}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1 font-medium">
              <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={0} />
              {formatRating(venue.rating.score)}
            </span>
            <span className="text-muted-foreground">{formatReviews(venue.rating.count)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {formatPrice(venue.averagePrice)} / чел.
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium">
              ≈ {formatPrice(recommendation.estimatedTotal)} на компанию
            </span>
          </div>

          {recommendation.caveats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {recommendation.caveats.map((caveat) => (
                <Badge key={caveat} variant="warning" size="sm" className="gap-1">
                  <AlertCircle className="size-3" />
                  {caveat}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button size="sm" onClick={() => openBooking(venueToBookingTarget(venue))}>
              Забронировать
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/venue/${venue.slug}`}>Подробнее</Link>
            </Button>
            <FavoriteButton
              venueId={venue.id}
              venueName={venue.name}
              variant="outline"
              size="sm"
            />

            <button
              type="button"
              onClick={() => setIsExpanded((value) => !value)}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Почему это подходит
              <ChevronDown
                className={cn('size-3.5 transition-transform', isExpanded && 'rotate-180')}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Объяснение подбора — главное отличие от обычного списка */}
      {isExpanded ? (
        <div className="border-t bg-muted/30 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Как считался процент совпадения
          </p>
          <ul className="mt-3 space-y-2">
            {recommendation.factors.map((factor) => (
              <li key={factor.key} className="flex items-start gap-2.5 text-sm">
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md',
                    factor.kind === 'penalty'
                      ? 'bg-destructive/10 text-destructive'
                      : factor.kind === 'match'
                        ? 'bg-success/12 text-success'
                        : 'bg-primary/10 text-primary',
                  )}
                >
                  {factor.impact >= 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{factor.label}.</span>{' '}
                  <span className="text-muted-foreground">{factor.reason}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 text-xs font-semibold tabular-nums',
                    factor.impact >= 0 ? 'text-success' : 'text-destructive',
                  )}
                >
                  {factor.impact > 0 ? '+' : ''}
                  {factor.impact}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function MatchScore({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          strokeWidth="3.5"
          className="stroke-secondary"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            score >= 85 ? 'stroke-success' : score >= 70 ? 'stroke-primary' : 'stroke-warning',
          )}
        />
      </svg>
      <span className="text-xs font-semibold tabular-nums">{score}%</span>
    </div>
  );
}
