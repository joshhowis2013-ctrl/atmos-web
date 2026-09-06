# Atmos Web

Atmos Web is a beautiful, responsive weather dashboard that runs in the browser and can be installed as a standalone Progressive Web App (PWA).

## Features

- Current weather, feels-like temperature, highs, and lows
- Seven-day forecast and hourly forecast
- Humidity, wind, visibility, pressure, UV index, and rain chance
- Simple mode with a clean at-a-glance summary
- Detailed mode with comfort scoring and visual progress bars
- Celsius/Fahrenheit switching
- City search and browser geolocation
- Animated day, night, rain, snow, and thunderstorm scenes
- Installable standalone web app with offline app-shell caching
- Met Office UK warning panel through an optional secure server-side proxy

Weather data is provided by [Open-Meteo](https://open-meteo.com/). No Open-Meteo API key is required.

## Run the app

Atmos Web uses a small Node.js server for the static website and optional Met Office warning proxy.

Install Node.js and npm if needed:

```bash
sudo apt update
sudo apt install nodejs npm
```

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Configure Met Office warnings

The warning proxy is optional. Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` with the endpoint and credential from the Met Office Weather DataHub:

```env
PORT=3000
MET_OFFICE_WARNINGS_URL=https://your-warnings-endpoint
MET_OFFICE_API_KEY=your-api-key
MET_OFFICE_AUTH_HEADER=X-API-Key
```

If the DataHub documentation requires a bearer token, use the exact format it specifies:

```env
MET_OFFICE_AUTH_HEADER=Authorization
MET_OFFICE_API_KEY=Bearer your-api-key
```

Restart the server after changing `.env`.

Never commit `.env` or put a private API key in `app.js`. The `.gitignore` file excludes `.env` and `node_modules/` from Git.

## Static website only

The frontend can also be served without the Node.js proxy:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Weather forecasts will work, but live Met Office warning proxy requests require the Node.js server.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | App layout and accessible controls |
| `styles.css` | Responsive design, glassmorphism, and animations |
| `app.js` | Weather API, UI state, search, location, and warnings |
| `server.js` | Static server and secure Met Office proxy |
| `manifest.webmanifest` | Installable PWA metadata |
| `sw.js` | Offline app-shell cache |
| `icon.svg` | Atmos Web app icon |
| `.env.example` | Safe configuration template |

## Security

API credentials belong in local environment variables or your deployment platform's secret manager. Rotate a credential immediately if it is accidentally shared or committed.
