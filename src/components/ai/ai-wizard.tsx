'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type {
  AIRecommendationRequest,
  AIRecommendationResult,
  Category,
  Cuisine,
  DayPart,
  District,
  Occasion,
  Vibe,
} from '@/types';
import { apiClient, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatPrice, formatGuests } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/primitives';
import { AiResults } from './ai-results';

const OCCASIONS: { value: Occasion; label: string; emoji: string; hint: string }[] = [
  { value: 'date', label: 'Свидание', emoji: '💛', hint: 'Тихо, красиво, на двоих' },
  { value: 'friends', label: 'С друзьями', emoji: '🍻', hint: 'Живо и без формальностей' },
  { value: 'family', label: 'С семьёй', emoji: '👨‍👩‍👧', hint: 'Детская зона и удобный вход' },
  { value: 'business', label: 'Деловая встреча', emoji: '💼', hint: 'Спокойно, есть Wi-Fi' },
  { value: 'celebration', label: 'Праздник', emoji: '🎉', hint: 'Банкет, зал, ведущий' },
  { value: 'solo', label: 'Один', emoji: '📖', hint: 'Поработать или отдохнуть' },
];

const DAY_PARTS: { value: DayPart; label: string; hint: string }[] = [
  { value: 'morning', label: 'Утром', hint: 'до 11:00' },
  { value: 'lunch', label: 'В обед', hint: '12:00–15:00' },
  { value: 'afternoon', label: 'Днём', hint: '15:00–18:00' },
  { value: 'evening', label: 'Вечером', hint: '19:00–22:00' },
  { value: 'night', label: 'Ночью', hint: 'после 23:00' },
];

const VIBES: { value: Vibe; label: string }[] = [
  { value: 'cozy', label: 'Уютно' },
  { value: 'lively', label: 'Оживлённо' },
  { value: 'quiet', label: 'Тихо' },
  { value: 'premium', label: 'Премиально' },
  { value: 'trendy', label: 'Модно' },
  { value: 'casual', label: 'По-простому' },
];

const BUDGETS = [4000, 8000, 12000, 20000, 35000];
const GUEST_PRESETS = [2, 4, 6, 8, 12, 20, 50];

const STEPS = ['Повод', 'Кухня', 'Бюджет', 'Компания', 'Район и время'] as const;

interface AiWizardProps {
  categories: Category[];
  cuisines: Cuisine[];
  districts: District[];
  initialQuery?: string;
}

