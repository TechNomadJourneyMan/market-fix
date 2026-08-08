import { hashString } from '@/lib/utils';

/**
 * Генератор фото-заглушек: /api/photo/{seed}/{width}/{height}
 *
 * ТЗ требует «фотографии-заглушки». Отдаём детерминированный SVG —
 * приложение не зависит от внешних CDN и работает офлайн.
 * Чтобы подключить реальные фото, достаточно заменить поле url в данных
 * на ссылку CDN: компоненты используют обычный <img>/next/image.
 */

/** Палитры подобраны так, чтобы карточки в сетке выглядели как одна система. */
const PALETTES: [string, string, string][] = [
  ['#F97316', '#EA580C', '#7C2D12'],
  ['#6366F1', '#8B5CF6', '#312E81'],
  ['#10B981', '#059669', '#064E3B'],
  ['#F43F5E', '#E11D48', '#881337'],
  ['#0EA5E9', '#0284C7', '#0C4A6E'],
  ['#F59E0B', '#D97706', '#78350F'],
  ['#8B5CF6', '#7C3AED', '#4C1D95'],
  ['#14B8A6', '#0D9488', '#134E4A'],
  ['#EC4899', '#DB2777', '#831843'],
  ['#B45309', '#92400E', '#451A03'],
];

function buildSvg(seed: string, width: number, height: number) {
  const hash = hashString(seed);
  const palette = PALETTES[hash % PALETTES.length];
  const [c1, c2, c3] = palette;

  const angle = (hash % 360) / 360;
  const blobs = Array.from({ length: 4 }, (_, index) => {
    const local = hashString(`${seed}-${index}`);
    const cx = ((local % 100) / 100) * width;
    const cy = (((local >> 7) % 100) / 100) * height;
    const r = (0.28 + (((local >> 3) % 40) / 100)) * Math.min(width, height);
    const color = [c1, c2, c3][index % 3];
    const opacity = 0.35 + ((local >> 11) % 30) / 100;
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${opacity.toFixed(2)}" />`;
  }).join('');

  const stripes = Array.from({ length: 7 }, (_, index) => {
    const y = (height / 7) * index + ((hash >> index) % 12);
    return `<rect x="0" y="${y.toFixed(1)}" width="${width}" height="1.5" fill="#ffffff" opacity="0.05" />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Фото-заглушка">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${Math.cos(angle * Math.PI * 2).toFixed(3)}" y2="${Math.sin(angle * Math.PI * 2).toFixed(3)}">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="55%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </linearGradient>
    <filter id="blur" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="${(Math.min(width, height) * 0.11).toFixed(1)}" />
    </filter>
    <radialGradient id="vignette" cx="50%" cy="42%" r="78%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.42" />
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <g filter="url(#blur)">${blobs}</g>
  ${stripes}
  <rect width="${width}" height="${height}" fill="url(#vignette)" />
</svg>`;
}

function clampSize(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(2000, Math.max(40, Math.round(value)));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ params: string[] }> },
) {
  const { params: segments } = await params;
  const [seed = 'venue', rawWidth, rawHeight] = segments;

  const width = clampSize(Number(rawWidth), 800);
  const height = clampSize(Number(rawHeight), width);

  return new Response(buildSvg(seed, width, height), {
    headers: {
      'Content-Type': 'image/svg+xml',
      // Заглушки детерминированы — можно кэшировать надолго.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
