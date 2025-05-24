const BASE_URL = "https://api.openweathermap.org/data/2.5";
const API_KEY = process.env.EXPO_PUBLIC_OPEN_WEATHER_MAP_API_KEY || null;
const COORDINATES = {
  latitude: 46.5547,
  longitude: 15.6459,
};

type WeatherData = {
  temperature: number;
  humidity: number;
  brightness: number;
};

type ForecastEntry = {
  time: string;
  temperature: number;
  humidity: number;
  brightness: number;
};

const estimateBrightness = (forecast: string): number => {
  switch (forecast.toLowerCase()) {
    case "clear":
      return 1000;
    case "clouds":
      return 600;
    case "rain":
    case "drizzle":
      return 300;
    case "thunderstorm":
    case "snow":
      return 200;
    case "mist":
    case "fog":
    case "haze":
      return 400;
    default:
      return 500;
  }
};

export const fetchCurrentWeather = async (): Promise<WeatherData | null> => {
  if (!API_KEY) {
    console.error("Manjka API ključ za OpenWeather.");
    return null;
  }

  try {
    const res = await fetch(
      `${BASE_URL}/weather?lat=${COORDINATES.latitude}&lon=${COORDINATES.longitude}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();

    const forecast = data?.weather?.[0]?.main;
    if (!forecast || !data.main)
      throw new Error("Neveljavni podatki iz API-ja");

    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      brightness: estimateBrightness(forecast),
    };
  } catch (err) {
    console.error("Napaka pri fetchCurrentWeather:", err);
    return null;
  }
};

export const fetchWeatherForecast = async (): Promise<ForecastEntry[]> => {
  if (!API_KEY) {
    console.error("Manjka API ključ za OpenWeather.");
    return [];
  }

  try {
    const res = await fetch(
      `${BASE_URL}/forecast?lat=${COORDINATES.latitude}&lon=${COORDINATES.longitude}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();

    return data.list.slice(0, 5).map((entry: any) => ({
      time: entry.dt_txt,
      temp: entry.main.temp,
      humidity: entry.main.humidity,
      brightness: estimateBrightness(entry.weather[0].main),
    }));
  } catch (err) {
    console.error("Napaka pri fetchWeatherForecast:", err);
    return [];
  }
};
