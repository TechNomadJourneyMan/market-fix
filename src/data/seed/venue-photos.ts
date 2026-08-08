/**
 * Курированные Unsplash-фото под теги галереи.
 * URL детерминированно выбираются по slug — SSR и клиент совпадают.
 */

type PhotoTag = 'interior' | 'food' | 'exterior' | 'event' | 'other';

const PHOTO_POOL: Record<PhotoTag, string[]> = {
  interior: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&h=800&fit=crop&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=800&fit=crop&q=80',
  ],
  exterior: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&h=800&fit=crop&q=80',
  ],
  event: [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop&q=80',
  ],
};

/** Доп. пулы по категории — чтобы бар не выглядел как fine dining. */
const CATEGORY_POOLS: Record<string, Partial<Record<PhotoTag, string[]>>> = {
  'cat-bar': {
    interior: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1200&h=800&fit=crop&q=80',
    ],
    food: [
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d0e?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=1200&h=800&fit=crop&q=80',
    ],
  },
  'cat-cafe': {
    interior: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=800&fit=crop&q=80',
    ],
    food: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504754524776-8f4f46978876?w=1200&h=800&fit=crop&q=80',
    ],
  },
  'cat-coffee': {
    interior: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=800&fit=crop&q=80',
    ],
    food: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&h=800&fit=crop&q=80',
    ],
  },
  'cat-karaoke': {
    interior: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop&q=80',
    ],
    event: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop&q=80',
    ],
  },
  'cat-banquet': {
    interior: [
      'https://images.unsplash.com/photo-1519167758481-83f29da45fce?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&h=800&fit=crop&q=80',
    ],
    event: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&h=800&fit=crop&q=80',
    ],
  },
};

function hashSeed(value: string) {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) {
    result = (result * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(result);
}

export function pickVenuePhotoUrl(
  slug: string,
  tag: PhotoTag,
  index: number,
  categoryId?: string,
): string {
  const categoryPool = categoryId ? CATEGORY_POOLS[categoryId]?.[tag] : undefined;
  const pool = categoryPool?.length ? categoryPool : PHOTO_POOL[tag];
  const fallback = PHOTO_POOL.interior;
  const source = pool.length ? pool : fallback;
  const offset = hashSeed(`${slug}:${tag}:${index}`) % source.length;
  return source[offset];
}
