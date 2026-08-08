import type { ID } from './common';
import type { VenueListItem } from './venue';

export type Occasion =
  | 'date'
  | 'friends'
  | 'family'
  | 'business'
  | 'celebration'
  | 'solo';

export type DayPart = 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night';

export type Vibe = 'cozy' | 'lively' | 'quiet' | 'premium' | 'trendy' | 'casual';

/**
 * Запрос к AI-подбору.
 * Пример из ТЗ: итальянская кухня → до 10 000 ₸ → 8 человек → центр → вечером.
 */
export interface AIRecommendationRequest {
  cuisineIds?: ID[];
  categoryIds?: ID[];
  /** Бюджет на человека, ₸ */
  budgetPerPerson?: number;
  guests?: number;
  districtIds?: ID[];
  /** Только центральные районы. */
  centerOnly?: boolean;
  dayPart?: DayPart;
  occasion?: Occasion;
  vibes?: Vibe[];
  mustHave?: string[];
  /** Свободный текст — в демо разбирается ключевыми словами. */
  freeText?: string;
}

/** Вклад отдельного критерия в итоговый скор — это и есть «объяснимость». */
export interface AIScoreFactor {
  key: string;
  label: string;
  /** Вклад в баллах (может быть отрицательным). */
  impact: number;
  /** Пояснение для пользователя: «Итальянская кухня — точное совпадение». */
  reason: string;
  kind: 'match' | 'bonus' | 'penalty';
}

export interface AIRecommendation {
  venue: VenueListItem;
  /** Итоговое совпадение 0..100 — показываем как «96% совпадение». */
  matchScore: number;
  /** Короткий вердикт для карточки. */
  summary: string;
  factors: AIScoreFactor[];
  /** Чего не хватает — честно предупреждаем. */
  caveats: string[];
  /** Ориентировочный чек на всю компанию, ₸ */
  estimatedTotal: number;
}

export interface AIRecommendationResult {
  id: ID;
  request: AIRecommendationRequest;
  recommendations: AIRecommendation[];
  /** Заголовок-объяснение: «Нашли 5 мест для компании из 8 в центре». */
  headline: string;
  /** Подсказки, как улучшить выдачу. */
  tips: string[];
  /** Время «размышления» — имитация задержки LLM. */
  elapsedMs: number;
  /** В демо всегда 'mock'. Переключится на 'openai' при подключении LLM. */
  engine: 'mock' | 'openai';
  createdAt: string;
}

/** Персональный совет в кабинете пользователя. */
export interface AIAdvice {
  id: ID;
  title: string;
  text: string;
  icon: string;
  kind: 'insight' | 'saving' | 'discovery' | 'timing';
  actionLabel?: string;
  actionHref?: string;
}
