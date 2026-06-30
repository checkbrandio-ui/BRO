import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Геокодирует название города → координаты (lat, lon, region).
 * 1. Ищет в справочнике City (кэш)
 * 2. Если нет — ищет во встроенном справочнике городов РФ и сохраняет в City
 * 3. Fallback: InvokeLLM для редких населённых пунктов
 *
 * Принимает: { city: string }
 * Возвращает: { lat, lon, region, source } или { error }
 */

const BUILTIN_CITIES = [
  { name: "Москва", region: "Москва", lat: 55.7558, lon: 37.6172 },
  { name: "Санкт-Петербург", region: "Санкт-Петербург", lat: 59.9375, lon: 30.3086 },
  { name: "Новосибирск", region: "Новосибирская область", lat: 55.0500, lon: 82.9500 },
  { name: "Екатеринбург", region: "Свердловская область", lat: 56.8356, lon: 60.6128 },
  { name: "Казань", region: "Татарстан", lat: 55.7964, lon: 49.1089 },
  { name: "Нижний Новгород", region: "Нижегородская область", lat: 56.3269, lon: 44.0075 },
  { name: "Челябинск", region: "Челябинская область", lat: 55.1547, lon: 61.3758 },
  { name: "Омск", region: "Омская область", lat: 54.9833, lon: 73.3667 },
  { name: "Самара", region: "Самарская область", lat: 53.2028, lon: 50.1408 },
  { name: "Ростов-на-Дону", region: "Ростовская область", lat: 47.2225, lon: 39.7100 },
  { name: "Уфа", region: "Башкортостан", lat: 54.7261, lon: 55.9475 },
  { name: "Красноярск", region: "Красноярский край", lat: 56.0089, lon: 92.8719 },
  { name: "Воронеж", region: "Воронежская область", lat: 51.6717, lon: 39.2106 },
  { name: "Пермь", region: "Пермский край", lat: 58.0000, lon: 56.3167 },
  { name: "Волгоград", region: "Волгоградская область", lat: 48.7086, lon: 44.5147 },
  { name: "Краснодар", region: "Краснодарский край", lat: 45.0333, lon: 38.9667 },
  { name: "Тюмень", region: "Тюменская область", lat: 57.1500, lon: 65.5333 },
  { name: "Саратов", region: "Саратовская область", lat: 51.5333, lon: 46.0167 },
  { name: "Тольятти", region: "Самарская область", lat: 53.5089, lon: 49.4222 },
  { name: "Махачкала", region: "Дагестан", lat: 42.9667, lon: 47.4833 },
  { name: "Ижевск", region: "Удмуртия", lat: 56.8333, lon: 53.1833 },
  { name: "Барнаул", region: "Алтайский край", lat: 53.3486, lon: 83.7764 },
  { name: "Ульяновск", region: "Ульяновская область", lat: 54.3167, lon: 48.3667 },
  { name: "Иркутск", region: "Иркутская область", lat: 52.2833, lon: 104.2833 },
  { name: "Хабаровск", region: "Хабаровский край", lat: 48.4833, lon: 135.0833 },
  { name: "Ярославль", region: "Ярославская область", lat: 57.6167, lon: 39.8500 },
  { name: "Владивосток", region: "Приморский край", lat: 43.1333, lon: 131.9000 },
  { name: "Томск", region: "Томская область", lat: 56.5000, lon: 84.9667 },
  { name: "Оренбург", region: "Оренбургская область", lat: 51.7833, lon: 55.1000 },
  { name: "Кемерово", region: "Кемеровская область", lat: 55.3667, lon: 86.0667 },
  { name: "Новокузнецк", region: "Кемеровская область", lat: 53.7667, lon: 87.1333 },
  { name: "Рязань", region: "Рязанская область", lat: 54.6300, lon: 39.7425 },
  { name: "Набережные Челны", region: "Татарстан", lat: 55.6833, lon: 52.3167 },
  { name: "Астрахань", region: "Астраханская область", lat: 46.3500, lon: 48.0350 },
  { name: "Пенза", region: "Пензенская область", lat: 53.2000, lon: 45.0000 },
  { name: "Липецк", region: "Липецкая область", lat: 52.6167, lon: 39.6000 },
  { name: "Киров", region: "Кировская область", lat: 58.6000, lon: 49.6833 },
  { name: "Калининград", region: "Калининградская область", lat: 54.7003, lon: 20.4531 },
  { name: "Чебоксары", region: "Чувашия", lat: 56.1500, lon: 47.2333 },
  { name: "Тула", region: "Тульская область", lat: 54.1930, lon: 37.6170 },
  { name: "Балашиха", region: "Московская область", lat: 55.8095, lon: 37.9581 },
  { name: "Курск", region: "Курская область", lat: 51.7250, lon: 36.1810 },
  { name: "Ставрополь", region: "Ставропольский край", lat: 45.0430, lon: 41.9690 },
  { name: "Улан-Удэ", region: "Бурятия", lat: 51.8333, lon: 107.5833 },
  { name: "Тверь", region: "Тверская область", lat: 56.8580, lon: 35.9000 },
  { name: "Магнитогорск", region: "Челябинская область", lat: 53.4070, lon: 59.0000 },
  { name: "Сочи", region: "Краснодарский край", lat: 43.6000, lon: 39.7300 },
  { name: "Иваново", region: "Ивановская область", lat: 57.0000, lon: 40.9833 },
  { name: "Брянск", region: "Брянская область", lat: 53.2420, lon: 34.3610 },
  { name: "Белгород", region: "Белгородская область", lat: 50.6000, lon: 36.5800 },
  { name: "Владимир", region: "Владимирская область", lat: 56.1290, lon: 40.4080 },
  { name: "Архангельск", region: "Архангельская область", lat: 64.5400, lon: 40.5100 },
  { name: "Сургут", region: "ХМАО", lat: 61.2500, lon: 73.4167 },
  { name: "Чита", region: "Забайкальский край", lat: 52.0333, lon: 113.5000 },
  { name: "Калуга", region: "Калужская область", lat: 54.5300, lon: 36.2500 },
  { name: "Смоленск", region: "Смоленская область", lat: 54.7800, lon: 32.0500 },
  { name: "Курган", region: "Курганская область", lat: 55.4500, lon: 65.3333 },
  { name: "Вологда", region: "Вологодская область", lat: 59.2200, lon: 39.8900 },
  { name: "Саранск", region: "Мордовия", lat: 54.1833, lon: 45.1833 },
  { name: "Тамбов", region: "Тамбовская область", lat: 52.7200, lon: 41.4500 },
  { name: "Грозный", region: "Чечня", lat: 43.3170, lon: 44.8000 },
  { name: "Нижневартовск", region: "ХМАО", lat: 60.9333, lon: 76.5833 },
  { name: "Кострома", region: "Костромская область", lat: 57.7700, lon: 40.9300 },
  { name: "Нальчик", region: "Кабардино-Балкария", lat: 43.5000, lon: 43.6000 },
  { name: "Старый Оскол", region: "Белгородская область", lat: 51.2900, lon: 37.8400 },
  { name: "Прокопьевск", region: "Кемеровская область", lat: 53.8800, lon: 86.7000 },
  { name: "Йошкар-Ола", region: "Марий Эл", lat: 56.6333, lon: 47.9000 },
  { name: "Рыбинск", region: "Ярославская область", lat: 58.0500, lon: 38.8333 },
  { name: "Нижнекамск", region: "Татарстан", lat: 55.6333, lon: 51.8167 },
  { name: "Новороссийск", region: "Краснодарский край", lat: 44.7200, lon: 37.7700 },
  { name: "Сыктывкар", region: "Коми", lat: 61.6667, lon: 50.8167 },
  { name: "Шахты", region: "Ростовская область", lat: 47.7100, lon: 40.2100 },
  { name: "Братск", region: "Иркутская область", lat: 56.1510, lon: 101.6340 },
  { name: "Орёл", region: "Орловская область", lat: 52.9650, lon: 36.0800 },
  { name: "Дзержинск", region: "Нижегородская область", lat: 56.2333, lon: 43.4667 },
  { name: "Ангарск", region: "Иркутская область", lat: 52.5650, lon: 103.9000 },
  { name: "Благовещенск", region: "Амурская область", lat: 50.2900, lon: 127.5300 },
  { name: "Великий Новгород", region: "Новгородская область", lat: 58.5200, lon: 31.2700 },
  { name: "Энгельс", region: "Саратовская область", lat: 51.4800, lon: 46.1100 },
  { name: "Псков", region: "Псковская область", lat: 57.8200, lon: 28.3300 },
  { name: "Бийск", region: "Алтайский край", lat: 52.5333, lon: 85.2167 },
  { name: "Миасс", region: "Челябинская область", lat: 55.0500, lon: 60.1000 },
  { name: "Кисловодск", region: "Ставропольский край", lat: 43.9100, lon: 42.7200 },
  { name: "Королёв", region: "Московская область", lat: 55.9200, lon: 37.8500 },
  { name: "Люберцы", region: "Московская область", lat: 55.6800, lon: 37.9000 },
  { name: "Мытищи", region: "Московская область", lat: 55.9100, lon: 37.7300 },
  { name: "Красногорск", region: "Московская область", lat: 55.8300, lon: 37.3300 },
  { name: "Химки", region: "Московская область", lat: 55.8900, lon: 37.4400 },
  { name: "Подольск", region: "Московская область", lat: 55.4300, lon: 37.5400 },
  { name: "Элиста", region: "Калмыкия", lat: 46.3100, lon: 44.2700 },
  { name: "Черкесск", region: "Карачаево-Черкесия", lat: 44.2200, lon: 42.0600 },
  { name: "Майкоп", region: "Адыгея", lat: 44.6100, lon: 40.1000 },
  { name: "Абакан", region: "Хакасия", lat: 53.7200, lon: 91.4400 },
  { name: "Горно-Алтайск", region: "Алтай", lat: 51.9600, lon: 85.9600 },
  { name: "Кызыл", region: "Тыва", lat: 51.7200, lon: 94.4500 },
  { name: "Петрозаводск", region: "Карелия", lat: 61.7900, lon: 34.3700 },
  { name: "Мурманск", region: "Мурманская область", lat: 68.9700, lon: 33.0800 },
  { name: "Петропавловск-Камчатский", region: "Камчатский край", lat: 53.0200, lon: 158.6500 },
  { name: "Южно-Сахалинск", region: "Сахалинская область", lat: 46.9600, lon: 142.7300 },
  { name: "Магадан", region: "Магаданская область", lat: 59.5600, lon: 150.8000 },
  { name: "Якутск", region: "Саха (Якутия)", lat: 62.0300, lon: 129.7300 },
  { name: "Комсомольск-на-Амуре", region: "Хабаровский край", lat: 50.5500, lon: 137.0000 },
  { name: "Биробиджан", region: "Еврейская АО", lat: 48.7900, lon: 132.9200 },
  { name: "Находка", region: "Приморский край", lat: 42.8200, lon: 132.8700 },
  { name: "Уссурийск", region: "Приморский край", lat: 43.8000, lon: 131.9500 },
  { name: "Арсеньев", region: "Приморский край", lat: 44.1500, lon: 133.2800 },
  { name: "Артём", region: "Приморский край", lat: 43.3500, lon: 132.1800 },
  { name: "Большой Камень", region: "Приморский край", lat: 43.1121, lon: 132.3509 },
  { name: "Дальнегорск", region: "Приморский край", lat: 44.5500, lon: 135.5800 },
  { name: "Лесозаводск", region: "Приморский край", lat: 45.4800, lon: 133.9900 },
  { name: "Спасск-Дальний", region: "Приморский край", lat: 44.6000, lon: 132.8200 },
  { name: "Партизанск", region: "Приморский край", lat: 43.1200, lon: 132.4000 },
  { name: "Дальнереченск", region: "Приморский край", lat: 45.8700, lon: 133.7500 },
  { name: "Вяземский", region: "Хабаровский край", lat: 47.5500, lon: 134.8000 },
  { name: "Амурск", region: "Хабаровский край", lat: 50.2300, lon: 136.9000 },
  { name: "Советская Гавань", region: "Хабаровский край", lat: 48.9600, lon: 140.2800 },
  { name: "Таганрог", region: "Ростовская область", lat: 47.2100, lon: 38.9300 },
  { name: "Волжский", region: "Волгоградская область", lat: 48.7800, lon: 44.7800 },
  { name: "Волгодонск", region: "Ростовская область", lat: 47.5100, lon: 42.1900 },
  { name: "Батайск", region: "Ростовская область", lat: 47.1400, lon: 39.7500 },
  { name: "Новочеркасск", region: "Ростовская область", lat: 47.4200, lon: 40.1100 },
  { name: "Каменск-Шахтинский", region: "Ростовская область", lat: 48.3200, lon: 40.2600 },
  { name: "Азов", region: "Ростовская область", lat: 47.1000, lon: 39.4200 },
  { name: "Пятигорск", region: "Ставропольский край", lat: 44.0400, lon: 43.0600 },
  { name: "Ессентуки", region: "Ставропольский край", lat: 44.0400, lon: 42.8600 },
  { name: "Железноводск", region: "Ставропольский край", lat: 44.1400, lon: 43.0200 },
  { name: "Минеральные Воды", region: "Ставропольский край", lat: 44.2100, lon: 43.1300 },
  { name: "Армавир", region: "Краснодарский край", lat: 45.0000, lon: 41.0900 },
  { name: "Анапа", region: "Краснодарский край", lat: 44.8900, lon: 37.3200 },
  { name: "Геленджик", region: "Краснодарский край", lat: 44.5800, lon: 38.0000 },
  { name: "Туапсе", region: "Краснодарский край", lat: 44.1000, lon: 39.0700 },
  { name: "Ейск", region: "Краснодарский край", lat: 46.7000, lon: 38.2800 },
  { name: "Невинномысск", region: "Ставропольский край", lat: 44.6300, lon: 41.9700 },
];

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

    // 1. Проверяем кэш — точное совпадение
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

    // 2. Ищем во встроенном справочнике
    const builtin = BUILTIN_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (builtin) {
      // Сохраняем в кэш
      try {
        await sr.entities.City.create({
          name: builtin.name,
          region: builtin.region || '',
          lat: builtin.lat,
          lon: builtin.lon,
          source: 'builtin',
        });
      } catch (cacheErr) {
        console.error('City cache save failed:', cacheErr.message);
      }
      return Response.json({
        lat: builtin.lat,
        lon: builtin.lon,
        region: builtin.region || '',
        source: 'builtin',
        cached: false,
      });
    }

    // 3. Fallback: InvokeLLM для редких населённых пунктов
    try {
      const llmRes = await sr.integrations.Core.InvokeLLM({
        prompt: `Определи примерные географические координаты (широта и долгота) для населённого пункта "${cityName}" в России или странах СНГ. Верни только JSON в формате {"lat": число, "lon": число, "region": "название региона"}. Если не знаешь — верни {"lat": null, "lon": null}.`,
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
        try {
          await sr.entities.City.create({
            name: cityName,
            region: llmRes.region || cityName,
            lat: llmRes.lat,
            lon: llmRes.lon,
            source: 'llm',
          });
        } catch (cacheErr) {
          console.error('City cache save failed:', cacheErr.message);
        }
        return Response.json({
          lat: llmRes.lat,
          lon: llmRes.lon,
          region: llmRes.region || '',
          source: 'llm',
          cached: false,
        });
      }
    } catch (llmErr) {
      console.error('LLM geocode error:', llmErr.message);
    }

    return Response.json({
      error: 'Не удалось определить координаты города',
      city: cityName,
    }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});