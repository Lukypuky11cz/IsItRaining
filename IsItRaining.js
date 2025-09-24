window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('city-form').innerHTML = `
        <input type="text" id="city-input" placeholder="Enter your city" required />
        <button type="submit">Check</button>
    `;
    createWhyDropdown();
});

let lastWeatherData = null;
let lastRainStatus = null;
let currentGeoResults = null;
let selectedLocationInfo = null;

function createWhyDropdown() {
    let whyDiv = document.getElementById('why-div');
    if (!whyDiv) {
        whyDiv = document.createElement('div');
        whyDiv.id = 'why-div';
        whyDiv.style = 'width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:32px;';
        document.body.appendChild(whyDiv);
    }
    whyDiv.innerHTML = '';
    if (lastRainStatus === null) return;
    const btn = document.createElement('button');
    btn.textContent = lastRainStatus === 'YES' ? 'Why YES?' : 'Why NO?';
    const apiRow = document.createElement('div');
    apiRow.style = 'display:flex;flex-direction:row;gap:24px;justify-content:center;width:100%;max-width:1200px;margin:0 auto;padding:0 0px;';
    const weatherApiSection = document.createElement('div');
    weatherApiSection.className = 'api-section';
    weatherApiSection.style.display = 'none';
    weatherApiSection.style.textAlign = 'left';
    weatherApiSection.style.margin = '0';
    weatherApiSection.style.flex = '1';
    const geoApiSection = document.createElement('div');
    geoApiSection.className = 'api-section';
    geoApiSection.style.display = 'none';
    geoApiSection.style.textAlign = 'left';
    geoApiSection.style.margin = '0';
    geoApiSection.style.flex = '1';
    btn.onclick = () => {
        const show = weatherApiSection.style.display === 'none';
        weatherApiSection.style.display = show ? 'block' : 'none';
        geoApiSection.style.display = show ? 'block' : 'none';
        if (show) {
            document.body.classList.add('api-expanded');
            document.documentElement.classList.add('api-expanded');
            let jsonWeather = JSON.stringify(lastWeatherData, null, 2);
            jsonWeather = jsonWeather.replace(/("weather_code":\s*)(\d+)/, (match, p1, p2) => {
                const desc = weatherCodeDescriptions[p2] ? `<span style=\"color:var(--accent);font-weight:600;\"> - ${weatherCodeDescriptions[p2]}</span>` : "";
                return `${p1}<span style=\"background:var(--primary);color:var(--text-primary);padding:4px 8px;border-radius:6px;font-weight:600;\">${p2}</span>${desc}`;
            });
            
            let locationHeader = '';
            if (selectedLocationInfo) {
                locationHeader = `<div style="background:var(--primary);color:var(--text-primary);padding:12px 16px;border-radius:8px;margin-bottom:16px;font-weight:600;">📍 ${selectedLocationInfo.name}, ${selectedLocationInfo.country}${selectedLocationInfo.admin1 ? `, ${selectedLocationInfo.admin1}` : ''}</div>`;
            }
            
            weatherApiSection.innerHTML = `<strong style="color:var(--accent);">Weather API Response</strong><br>${locationHeader}<pre style='text-align:left;margin:8px 0 0 0;color:var(--text-secondary);font-size:0.85rem;'>${jsonWeather}</pre>`;
            if (window.lastGeoData) {
                let jsonGeo = JSON.stringify(window.lastGeoData, null, 2);
                
                // Highlight the selected location in geo JSON
                if (selectedLocationInfo && selectedLocationInfo.id) {
                    const locationPattern = new RegExp(
                        `(\\{[^}]*"id":\\s*${selectedLocationInfo.id}[^}]*\\})`,
                        'g'
                    );
                    jsonGeo = jsonGeo.replace(locationPattern, '<span style="background:var(--primary);color:var(--text-primary);padding:2px 4px;border-radius:4px;font-weight:600;">$1</span>');
                }
                
                geoApiSection.innerHTML = `<strong style="color:var(--accent);">Geocoding API Response</strong><br><pre style='text-align:left;margin:8px 0 0 0;color:var(--text-secondary);font-size:0.85rem;'>${jsonGeo}</pre>`;
            } else {
                geoApiSection.innerHTML = `<strong style="color:var(--accent);">Geocoding API Response</strong><br><em style="color:var(--text-muted);">No geo data available.</em>`;
            }
        } else {
            document.body.classList.remove('api-expanded');
            document.documentElement.classList.remove('api-expanded');
        }
    };
    whyDiv.appendChild(btn);
    // Add responsive behavior for mobile
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    if (mediaQuery.matches) {
        apiRow.style.flexDirection = 'column';
        apiRow.style.gap = '16px';
    }
    apiRow.appendChild(weatherApiSection);
    apiRow.appendChild(geoApiSection);
    whyDiv.appendChild(apiRow);
}

