import type { Entity } from './common';

/** Имя иконки из lucide-react. Резолвится через components/ui/icon.tsx */
export type IconName = string;

export interface Category extends Entity {
  slug: string;
  name: string;
  /** Родительный падеж для заголовков: «Лучшие рестораны» */
  namePlural: string;
  description: string;
  icon: IconName;
  /** Tailwind-классы градиента для плитки категории. */
  gradient: string;
  coverImage: string;
  venueCount: number;
  isPopular: boolean;
}

/** Кухня — вторичная таксономия, важна для AI-подбора. */
export interface Cuisine extends Entity {
  slug: string;
  name: string;
  emoji: string;
}
