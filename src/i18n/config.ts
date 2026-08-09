/**
 * Локали продукта. Русский — язык по умолчанию.
 * Коды следуют BCP 47 / ISO 639-1: казахский — `kk` (не `kz`).
 */
export const LOCALES = ['ru', 'en', 'kk'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

/** Кука, в которой храним выбор пользователя. Читается и на сервере, и в браузере. */
export const LOCALE_COOKIE = 'market-fix-locale';

export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

/** Полные названия — всегда на своём языке (самоназвание). */
export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  kk: 'Қазақша',
};

/** Компактные подписи для переключателя в шапке. */
export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  ru: 'RU',
  en: 'EN',
  kk: 'KK',
};

/** Полные BCP 47 теги для Intl (числа, даты, плюрализация). */
export const INTL_LOCALES: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  kk: 'kk-KZ',
};

/** Для og:locale и атрибута lang. */
export const OG_LOCALES: Record<Locale, string> = {
  ru: 'ru_RU',
  en: 'en_US',
  kk: 'kk_KZ',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