function createLocationDropdown(geoResults) {
    const existingDropdown = document.getElementById('location-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }

    const dropdownDiv = document.createElement('div');
    dropdownDiv.id = 'location-dropdown';

    const label = document.createElement('p');
    label.textContent = 'Multiple locations found. Please select one:';

    const select = document.createElement('select');
    select.id = 'location-select';

    geoResults.forEach((result, index) => {
        const option = document.createElement('option');
        option.value = index;
        const flag = getCountryFlag(result.country_code);
        option.textContent = `${flag} ${result.name}, ${result.country}${result.admin1 ? `, ${result.admin1}` : ''}`;
        select.appendChild(option);
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Get Weather';
    confirmBtn.onclick = () => selectLocation();

    dropdownDiv.appendChild(label);
    dropdownDiv.appendChild(select);
    dropdownDiv.appendChild(confirmBtn);

    const cityForm = document.getElementById('city-form');
    cityForm.parentNode.insertBefore(dropdownDiv, cityForm.nextSibling);
}

function createWrongCountryDropdown() {
    const existingWrongDropdown = document.getElementById('wrong-country-dropdown');
    if (existingWrongDropdown) {
        existingWrongDropdown.remove();
    }

    if (!currentGeoResults || currentGeoResults.length <= 1) return;

    const dropdownDiv = document.createElement('div');
    dropdownDiv.id = 'wrong-country-dropdown';

    const label = document.createElement('p');
    label.textContent = 'Wrong city?';

    const select = document.createElement('select');
    select.id = 'wrong-country-select';

    currentGeoResults.forEach((result, index) => {
        const option = document.createElement('option');
        option.value = index;
        const flag = getCountryFlag(result.country_code);
        option.textContent = `${flag} ${result.name}, ${result.country}${result.admin1 ? `, ${result.admin1}` : ''}`;
        if (selectedLocationInfo && result.id === selectedLocationInfo.id) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Change Location';
    confirmBtn.onclick = () => changeLocation();

    dropdownDiv.appendChild(label);
    dropdownDiv.appendChild(select);
    dropdownDiv.appendChild(confirmBtn);

    const rainStatus = document.getElementById('rain-status');
    rainStatus.parentNode.insertBefore(dropdownDiv, rainStatus.nextSibling);
}

async function changeLocation() {
    const select = document.getElementById('wrong-country-select');
    const selectedIndex = select.value;
    const selectedLocation = currentGeoResults[selectedIndex];
    
    selectedLocationInfo = {
        id: selectedLocation.id,
        name: selectedLocation.name,
        country: selectedLocation.country,
        admin1: selectedLocation.admin1
    };
    
    const statusDiv = document.getElementById('rain-status');
    statusDiv.textContent = 'FETCHING';

    const wrongDropdown = document.getElementById('wrong-country-dropdown');
    if (wrongDropdown) {
        wrongDropdown.remove();
    }

    const whyDiv = document.getElementById('why-div');
    if (whyDiv) {
        whyDiv.innerHTML = '';
    }

    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${selectedLocation.latitude}&longitude=${selectedLocation.longitude}&current=weather_code&timezone=Europe%2FBerlin&forecast_days=1`);
        const weatherData = await weatherRes.json();
        const code = Number(weatherData.current?.weather_code);
        const rainCodes = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
        lastRainStatus = rainCodes.includes(code) ? 'YES' : 'NO';
        lastWeatherData = weatherData;
        statusDiv.textContent = lastRainStatus;
        createWhyDropdown();
        createWrongCountryDropdown();
        document.getElementById('ai-overview').style.display = 'block';
        document.getElementById('ai-overview-heading').style.display = 'block';
        document.getElementById('ai-overview').textContent = 'Loading AI overview...';
        try {
            const desc = weatherCodeDescriptions[code] || 'Unknown weather';
            let aiText = await fetchAIOverview(`Weather: ${desc}. Tell me shortly about this weather like you're a weatherman. Disregard any intensities or amounts. Avoid greetings.`);
            // gotta somehow clean up the response rightt
            aiText = aiText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            aiText = aiText.replace(/\s*\([^)]*\)\s*$/g, '').trim();
            const aiBox = document.getElementById('ai-overview');
            aiBox.style.textAlign = 'center';
            aiBox.textContent = aiText;
        } catch (err) {
            const aiBox = document.getElementById('ai-overview');
            aiBox.style.textAlign = 'center';
            aiBox.textContent = 'Failed to fetch AI overview.';
        }
    } catch {
        statusDiv.textContent = 'FETCH ERROR';
        lastRainStatus = null;
        lastWeatherData = null;
        createWhyDropdown();
    }
}

async function selectLocation() {
    const select = document.getElementById('location-select');
    const selectedIndex = select.value;
    const selectedLocation = currentGeoResults[selectedIndex];
    
    selectedLocationInfo = {
        id: selectedLocation.id,
        name: selectedLocation.name,
        country: selectedLocation.country,
        admin1: selectedLocation.admin1
    };
    
    const statusDiv = document.getElementById('rain-status');
    statusDiv.textContent = 'FETCHING';

    const dropdown = document.getElementById('location-dropdown');
    if (dropdown) {
        dropdown.remove();
    }

    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${selectedLocation.latitude}&longitude=${selectedLocation.longitude}&current=weather_code&timezone=Europe%2FBerlin&forecast_days=1`);
        const weatherData = await weatherRes.json();
        const code = Number(weatherData.current?.weather_code);
        const rainCodes = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
        lastRainStatus = rainCodes.includes(code) ? 'YES' : 'NO';
        lastWeatherData = weatherData;
        statusDiv.textContent = lastRainStatus;
        createWhyDropdown();
        createWrongCountryDropdown();
        document.getElementById('ai-overview').style.display = 'block';
        document.getElementById('ai-overview-heading').style.display = 'block';
        document.getElementById('ai-overview').textContent = 'Loading AI overview...';
        try {
            const desc = weatherCodeDescriptions[code] || 'Unknown weather';
            let aiText = await fetchAIOverview(`Weather: ${desc}. Write a short, clear summary of what this means for someone outside. No inside thinking. Max 30 words.`);
            aiText = aiText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            aiText = aiText.replace(/\s*\([^)]*\)\s*$/g, '').trim();
            const aiBox = document.getElementById('ai-overview');
            aiBox.style.textAlign = 'center';
            aiBox.textContent = aiText;
        } catch (err) {
            const aiBox = document.getElementById('ai-overview');
            aiBox.style.textAlign = 'center';
            aiBox.textContent = 'Failed to fetch AI overview.';
        }
    } catch {
        statusDiv.textContent = 'FETCH ERROR';
        lastRainStatus = null;
        lastWeatherData = null;
        createWhyDropdown();
    }
}

async function fetchAIOverview(message) {
    const response = await fetch('https://ai.hackclub.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: [{ role: 'user', content: message }]
        })
    });
    const data = await response.json();
    return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
        ? data.choices[0].message.content
        : 'No response from AI.';
}

document.getElementById('city-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const city = document.getElementById('city-input').value.trim();
    const statusDiv = document.getElementById('rain-status');
    statusDiv.textContent = 'FETCHING';
    
    const existingDropdown = document.getElementById('location-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    const existingWrongDropdown = document.getElementById('wrong-country-dropdown');
    if (existingWrongDropdown) {
        existingWrongDropdown.remove();
    }
    
    if (!city) return;

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10`);
        const geoData = await geoRes.json();
        window.lastGeoData = geoData;
        
        if (!geoData.results || !geoData.results.length) {
            statusDiv.textContent = 'NOT FOUND';
            lastRainStatus = null;
            lastWeatherData = null;
            currentGeoResults = null;
            createWhyDropdown();
            return;
        }

        currentGeoResults = geoData.results;
        
        const { latitude, longitude } = geoData.results[0];
        
        selectedLocationInfo = {
            id: geoData.results[0].id,
            name: geoData.results[0].name,
            country: geoData.results[0].country,
            admin1: geoData.results[0].admin1
        };
        
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code&timezone=Europe%2FBerlin&forecast_days=1`);
        const weatherData = await weatherRes.json();
        const code = Number(weatherData.current?.weather_code);
        const rainCodes = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
        lastRainStatus = rainCodes.includes(code) ? 'YES' : 'NO';
        lastWeatherData = weatherData;
        statusDiv.textContent = lastRainStatus;
        createWhyDropdown();
        createWrongCountryDropdown();
        document.getElementById('ai-overview').style.display = 'block';
        document.getElementById('ai-overview-heading').style.display = 'block';
        document.getElementById('ai-overview').textContent = 'Loading AI overview...';
        try {
            const desc = weatherCodeDescriptions[code] || 'Unknown weather';
            let aiText = await fetchAIOverview(`Weather: ${desc}. Write a summary of this weather. Max 50 words.`);
            aiText = aiText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            aiText = aiText.replace(/\s*\([^)]*\)\s*$/g, '').trim();
            const aiBox = document.getElementById('ai-overview');
            aiBox.style.textAlign = 'center';
            aiBox.textContent = aiText;
        } catch (err) {
            const aiBox = document.getElementById('ai-overview');
            aiBox.style.textAlign = 'center';
            aiBox.textContent = 'Failed to fetch AI overview.';
        }
    } catch {
        statusDiv.textContent = 'FETCH ERROR';
        lastRainStatus = null;
        lastWeatherData = null;
        currentGeoResults = null;
        selectedLocationInfo = null;
        createWhyDropdown();
    }
});

function getCountryFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    return String.fromCodePoint(...countryCode.toUpperCase().split('').map(char => 0x1F1E6 + char.charCodeAt(0) - 65));
}

const weatherCodeDescriptions = {
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