export function AiWizard({ categories, cuisines, districts, initialQuery }: AiWizardProps) {
  const [step, setStep] = React.useState(0);
  const [freeText, setFreeText] = React.useState(initialQuery ?? '');
  const [request, setRequest] = React.useState<AIRecommendationRequest>({});
  const resultRef = React.useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: (payload: AIRecommendationRequest) =>
      apiClient.post<AIRecommendationResult>('/api/ai/recommend', payload),
    onSuccess: () => {
      // Прокручиваем к результатам — на мобильных они иначе остаются ниже экрана.
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        80,
      );
    },
  });

  // Автозапуск, если пришли по ссылке с готовым запросом.
  React.useEffect(() => {
    if (initialQuery) mutation.mutate({ freeText: initialQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const patch = (partial: AIRecommendationRequest) =>
    setRequest((current) => ({ ...current, ...partial }));

  const toggleInList = <K extends 'cuisineIds' | 'categoryIds' | 'districtIds' | 'vibes'>(
    key: K,
    value: string,
  ) => {
    setRequest((current) => {
      const list = (current[key] as string[] | undefined) ?? [];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...current, [key]: next.length ? next : undefined };
    });
  };

  const submit = () => {
    mutation.mutate({ ...request, freeText: freeText.trim() || undefined });
  };

  const restart = () => {
    setRequest({});
    setFreeText('');
    setStep(0);
    mutation.reset();
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-8">
      {/* ——— Свободный ввод ——— */}
      <div className="rounded-3xl border bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.06] p-5 sm:p-7">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          Опишите вечер своими словами
        </div>
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <Input
            value={freeText}
            onChange={(event) => setFreeText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
            placeholder="Итальянская кухня, до 10 000 ₸, 8 человек, центр, вечером"
            className="h-12 flex-1 text-sm"
          />
          <Button
            size="lg"
            onClick={submit}
            isLoading={mutation.isPending}
            className="shrink-0"
          >
            <Wand2 />
            Подобрать
          </Button>
        </div>
        <p className="mt-2.5 text-xs text-muted-foreground">
          Ассистент разберёт кухню, бюджет, размер компании, район и время. Можно заполнить и
          пошагово ниже — результат станет точнее.
        </p>
      </div>

      {/* ——— Пошаговый мастер ——— */}
      <div className="rounded-3xl border bg-card p-5 sm:p-7">
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              Шаг {step + 1} из {STEPS.length} · {STEPS[step]}
            </p>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              Начать заново
            </button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-[190px]"
          >
            {step === 0 ? (
              <StepBlock
                title="По какому поводу идём?"
                hint="От повода зависит формат: для свидания и для тоя нужны разные места."
              >
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {OCCASIONS.map((occasion) => (
                    <OptionCard
                      key={occasion.value}
                      isActive={request.occasion === occasion.value}
                      onClick={() =>
                        patch({
                          occasion:
                            request.occasion === occasion.value ? undefined : occasion.value,
                        })
                      }
                      title={`${occasion.emoji} ${occasion.label}`}
                      hint={occasion.hint}
                    />
                  ))}
                </div>
              </StepBlock>
            ) : null}

            {step === 1 ? (
              <StepBlock
                title="Какая кухня по душе?"
                hint="Можно выбрать несколько — подберём места, где есть хотя бы одна из них."
              >
                <div className="flex flex-wrap gap-2">
                  {cuisines.map((cuisine) => (
                    <Chip
                      key={cuisine.id}
                      isActive={request.cuisineIds?.includes(cuisine.id) ?? false}
                      onClick={() => toggleInList('cuisineIds', cuisine.id)}
                    >
                      <span aria-hidden>{cuisine.emoji}</span> {cuisine.name}
                    </Chip>
                  ))}
                </div>

                <p className="mt-5 text-xs font-medium text-muted-foreground">
                  Или выберите формат заведения
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      isActive={request.categoryIds?.includes(category.id) ?? false}
                      onClick={() => toggleInList('categoryIds', category.id)}
                    >
                      {category.name}
                    </Chip>
                  ))}
                </div>
              </StepBlock>
            ) : null}

            {step === 2 ? (
              <StepBlock
                title="Сколько готовы потратить на человека?"
                hint="Покажем места, которые укладываются в сумму. Немного дороже — тоже, но честно предупредим."
              >
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((budget) => (
                    <Chip
                      key={budget}
                      isActive={request.budgetPerPerson === budget}
                      onClick={() =>
                        patch({
                          budgetPerPerson:
                            request.budgetPerPerson === budget ? undefined : budget,
                        })
                      }
                    >
                      до {formatPrice(budget)}
                    </Chip>
                  ))}
                </div>
              </StepBlock>
            ) : null}

            {step === 3 ? (
              <StepBlock
                title="Сколько вас будет?"
                hint="От восьми человек включаем в подбор места с банкетным обслуживанием."
              >
                <div className="flex flex-wrap gap-2">
                  {GUEST_PRESETS.map((guests) => (
                    <Chip
                      key={guests}
                      isActive={request.guests === guests}
                      onClick={() =>
                        patch({ guests: request.guests === guests ? undefined : guests })
                      }
                    >
                      {guests >= 20 ? `${guests}+` : formatGuests(guests)}
                    </Chip>
                  ))}
                </div>

                <p className="mt-5 text-xs font-medium text-muted-foreground">Атмосфера</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {VIBES.map((vibe) => (
                    <Chip
                      key={vibe.value}
                      isActive={request.vibes?.includes(vibe.value) ?? false}
                      onClick={() => toggleInList('vibes', vibe.value)}
                    >
                      {vibe.label}
                    </Chip>
                  ))}
                </div>
              </StepBlock>
            ) : null}

            {step === 4 ? (
              <StepBlock
                title="Где и когда?"
                hint="Учтём расписание заведений — покажем только те, что работают в это время."
              >
                <div className="flex flex-wrap gap-2">
                  <Chip
                    isActive={Boolean(request.centerOnly)}
                    onClick={() =>
                      patch({
                        centerOnly: request.centerOnly ? undefined : true,
                        districtIds: undefined,
                      })
                    }
                  >
                    📍 Только центр
                  </Chip>
                  {districts.map((district) => (
                    <Chip
                      key={district.id}
                      isActive={request.districtIds?.includes(district.id) ?? false}
                      onClick={() => {
                        patch({ centerOnly: undefined });
                        toggleInList('districtIds', district.id);
                      }}
                    >
                      {district.name}
                    </Chip>
                  ))}
                </div>

                <p className="mt-5 text-xs font-medium text-muted-foreground">Время</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DAY_PARTS.map((part) => (
                    <Chip
                      key={part.value}
                      isActive={request.dayPart === part.value}
                      onClick={() =>
                        patch({
                          dayPart: request.dayPart === part.value ? undefined : part.value,
                        })
                      }
                    >
                      {part.label}
                      <span className="text-[10px] text-muted-foreground">{part.hint}</span>
                    </Chip>
                  ))}
                </div>
              </StepBlock>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex items-center justify-between gap-3 border-t pt-5">
          <Button
            variant="ghost"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
          >
            <ArrowLeft />
            Назад
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((value) => value + 1)}>
              Далее
              <ArrowRight />
            </Button>
          ) : (
            <Button onClick={submit} isLoading={mutation.isPending} size="lg">
              <Sparkles />
              Показать подборку
            </Button>
          )}
        </div>
      </div>

      {/* ——— Результаты ——— */}
      <div ref={resultRef} className="scroll-mt-24">
        {mutation.isPending ? <AiThinking /> : null}

        {mutation.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
            <p className="text-sm font-medium text-destructive">
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : 'Не удалось получить подборку'}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={submit}>
              Попробовать ещё раз
            </Button>
          </div>
        ) : null}

        {mutation.data && !mutation.isPending ? (
          <AiResults result={mutation.data} onRestart={restart} />
        ) : null}
      </div>
    </div>
  );
}

