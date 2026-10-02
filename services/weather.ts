import { WeatherCondition } from "../types/planner";
import { cachedSource } from "@/lib/source-cache";

const WEATHER_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function _fetchWeatherUncached(lat: number, lng: number): Promise<WeatherCondition[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relative_humidity_2m&forecast_days=1`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API responded with ${response.status}`);
  }

  const data = await response.json();
  const current = data.current_weather;

  if (!current) return [];

  // Map WMO weather code to a simple icon/type string
  // https://open-meteo.com/en/docs
  let type = "Clear";
  let iconName = "sun";

  const code = current.weathercode;
  if (code >= 1 && code <= 3) {
    type = "Partly Cloudy";
    iconName = "cloud";
  } else if (code >= 45 && code <= 48) {
    type = "Fog";
    iconName = "cloud-fog";
  } else if (code >= 51 && code <= 67) {
    type = "Rain";
    iconName = "cloud-rain";
  } else if (code >= 71 && code <= 77) {
    type = "Snow";
    iconName = "cloud-snow";
  } else if (code >= 95) {
    type = "Thunderstorm";
    iconName = "cloud-lightning";
  }

  const humidity = data.hourly?.relative_humidity_2m?.[0] ?? 50;
  const result: WeatherCondition = {
    temp: current.temperature,
    windSpeed: current.windspeed,
    type: type,
    iconName: iconName,
    humidity: humidity,
  };

  return [result];
}

export async function getWeather(lat: number, lng: number): Promise<WeatherCondition | null> {
  try {
    // Round to 2 decimal places (~1 km) for cache key grouping
    const cacheKey = `weather:${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const cached = cachedSource<WeatherCondition>(
      cacheKey,
      () => _fetchWeatherUncached(lat, lng),
      WEATHER_TTL_MS
    );
    const results = await cached();
    return results[0] ?? null;
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
}
