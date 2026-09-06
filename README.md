<img width="150" height="150" alt="icon" src="https://github.com/user-attachments/assets/f53c8262-6d49-47c2-b88d-6f741828b304" />
<!-- Banner -->
<div align="center">
<img width="254" height="66" alt="image" src="https://github.com/user-attachments/assets/075daecc-57d1-4356-a58a-3767432e1d90" />

</div>

# Atmos Web

</div>

Atmos Web is a responsive weather dashboard at `/`. A separate polished overview page is available at `/overview.html`. The dashboard can also be installed as a standalone Progressive Web App (PWA).

> [!WARNING]
> Running Atmos on Mac is not supported 


> [!NOTE]
> Atmos web might not run best on WSL on windows

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

## Platform

Atmos Web is currently developed and tested on **Ubuntu/Linux**. Linux is the supported local development environment. The frontend is browser-based and the Node.js server may work on other operating systems, but those environments are not currently documented or tested.

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

Create your local environment file:

```bash
cp .env.example .env
```

The copied `.env` starts with placeholder values. Edit it only if you want live Met Office warnings; the main weather forecast works without an API key:

```bash
nano .env
```

Never commit `.env`. It is ignored by Git, while `.env.example` is the safe template committed to the repository.

Start the app:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) for the weather dashboard. Visit [http://localhost:3000/overview.html](http://localhost:3000/overview.html) for the separate overview page.

## Configure Met Office warnings

The warning proxy is optional. If you have not already copied the template, run:

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

Confirm Git is ignoring the local file:

```bash
git check-ignore -v .env
```

Never commit `.env` or put a private API key in `app.js`. The `.gitignore` file excludes `.env` and `node_modules/` from Git.

## Static website only

The frontend can also be served without the Node.js proxy:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Weather forecasts will work, but live Met Office warning proxy requests require the Node.js server.

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml`. Push to the `main` branch, then GitHub Actions will publish the static website automatically.

Enable Pages once in the repository settings:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Push to `main` or run **Deploy Atmos Web to GitHub Pages** from the **Actions** tab.

The weather dashboard will be available at the repository's Pages URL:

```text
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/
```

The separate overview page is available at:

```text
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/overview.html
```

GitHub Pages hosts static files only. Open-Meteo forecasts, city search, animations, the PWA, and the official Met Office link work there. The private Met Office warning proxy in `server.js` requires a separate Node.js deployment; never add its `.env` credentials to GitHub Pages.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Weather dashboard layout and accessible controls |
| `overview.html` | Separate product overview website |
| `styles.css` | Responsive design, glassmorphism, and animations |
| `app.js` | Weather API, UI state, search, location, and warnings |
| `server.js` | Static server and secure Met Office proxy |
| `.github/workflows/deploy-pages.yml` | GitHub Pages deployment |
| `manifest.webmanifest` | Installable PWA metadata |
| `sw.js` | Offline app-shell cache |
| `icon.svg` | Atmos Web app icon |
| `.env.example` | Safe configuration template |

## Security

API credentials belong in local environment variables or your deployment platform's secret manager. Rotate a credential immediately if it is accidentally shared or committed.
