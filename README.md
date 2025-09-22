# IsItRaining

A straightforward web app that instantly tells you if it's raining in your city, using real-time weather data. 
> Inspired by [isitchristmas.com](https://isitchristmas.com).
---
## How it works:

1. Enter a city name and submit.
2. The app uses Open-Meteo's APIs to get the location and fetch the weather from there.
4. If the weather code means rain, it shows YES. Otherwise, it shows NO.
---
## APIs Used

All data is fetched live from public APIs. No account or API key needed.
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — to convert city names to coordinates.
- [Open-Meteo Weather API](https://open-meteo.com/en/docs) — to get current weather codes for those coordinates.

---

## Weather Codes Reference

| Code      | Description                                         |
|-----------|-----------------------------------------------------|
| 0         | Clear sky                                           |
| 1-3       | Mainly clear, partly cloudy, and overcast           |
| 45,48     | Fog and depositing rime fog                         |
| 51,53,55  | Drizzle: Light, moderate, and dense intensity       |
| 56,57     | Freezing Drizzle: Light and dense intensity         |
| 61,63,65  | Rain: Slight, moderate and heavy intensity          |
| 66,67     | Freezing Rain: Light and heavy intensity            |
| 71,73,75  | Snow fall: Slight, moderate, and heavy intensity    |
| 77        | Snow grains                                         |
| 80,81,82  | Rain showers: Slight, moderate, and violent         |
| 85,86     | Snow showers slight and heavy                       |
| 95        | Thunderstorm: Slight or moderate                    |
| 96,99     | Thunderstorm with slight and heavy hail             |

