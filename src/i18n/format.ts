import { INTL_LOCALES, type Locale } from './config';

/**
 * Локаль-зависимое форматирование чисел, цен, расстояний и дат.
 *
 * Существующий `lib/format.ts` остаётся для ru-специфичных мест и обратной
 * совместимости; здесь — версии, которые принимают локаль явно.
 */

const numberFormatters = new Map<string, Intl.NumberFormat>();

function numberFormatter(locale: Locale, options?: Intl.NumberFormatOptions) {
  const key = `${locale}:${JSON.stringify(options ?? {})}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(INTL_LOCALES[locale], {
      maximumFractionDigits: 0,
      ...options,
    });
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

export function formatNumberI18n(value: number, locale: Locale) {
  return numberFormatter(locale).format(value);
}

/** Цена в тенге: 12 500 ₸ / 12,500 ₸ — разделитель зависит от локали. */
export function formatPriceI18n(amount: number, locale: Locale, withCurrency = true) {
  const value = numberFormatter(locale).format(Math.round(amount));
  return withCurrency ? `${value} ₸` : value;
}

export function formatRatingI18n(score: number, locale: Locale) {
  return numberFormatter(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(score);
}

/**
 * Расстояние. Единицы приходят из словаря, чтобы «км»/«km» переводились,
 * а не склеивались в коде.
 */
export function formatDistanceI18n(
  km: number | undefined,
  locale: Locale,
  units: { m: string; km: string },
) {
  if (km === undefined) return null;
  if (km < 1) return `${Math.round(km * 1000)} ${units.m}`;
  return `${numberFormatter(locale, { maximumFractionDigits: 1 }).format(km)} ${units.km}`;
}

export function formatDateI18n(
  date: Date | string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
) {
  const value = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], options).format(value);
}

export function formatWeekdayI18n(
  date: Date,
  locale: Locale,
  weekday: 'short' | 'long' = 'short',
) {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], { weekday }).format(date);
}
