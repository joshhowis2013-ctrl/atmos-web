const state = { unit: "celsius", simple: false, weather: null, loading: false, savedLocations: JSON.parse(localStorage.getItem("atmos-saved-locations") || "[]") };
const ids = {
  cityName: "city-name", locationDetail: "location-detail", localTime: "local-time", dateLabel: "date-label", conditionLabel: "condition-label", heroIcon: "hero-icon",
  temperature: "temperature", feelsLike: "feels-like", highLow: "high-low", sunsetLabel: "sunset-label",
  humidity: "humidity", wind: "wind", visibility: "visibility", pressure: "pressure", forecastList: "forecast-list",
  uvIndex: "uv-index", rainChance: "rain-chance", windDirection: "wind-direction", sunriseLabel: "sunrise-label",
  comfortScore: "comfort-score", comfortCopy: "comfort-copy", insightLocation: "insight-location", humidityBar: "humidity-bar",
  rainBar: "rain-bar", uvBar: "uv-bar", humidityCopy: "humidity-copy", rainCopy: "rain-copy", uvCopy: "uv-copy",
  simpleAdvice: "simple-advice", simpleDaylight: "simple-daylight", simpleFeelsLike: "simple-feels-like", simpleRain: "simple-rain",
  simpleWind: "simple-wind", simpleHumidity: "simple-humidity", simpleSunrise: "simple-sunrise", simpleSunset: "simple-sunset",
  warningCard: "warning-card", warningIcon: "warning-icon", warningTitle: "warning-title", warningCopy: "warning-copy",
  hourlyList: "hourly-list", status: "status", locationInput: "location-input", modeLabel: "mode-label", unitToggle: "unit-toggle",
  searchButton: "search-form", toast: "toast", installButton: "install-button", savedLocations: "saved-locations", saveLocation: "save-location", suggestions: "location-suggestions"
};
const els = Object.fromEntries(Object.entries(ids).map(([name, id]) => [name, document.getElementById(id)]));
let deferredInstallPrompt;

const weatherCodes = {
  0: ["Clear skies", "☀"], 1: ["Mostly clear", "🌤"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁"],
  45: ["Foggy", "🌫"], 48: ["Foggy", "🌫"], 51: ["Light drizzle", "🌦"], 53: ["Drizzle", "🌦"], 55: ["Heavy drizzle", "🌧"],
  61: ["Light rain", "🌦"], 63: ["Rain", "🌧"], 65: ["Heavy rain", "🌧"], 71: ["Light snow", "🌨"], 73: ["Snow", "❄"], 75: ["Heavy snow", "❄"],
  80: ["Rain showers", "🌦"], 81: ["Rain showers", "🌧"], 82: ["Heavy showers", "⛈"], 95: ["Thunderstorm", "⛈"], 96: ["Storm & hail", "⛈"], 99: ["Storm & hail", "⛈"]
};

const getWeatherInfo = code => weatherCodes[code] || ["Changeable", "⛅"];
const formatTemp = value => `${Math.round(value)}°`;
const formatDay = date => new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${date}T12:00:00`));
const formatTime = date => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(date));
const convertTemp = celsius => state.unit === "celsius" ? celsius : celsius * 9 / 5 + 32;
const distance = meters => `${(meters / 1000).toFixed(1)} km`;
const compass = degrees => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8];
const uvLabel = value => value < 3 ? "Low" : value < 6 ? "Moderate" : value < 8 ? "High" : value < 11 ? "Very high" : "Extreme";
const clamp = value => Math.max(0, Math.min(100, value));
const getAdvice = (temperature, rainChance, wind) => {
  if (rainChance >= 60) return "Keep an umbrella nearby";
  if (wind >= 30) return "A breezy day — hold onto your hat";
  if (temperature >= 25) return "Great for a sunny outdoor plan";
  if (temperature <= 8) return "A warm layer will feel good today";
  return "A comfortable day outside";
};

function renderMetOfficeCheck(location) {
  const isUkLocation = location.country_code === "GB" || ["United Kingdom", "England", "Scotland", "Wales", "Northern Ireland"].includes(location.country);
  els.warningCard.classList.toggle("warning-card--notice", isUkLocation);
  els.warningIcon.textContent = isUkLocation ? "!" : "i";
  els.warningTitle.textContent = isUkLocation ? "Check for active UK warnings" : "Met Office warnings are UK-only";
  els.warningCopy.textContent = isUkLocation
    ? "This app does not have a Met Office warning API key. Check the official map before travelling or making outdoor plans."
    : "The Met Office publishes warnings for the United Kingdom. Use the local weather service for this location.";
}

function renderWarnings(warnings, location) {
  const isUkLocation = location.country_code === "GB" || ["United Kingdom", "England", "Scotland", "Wales", "Northern Ireland"].includes(location.country);
  if (!isUkLocation || warnings?.status === "not_configured") return;
  const items = Array.isArray(warnings) ? warnings : warnings?.items || warnings?.features || [];
  const warning = items[0]?.properties || items[0] || null;
  if (!warning) {
    els.warningCard.classList.remove("warning-card--notice");
    els.warningIcon.textContent = "✓";
    els.warningTitle.textContent = "No active warning reported";
    els.warningCopy.textContent = "The warnings feed is connected and did not return an active warning for this check.";
    return;
  }
  els.warningCard.classList.add("warning-card--notice");
  els.warningIcon.textContent = "!";
  els.warningTitle.textContent = warning.title || warning.event || warning.headline || "Active weather warning";
  els.warningCopy.textContent = warning.description || warning.summary || warning.areaDesc || "Check the official Met Office page for full details and affected areas.";
}

async function loadWarnings(location) {
  if (!location.country_code && !["London", "Your location"].includes(location.name)) return;
  try {
    const response = await fetch(`./api/warnings?latitude=${encodeURIComponent(location.latitude)}&longitude=${encodeURIComponent(location.longitude)}`);
    if (response.status === 404) {
      els.warningCard.classList.add("warning-card--notice");
      els.warningIcon.textContent = "i";
      els.warningTitle.textContent = "Live warnings need the optional proxy";
      els.warningCopy.textContent = "The static GitHub Pages site cannot run the private Met Office server. Use the official Met Office link for current warnings.";
      return;
    }
    const result = await response.json();
    if (result.status === "not_configured") {
      els.warningCard.classList.add("warning-card--notice");
      els.warningIcon.textContent = "i";
      els.warningTitle.textContent = "Met Office feed needs configuring";
      els.warningCopy.textContent = "Add your real warnings endpoint and rotated API key to .env, then restart Atmos Web.";
      return;
    }
    if (result.status === "upstream_error") {
      els.warningCard.classList.add("warning-card--notice");
      els.warningIcon.textContent = "!";
      els.warningTitle.textContent = "Met Office warnings unavailable";
      els.warningCopy.textContent = result.error;
      return;
    }
    if (!response.ok) return;
    renderWarnings(result, location);
  } catch (error) {
    els.warningCard.classList.add("warning-card--notice");
    els.warningIcon.textContent = "!";
    els.warningTitle.textContent = "Met Office warnings unavailable";
    els.warningCopy.textContent = "The warning proxy is not running or cannot be reached.";
  }
}

async function searchLocations(query, count = 5) {
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`);
  if (!response.ok) throw new Error("Could not search for that place.");
  const data = await response.json();
  return data.results || [];
}

