// State management
let debounceTimeout = null;
let currentCityName = '';

// DOM Elements
const appContainer = document.getElementById('appContainer');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingState = document.getElementById('loadingState');
const weatherContent = document.getElementById('weatherContent');

// Today's Card DOM Elements
const cityNameEl = document.getElementById('cityName');
const currentDateEl = document.getElementById('currentDate');
const currentTempEl = document.getElementById('currentTemp');
const weatherIconContainer = document.getElementById('weatherIconContainer');
const weatherDescEl = document.getElementById('weatherDesc');
const apparentTempEl = document.getElementById('apparentTemp');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('windSpeed');
const uvIndexEl = document.getElementById('uvIndex');
const hourlyContainer = document.getElementById('hourlyContainer');

// Tomorrow's Card DOM Elements
const tomorrowDateEl = document.getElementById('tomorrowDate');
const tomorrowTempMaxEl = document.getElementById('tomorrowTempMax');
const tomorrowTempMinEl = document.getElementById('tomorrowTempMin');
const tomorrowIconContainer = document.getElementById('tomorrowIconContainer');
const tomorrowDescEl = document.getElementById('tomorrowDesc');
const tomorrowWindEl = document.getElementById('tomorrowWind');
const tomorrowCodeEl = document.getElementById('tomorrowCode');

// Init Lucide Icons on startup
lucide.createIcons();

// Event Listeners
searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (value.length > 0) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
        hideDropdown();
    }
    
    // Debounce Geocoding Search
    clearTimeout(debounceTimeout);
    if (value.length >= 2) {
        debounceTimeout = setTimeout(() => {
            searchLocation(value);
        }, 300);
    } else {
        hideDropdown();
    }
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    hideDropdown();
    searchInput.focus();
});

// Close dropdown on click outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
        hideDropdown();
    }
});

// Search Location - Geocoding API
async function searchLocation(query) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=he&format=json`);
        if (!res.ok) throw new Error('Geocoding error');
        
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            renderAutocomplete(data.results);
        } else {
            // Try with English search if Hebrew fails or returned no results
            const enRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
            if (enRes.ok) {
                const enData = await enRes.json();
                if (enData.results && enData.results.length > 0) {
                    renderAutocomplete(enData.results);
                    return;
                }
            }
            showDropdownMessage('לא נמצאו מיקומים תואמים. נסה לחפש באנגלית.');
        }
    } catch (err) {
        console.error(err);
        showDropdownMessage('שגיאה בחיפוש המיקום.');
    }
}

function renderAutocomplete(results) {
    autocompleteDropdown.innerHTML = '';
    autocompleteDropdown.classList.remove('hidden');
    
    results.forEach(city => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        
        const name = city.name;
        const country = city.country ? `, ${city.country}` : '';
        const admin1 = city.admin1 ? ` (${city.admin1})` : '';
        const displayName = `${name}${admin1}${country}`;
        
        item.innerHTML = `
            <span class="city">${name}${admin1}</span>
            <span class="country">${city.country || ''}</span>
        `;
        
        item.addEventListener('click', () => {
            currentCityName = displayName;
            searchInput.value = name;
            hideDropdown();
            fetchWeather(city.latitude, city.longitude);
        });
        
        autocompleteDropdown.appendChild(item);
    });
}

function hideDropdown() {
    autocompleteDropdown.classList.add('hidden');
    autocompleteDropdown.innerHTML = '';
}

function showDropdownMessage(msg) {
    autocompleteDropdown.innerHTML = `<div style="padding: 1rem; color: rgba(255,255,255,0.6); text-align: center; font-size: 0.9rem;">${msg}</div>`;
    autocompleteDropdown.classList.remove('hidden');
}

// Fetch Weather Data
async function fetchWeather(lat, lon) {
    showLoading(true);
    showError(false);
    
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,wind_speed_10m_max&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather fetching error');
        
        const data = await res.json();
        renderWeather(data);
    } catch (err) {
        console.error(err);
        showError(true, 'שגיאה בקבלת נתוני מזג האוויר. נסה שוב מאוחר יותר.');
        showLoading(false);
    }
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingState.classList.remove('hidden');
        weatherContent.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
    }
}

function showError(hasError, message = '') {
    if (hasError) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        weatherContent.classList.add('hidden');
    } else {
        errorMessage.classList.add('hidden');
    }
}

// Map WMO Weather Codes to descriptions, icons, backgrounds
function getWeatherConfig(code, isDay) {
    const config = {
        desc: 'לא ידוע',
        icon: 'help-circle',
        bgClass: 'bg-default'
    };

    if (isDay === 0) {
        config.bgClass = 'bg-night';
    }

    switch (code) {
        case 0:
            config.desc = 'שמיים בהירים';
            config.icon = isDay === 0 ? 'moon' : 'sun';
            config.bgClass = isDay === 0 ? 'bg-night' : 'bg-sunny';
            break;
        case 1:
        case 2:
            config.desc = 'בהיר לרוב / מעונן חלקית';
            config.icon = isDay === 0 ? 'cloud-moon' : 'cloud-sun';
            config.bgClass = isDay === 0 ? 'bg-night' : 'bg-sunny';
            break;
        case 3:
            config.desc = 'מעונן';
            config.icon = 'cloud';
            config.bgClass = 'bg-cloudy';
            break;
        case 45:
        case 48:
            config.desc = 'ערפל';
            config.icon = 'cloud-fog';
            config.bgClass = 'bg-cloudy';
            break;
        case 51:
        case 53:
        case 55:
            config.desc = 'טפטוף קל / בינוני';
            config.icon = 'cloud-drizzle';
            config.bgClass = 'bg-rainy';
            break;
        case 56:
        case 57:
            config.desc = 'טפטוף קפוא';
            config.icon = 'cloud-snow';
            config.bgClass = 'bg-snowy';
            break;
        case 61:
        case 63:
        case 65:
            config.desc = 'גשם רגיל / חזק';
            config.icon = 'cloud-rain';
            config.bgClass = 'bg-rainy';
            break;
        case 66:
        case 67:
            config.desc = 'גשם קפוא';
            config.icon = 'cloud-hail';
            config.bgClass = 'bg-snowy';
            break;
        case 71:
        case 73:
        case 75:
        case 77:
            config.desc = 'שלג';
            config.icon = 'snowflake';
            config.bgClass = 'bg-snowy';
            break;
        case 80:
        case 81:
        case 82:
            config.desc = 'ממטרים מקומיים (גשם שוטף)';
            config.icon = 'cloud-showers-heavy';
            config.bgClass = 'bg-rainy';
            break;
        case 85:
        case 86:
            config.desc = 'ממטרי שלג קלים';
            config.icon = 'snowflake';
            config.bgClass = 'bg-snowy';
            break;
        case 95:
        case 96:
        case 99:
            config.desc = 'סופות רעמים וברקים';
            config.icon = 'cloud-lightning';
            config.bgClass = 'bg-thunderstorm';
            break;
    }
    return config;
}

// Render Weather Data
function renderWeather(data) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    
    // 1. App Background transition based on current weather config
    const currentConfig = getWeatherConfig(current.weather_code, current.is_day);
    updateAppBackground(currentConfig.bgClass);
    
    // 2. Render Today's card
    cityNameEl.textContent = currentCityName || 'מיקום נבחר';
    
    // Format Today's Date
    const todayDate = new Date(daily.time[0]);
    currentDateEl.textContent = todayDate.toLocaleDateString('he-IL', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    currentTempEl.textContent = Math.round(current.temperature_2m);
    weatherDescEl.textContent = currentConfig.desc;
    
    weatherIconContainer.innerHTML = `<i data-lucide="${currentConfig.icon}"></i>`;
    
    apparentTempEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windSpeedEl.textContent = `${Math.round(current.wind_speed_10m)} קמ"ש`;
    uvIndexEl.textContent = daily.uv_index_max[0] ? Math.round(daily.uv_index_max[0]) : '--';
    
    // 3. Render Today's Hourly Forecast (next 12 hours starting from current hour)
    renderHourly(hourly);

    // 4. Render Tomorrow's card
    const tomorrowDate = new Date(daily.time[1]);
    tomorrowDateEl.textContent = tomorrowDate.toLocaleDateString('he-IL', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    tomorrowTempMaxEl.textContent = `${Math.round(daily.temperature_2m_max[1])}°C`;
    tomorrowTempMinEl.textContent = `${Math.round(daily.temperature_2m_min[1])}°C`;
    
    const tomorrowConfig = getWeatherConfig(daily.weather_code[1], 1); // Render tomorrow with day theme
    tomorrowDescEl.textContent = tomorrowConfig.desc;
    tomorrowIconContainer.innerHTML = `<i data-lucide="${tomorrowConfig.icon}"></i>`;
    tomorrowWindEl.textContent = `${Math.round(daily.wind_speed_10m_max[1])} קמ"ש`;
    tomorrowCodeEl.textContent = `קוד WMO (${daily.weather_code[1]})`;
    
    // Create new Lucide icons
    lucide.createIcons();
    
    // Toggle content displays
    showLoading(false);
    weatherContent.classList.remove('hidden');
}

