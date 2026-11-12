const map = L.map("map").setView([12.8797, 121.774], 6);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);

const form = document.getElementById("searchForm");
const input = document.getElementById("cityInput");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = input.value.trim();
  if (city.length < 2) return;

  markerLayer.clearLayers();

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

    // Add a marker for every result
    locations.forEach((place) => {
      const label = [place.name, place.admin1, place.country]
        .filter(Boolean)
        .join(", ");
      L.marker([place.latitude, place.longitude])
        .addTo(markerLayer)
        .bindPopup(label);
    });

    // Zoom in on the best match (first result) every time
    const best = locations[0];
    map.flyTo([best.latitude, best.longitude], 12, { duration: 1.5 });

    // Open the popup of the best match after the animation
    markerLayer.getLayers()[0].openPopup();
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
});
