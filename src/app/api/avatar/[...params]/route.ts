import { getInitials, hashString } from '@/lib/utils';

/**
 * Аватары-заглушки: /api/avatar/{seed}/{size}
 * Инициалы на градиенте — читаемо и не требует внешних сервисов.
 */

const PAIRS: [string, string][] = [
  ['#6366F1', '#8B5CF6'],
  ['#F97316', '#F43F5E'],
  ['#10B981', '#14B8A6'],
  ['#0EA5E9', '#6366F1'],
  ['#F59E0B', '#F97316'],
  ['#EC4899', '#8B5CF6'],
  ['#14B8A6', '#0EA5E9'],
  ['#EF4444', '#F59E0B'],
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ params: string[] }> },
) {
  const { params: segments } = await params;
  const [rawSeed = 'guest', rawSize] = segments;
  const seed = decodeURIComponent(rawSeed);
  const size = Math.min(512, Math.max(24, Number(rawSize) || 96));

  const hash = hashString(seed);
  const [from, to] = PAIRS[hash % PAIRS.length];
  // Убираем технический суффикс вида «-3», чтобы инициалы были по имени.
  const name = seed.replace(/-\d+$/, '').replace(/-/g, ' ');
  const initials = getInitials(name) || 'Г';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${initials}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#g)" />
  <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
    font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="38" font-weight="600" fill="#ffffff" opacity="0.95">${initials}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
