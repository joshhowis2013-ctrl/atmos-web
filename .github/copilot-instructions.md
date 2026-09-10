# Copilot instructions for Atmos Web

## Project shape

Atmos Web is a dependency-light vanilla JavaScript weather PWA:

- `index.html` is the root weather dashboard; `overview.html` is the separate product overview page; `configure.html` is the documentation home, with additional guides under `docs/`. The dashboard includes simple/detail modes, search, location, install, forecast, and Met Office warning panels.
- `styles.css` owns the responsive glassmorphism layout and weather-driven animations. Weather states are applied through `body.night`, `body.simple-mode`, `body[data-weather]`, and `.weather-scene.wet`.
- `app.js` owns browser state and all frontend behavior. It calls Open-Meteo directly for geocoding and forecast data, then renders both dashboard modes and the optional warning result.
- `server.js` serves the static app and exposes `/api/warnings`. It is the only place that may read the Met Office credential from environment variables.
- `manifest.webmanifest`, `sw.js`, and `icon.svg` provide installable PWA metadata, app-shell caching, and branding.
- `.github/workflows/deploy-pages.yml` builds a separate browser-only `_site` artifact for GitHub Pages; keep server files, `.env`, and credentials out of that artifact.
- `pressure.html`, `pressure.css`, and `pressure.js` provide the standalone UK, Ireland, and France pressure map using Leaflet and Open-Meteo. It includes live points for Ireland, including Waterford, and France, including Paris, Bordeaux, Lyon, and Marseille.

The normal production-shaped local entry point is `http://localhost:3000` through `server.js`. A Python static server is useful for frontend-only work, but it cannot provide `/api/warnings`. GitHub Pages uses the workflow-generated static example and intentionally relies on the official warning fallback.
Local development is currently documented and tested on Ubuntu/Linux.

## Commands

Install dependencies:

```bash
npm install
```

One-command Ubuntu/Linux setup:

```bash
chmod +x setup.sh
./setup.sh
```

The script installs npm dependencies and creates `.env` from `.env.example` only when `.env` does not already exist. It requires Node.js and npm but does not install system packages automatically.

Run the app and proxy:

```bash
npm start
```

Run the frontend without the Node proxy:

```bash
python3 -m http.server 8000
```

There are currently no test or lint scripts in `package.json`. For a basic local smoke check, start the app and verify `http://localhost:3000`, a city search, the Celsius/Fahrenheit toggle, both display modes, and `/api/warnings`. Validate the manifest with:

```bash
python3 -m json.tool manifest.webmanifest
```

## Environment and secrets

Copy `.env.example` to `.env` before running the Node server when configuring the optional Met Office integration. Keep the real `MET_OFFICE_API_KEY` and endpoint only in `.env` or deployment secret storage. `.env` and `node_modules/` are intentionally ignored by Git. Never replace the placeholders in `.env.example` with real credentials.

The proxy supports the configured authentication header through `MET_OFFICE_AUTH_HEADER`, defaults to `X-API-Key`, and accepts either JSON or Atom/XML upstream responses. Do not move the Met Office credential into `app.js`, HTML, the service worker, or committed configuration.

## Implementation conventions

- Keep the frontend framework-free and reuse the existing `state`, `ids`, `els`, `render`, `loadLocation`, and formatting helpers instead of introducing a second state or rendering path.
- Weather values from Open-Meteo are Celsius/metres-based internally. Convert temperatures only at display time through `convertTemp`; preserve raw API values for calculations such as comfort scoring and advice.
- When adding a weather field, request it in `fetchWeather`, render it in `render`, and update both simple and detailed views when applicable.
- Weather-code behavior belongs in `weatherCodes`/`getWeatherInfo`; keep condition text, icon selection, and animation state derived from the same code.
- Location searches return Open-Meteo geocoding results. Preserve latitude/longitude and country metadata because the warning panel uses country information to decide whether the Met Office link is relevant.
- Pressure-map locations are maintained as a fixed point list in `pressure.js`; preserve the `[name, latitude, longitude]` shape when adding regional readings. The current map covers the UK, Ireland, and France, including Donegal, Galway, Dublin, Waterford, Cork, Limerick, Paris, Bordeaux, Lyon, and Marseille.
- The pressure map requests `pressure_msl` for all points in one Open-Meteo request, classifies readings below 1005 hPa as low, above 1020 hPa as high, and the range between them as normal, then renders Leaflet markers.
- Warning failures must remain non-blocking: forecast rendering should continue if the proxy is unavailable, unconfigured, or returns an upstream error. Keep the official Met Office link available as the fallback.
- Preserve the relative `./` paths used by the manifest and service worker so the app works when hosted from a subpath.
- Keep API responses and user-visible errors explicit. Do not silently treat failed warning requests as active or clear warnings.
- Use the existing visual language: CSS custom properties, `.glass-card`, rounded cards, muted secondary text, and the existing animation/keyframe style. Keep Simple mode compact rather than copying the detailed dashboard into it.
- Escape or safely assign external API text through `textContent`; avoid inserting untrusted warning content into `innerHTML`.

## PWA considerations

When adding or renaming an app-shell asset, update `APP_SHELL` in `sw.js` and bump `CACHE_NAME` so installed clients receive the change. Keep runtime API requests network-first; cached app-shell files are only a fallback for offline startup.
