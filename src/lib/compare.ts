import type { RatingFactorKey, RatingSnapshot, Venue, VenueListItem } from '@/types';
import { getCuisineNames } from '@/server/mappers';

export const RATING_CRITERIA: {
  key: RatingFactorKey;
  label: string;
  description: string;
}[] = [
  { key: 'food', label: 'Еда / качество', description: 'Вкус, свежесть, подача' },
  { key: 'service', label: 'Обслуживание', description: 'Персонал и скорость' },
  { key: 'value', label: 'Цена / качество', description: 'Не награждает дороговизну' },
  { key: 'atmosphere', label: 'Атмосфера', description: 'Настроение и комфорт' },
  { key: 'cleanliness', label: 'Чистота', description: 'Гигиена зала и санузлов' },
  { key: 'location', label: 'Локация', description: 'Удобство района' },
  { key: 'booking', label: 'Бронирование', description: 'Опыт записи через платформу' },
  { key: 'reliability', label: 'Надёжность', description: 'Отмены и no-show' },
  { key: 'review_quality', label: 'Качество отзывов', description: 'Достоверность сигналов' },
];

export function factorScore(snapshot: RatingSnapshot | null | undefined, key: RatingFactorKey) {
  return snapshot?.factors.find((factor) => factor.key === key)?.score ?? 0;
}

export function buildCompareInsight(venues: (VenueListItem & { snapshot?: RatingSnapshot | null })[]) {
  if (venues.length < 2) {
    return { similar: [] as string[], different: [] as string[] };
  }

  const similar: string[] = [];
  const different: string[] = [];

  const categories = new Set(venues.map((venue) => venue.categoryName));
  if (categories.size === 1) similar.push(`Все в категории «${venues[0].categoryName}»`);
  else different.push(`Категории: ${[...categories].join(', ')}`);

  const districts = new Set(venues.map((venue) => venue.location.districtName));
  if (districts.size === 1) similar.push(`Один район — ${venues[0].location.districtName}`);
  else different.push(`Районы: ${[...districts].join(', ')}`);

  const priceLevels = new Set(venues.map((venue) => venue.priceLevel));
  if (priceLevels.size === 1) similar.push(`Одинаковый ценовой сегмент (₸×${venues[0].priceLevel})`);
  else {
    const sorted = [...venues].sort((a, b) => a.averagePrice - b.averagePrice);
    different.push(
      `Средний чек: от ${sorted[0].averagePrice.toLocaleString('ru-RU')} ₸ (${sorted[0].name}) до ${sorted[sorted.length - 1].averagePrice.toLocaleString('ru-RU')} ₸ (${sorted[sorted.length - 1].name})`,
    );
  }

  const scores = venues.map((venue) => venue.snapshot?.layers.finalScore ?? venue.rating.score * 2);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  if (maxScore - minScore <= 0.4) similar.push('Рейтинги очень близки');
  else {
    const best = venues[scores.indexOf(maxScore)];
    const worst = venues[scores.indexOf(minScore)];
    different.push(
      `Рейтинг: ${best.name} выше (${maxScore.toFixed(1)}) vs ${worst.name} (${minScore.toFixed(1)})`,
    );
  }

  for (const criterion of RATING_CRITERIA.slice(0, 5)) {
    const values = venues.map((venue) => factorScore(venue.snapshot, criterion.key));
    const spread = Math.max(...values) - Math.min(...values);
    if (spread <= 0.5) similar.push(`${criterion.label}: сопоставимо`);
    else {
      const bestIdx = values.indexOf(Math.max(...values));
      different.push(`${criterion.label}: лучше у ${venues[bestIdx].name} (${values[bestIdx].toFixed(1)})`);
    }
  }

  const amenitySets = venues.map((venue) => new Set(venue.amenities));
  const sharedAmenities = [...amenitySets[0]].filter((item) =>
    amenitySets.every((set) => set.has(item)),
  );
  if (sharedAmenities.length) {
    similar.push(`Общие удобства: ${sharedAmenities.slice(0, 4).join(', ')}`);
  }

  const cuisineSets = venues.map((venue) => new Set(getCuisineNames(venue.cuisineIds)));
  const sharedCuisines = [...cuisineSets[0]].filter((item) =>
    cuisineSets.every((set) => set.has(item)),
  );
  if (sharedCuisines.length) similar.push(`Общая кухня: ${sharedCuisines.join(', ')}`);
  else {
    const all = new Set(venues.flatMap((venue) => getCuisineNames(venue.cuisineIds)));
    if (all.size) different.push(`Кухни различаются: ${[...all].slice(0, 6).join(', ')}`);
  }

  return {
    similar: similar.slice(0, 6),
    different: different.slice(0, 8),
  };
}

export function venueCapacityLabel(venue: Venue | VenueListItem) {
  return `до ${venue.capacity}`;
}
