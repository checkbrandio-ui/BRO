import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Поиск населённых пунктов через Nominatim (OpenStreetMap) + локальный кэш City.
 * Принимает: { query: string }
 * Возвращает: { results: [{ name, region, lat, lon, source }] }
 *
 * Новые города из Nominatim автоматически кэшируются в сущности City,
 * чтобы при следующих запросах и расчётах расстояний работать без обращения к API.
 */
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return Response.json({ results: [] });
    }

    const q = query.trim();
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // 1. Локальный кэш — частичное совпадение по имени
    const cached = await sr.entities.City.list('-created_date', 500);
    const cacheLower = cached.map(c => ({
      ...c,
      _lower: (c.name || '').toLowerCase(),
    }));
    const localMatches = cacheLower
      .filter(c => c._lower.includes(q.toLowerCase()) && c.lat != null)
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        region: c.region || '',
        lat: c.lat,
        lon: c.lon,
        source: 'cache',
      }));

    // 2. Nominatim — бесплатное геокодирование OpenStreetMap
    let apiResults = [];
    try {
      const params = new URLSearchParams({
        q: q,
        format: 'json',
        limit: '8',
        addressdetails: '1',
        'accept-language': 'ru',
        countrycodes: 'ru,by,kz,ua,uz,tj,kg,tm,az,am,md',
      });

      const resp = await fetch('https://nominatim.openstreetmap.org/search?' + params, {
        headers: {
          'User-Agent': 'Bratouveriye-SNB/1.0 (recruitment platform)',
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        // Фильтруем только населённые пункты (class=place), исключаем улицы/здания
        const cityTypes = new Set([
          'city', 'town', 'village', 'hamlet', 'municipality',
          'suburb', 'neighbourhood', 'quarter', 'settlement',
          'county', 'state_district', 'state', 'region',
        ]);

        apiResults = (Array.isArray(data) ? data : [])
          .filter(item => item.class === 'place' || cityTypes.has(item.addresstype))
          .map(item => {
            const addr = item.address || {};
            const name =
              addr.city || addr.town || addr.village || addr.hamlet ||
              addr.municipality || addr.settlement ||
              item.display_name?.split(',')[0]?.trim() || q;
            const region =
              addr.state || addr.region || addr.province || addr.district || '';
            return {
              name,
              region,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              source: 'nominatim',
            };
          })
          .filter(r => !isNaN(r.lat) && !isNaN(r.lon));
      }
    } catch (nominatimErr) {
      console.error('Nominatim search error:', nominatimErr.message);
    }

    // 3. Объединяем, дедуплицируем по имени (без учёта регистра)
    const seen = new Set();
    const combined = [];

    for (const m of localMatches) {
      const key = m.name.toLowerCase();
      if (!seen.has(key)) { seen.add(key); combined.push(m); }
    }
    for (const m of apiResults) {
      const key = m.name.toLowerCase();
      if (!seen.has(key)) { seen.add(key); combined.push(m); }
    }

    // 4. Кэшируем новые города из Nominatim (параллельно, ошибки игнорируем)
    const newCities = apiResults.filter(r =>
      !cacheLower.some(c => c._lower === r.name.toLowerCase())
    );

    if (newCities.length > 0) {
      await Promise.allSettled(newCities.map(c =>
        sr.entities.City.create({
          name: c.name,
          region: c.region || '',
          lat: c.lat,
          lon: c.lon,
          source: 'nominatim',
        })
      ));
    }

    return Response.json({ results: combined.slice(0, 10) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});