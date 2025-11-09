// Variables globales del mapa
let map = null;
let currentMarker = null;

// Inicializar mapa
function initializeMap() {
  // Si ya existe, no recrear
  if (map) return;

  // Centro en Bilbao por defecto
  const bilbaoCoords = [43.263, -2.935];

  // Crear mapa
  map = L.map("map").setView(bilbaoCoords, 13);

  // Añadir capa de tiles de OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  // Click en el mapa para seleccionar ubicación
  map.on("click", onMapClickHandler);

  console.log("✅ Mapa inicializado");

  // Forzar actualización del tamaño
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

// Manejar click en el mapa
async function onMapClickHandler(e) {
  const { lat, lng } = e.latlng;

  console.log("📍 Click en mapa:", lat, lng);

  // Añadir marcador
  addMapMarker(lat, lng);

  // Obtener dirección (geocodificación inversa)
  const address = await reverseGeocode(lat, lng);

  // Llamar a la función del formulario
  if (window.onMapClick) {
    window.onMapClick(lat, lng, address);
  }
}

// Geocodificación inversa (coordenadas → dirección)
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch("http://localhost:8000/api/reverse-geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng }),
    });

    const result = await response.json();

    if (result.success) {
      return result.data.display_name;
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error("Error al obtener dirección:", error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

// Añadir marcador en el mapa
function addMapMarker(lat, lng, popupText = null) {
  // Remover marcador anterior si existe
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  // Crear nuevo marcador
  currentMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }),
  }).addTo(map);

  if (popupText) {
    currentMarker.bindPopup(`📍 ${popupText}`).openPopup();
  }
}

// Centrar mapa en ubicación
function centerMapOnLocation(lat, lng) {
  if (map) {
    map.setView([lat, lng], 15);
  }
}

// Exportar funciones para uso global
window.initializeMap = initializeMap;
window.centerMapOnLocation = centerMapOnLocation;
window.addMapMarker = addMapMarker;
