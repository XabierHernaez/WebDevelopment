// Variables globales del mapa
let map;
let markers = [];
let selectedCoords = null;

// Inicializar mapa
function initMap() {
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
  map.on("click", onMapClick);

  console.log("✅ Mapa inicializado");
}

// Manejar click en el mapa
function onMapClick(e) {
  const { lat, lng } = e.latlng;

  // Guardar coordenadas seleccionadas
  selectedCoords = { lat, lng };

  // Mostrar marcador temporal
  addTemporaryMarker(lat, lng);

  // Actualizar campo de dirección en el formulario
  reverseGeocode(lat, lng);

  console.log("📍 Ubicación seleccionada:", lat, lng);
}

// Añadir marcador temporal (al hacer click)
function addTemporaryMarker(lat, lng) {
  // Remover marcador temporal anterior si existe
  if (window.tempMarker) {
    map.removeLayer(window.tempMarker);
  }

  // Crear nuevo marcador temporal
  window.tempMarker = L.marker([lat, lng], {
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

  window.tempMarker.bindPopup("📍 Ubicación seleccionada").openPopup();
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
      const address = result.data.display_name;

      // Actualizar campo de dirección
      const addressInput = document.getElementById("reminderAddress");
      if (addressInput) {
        addressInput.value = address;
      }

      // Mostrar ubicación seleccionada
      const selectedLocationDiv = document.getElementById("selectedLocation");
      if (selectedLocationDiv) {
        selectedLocationDiv.innerHTML = `
                    <strong>✅ Ubicación seleccionada:</strong><br>
                    ${address}<br>
                    <small>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(
          6
        )}</small>
                `;
      }
    }
  } catch (error) {
    console.error("Error al obtener dirección:", error);
  }
}

// Añadir marcador de recordatorio permanente
function addReminderMarker(reminder) {
  if (!reminder.coordinates) return;

  const { lat, lng } = reminder.coordinates;

  // Icono según el tipo
  let iconColor = "blue";
  if (reminder.reminder_type === "location") iconColor = "green";
  if (reminder.reminder_type === "both") iconColor = "orange";

  const marker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }),
  }).addTo(map);

  // Popup con información
  const popupContent = `
        <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0;">${reminder.title}</h4>
            ${
              reminder.description
                ? `<p style="margin: 0 0 8px 0; font-size: 0.9em;">${reminder.description}</p>`
                : ""
            }
            ${
              reminder.address
                ? `<p style="margin: 0; font-size: 0.85em; color: #666;">📍 ${reminder.address}</p>`
                : ""
            }
            ${
              reminder.datetime
                ? `<p style="margin: 4px 0 0 0; font-size: 0.85em; color: #666;">⏰ ${new Date(
                    reminder.datetime
                  ).toLocaleString("es-ES")}</p>`
                : ""
            }
        </div>
    `;

  marker.bindPopup(popupContent);

  // Guardar marcador
  markers.push({ id: reminder.id, marker });

  return marker;
}

// Limpiar todos los marcadores de recordatorios
function clearReminderMarkers() {
  markers.forEach(({ marker }) => {
    map.removeLayer(marker);
  });
  markers = [];
}

// Centrar mapa en una ubicación
function centerMap(lat, lng, zoom = 15) {
  map.setView([lat, lng], zoom);
}

// Obtener ubicación actual del usuario
async function getMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        centerMap(latitude, longitude, 15);

        // Añadir marcador temporal
        addTemporaryMarker(latitude, longitude);

        console.log("📍 Mi ubicación:", latitude, longitude);
      },
      async (error) => {
        console.error("Error al obtener ubicación:", error);
        await showError(
          "No se pudo obtener tu ubicación. Verifica los permisos del navegador.",
          "Error de ubicación",
          "📍"
        );
      }
    );
  } else {
    await showError(
      "Tu navegador no soporta geolocalización",
      "Navegador incompatible",
      "⚠️"
    );
  }
}

// Inicializar mapa cuando cargue la página
if (document.getElementById("map")) {
  // Esperar a que Leaflet esté cargado
  if (typeof L !== "undefined") {
    initMap();
  } else {
    window.addEventListener("load", initMap);
  }
}