// Render Hourly bubbles
function renderHourly(hourly) {
    hourlyContainer.innerHTML = '';
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Slice 12 hours starting from the current hour
    for (let i = currentHour; i < currentHour + 12; i++) {
        // Adjust for index wrapping if needed (though Open-Meteo provides 168 hours)
        if (i >= hourly.time.length) break;
        
        const hourTime = new Date(hourly.time[i]);
        const hourStr = hourTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(hourly.temperature_2m[i]);
        const code = hourly.weather_code[i];
        
        // Assume day or night for hourly bubbles: 
        // 6:00 to 19:00 is day, others night
        const isHourDay = (hourTime.getHours() >= 6 && hourTime.getHours() < 19) ? 1 : 0;
        const config = getWeatherConfig(code, isHourDay);
        
        const bubble = document.createElement('div');
        bubble.className = 'hourly-item';
        // Highlight current hour
        if (i === currentHour) {
            bubble.style.background = 'rgba(255, 255, 255, 0.15)';
            bubble.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }
        
        bubble.innerHTML = `
            <span class="hourly-time">${i === currentHour ? 'עכשיו' : hourStr}</span>
            <i data-lucide="${config.icon}"></i>
            <span class="hourly-temp">${temp}°C</span>
        `;
        
        hourlyContainer.appendChild(bubble);
    }
}

function updateAppBackground(newBgClass) {
    // Remove all background classes
    const classes = ['bg-default', 'bg-sunny', 'bg-cloudy', 'bg-rainy', 'bg-snowy', 'bg-thunderstorm', 'bg-night'];
    classes.forEach(cls => appContainer.classList.remove(cls));
    
    // Add the new class
    appContainer.classList.add(newBgClass);
}

// Initial Fetch for Tel Aviv as default
currentCityName = 'Tel Aviv, Israel';
searchInput.value = 'Tel Aviv';
fetchWeather(32.0853, 34.7818);
