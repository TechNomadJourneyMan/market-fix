import type { MapPinKind } from '@/lib/map-config';
import type { Coordinates, VenueListItem } from '@/types';

/** Прямоугольник видимой области — для «Искать в этой области». */
export interface MapBoundsRect {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface VenueMapProps {
  venues: VenueListItem[];
  /** Точка отсчёта: демо-центр или реальная геопозиция пользователя. */
  origin?: Coordinates;
  /** true — origin получен из geolocation, рисуем «живую» точку с пульсацией. */
  originIsUser?: boolean;
  className?: string;
  /** Подсвеченный объект (наведение/выбор в списке). */
  activeVenueId?: string;
  onActiveChange?: (venueId: string | null) => void;

  /** Контрол геолокации. */
  showLocateControl?: boolean;
  locating?: boolean;
  onLocateRequest?: () => void;

  showFullscreenControl?: boolean;
  /** Компактные контролы для маленьких карт (карточка заведения). */
  compact?: boolean;

  /** Подпись-бейдж в левом нижнем углу. */
  mapLabel?: string;

  resolveHref?: (venue: VenueListItem) => string;
  /** Тип объекта → внешний вид пина и CTA в карточке. */
  resolveKind?: (venue: VenueListItem) => MapPinKind;
  /** Подпись на пине (по умолчанию — средний чек). */
  resolveLabel?: (venue: VenueListItem) => string;

  /** Поиск по текущей области карты. */
  onSearchArea?: (bounds: MapBoundsRect) => void;
  onResetArea?: () => void;
  areaFilterActive?: boolean;
  /** Действие из empty state (сброс фильтров). */
  onResetFilters?: () => void;

  /** Автоподгонка границ при смене набора объектов. По умолчанию включена. */
  autoFit?: boolean;

  /** Оставлено для совместимости: зум колесом в OSM нативный. */
  enableWheelZoom?: boolean;
}
