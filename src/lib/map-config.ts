import type { Coordinates } from '@/types';
import { CITIES } from '@/data/seed/geo';

/**
 * Конфигурация карты. Основа — OpenStreetMap: платный API и ключи не нужны.
 * Тайлы можно подменить через env, если понадобится собственный/платный провайдер.
 */

/** Стартовая позиция — центр Алматы. */
export const ALMATY_CENTER: Coordinates = CITIES[0].center;

export const MAP_DEFAULT_ZOOM = 12;
export const MAP_MIN_ZOOM = 9;
export const MAP_MAX_ZOOM = 18;
/** Зум при фокусе на одном объекте. */
export const MAP_FOCUS_ZOOM = 16;
/** Ограничение зума при автоподгонке границ, чтобы не «влетать» в один пин. */
export const MAP_FIT_MAX_ZOOM = 15;

/** Размер ячейки кластеризации в пикселях экрана. */
export const CLUSTER_CELL_PX = 72;
/** С этого зума показываем каждый объект отдельно. */
export const CLUSTER_DISABLE_ZOOM = 17;
/** Запас вокруг видимой области при рендере маркеров (доля от размера). */
export const VIEWPORT_PADDING_RATIO = 0.25;

export interface TileProvider {
  url: string;
  attribution: string;
  subdomains: string;
  maxZoom: number;
}

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer noopener">OpenStreetMap</a>';

const CARTO_ATTRIBUTION = `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer noopener">CARTO</a>`;

/**
 * Светлые и тёмные тайлы CARTO Basemaps поверх данных OpenStreetMap:
 * приглушённая графика без визуального шума, поэтому наши пины читаются.
 * Атрибуция OSM + CARTO обязательна и выводится на карте.
 */
export const LIGHT_TILES: TileProvider = {
  url:
    process.env.NEXT_PUBLIC_MAP_TILE_URL ??
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution: process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ?? CARTO_ATTRIBUTION,
  subdomains: 'abcd',
  maxZoom: 20,
};

export const DARK_TILES: TileProvider = {
  url:
    process.env.NEXT_PUBLIC_MAP_TILE_URL_DARK ??
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ?? CARTO_ATTRIBUTION,
  subdomains: 'abcd',
  maxZoom: 20,
};

/** Резервный источник — стандартные тайлы OpenStreetMap. */
export const FALLBACK_TILES: TileProvider = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: OSM_ATTRIBUTION,
  subdomains: 'abc',
  maxZoom: 19,
};

export function getTileProvider(isDark: boolean): TileProvider {
  return isDark ? DARK_TILES : LIGHT_TILES;
}

/**
 * Типы пинов. Цветовых семейств всего три, чтобы карта не рябила:
 * места (терракота), доставка/кейтеринг (зелёный), остальные сервисы (индиго).
 */
export type MapPinKind =
  | 'venue'
  | 'delivery'
  | 'rental'
  | 'services'
  | 'gifts'
  | 'catering'
  | 'transport'
  | 'events'
  | 'other';

export type MapPinFamily = 'venue' | 'delivery' | 'service';

export const PIN_FAMILY: Record<MapPinKind, MapPinFamily> = {
  venue: 'venue',
  delivery: 'delivery',
  catering: 'delivery',
  rental: 'service',
  transport: 'service',
  services: 'service',
  gifts: 'service',
  events: 'service',
  other: 'service',
};
