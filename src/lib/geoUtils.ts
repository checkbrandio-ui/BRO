/**
 * Утилиты для работы с геокоординатами и расчётом расстояний.
 */
import type { GeoCity } from './types';

/** Формула гаверсинуса — расстояние между двумя точками на Земле (км). */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/** Форматирует расстояние: "120 км" или "8 км" */
export function formatDistance(km: number | null): string {
  if (km == null) return '—';
  if (km < 1) return '< 1 км';
  return `${km} км`;
}

/** Находит ближайший пункт сбора к городу кандидата. */
export function findNearestAssemblyPoint(
  cityLat: number,
  cityLon: number,
  assemblyPoints: GeoCity[]
): { point: GeoCity; distance: number } | null {
  if (!cityLat || !cityLon || !assemblyPoints?.length) return null;

  let nearest: GeoCity | null = null;
  let minDist = Infinity;

  for (const ap of assemblyPoints) {
    if (ap.lat == null || ap.lon == null) continue;
    const dist = haversineDistance(cityLat, cityLon, ap.lat, ap.lon);
    if (dist != null && dist < minDist) {
      minDist = dist;
      nearest = ap;
    }
  }

  if (!nearest) return null;
  return { point: nearest, distance: minDist };
}