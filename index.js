import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── WeatherAPI config ─────────────────────────────────────────────────────
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "DEMO_KEY";
const FORECAST_URL = "http://api.weatherapi.com/v1/forecast.json";



// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.render("index", { result: null, error: null, query: "" });
});

app.post("/check", async (req, res) => {
  const { city } = req.body;
  if (!city || !city.trim()) {
    return res.render("index", {
      result: null,
      error: "Please enter a city name.",
      query: "",
    });
  }

  try {
    const response = await axios.get(FORECAST_URL, {
      params: {
        key: WEATHER_API_KEY,
        q: city.trim(),
        days: 2,
        aqi: "no",
        alerts: "no",
      },
    });

    const { location, forecast } = response.data;
    const tomorrowForecast = forecast?.forecastday?.[1];

    if (!tomorrowForecast) {
      throw new Error("Forecast data for tomorrow is unavailable.");
    }

    const day = tomorrowForecast.day;
    const maxPop = Number(day.daily_chance_of_rain ?? 0);
    const totalRainMm = Number(day.totalprecip_mm ?? 0);
    const conditionText = day.condition.text;
    const willRain = maxPop > 30 || /rain|shower|storm/i.test(conditionText);
    const intensity = willRain
      ? totalRainMm >= 15 || maxPop >= 80
        ? "heavy"
        : totalRainMm >= 5 || maxPop >= 40
        ? "moderate"
        : "light"
      : "none";

    const conditions = [];
    if (/rain|shower|storm/i.test(conditionText)) conditions.push("Rain");
    if (/cloud/i.test(conditionText)) conditions.push("Cloudy");
    if (/clear|sunny/i.test(conditionText)) conditions.push("Clear");
    if (/snow|sleet|ice/i.test(conditionText)) conditions.push("Snow");
    if (/fog|mist|haze|smoke/i.test(conditionText)) conditions.push("Foggy");
    if (conditions.length === 0) conditions.push(conditionText);

    const locationName = `${location.name}${location.region ? `, ${location.region}` : ""}`;
    const tomorrowStr = new Date(tomorrowForecast.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    return res.render("index", {
      result: {
        location: locationName,
        willRain,
        maxPop,
        totalRainMm,
        temps: {
          min: Math.round(day.mintemp_c),
          max: Math.round(day.maxtemp_c),
        },
        humidity: Math.round(day.avghumidity),
        windSpeed: Number((day.maxwind_kph / 3.6).toFixed(1)),
        intensity,
        conditions,
        tomorrowStr,
      },
      error: null,
      query: city,
    });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    const apiError = err?.response?.data?.error;
    let errorMsg = "Something went wrong fetching weather data. Please try again.";
    if (apiError) {
      if (apiError.code === 1006) {
        errorMsg = `Could not find "${city}". Try a different spelling or add a country code (e.g. "Paris, FR").`;
      } else {
        errorMsg = `API error: ${apiError.message}`;
      }
    }
    return res.render("index", {
      result: null,
      error: errorMsg,
      query: city,
    });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌧  Weather App running at http://localhost:${PORT}`);
});
