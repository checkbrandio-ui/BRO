import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Формула Гаверсинуса для расчёта расстояния между координатами
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { city_name } = body;

    if (!city_name || typeof city_name !== 'string') {
      return Response.json({ error: 'Параметр city_name обязателен' }, { status: 400 });
    }

    const cities = await base44.asServiceRole.entities.City.list('-created_date', 500);

    // Ищем исходный город в справочнике
    const targetCity = cities.find(
      c => c.name.toLowerCase() === city_name.toLowerCase() && c.lat != null && c.lon != null
    );

    if (!targetCity) {
      // Город не найден — возвращаем список всех городов с координатами
      return Response.json({
        found: false,
        message: `Город «${city_name}» не найден в справочнике. Найдите координаты через web search и предложите админу добавить.`,
        all_cities: cities
          .filter(c => c.lat != null && c.lon != null)
          .map(c => ({ name: c.name, region: c.region, lat: c.lat, lon: c.lon }))
          .slice(0, 50),
      });
    }

    // Считаем расстояния до всех остальных городов
    const withDistances = cities
      .filter(c => c.lat != null && c.lon != null && c.name.toLowerCase() !== targetCity.name.toLowerCase())
      .map(c => ({
        name: c.name,
        region: c.region || '',
        lat: c.lat,
        lon: c.lon,
        distance_km: Math.round(haversine(targetCity.lat, targetCity.lon, c.lat, c.lon)),
      }))
      .filter(c => c.distance_km != null && !isNaN(c.distance_km))
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 10);

    return Response.json({
      found: true,
      city: { name: targetCity.name, region: targetCity.region, lat: targetCity.lat, lon: targetCity.lon },
      nearest_cities: withDistances,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});