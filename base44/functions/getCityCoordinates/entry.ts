import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Геокодирует название города → координаты (lat, lon, region).
 * 1. Ищет в справочнике City (кэш)
 * 2. Если нет — обращается к Nominatim (OpenStreetMap), сохраняет в City
 * 3. Если Nominatim не нашёл — fallback на InvokeLLM
 *
 * Принимает: { city: string }
 * Возвращает: { lat, lon, region, source } или { error }
 */
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { city } = body;

    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      return Response.json({ error: 'city обязателен (минимум 2 символа)' }, { status: 400 });
    }

    const cityName = city.trim();
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // 1. Проверяем кэш — точное совпадение по имени (без учёта регистра)
    const cached = await sr.entities.City.list('-created_date', 500);
    const hit = cached.find(c => c.name && c.name.toLowerCase() === cityName.toLowerCase());
    if (hit && hit.lat != null && hit.lon != null) {
      return Response.json({
        lat: hit.lat,
        lon: hit.lon,
        region: hit.region || '',
        source: hit.source || 'cache',
        cached: true,
      });
    }

    // 2. Nominatim — бесплатное геокодирование OpenStreetMap
    let coords = null;
    let region = '';
    try {
      const nominatimUrl = 'https://nominatim.openstreetmap.org/search?' +
        new URLSearchParams({
          q: cityName,
          format: 'json',
          limit: '1',
          'accept-language': 'ru',
          countrycodes: 'ru,by,kz,ua,uz,tj,kg,tm,az,am,md',
        }).toString();

      const resp = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'Bratouverie-SNB/1.0 (recruitment platform)',
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
          // Извлекаем регион из адресных компонентов
          const addr = data[0].address || {};
          region = addr.state || addr.region || addr.province || addr.city || cityName;
        }
      }
    } catch (nominatimErr) {
      console.error('Nominatim error:', nominatimErr.message);
    }

    // 3. Fallback на InvokeLLM если Nominatim не нашёл
    if (!coords) {
      try {
        const llmRes = await sr.integrations.Core.InvokeLLM({
          prompt: `Определи примерные географические координаты (широта и долгота) для города "${cityName}" в России или странах СНГ. Верни только JSON в формате {"lat": число, "lon": число, "region": "название региона"}. Если не знаешь — верни {"lat": null, "lon": null}.`,
          response_json_schema: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lon: { type: 'number' },
              region: { type: 'string' },
            },
          },
        });
        if (llmRes && llmRes.lat != null && llmRes.lon != null) {
          coords = { lat: llmRes.lat, lon: llmRes.lon };
          region = llmRes.region || cityName;
        }
      } catch (llmErr) {
        console.error('LLM geocode error:', llmErr.message);
      }
    }

    if (!coords) {
      return Response.json({
        error: 'Не удалось определить координаты города',
        city: cityName,
      }, { status: 404 });
    }

    // Сохраняем в кэш
    try {
      await sr.entities.City.create({
        name: cityName,
        region: region || '',
        lat: coords.lat,
        lon: coords.lon,
        source: 'nominatim',
      });
    } catch (cacheErr) {
      // Ошибка кэширования не критична — координаты уже получены
      console.error('City cache save failed:', cacheErr.message);
    }

    return Response.json({
      lat: coords.lat,
      lon: coords.lon,
      region: region || '',
      source: 'nominatim',
      cached: false,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});