function StepBlock({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function OptionCard({
  isActive,
  onClick,
  title,
  hint,
}: {
  isActive: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border p-4 text-left transition-all',
        isActive
          ? 'border-primary bg-primary/[0.05] shadow-glow'
          : 'hover:border-foreground/20 hover:bg-secondary/50',
      )}
    >
      {isActive ? (
        <Check className="absolute right-3 top-3 size-4 text-primary" strokeWidth={3} />
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}

function Chip({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
        isActive
          ? 'border-primary bg-primary/10 text-primary'
          : 'hover:border-foreground/20 hover:bg-secondary',
      )}
    >
      {children}
    </button>
  );
}

const THINKING_STEPS = [
  'Разбираем ваш запрос',
  'Сверяем расписание заведений',
  'Считаем бюджет на компанию',
  'Сравниваем оценки гостей',
  'Собираем объяснения',
];

function AiThinking() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(
      () => setIndex((value) => Math.min(value + 1, THINKING_STEPS.length - 1)),
      420,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-3xl border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl brand-gradient text-white">
          <Loader2 className="size-5 animate-spin" />
        </span>
        <div>
          <p className="text-sm font-semibold">Подбираем места</p>
          <p className="text-xs text-muted-foreground">Обычно это занимает пару секунд</p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {THINKING_STEPS.map((label, stepIndex) => (
          <li
            key={label}
            className={cn(
              'flex items-center gap-2.5 text-sm transition-colors',
              stepIndex <= index ? 'text-foreground' : 'text-muted-foreground/50',
            )}
          >
            {stepIndex < index ? (
              <Check className="size-4 text-success" strokeWidth={3} />
            ) : stepIndex === index ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <span className="size-4" />
            )}
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
