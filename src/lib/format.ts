import type { PriceLevel } from '@/types';

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

/** 12 500 ₸ */
export function formatPrice(amount: number, withCurrency = true) {
  const value = priceFormatter.format(Math.round(amount));
  return withCurrency ? `${value} ₸` : value;
}

/** 12,5 тыс ₸ — для компактных мест (аналитика, бейджи). */
export function formatPriceCompact(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} млн ₸`;
  if (amount >= 10_000) return `${Math.round(amount / 1000)} тыс ₸`;
  return formatPrice(amount);
}

export function formatNumber(value: number) {
  return priceFormatter.format(value);
}

export function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (value >= 1_000) return `${(value / 1000).toFixed(1).replace('.', ',')}K`;
  return String(value);
}

export function formatPercent(value: number, fractionDigits = 0) {
  return `${(value * 100).toFixed(fractionDigits).replace('.', ',')}%`;
}

/** 4,8 — рейтинг всегда с одним знаком. */
export function formatRating(score: number) {
  return score.toFixed(1).replace('.', ',');
}

export function formatPriceLevel(level: PriceLevel) {
  return '₸'.repeat(level);
}

export function formatDistance(km?: number) {
  if (km === undefined) return null;
  if (km < 1) return `${Math.round(km * 1000)} м`;
  return `${km.toFixed(1).replace('.', ',')} км`;
}

const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const WEEKDAYS_FULL = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
  'Четверг', 'Пятница', 'Суббота',
];

export function getWeekdayShort(day: number) {
  return WEEKDAYS_SHORT[day];
}

export function getWeekdayFull(day: number) {
  return WEEKDAYS_FULL[day];
}

/** 12 августа */
export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`;
}

/** 12 августа 2026 */
export function formatDateFull(date: Date | string) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return `${formatDate(d)} ${d.getFullYear()}`;
}

/** пятница, 12 августа */
export function formatDateWithWeekday(date: Date | string) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return `${WEEKDAYS_FULL[d.getDay()].toLowerCase()}, ${formatDate(d)}`;
}

/** 12 августа, 19:00 */
export function formatDateTime(date: string, time: string) {
  return `${formatDate(date)}, ${time}`;
}

/** «2 дня назад» — для отзывов и уведомлений. */
export function formatRelativeTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} ${plural(diffMin, 'минуту', 'минуты', 'минут')} назад`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ${plural(diffHours, 'час', 'часа', 'часов')} назад`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ${plural(diffDays, 'день', 'дня', 'дней')} назад`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ${plural(diffMonths, 'месяц', 'месяца', 'месяцев')} назад`;
  const diffYears = Math.round(diffMonths / 12);
  return `${diffYears} ${plural(diffYears, 'год', 'года', 'лет')} назад`;
}

/** Русская плюрализация: 1 гость / 2 гостя / 5 гостей */
export function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function formatGuests(count: number) {
  return `${count} ${plural(count, 'гость', 'гостя', 'гостей')}`;
}

export function formatReviews(count: number) {
  return `${formatNumber(count)} ${plural(count, 'отзыв', 'отзыва', 'отзывов')}`;
}

export function formatVenues(count: number) {
  return `${formatNumber(count)} ${plural(count, 'заведение', 'заведения', 'заведений')}`;
}

/** YYYY-MM-DD → Date в локальной зоне (без сдвига UTC). */
export function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date(value);
  return new Date(year, month - 1, day);
}

/** Date → YYYY-MM-DD */
export function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** «Сегодня» / «Завтра» / «пт, 12 авг» — для чипов выбора даты. */
export function formatDateChip(date: Date, today = new Date()) {
  const key = toDateKey(date);
  if (key === toDateKey(today)) return 'Сегодня';
  if (key === toDateKey(addDays(today, 1))) return 'Завтра';
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()].slice(0, 3)}`;
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 11) return phone;
  return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
}

/** +12,4% / −3,1% — для дельт в аналитике. */
export function formatDelta(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(1).replace('.', ',')}%`;
}
