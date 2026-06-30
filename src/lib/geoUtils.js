/**
 * Утилиты для работы с геокоординатами и расчётом расстояний.
 */

/**
 * Формула гаверсинуса — расстояние между двумя точками на Земле (км).
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // радиус Земли в км
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Форматирует расстояние: "120 км" или "8 км"
 */
export function formatDistance(km) {
  if (km == null) return '—';
  if (km < 1) return '< 1 км';
  return `${km} км`;
}

/**
 * Находит ближайший пункт сбора к городу кандидата.
 * @param {number} cityLat, cityLon — координаты города кандидата
 * @param {Array} assemblyPoints — список пунктов сбора с lat/lon
 * @returns {{ point, distance }} ближайший пункт и расстояние
 */
export function findNearestAssemblyPoint(cityLat, cityLon, assemblyPoints) {
  if (!cityLat || !cityLon || !assemblyPoints?.length) return null;

  let nearest = null;
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