<img width="150" height="150" alt="icon" src="https://github.com/user-attachments/assets/f53c8262-6d49-47c2-b88d-6f741828b304" />
<!-- Banner -->
<div align="center">
<img width="254" height="66" alt="image" src="https://github.com/user-attachments/assets/075daecc-57d1-4356-a58a-3767432e1d90" />

</div>

# Atmos Web

</div>

Atmos Web is a beautiful, responsive weather dashboard that runs in the browser and can be installed as a standalone Progressive Web App (PWA).

> [!WARNING]
> Running Atmos on Mac is not supported 


> [!NOTE]
> Atmos web might not run best on WSL on windows

> [!NOTE]
> The website (not the local domain) will not show weather warnings as its an exsample and met office api is not configerd 
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

Open [http://localhost:3000](http://localhost:3000).
The separate overview page is at [http://localhost:3000/overview.html](http://localhost:3000/overview.html), and the documentation home is at [http://localhost:3000/configure.html](http://localhost:3000/configure.html). Use its menu to open the getting started, configuration, deployment, and troubleshooting pages.

## GitHub Pages example

GitHub Pages publishes a separate static example build through `.github/workflows/deploy-pages.yml`. The workflow copies only browser-safe frontend files into a temporary `_site` directory; it does not publish `server.js`, `.env`, `package.json`, or private credentials.

The public example keeps Open-Meteo forecasts, the pressure map, PWA installation, and the official Met Office warning fallback. Live Met Office warnings are intentionally unavailable because GitHub Pages cannot run the private `/api/warnings` server proxy. The local `npm start` application remains unchanged and can use the configured warning API.

### One-command setup

On Ubuntu/Linux, `setup.sh` installs the npm dependencies and creates `.env` from `.env.example` without overwriting an existing `.env`:

```bash
chmod +x setup.sh
./setup.sh
npm start
```

The script expects Node.js and npm to be installed. If they are missing, install them with:

```bash
sudo apt update
sudo apt install nodejs npm
```

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

## Hosting options

You do not need GitHub Pages to use Atmos Web.

- Use `npm start` on a Linux computer or Node.js host when you want the secure Met Office warning proxy.
- Use a static host such as GitHub Pages, Netlify, or Cloudflare Pages for the dashboard without the private warning proxy.
- Use a custom domain with either hosting approach. The root URL opens the dashboard, while `/overview.html` opens the separate overview.

This repository includes `.github/workflows/deploy-pages.yml` for optional GitHub Pages deployment. GitHub Pages hosts static files only, so `server.js` and private `.env` credentials must remain on a separate Node.js host.

## Downloading and installing

Choose **one** of these two options.

### Option A: Clone with Git

Use this option if Git is installed and you want to receive future updates with `git pull`.

```bash
sudo apt update
sudo apt install git nodejs npm
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/joshhowis2013-ctrl/atmos-web.git
cd atmos-web
./setup.sh
```

### Option B: Download as a ZIP

On the GitHub repository page, select **Code → Download ZIP**, save it in `~/Downloads`, and extract it into a project directory:

```bash
sudo apt update
sudo apt install nodejs npm unzip
mkdir -p ~/Projects
unzip ~/Downloads/atmos-web-main.zip -d ~/Projects
cd ~/Projects/atmos-web-main
chmod +x setup.sh
./setup.sh
```

Then follow the `.env` setup above and start the app:

```bash
cp .env.example .env
npm start
```

## Updating Atmos Web

### Git clone

If you installed Atmos Web with Git, run these commands from the project folder:

```bash
cd ~/weather-app
git pull origin main
./setup.sh
npm start
```

`./setup.sh` updates dependencies and preserves your existing `.env`. Stop the old server before starting the updated one.

### ZIP download

If you installed from a ZIP file, download the latest ZIP, extract it into a new folder, and run:

```bash
cd ~/Projects/atmos-web-main
chmod +x setup.sh
./setup.sh
npm start
```

Copy your old `.env` into the new folder before running `npm start` if you use Met Office warnings. Never copy credentials into frontend files.

If frontend changes do not appear, refresh the browser or wait for the service worker cache to update.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Weather dashboard layout and accessible controls |
| `overview.html` | Separate product overview website |
| `configure.html` | Setup and deployment documentation |
| `docs/getting-started.html` | Installation and first-run guide |
| `docs/configuration.html` | Environment and Met Office configuration |
| `docs/deployment.html` | Node.js and static hosting options |
| `docs/updating.html` | Git and ZIP update instructions |
| `docs/troubleshooting.html` | Common setup and runtime issues |
| `pressure.html` | Interactive UK, Ireland, and France surface pressure map |
| `pressure.js` | Pressure map data and Leaflet markers |
| `pressure.css` | Pressure map layout and marker styles |
| `styles.css` | Responsive design, glassmorphism, and animations |
| `app.js` | Weather API, UI state, search, location, and warnings |
| `server.js` | Static server and secure Met Office proxy |
| `setup.sh` | Installs dependencies and creates the local `.env` template |
| `example/README.md` | Documents the separate static GitHub Pages example |
| `manifest.webmanifest` | Installable PWA metadata |
| `sw.js` | Offline app-shell cache |
| `icon.svg` | Atmos Web app icon |
| `.env.example` | Safe configuration template |

## Security

API credentials belong in local environment variables or your deployment platform's secret manager. Rotate a credential immediately if it is accidentally shared or committed.
