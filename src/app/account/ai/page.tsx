import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { getCurrentUser } from '@/server/repositories/users';
import { getAIAdvice } from '@/server/ai/advice';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'AI-советы' };

const KIND_META: Record<string, { label: string; className: string }> = {
  insight: { label: 'Наблюдение', className: 'bg-primary/10 text-primary' },
  saving: { label: 'Экономия', className: 'bg-success/12 text-success' },
  discovery: { label: 'Открытие', className: 'bg-accent/12 text-accent' },
  timing: { label: 'Тайминг', className: 'bg-warning/15 text-warning' },
};

export default function AiAdvicePage() {
  const user = getCurrentUser();
  const advice = getAIAdvice(user.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          AI-советы
        </h1>
        <p className="text-sm text-muted-foreground">
          Персональные наблюдения из вашей истории — как ходить чаще и тратить меньше
        </p>
      </header>

      {advice.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Пока недостаточно данных"
          description="Сделайте пару бронирований — и ассистент начнёт замечать закономерности в ваших визитах."
          action={{ label: 'Найти заведение', href: '/catalog' }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {advice.map((item) => {
            const meta = KIND_META[item.kind] ?? KIND_META.insight;
            return (
              <article
                key={item.id}
                className="flex flex-col rounded-2xl border bg-card p-5 transition-shadow hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl',
                      meta.className,
                    )}
                  >
                    <Icon name={item.icon} className="size-[18px]" />
                  </span>
                  <Badge variant="secondary" size="sm">
                    {meta.label}
                  </Badge>
                </div>

                <p className="mt-3.5 text-sm font-semibold">{item.title}</p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>

                {item.actionHref ? (
                  <Button asChild variant="ghost" size="sm" className="mt-3 -ml-2 self-start">
                    <Link href={item.actionHref}>
                      {item.actionLabel}
                      <ArrowRight />
                    </Link>
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        Советы формируются прозрачным алгоритмом на основе ваших броней, избранного и
        настроек профиля — без обращения к языковой модели. Архитектура готова к подключению
        OpenAI: заменяется только источник текста.
      </div>
    </div>
  );
}
