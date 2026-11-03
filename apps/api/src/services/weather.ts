import { getSettings } from "./settings.js";

type Cache = { at: number; key: string; summary: WeatherSummary };
let cache: Cache | null = null;

export interface WeatherSummary {
  lat: number;
  lon: number;
  label: string;
  temperatureC: number | null;
  rainMmNext24h: number;
  weatherCode: number | null;
  source: string;
}

export async function getRainMmNext24h(): Promise<number> {
  return (await getWeatherSummary()).rainMmNext24h;
}

export async function getWeatherSummary(): Promise<WeatherSummary> {
  const s = getSettings();
  const key = `${s.weatherLat},${s.weatherLon}`;
  const now = Date.now();
  if (cache && cache.key === key && now - cache.at < 15 * 60 * 1000) return cache.summary;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${s.weatherLat}` +
    `&longitude=${s.weatherLon}&current=temperature_2m,weather_code` +
    `&hourly=precipitation&forecast_days=1&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`weather ${res.status}`);
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      hourly?: { precipitation?: number[] };
    };
    const precip = data.hourly?.precipitation?.slice(0, 24) ?? [];
    const rainMm = precip.reduce((a, b) => a + (b || 0), 0);
    const summary: WeatherSummary = {
      lat: s.weatherLat,
      lon: s.weatherLon,
      label: s.weatherLabel,
      temperatureC: data.current?.temperature_2m ?? null,
      rainMmNext24h: Math.round(rainMm * 10) / 10,
      weatherCode: data.current?.weather_code ?? null,
      source: "open-meteo",
    };
    cache = { at: now, key, summary };
    return summary;
  } catch {
    return {
      lat: s.weatherLat,
      lon: s.weatherLon,
      label: s.weatherLabel,
      temperatureC: null,
      rainMmNext24h: 0,
      weatherCode: null,
      source: "fallback",
    };
  }
}
