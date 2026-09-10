const points = [
  ["Scotland", 56.5, -4.2], ["Northern Ireland", 54.8, -6.7], ["Donegal", 55.0, -8.0],
  ["Galway", 53.3, -9.1], ["Dublin", 53.35, -6.26], ["Waterford", 52.26, -7.11], ["Cork", 51.9, -8.47],
  ["Limerick", 52.66, -8.63], ["North West", 54.5, -2.6],
  ["North East", 54.8, -1.5], ["Wales", 52.4, -3.7], ["West Midlands", 52.5, -1.9],
  ["East Midlands", 52.9, -.9], ["East Anglia", 52.3, .5], ["South West", 50.8, -4.2],
  ["South", 51.1, -.9], ["South East", 51.2, .8], ["Channel", 50.4, -.5],
  ["Brittany", 48.2, -2.8], ["Normandy", 49.2, .2], ["Paris", 48.86, 2.35],
  ["Bordeaux", 44.84, -.58], ["Lyon", 45.76, 4.84], ["Marseille", 43.3, 5.37]
];
const initialView = [51.5, 1.2];
const map = L.map("pressure-map", { zoomControl: true }).setView(initialView, 5.5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 12 }).addTo(map);
const markerLayer = L.layerGroup().addTo(map);
const els = { loading: document.getElementById("map-loading"), status: document.getElementById("map-status"), lowest: document.getElementById("lowest-pressure"), highest: document.getElementById("highest-pressure"), updated: document.getElementById("map-updated"), refresh: document.getElementById("refresh-map"), filter: document.getElementById("pressure-filter"), reset: document.getElementById("reset-map") };
const pressureClass = pressure => pressure < 1005 ? "low" : pressure > 1020 ? "high" : "normal";
let readings = [];

function renderMarkers() {
  markerLayer.clearLayers();
  const filtered = readings.filter(reading => els.filter.value === "all" || pressureClass(reading.pressure) === els.filter.value);
  filtered.forEach((reading, index) => {
    const kind = pressureClass(reading.pressure);
    const icon = L.divIcon({ className: "", html: `<div class="pressure-marker ${kind}" style="animation-delay:${index * 35}ms">${Math.round(reading.pressure)}<small> hPa</small></div>`, iconSize: [66, 66], iconAnchor: [33, 33] });
    L.marker([reading.latitude, reading.longitude], { icon, title: `${reading.name}: ${reading.pressure.toFixed(1)} hPa` }).bindPopup(`<strong>${reading.name}</strong><br>${reading.pressure.toFixed(1)} hPa surface pressure`).addTo(markerLayer);
  });
  els.status.textContent = `${filtered.length} of ${readings.length} live readings shown. Click a marker for details.`;
}

async function loadPressureMap() {
  els.refresh.disabled = true;
  els.loading.classList.remove("hidden");
  els.status.textContent = "Requesting live surface pressure readings...";
  try {
    const params = new URLSearchParams({
      latitude: points.map(point => point[1]).join(","),
      longitude: points.map(point => point[2]).join(","),
      current: "pressure_msl",
      timezone: "auto"
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error("The pressure service returned an error.");
    const data = await response.json();
    const rawReadings = points.map((point, index) => ({ name: point[0], latitude: point[1], longitude: point[2], pressure: Array.isArray(data) ? data[index]?.current?.pressure_msl : data.current?.pressure_msl }));
    const valid = rawReadings.filter(reading => Number.isFinite(reading.pressure));
    if (!valid.length) throw new Error("No pressure readings were returned.");
    readings = valid;
    renderMarkers();
    const values = valid.map(reading => reading.pressure);
    els.lowest.textContent = `${Math.min(...values).toFixed(1)} hPa`;
    els.highest.textContent = `${Math.max(...values).toFixed(1)} hPa`;
    els.updated.textContent = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
  } catch (error) {
    els.status.textContent = error.message;
  } finally {
    els.loading.classList.add("hidden");
    els.refresh.disabled = false;
  }
}
els.refresh.addEventListener("click", loadPressureMap);
els.filter.addEventListener("change", renderMarkers);
els.reset.addEventListener("click", () => map.setView(initialView, 5.5));
loadPressureMap();