async function findLocation(query) {
  const results = await searchLocations(query, 1);
  if (!results.length) throw new Error("No city found. Try another search.");
  return results[0];
}

function locationLabel(location) {
  return [location.admin1, location.country].filter(Boolean).join(", ") || "Location details unavailable";
}

function renderSuggestions(results) {
  els.suggestions.replaceChildren();
  if (!results.length) {
    els.suggestions.hidden = true;
    els.locationInput.setAttribute("aria-expanded", "false");
    return;
  }
  results.forEach((location, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "option";
    button.className = "location-suggestion";
    button.setAttribute("aria-selected", index === 0 ? "true" : "false");
    const name = document.createElement("strong");
    name.textContent = location.name;
    const detail = document.createElement("span");
    detail.textContent = [location.admin1, location.country].filter(Boolean).join(", ");
    button.append(name, detail);
    button.addEventListener("click", () => {
      els.locationInput.value = location.name;
      renderSuggestions([]);
      loadLocation(location);
    });
    els.suggestions.append(button);
  });
  els.suggestions.hidden = false;
  els.locationInput.setAttribute("aria-expanded", "true");
}

async function fetchWeather(location) {
  const params = new URLSearchParams({
    latitude: location.latitude, longitude: location.longitude, timezone: "auto",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,visibility,surface_pressure,precipitation,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max", hourly: "temperature_2m,weather_code"
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error("Weather data is unavailable right now.");
  return { location, data: await response.json() };
}

function render({ location, data }) {
  const current = data.current;
  const [condition, icon] = getWeatherInfo(current.weather_code);
  state.weather = { location, data };
  els.locationDetail.textContent = locationLabel(location);
  els.localTime.textContent = formatTime(data.current.time);
  renderSavedLocations();
  els.saveLocation.textContent = state.savedLocations.some(saved => saved.name === location.name && saved.latitude === location.latitude) ? "★" : "☆";
  els.saveLocation.setAttribute("aria-label", els.saveLocation.textContent === "★" ? "Remove saved location" : "Save this location");
  renderMetOfficeCheck(location);
  document.body.classList.toggle("night", !current.is_day);
  document.body.dataset.weather = condition.toLowerCase();
  document.querySelector(".weather-scene").classList.toggle("wet", [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(current.weather_code));
  els.cityName.textContent = location.name;
  els.dateLabel.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  els.conditionLabel.textContent = condition;
  els.heroIcon.textContent = icon;
  els.temperature.textContent = formatTemp(convertTemp(current.temperature_2m));
  els.feelsLike.textContent = formatTemp(convertTemp(current.apparent_temperature));
  els.highLow.textContent = `H ${formatTemp(convertTemp(data.daily.temperature_2m_max[0]))} · L ${formatTemp(convertTemp(data.daily.temperature_2m_min[0]))}`;
  els.sunsetLabel.textContent = `Sunset ${formatTime(data.daily.sunset[0])}`;
  els.sunriseLabel.textContent = formatTime(data.daily.sunrise[0]);
  els.humidity.textContent = `${current.relative_humidity_2m}%`;
  els.wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  els.visibility.textContent = distance(current.visibility);
  els.pressure.textContent = `${Math.round(current.surface_pressure)} hPa`;
  const rainChance = data.daily.precipitation_probability_max[0] ?? 0;
  const uvIndex = current.uv_index ?? data.daily.uv_index_max[0] ?? 0;
  els.simpleAdvice.textContent = getAdvice(current.temperature_2m, rainChance, current.wind_speed_10m);
  els.simpleDaylight.textContent = current.is_day ? "Daylight" : "Night-time";
  els.simpleFeelsLike.textContent = formatTemp(convertTemp(current.apparent_temperature));
  els.simpleRain.textContent = `${rainChance}%`;
  els.simpleWind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  els.simpleHumidity.textContent = `${current.relative_humidity_2m}%`;
  els.simpleSunrise.textContent = formatTime(data.daily.sunrise[0]);
  els.simpleSunset.textContent = formatTime(data.daily.sunset[0]);
  els.uvIndex.textContent = `${Number(uvIndex).toFixed(1)} · ${uvLabel(uvIndex)}`;
  els.rainChance.textContent = `${rainChance}%`;
  els.windDirection.textContent = `${compass(current.wind_direction_10m)} · ${Math.round(current.wind_direction_10m)}°`;
  const comfortScore = Math.round(clamp(100 - Math.abs(current.temperature_2m - 20) * 3 - Math.abs(current.relative_humidity_2m - 50) * .45 - current.wind_speed_10m * .6));
  els.comfortScore.textContent = comfortScore;
  els.comfortCopy.textContent = comfortScore >= 80 ? "A lovely day to be outside." : comfortScore >= 60 ? "Pretty comfortable with a light layer." : "Bring the right gear for changing conditions.";
  els.insightLocation.textContent = `${condition} · ${current.is_day ? "Daylight" : "Night-time"}`;
  els.humidityBar.style.width = `${current.relative_humidity_2m}%`;
  els.rainBar.style.width = `${rainChance}%`;
  els.uvBar.style.width = `${clamp(uvIndex / 11 * 100)}%`;
  els.humidityCopy.textContent = `${current.relative_humidity_2m}%`;
  els.rainCopy.textContent = `${rainChance}%`;
  els.uvCopy.textContent = uvLabel(uvIndex);
  els.forecastList.innerHTML = data.daily.time.slice(0, 7).map((day, index) => {
    const [label, dayIcon] = getWeatherInfo(data.daily.weather_code[index]);
    const rain = data.daily.precipitation_probability_max[index] ?? 0;
    return `<div class="forecast-day"><span>${index === 0 ? "Today" : formatDay(day)}</span><span class="weather-icon" title="${label}" aria-label="${label}">${dayIcon}</span><strong>${formatTemp(convertTemp(data.daily.temperature_2m_max[index]))}</strong><span class="range">↓ ${formatTemp(convertTemp(data.daily.temperature_2m_min[index]))}</span><small class="forecast-rain">☂ ${rain}%</small></div>`;
  }).join("");
  const now = new Date();
  const nextHours = data.hourly.time.map((time, index) => ({ time, index })).filter(item => new Date(item.time) >= now).slice(0, 10);
  els.hourlyList.innerHTML = nextHours.map(({ time, index }, position) => {
    const [, hourIcon] = getWeatherInfo(data.hourly.weather_code[index]);
    return `<div class="hour"><span>${position === 0 ? "Now" : formatTime(time)}</span><span class="weather-icon">${hourIcon}</span><strong>${formatTemp(convertTemp(data.hourly.temperature_2m[index]))}</strong></div>`;
  }).join("");
  els.status.textContent = `Showing weather for ${location.name}${location.country ? `, ${location.country}` : ""}`;
}

function renderSavedLocations() {
  if (!state.savedLocations.length) {
    els.savedLocations.hidden = true;
    els.savedLocations.replaceChildren();
    return;
  }
  els.savedLocations.hidden = false;
  els.savedLocations.innerHTML = `<span>Saved:</span>${state.savedLocations.map((location, index) => `<button type="button" data-saved-index="${index}">${location.name}</button>`).join("")}`;
  els.savedLocations.querySelectorAll("[data-saved-index]").forEach(button => button.addEventListener("click", async () => {
    await loadLocation(state.savedLocations[Number(button.dataset.savedIndex)]);
  }));
}

function toggleSavedLocation() {
  if (!state.weather) return;
  const { location } = state.weather;
  const existing = state.savedLocations.findIndex(saved => saved.name === location.name && saved.latitude === location.latitude);
  if (existing >= 0) {
    state.savedLocations.splice(existing, 1);
    showToast(`${location.name} removed from saved locations.`);
  } else {
    state.savedLocations.unshift({ name: location.name, country: location.country, country_code: location.country_code, latitude: location.latitude, longitude: location.longitude });
    state.savedLocations = state.savedLocations.slice(0, 6);
    showToast(`${location.name} saved.`);
  }
  localStorage.setItem("atmos-saved-locations", JSON.stringify(state.savedLocations));
  renderSavedLocations();
  render(state.weather);
}

function setLoading(loading, message = "") {
  state.loading = loading;
  document.body.classList.toggle("is-loading", loading);
  els.status.textContent = message;
  document.querySelector(".search-box button").disabled = loading;
  document.getElementById("locate-button").disabled = loading;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("visible"), 3200);
}

async function loadLocation(location) {
  setLoading(true, "Finding the latest forecast...");
  try {
    render(await fetchWeather(location));
    await loadWarnings(location);
  } catch (error) {
    els.status.textContent = error.message;
    showToast(error.message);
  } finally {
    setLoading(false);
  }
}

document.getElementById("search-form").addEventListener("submit", async event => {
  event.preventDefault();
  const query = els.locationInput.value.trim();
  if (!query) {
    els.locationInput.focus();
    showToast("Type a city name to search.");
    return;
  }
  try { await loadLocation(await findLocation(els.locationInput.value.trim())); }
  catch (error) { els.status.textContent = error.message; showToast(error.message); }
});
let suggestionTimer;
els.locationInput.addEventListener("input", () => {
  window.clearTimeout(suggestionTimer);
  const query = els.locationInput.value.trim();
  if (query.length < 2) {
    renderSuggestions([]);
    return;
  }
  suggestionTimer = window.setTimeout(async () => {
    try {
      renderSuggestions(await searchLocations(query));
    } catch {
      renderSuggestions([]);
    }
  }, 250);
});
els.locationInput.addEventListener("keydown", event => {
  if (event.key === "Escape") renderSuggestions([]);
});
document.addEventListener("click", event => {
  if (!event.target.closest(".search-box") && !event.target.closest(".location-suggestions")) renderSuggestions([]);
});
document.getElementById("locate-button").addEventListener("click", () => {
  if (!navigator.geolocation) { els.status.textContent = "Location is not supported by this browser."; showToast("Location is not supported by this browser."); return; }
  setLoading(true, "Requesting your location...");
  navigator.geolocation.getCurrentPosition(async position => {
    try {
      const { latitude, longitude } = position.coords;
      await loadLocation({ latitude, longitude, name: "Your location" });
    } catch (error) { els.status.textContent = error.message; showToast(error.message); }
  }, () => { setLoading(false); els.status.textContent = "Location permission was not granted."; showToast("Please allow location access or search for a city."); });
});
document.getElementById("mode-toggle").addEventListener("click", event => {
  state.simple = !state.simple;
  document.body.classList.toggle("simple-mode", state.simple);
  els.modeLabel.textContent = state.simple ? "Detailed mode" : "Simple mode";
  event.currentTarget.querySelector(".mode-icon").textContent = state.simple ? "▦" : "☼";
});
els.unitToggle.addEventListener("click", () => {
  state.unit = state.unit === "celsius" ? "fahrenheit" : "celsius";
  els.unitToggle.textContent = state.unit === "celsius" ? "°C" : "°F";
  if (state.weather) render(state.weather);
});

document.querySelectorAll("[data-city]").forEach(button => {
  button.addEventListener("click", async () => {
    els.locationInput.value = button.dataset.city;
    try {
      await loadLocation(await findLocation(button.dataset.city));
    } catch (error) {
      els.status.textContent = error.message;
      showToast(error.message);
    }
  });
  els.saveLocation.addEventListener("click", toggleSavedLocation);
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  els.installButton.hidden = false;
});

els.installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  els.installButton.hidden = true;
  showToast("Atmos Web was installed successfully.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

loadLocation({ name: "London", latitude: 51.5074, longitude: -0.1278 });
