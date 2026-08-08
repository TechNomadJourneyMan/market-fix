import type { Coordinates } from '@/types';

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

/** Расстояние по формуле гаверсинуса, км. */
export function distanceKm(a: Coordinates, b: Coordinates) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export interface Bounds {
  southWest: Coordinates;
  northEast: Coordinates;
}

export function getBounds(points: Coordinates[], padding = 0.006): Bounds {
  if (points.length === 0) {
    return {
      southWest: { lat: 0, lng: 0 },
      northEast: { lat: 0, lng: 0 },
    };
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return {
    southWest: { lat: Math.min(...lats) - padding, lng: Math.min(...lngs) - padding },
    northEast: { lat: Math.max(...lats) + padding, lng: Math.max(...lngs) + padding },
  };
}

/**
 * Проекция координат в проценты внутри bounds.
 * Используется собственным демо-рендерером карты (без внешних SDK и ключей).
 * При подключении Mapbox/Google этот модуль остаётся — меняется только рендерер.
 */
export function projectToPercent(point: Coordinates, bounds: Bounds) {
  const latSpan = bounds.northEast.lat - bounds.southWest.lat || 1;
  const lngSpan = bounds.northEast.lng - bounds.southWest.lng || 1;
  return {
    // Меркатор в таком масштабе города визуально неотличим от линейной проекции.
    x: ((point.lng - bounds.southWest.lng) / lngSpan) * 100,
    y: (1 - (point.lat - bounds.southWest.lat) / latSpan) * 100,
  };
}

/** Ссылка «Доехать» — открывает маршрут в картах устройства. */
export function getDirectionsUrl(point: Coordinates, label?: string) {
  const query = label ? encodeURIComponent(label) : `${point.lat},${point.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}&destination_place_id=&query=${query}`;
}

/** Примерное время в пути пешком/на авто по прямой дистанции. */
export function estimateTravel(km: number) {
  const walkMinutes = Math.round((km / 4.5) * 60);
  const driveMinutes = Math.max(3, Math.round((km / 22) * 60));
  return { walkMinutes, driveMinutes };
}
