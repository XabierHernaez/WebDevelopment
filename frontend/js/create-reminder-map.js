// Variables globales del mapa
let map = null;
let currentMarker = null;
let userLocationMarker = null;
let isGettingLocation = false; // Para controlar el estado

// Inicializar mapa
function initializeMap() {
  // Si ya existe, no recrear
  if (map) return;

  // Centro temporal en Bilbao (mientras se obtiene ubicación real)
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

  // IMPORTANTE: Obtener ubicación inmediatamente
  getUserLocation();
}

// Obtener ubicación actual del usuario (MEJORADO)
function getUserLocation() {
  if (!navigator.geolocation) {
    console.warn("Geolocalización no disponible en este navegador");
    return;
  }

  if (isGettingLocation) return; // Evitar múltiples llamadas

  isGettingLocation = true;
  console.log("📍 Obteniendo tu ubicación...");

  // Mostrar indicador visual de carga
  showLocationLoading();

  navigator.geolocation.getCurrentPosition(
    // ✅ Éxito
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("✅ Ubicación obtenida:", latitude, longitude);
      console.log("📏 Precisión:", Math.round(accuracy), "metros");

      // IMPORTANTE: Centrar mapa inmediatamente
      if (map) {
        map.setView([latitude, longitude], 16, {
          animate: true,
          duration: 1,
        });
      }

      // Añadir marcador azul "Estás aquí"
      addUserLocationMarker(latitude, longitude, accuracy);

      // Ocultar indicador de carga
      hideLocationLoading();

      isGettingLocation = false;
    },
    // ❌ Error
    (error) => {
      console.warn("⚠️ Error al obtener ubicación:", error.message);

      let errorMsg = "";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = "Permiso de ubicación denegado";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = "Ubicación no disponible";
          break;
        case error.TIMEOUT:
          errorMsg = "Tiempo de espera agotado";
          break;
      }

      alert(`⚠️ ${errorMsg}. El mapa se mostrará en Bilbao por defecto.`);

      hideLocationLoading();
      isGettingLocation = false;
    },
    // ⚙️ Opciones optimizadas
    {
      enableHighAccuracy: true, // Usar GPS si está disponible
      timeout: 8000, // Esperar máximo 8 segundos
      maximumAge: 0, // No usar caché, ubicación en tiempo real
    }
  );
}

// Mostrar indicador de carga
function showLocationLoading() {
  // Crear overlay de carga si no existe
  if (!document.getElementById("locationLoadingOverlay")) {
    const overlay = document.createElement("div");
    overlay.id = "locationLoadingOverlay";
    overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            border-radius: 12px;
        `;
    overlay.innerHTML = `
            <div style="
                font-size: 3rem;
                animation: spin 1.5s linear infinite;
            ">📍</div>
            <p style="
                margin-top: 15px;
                font-size: 1.1rem;
                color: #6366f1;
                font-weight: 600;
            ">Obteniendo tu ubicación...</p>
            <style>
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

    const mapContainer = document.getElementById("map");
    if (mapContainer && mapContainer.parentElement) {
      mapContainer.parentElement.style.position = "relative";
      mapContainer.parentElement.appendChild(overlay);
    }
  }
}

// Ocultar indicador de carga
function hideLocationLoading() {
  const overlay = document.getElementById("locationLoadingOverlay");
  if (overlay) {
    overlay.remove();
  }
}

// Añadir marcador azul de ubicación del usuario (MEJORADO)
function addUserLocationMarker(lat, lng, accuracy = 100) {
  // Remover marcador anterior si existe
  if (userLocationMarker) {
    map.removeLayer(userLocationMarker);
  }

  // Crear icono azul personalizado con animación
  const blueIcon = L.divIcon({
    className: "user-location-marker",
    html: `
            <div style="
                width: 24px;
                height: 24px;
                background: #3b82f6;
                border: 4px solid white;
                border-radius: 50%;
                box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
                animation: pulse 2s infinite;
            "></div>
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                }
            </style>
        `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Añadir marcador al mapa
  userLocationMarker = L.marker([lat, lng], {
    icon: blueIcon,
    zIndexOffset: 1000,
  }).addTo(map);

  // Popup informativo
  userLocationMarker
    .bindPopup(
      `
        <strong>📍 Estás aquí</strong><br>
        <small>Precisión: ~${Math.round(accuracy)} metros</small>
    `
    )
    .openPopup();

  // Círculo de precisión
  L.circle([lat, lng], {
    color: "#3b82f6",
    fillColor: "#3b82f6",
    fillOpacity: 0.1,
    radius: Math.min(accuracy, 200), // Máximo 200m de radio visual
  }).addTo(map);
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
