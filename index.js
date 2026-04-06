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
const CURRENT_URL = "http://api.weatherapi.com/v1/current.json";



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
    const response = await axios.get(CURRENT_URL, {
      params: { key: WEATHER_API_KEY, q: encodeURIComponent(city.trim()) },
    });

    const { location, current } = response.data;
    const cityName = location.name;
    const temp = current.temp_c;
    const condition = current.condition.text;

    return res.render("index", {
      result: { city: cityName, temp, condition },
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