import type { VenueListItem } from '@/types';

export interface ClusterNode {
  id: string;
  lat: number;
  lng: number;
  items: VenueListItem[];
}

interface ProjectedPoint {
  x: number;
  y: number;
}

/**
 * Простая сеточная кластеризация в экранных координатах.
 *
 * Точки проецируются в пиксели текущего зума и раскладываются по ячейкам
 * фиксированного размера — соседние пины сливаются в один кружок со счётчиком.
 * Алгоритм O(n), без внешних зависимостей и без пересоздания слоёв Leaflet.
 */
export function clusterVenues(
  venues: VenueListItem[],
  project: (lat: number, lng: number) => ProjectedPoint,
  cellSize: number,
): ClusterNode[] {
  if (cellSize <= 0 || venues.length === 0) {
    return venues.map(toSingleNode);
  }

  const cells = new Map<string, { items: VenueListItem[]; sumLat: number; sumLng: number }>();

  for (const venue of venues) {
    const { lat, lng } = venue.location.coordinates;
    const point = project(lat, lng);
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;

    const cell = cells.get(key);
    if (cell) {
      cell.items.push(venue);
      cell.sumLat += lat;
      cell.sumLng += lng;
    } else {
      cells.set(key, { items: [venue], sumLat: lat, sumLng: lng });
    }
  }

  const nodes: ClusterNode[] = [];

  for (const cell of cells.values()) {
    if (cell.items.length === 1) {
      nodes.push(toSingleNode(cell.items[0]));
      continue;
    }
    const count = cell.items.length;
    nodes.push({
      // Идентификатор стабилен для одного и того же набора объектов,
      // поэтому React не пересоздаёт маркер при перерисовке.
      id: `cluster:${cell.items
        .map((item) => item.id)
        .sort()
        .join(',')}`,
      lat: cell.sumLat / count,
      lng: cell.sumLng / count,
      items: cell.items,
    });
  }

  return nodes;
}

function toSingleNode(venue: VenueListItem): ClusterNode {
  return {
    id: venue.id,
    lat: venue.location.coordinates.lat,
    lng: venue.location.coordinates.lng,
    items: [venue],
  };
}

export function isCluster(node: ClusterNode) {
  return node.items.length > 1;
}
