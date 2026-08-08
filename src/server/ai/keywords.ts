import type { AIRecommendationRequest, DayPart, Occasion, Vibe } from '@/types';
import { CUISINES, CATEGORIES } from '@/data/seed/categories';
import { DISTRICTS } from '@/data/seed/geo';

/**
 * Разбор свободного текста ключевыми словами.
 * Это осознанная mock-замена LLM: интерфейс parseFreeText() совпадает с тем,
 * что будет возвращать вызов OpenAI с structured output — заменить можно точечно.
 */

const DAY_PART_KEYWORDS: Record<DayPart, string[]> = {
  morning: ['утром', 'утро', 'завтрак', 'позавтракать', 'рано'],
  lunch: ['обед', 'ланч', 'пообедать', 'днём', 'бизнес-ланч'],
  afternoon: ['после обеда', 'полдник', 'днем'],
  evening: ['вечером', 'вечер', 'ужин', 'поужинать', 'на закате'],
  night: ['ночью', 'ночь', 'до утра', 'потанцевать', 'клуб'],
};

const OCCASION_KEYWORDS: Record<Occasion, string[]> = {
  date: ['свидание', 'вдвоём', 'вдвоем', 'романтик', 'девушк', 'парн'],
  friends: ['друзья', 'с друзьями', 'компанией', 'посидеть'],
  family: ['семь', 'с детьми', 'ребёнк', 'ребенк', 'родител'],
  business: ['деловой', 'встреча', 'переговор', 'партнёр', 'партнер', 'коллег'],
  celebration: ['день рождения', 'юбилей', 'свадьб', 'праздник', 'корпоратив', 'той', 'банкет'],
  solo: ['один', 'одна', 'поработать', 'ноутбук'],
};

const VIBE_KEYWORDS: Record<Vibe, string[]> = {
  cozy: ['уютн', 'камерн', 'тепл'],
  lively: ['шумн', 'весел', 'живая музыка', 'драйв'],
  quiet: ['тих', 'спокойн', 'без музыки'],
  premium: ['премиум', 'дорог', 'высок', 'изысканн', 'фешенебельн'],
  trendy: ['модн', 'трендов', 'инстаграм', 'стильн'],
  casual: ['простой', 'демократ', 'недорог', 'бюджет'],
};

const AMENITY_KEYWORDS: Record<string, string[]> = {
  parking: ['парковк', 'на машине'],
  wifi: ['wi-fi', 'wifi', 'интернет', 'розетк'],
  kids: ['с детьми', 'детск', 'ребёнк', 'ребенк'],
  pets: ['с собак', 'с животн', 'питомц'],
  terrace: ['террас', 'веранд', 'на воздухе', 'на улице'],
  vip: ['vip', 'вип', 'приватн', 'отдельный зал'],
  banquet: ['банкет', 'той', 'свадьб', 'корпоратив'],
  hookah: ['кальян'],
  halal: ['халяль', 'халал'],
  music: ['живая музыка', 'диджей', 'музык'],
};

/** «до 10 000», «10000 тенге», «бюджет 15к» */
function parseBudget(text: string): number | undefined {
  const normalized = text.replace(/\s/g, '');

  const kMatch = normalized.match(/(\d{1,3})к(?!\w)/i);
  if (kMatch) return Number(kMatch[1]) * 1000;

  const upTo = normalized.match(/до(\d{3,7})/);
  if (upTo) return Number(upTo[1]);

  const plain = normalized.match(/(\d{4,7})(тг|тенге|₸)?/);
  if (plain) {
    const value = Number(plain[1]);
    if (value >= 1000 && value <= 500000) return value;
  }
  return undefined;
}

/** «на 8 человек», «8 гостей», «нас четверо» */
function parseGuests(text: string): number | undefined {
  const match = text.match(/(\d{1,3})\s*(человек|чел|гост|персон)/i);
  if (match) return Number(match[1]);

  const words: Record<string, number> = {
    вдвоём: 2, вдвоем: 2, двое: 2, троем: 3, трое: 3,
    вчетвером: 4, четверо: 4, впятером: 5, пятеро: 5,
    вшестером: 6, шестеро: 6,
  };
  const found = Object.keys(words).find((word) => text.includes(word));
  return found ? words[found] : undefined;
}

export function parseFreeText(input: string): AIRecommendationRequest {
  const text = input.toLowerCase();
  const request: AIRecommendationRequest = { freeText: input };

  const cuisineIds = CUISINES.filter((cuisine) => {
    const stem = cuisine.name.toLowerCase().slice(0, 6);
    return text.includes(stem);
  }).map((cuisine) => cuisine.id);
  if (cuisineIds.length) request.cuisineIds = cuisineIds;

  const categoryIds = CATEGORIES.filter((category) => {
    const stem = category.name.toLowerCase().split(' ')[0].slice(0, 5);
    return text.includes(stem);
  }).map((category) => category.id);
  if (categoryIds.length) request.categoryIds = categoryIds;

  const districtIds = DISTRICTS.filter((district) =>
    text.includes(district.name.toLowerCase().slice(0, 6)),
  ).map((district) => district.id);
  if (districtIds.length) request.districtIds = districtIds;

  if (text.includes('центр')) request.centerOnly = true;

  const budget = parseBudget(text);
  if (budget) request.budgetPerPerson = budget;

  const guests = parseGuests(text);
  if (guests) request.guests = guests;

  const dayPart = (Object.keys(DAY_PART_KEYWORDS) as DayPart[]).find((part) =>
    DAY_PART_KEYWORDS[part].some((keyword) => text.includes(keyword)),
  );
  if (dayPart) request.dayPart = dayPart;

  const occasion = (Object.keys(OCCASION_KEYWORDS) as Occasion[]).find((item) =>
    OCCASION_KEYWORDS[item].some((keyword) => text.includes(keyword)),
  );
  if (occasion) request.occasion = occasion;

  const vibes = (Object.keys(VIBE_KEYWORDS) as Vibe[]).filter((vibe) =>
    VIBE_KEYWORDS[vibe].some((keyword) => text.includes(keyword)),
  );
  if (vibes.length) request.vibes = vibes;

  const mustHave = Object.keys(AMENITY_KEYWORDS).filter((amenity) =>
    AMENITY_KEYWORDS[amenity].some((keyword) => text.includes(keyword)),
  );
  if (mustHave.length) request.mustHave = mustHave;

  return request;
}
