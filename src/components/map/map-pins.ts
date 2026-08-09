import L from 'leaflet';

import { PIN_FAMILY, type MapPinKind } from '@/lib/map-config';

/**
 * Иконки маркеров построены на divIcon с CSS-классами (стили — в globals.css),
 * поэтому пины автоматически следуют светлой/тёмной теме и дизайн-системе.
 *
 * Якорь всегда точка на карте: сам divIcon нулевого размера, а видимая часть
 * сдвигается в CSS через transform. Так ширина ценника не влияет на точность.
 */

const GLYPHS: Record<string, string> = {
  delivery:
    '<path d="M1 6h12v9H1z"/><path d="M13 9h4l4 4v2h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  rental:
    '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.5 12.5 20 20"/><path d="M17 17l2.5-2.5"/>',
  gifts:
    '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 14h18"/><path d="M8.5 9a2.75 2.75 0 1 1 3.5-2.75V9zM15.5 9a2.75 2.75 0 1 0-3.5-2.75V9z"/>',
  events: '<path d="M12 3l2.3 6.2L21 11l-6.7 1.8L12 19l-2.3-6.2L3 11l6.7-1.8z"/>',
  services: '<path d="M12 3l2.3 6.2L21 11l-6.7 1.8L12 19l-2.3-6.2L3 11l6.7-1.8z"/>',
  catering:
    '<path d="M4 4v6a4 4 0 0 0 8 0V4"/><path d="M8 14v7"/><path d="M17 4c2 2 2 5 0 7v10"/>',
  transport:
    '<path d="M4 16V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"/><path d="M4 16h16"/><circle cx="7.5" cy="18.5" r="1.8"/><circle cx="16.5" cy="18.5" r="1.8"/>',
  other: '<circle cx="12" cy="12" r="6"/>',
};

function glyph(kind: MapPinKind) {
  const path = GLYPHS[kind] ?? GLYPHS.other;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Кэш иконок: Leaflet допускает переиспользование одного divIcon несколькими
 * маркерами, а стабильная ссылка избавляет react-leaflet от лишних обновлений DOM.
 */
const iconCache = new Map<string, L.DivIcon>();
const MAX_CACHE = 600;

function cached(key: string, create: () => L.DivIcon) {
  const hit = iconCache.get(key);
  if (hit) return hit;
  if (iconCache.size > MAX_CACHE) iconCache.clear();
  const icon = create();
  iconCache.set(key, icon);
  return icon;
}

export interface PinOptions {
  kind: MapPinKind;
  /** Ценник для мест, короткая подпись для сервисов. */
  label: string;
  active: boolean;
  /** Точка со скидкой/акцией — маленький маркер-индикатор. */
  promo?: boolean;
  ariaLabel: string;
}

export function createPinIcon({ kind, label, active, promo, ariaLabel }: PinOptions) {
  const family = PIN_FAMILY[kind];
  const key = `pin:${family}:${kind}:${label}:${active ? 1 : 0}:${promo ? 1 : 0}:${ariaLabel}`;

  return cached(key, () =>
    L.divIcon({
      className: 'mf-pin-root',
      html: `
        <div class="mf-pin mf-pin--${family}${active ? ' is-active' : ''}" role="button" tabindex="-1" aria-label="${escapeHtml(ariaLabel)}">
          <div class="mf-pin__body">
            ${family === 'venue' ? '' : `<span class="mf-pin__glyph">${glyph(kind)}</span>`}
            <span class="mf-pin__label">${escapeHtml(label)}</span>
            ${promo ? '<span class="mf-pin__promo" aria-hidden="true"></span>' : ''}
          </div>
          <span class="mf-pin__tail" aria-hidden="true"></span>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    }),
  );
}

export function createClusterIcon(count: number, ariaLabel: string) {
  const size = count > 99 ? 52 : count > 24 ? 46 : count > 9 ? 40 : 36;
  const key = `cluster:${count}:${size}:${ariaLabel}`;

  return cached(key, () =>
    L.divIcon({
      className: 'mf-pin-root',
      html: `
        <div class="mf-cluster" style="--mf-cluster-size:${size}px" role="button" tabindex="-1" aria-label="${escapeHtml(ariaLabel)}">
          <span class="mf-cluster__count">${count > 999 ? '999+' : count}</span>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    }),
  );
}

export function createUserLocationIcon(ariaLabel: string) {
  return cached(`geo:${ariaLabel}`, () =>
    L.divIcon({
      className: 'mf-pin-root',
      html: `
        <div class="mf-geo" aria-label="${escapeHtml(ariaLabel)}">
          <span class="mf-geo__pulse" aria-hidden="true"></span>
          <span class="mf-geo__dot" aria-hidden="true"></span>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    }),
  );
}
