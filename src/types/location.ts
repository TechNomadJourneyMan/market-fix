import type { Entity, ID } from './common';

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Район города — используется в фильтрах и в AI-подборе («центр», «набережная»). */
export interface District extends Entity {
  slug: string;
  name: string;
  cityId: ID;
  /** Признак центра — AI-логика повышает вес таких районов при запросе «центр». */
  isCentral: boolean;
  center: Coordinates;
}

export interface City extends Entity {
  slug: string;
  name: string;
  country: string;
  timezone: string;
  center: Coordinates;
  /** Границы для fit-bounds карты. */
  bounds: {
    southWest: Coordinates;
    northEast: Coordinates;
  };
}

export interface Location {
  coordinates: Coordinates;
  address: string;
  cityId: ID;
  cityName: string;
  districtId: ID;
  districtName: string;
  /** Как доехать: ориентир + ближайшая станция/остановка. */
  landmark?: string;
  metro?: string;
}
