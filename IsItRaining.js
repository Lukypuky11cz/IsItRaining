window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('city-form').innerHTML = `
        <input type="text" id="city-input" placeholder="Enter your city" required />
        <button type="submit">Check</button>
    `;
    createWhyDropdown();
});

let lastWeatherData = null;
let lastRainStatus = null;

function createWhyDropdown() {
    let whyDiv = document.getElementById('why-div');
    if (!whyDiv) {
        whyDiv = document.createElement('div');
        whyDiv.id = 'why-div';
        whyDiv.style = 'width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:24px;';
        document.body.appendChild(whyDiv);
    }
    whyDiv.innerHTML = '';
    if (lastRainStatus === null) return;
    const btn = document.createElement('button');
    btn.textContent = lastRainStatus === 'YES' ? 'Why YES?' : 'Why NO?';
    btn.style = 'padding:8px 24px;font-size:1.1rem;border-radius:4px;background:var(--silver);color:var(--eerie-black);border:none;cursor:pointer;box-shadow:0 2px 8px rgba(22,26,29,0.08);margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;';
    const apiRow = document.createElement('div');
    apiRow.style = 'display:flex;flex-direction:row;gap:24px;justify-content:center;width:100%;';
    const weatherApiSection = document.createElement('div');
    weatherApiSection.className = 'api-section';
    weatherApiSection.style.display = 'none';
    weatherApiSection.style.textAlign = 'left';
    weatherApiSection.style.margin = '0';
    const geoApiSection = document.createElement('div');
    geoApiSection.className = 'api-section';
    geoApiSection.style.display = 'none';
    geoApiSection.style.textAlign = 'left';
    geoApiSection.style.margin = '0';
    btn.onclick = () => {
        const show = weatherApiSection.style.display === 'none';
        weatherApiSection.style.display = show ? 'block' : 'none';
        geoApiSection.style.display = show ? 'block' : 'none';
        if (show) {
            let jsonWeather = JSON.stringify(lastWeatherData, null, 2);
            jsonWeather = jsonWeather.replace(/("weather_code":\s*)(\d+)/, (match, p1, p2) => {
                const desc = weatherCodeDescriptions[p2] ? `<span style=\"color:var(--cornell-red-2);font-weight:bold;\"> - ${weatherCodeDescriptions[p2]}</span>` : "";
                return `${p1}<span style=\"background:var(--imperial-red);color:var(--white);padding:2px 6px;border-radius:3px;\">${p2}</span>${desc}`;
            });
            weatherApiSection.innerHTML = `<strong>Weather API response:</strong><br><pre style='text-align:left;margin:0;'>${jsonWeather}</pre>`;
            if (window.lastGeoData) {
                let jsonGeo = JSON.stringify(window.lastGeoData, null, 2);
                geoApiSection.innerHTML = `<strong>Geo API response:</strong><br><pre style='text-align:left;margin:0;'>${jsonGeo}</pre>`;
            } else {
                geoApiSection.innerHTML = `<strong>Geo API response:</strong><br><em>No geo data available.</em>`;
            }
        }
    };
    whyDiv.appendChild(btn);
    apiRow.appendChild(weatherApiSection);
    apiRow.appendChild(geoApiSection);
    whyDiv.appendChild(apiRow);
}

document.getElementById('city-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const city = document.getElementById('city-input').value.trim();
    const statusDiv = document.getElementById('rain-status');
    statusDiv.textContent = 'FETCHING';
    if (!city) return;

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        const geoData = await geoRes.json();
        window.lastGeoData = geoData;
        if (!geoData.results || !geoData.results.length) {
            statusDiv.textContent = 'NOT FOUND';
            lastRainStatus = null;
            lastWeatherData = null;
            createWhyDropdown();
            return;
        }
        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code&timezone=Europe%2FBerlin&forecast_days=1`);
        const weatherData = await weatherRes.json();
        const code = Number(weatherData.current?.weather_code);
        const rainCodes = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
        lastRainStatus = rainCodes.includes(code) ? 'YES' : 'NO';
        lastWeatherData = weatherData;
        statusDiv.textContent = lastRainStatus;
        createWhyDropdown();
    } catch {
        statusDiv.textContent = 'FETCH ERROR';
        lastRainStatus = null;
        lastWeatherData = null;
        createWhyDropdown();
    }
});

const weatherCodeDescriptions = { /* source: open-meteo :) */
    0: "Clear sky",
    1: "Mainly clear, partly cloudy, and overcast",
    2: "Mainly clear, partly cloudy, and overcast",
    3: "Mainly clear, partly cloudy, and overcast",
    45: "Fog and depositing rime fog",
    48: "Fog and depositing rime fog",
    51: "Drizzle: Light, moderate, and dense intensity",
    53: "Drizzle: Light, moderate, and dense intensity",
    55: "Drizzle: Light, moderate, and dense intensity",
    56: "Freezing Drizzle: Light and dense intensity",
    57: "Freezing Drizzle: Light and dense intensity",
    61: "Rain: Slight, moderate and heavy intensity",
    63: "Rain: Slight, moderate and heavy intensity",
    65: "Rain: Slight, moderate and heavy intensity",
    66: "Freezing Rain: Light and heavy intensity",
    67: "Freezing Rain: Light and heavy intensity",
    71: "Snow fall: Slight, moderate, and heavy intensity",
    73: "Snow fall: Slight, moderate, and heavy intensity",
    75: "Snow fall: Slight, moderate, and heavy intensity",
    77: "Snow grains",
    80: "Rain showers: Slight, moderate, and violent",
    81: "Rain showers: Slight, moderate, and violent",
    82: "Rain showers: Slight, moderate, and violent",
    85: "Snow showers slight and heavy",
    86: "Snow showers slight and heavy",
    95: "Thunderstorm: Slight or moderate",
    96: "Thunderstorm with slight and heavy hail",
    99: "Thunderstorm with slight and heavy hail"
};
