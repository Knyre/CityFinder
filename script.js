const DEFAULT_CENTER = [12.8797, 121.774];
const DEFAULT_ZOOM = 6;

const map = L.map("map").setView(DEFAULT_CENTER, DEFAULT_ZOOM);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);

const form = document.getElementById("searchForm");
const input = document.getElementById("cityInput");
const clearBtn = document.getElementById("clearBtn");

// Show the X only when there's text
function toggleClearBtn() {
  clearBtn.style.display = input.value ? "block" : "none";
}
input.addEventListener("input", toggleClearBtn);

// Zoom out to the default view and remove markers
function resetMap() {
  markerLayer.clearLayers();
  map.closePopup();
  map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.5 });
}

// Clicking the search box X: clear input and zoom out
clearBtn.addEventListener("click", () => {
  input.value = "";
  toggleClearBtn();
  input.focus();
  resetMap();
});

// Clicking the X on a pin's popup: zoom out
map.on("popupopen", (e) => {
  const closeBtn = e.popup
    .getElement()
    .querySelector(".leaflet-popup-close-button");

  if (closeBtn) {
    closeBtn.onclick = () => {
      input.value = "";
      toggleClearBtn();
      resetMap();
    };
  }
});

// Searching: zoom in on the best match
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = input.value.trim();
  if (city.length < 2) return;

  markerLayer.clearLayers();
  map.closePopup();

  const url =
    "https://geocoding-api.open-meteo.com/v1/search?" +
    new URLSearchParams({
      name: city,
      count: "5",
      language: "en",
      format: "json",
    });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Request failed");
    const data = await response.json();
    const locations = data.results ?? [];

    if (locations.length === 0) {
      alert("City not found.");
      return;
    }

    // Add a marker for every result (autoPan off so popups never cancel the zoom)
    const markers = locations.map((place) => {
      const label = [place.name, place.admin1, place.country]
        .filter(Boolean)
        .join(", ");
      return L.marker([place.latitude, place.longitude])
        .addTo(markerLayer)
        .bindPopup(label, { autoPan: false });
    });

    // Zoom in on the best match and open its popup
    const best = locations[0];
    map.flyTo([best.latitude, best.longitude], 12, { duration: 1.5 });
    markers[0].openPopup();
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
});
