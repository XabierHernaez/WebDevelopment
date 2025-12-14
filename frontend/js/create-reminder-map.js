// Variables globales del mapa
let map = null;
let currentMarker = null;
let userLocationMarker = null;
let isGettingLocation = false;

// Nueva función: Verificar permisos sin pedirlos
async function checkMapPermissions() {
  if (!navigator.permissions) {
    return true;
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state === "granted";
  } catch (error) {
    console.log("No se pudo verificar permisos");
    return true;
  }
}

// Inicializar mapa
function initializeMap() {
  if (map) return;

  const bilbaoCoords = [43.263, -2.935];

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });

  map = L.map("map").setView(bilbaoCoords, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  map.on("click", onMapClickHandler);

  console.log("✅ Mapa inicializado");

  setTimeout(() => {
    map.invalidateSize();
  }, 200);

  getUserLocation();
}

async function getUserLocation() {
  if (!navigator.geolocation) {
    console.warn("Geolocalización no disponible en este navegador");
    return;
  }

  if (isGettingLocation) return;

  const hasPermission = await checkMapPermissions();

  if (hasPermission) {
    isGettingLocation = true;
    console.log("📍 Obteniendo tu ubicación...");
    showLocationLoading();
  } else {
    console.log("📍 Intentando obtener ubicación...");
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("✅ Ubicación obtenida:", latitude, longitude);
      console.log("🎯 Precisión:", Math.round(accuracy), "metros");

      if (map) {
        map.setView([latitude, longitude], 16, {
          animate: true,
          duration: 1,
        });
      }

      addUserLocationMarker(latitude, longitude, accuracy);
      hideLocationLoading();
      isGettingLocation = false;
    },
    async (error) => {
      if (error.code !== 1) {
        console.warn("⚠️ Error al obtener ubicación:", error.message);

        let errorMsg = "";
        const lang = typeof getLanguage === "function" ? getLanguage() : "es";

        switch (error.code) {
          case error.POSITION_UNAVAILABLE:
            errorMsg =
              lang === "en"
                ? "Location unavailable"
                : "Ubicación no disponible";
            break;
          case error.TIMEOUT:
            errorMsg =
              lang === "en" ? "Request timed out" : "Tiempo de espera agotado";
            break;
        }

        if (errorMsg) {
          const title =
            lang === "en"
              ? "Could not get location"
              : "No se pudo obtener ubicación";
          const message =
            lang === "en"
              ? `${errorMsg}. The map will show Bilbao by default.`
              : `${errorMsg}. El mapa se mostrará en Bilbao por defecto.`;
          await showInfo(message, title, "📍");
        }
      } else {
        console.log(
          "⚠️ Sin permisos de ubicación, mapa en ubicación por defecto"
        );
      }

      hideLocationLoading();
      isGettingLocation = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    }
  );
}

// Mostrar indicador de carga
function showLocationLoading() {
  if (!document.getElementById("locationLoadingOverlay")) {
    const lang = typeof getLanguage === "function" ? getLanguage() : "es";
    const loadingText =
      lang === "en" ? "Getting your location..." : "Obteniendo tu ubicación...";

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
      ">${loadingText}</p>
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

// Añadir marcador azul de ubicación del usuario
function addUserLocationMarker(lat, lng, accuracy = 100) {
  if (userLocationMarker) {
    map.removeLayer(userLocationMarker);
  }

  const blueIcon = L.divIcon({
    className: "user-location-marker",
    html: `<div class="user-location-dot"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  userLocationMarker = L.marker([lat, lng], {
    icon: blueIcon,
    zIndexOffset: 1000,
  }).addTo(map);

  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const youAreHere = lang === "en" ? "You are here" : "Estás aquí";
  const accuracyText = lang === "en" ? "Accuracy" : "Precisión";

  userLocationMarker
    .bindPopup(
      `
      <strong>📍 ${youAreHere}</strong><br>
      <small>${accuracyText}: ~${Math.round(accuracy)} ${
        lang === "en" ? "meters" : "metros"
      }</small>
    `
    )
    .openPopup();

  L.circle([lat, lng], {
    color: "#3b82f6",
    fillColor: "#3b82f6",
    fillOpacity: 0.1,
    radius: Math.min(accuracy, 200),
  }).addTo(map);
}

// Manejar click en el mapa
async function onMapClickHandler(e) {
  const { lat, lng } = e.latlng;

  console.log("🗺️ Click en mapa:", lat, lng);

  addMapMarker(lat, lng);

  const address = await reverseGeocode(lat, lng);

  if (window.onMapClick) {
    window.onMapClick(lat, lng, address);
  }
}

// Geocodificación inversa
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "GeoRemind/1.0",
        },
      }
    );

    const data = await response.json();

    if (data && data.display_name) {
      console.log("📍 Dirección encontrada:", data.display_name);
      return data.display_name;
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error("Error al obtener dirección:", error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

function addMapMarker(lat, lng, popupText = null) {
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  const redIcon = L.divIcon({
    className: "custom-red-marker",
    html: `
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z" 
              fill="#EF4444" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="#fff"/>
      </svg>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });

  currentMarker = L.marker([lat, lng], { icon: redIcon }).addTo(map);

  if (popupText) {
    currentMarker.bindPopup(popupText).openPopup();
  }

  console.log("✅ Marcador rojo añadido en:", lat, lng);
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

Object.defineProperty(window, "map", {
  get() {
    return map;
  },
});

// ========================================
// BUSCADOR DE LUGARES EN EL MAPA
// ========================================

let searchTimeout = null;
const mapSearchInput = document.getElementById("mapSearchInput");
const mapSearchResults = document.getElementById("mapSearchResults");

if (mapSearchInput) {
  mapSearchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 3) {
      hideSearchResults();
      return;
    }

    searchTimeout = setTimeout(() => {
      searchPlaces(query);
    }, 500);
  });

  document.addEventListener("click", (e) => {
    if (
      !mapSearchInput.contains(e.target) &&
      !mapSearchResults.contains(e.target)
    ) {
      hideSearchResults();
    }
  });

  mapSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      mapSearchInput.value = "";
      hideSearchResults();
    }
  });
}

// Buscar lugares con Nominatim
async function searchPlaces(query) {
  showLoading();

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=8&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "GeoRemind/1.0",
        },
      }
    );

    const places = await response.json();

    if (places.length === 0) {
      showNoResults();
    } else {
      showResults(places);
    }
  } catch (error) {
    console.error("Error al buscar lugares:", error);
    showSearchError();
  }
}

// Mostrar resultados
function showResults(places) {
  mapSearchResults.innerHTML = places
    .map((place) => {
      let icon = "📍";
      if (place.type === "city" || place.type === "town") icon = "🏙️";
      else if (place.type === "village") icon = "🏘️";
      else if (place.type === "restaurant" || place.type === "cafe")
        icon = "🍽️";
      else if (place.type === "hotel") icon = "🏨";
      else if (place.type === "shop" || place.type === "mall") icon = "🛍️";
      else if (place.type === "park") icon = "🌳";
      else if (place.type === "museum") icon = "🏛️";
      else if (place.type === "hospital") icon = "🏥";
      else if (place.type === "school" || place.type === "university")
        icon = "🎓";
      else if (place.class === "highway") icon = "🛣️";
      else if (place.class === "building") icon = "🏢";

      const name = place.name || place.display_name.split(",")[0];
      const address = place.display_name;

      return `
        <div class="search-result-item" onclick='selectPlace(${JSON.stringify(
          place
        ).replace(/'/g, "&#39;")})'>
          <div class="result-icon">${icon}</div>
          <div class="result-content">
            <div class="result-name">${name}</div>
            <div class="result-address">${address}</div>
          </div>
        </div>
      `;
    })
    .join("");

  mapSearchResults.classList.add("show");
}

// Seleccionar un lugar
function selectPlace(place) {
  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lon);
  const address = place.display_name;

  console.log("✅ Lugar seleccionado:", address);

  const reminderAddress = document.getElementById("reminderAddress");
  if (reminderAddress) {
    reminderAddress.value = address;
  }

  if (window.map) {
    window.map.setView([lat, lng], 16, {
      animate: true,
      duration: 1,
    });

    addMapMarker(lat, lng, address);
  }

  if (window.onMapClick) {
    window.onMapClick(lat, lng, address);
  }

  mapSearchInput.value = "";
  hideSearchResults();
}

function showLoading() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const searchingText =
    lang === "en" ? "Searching places..." : "Buscando lugares...";

  mapSearchResults.innerHTML = `
    <div class="search-loading">
      <div class="search-loading-spinner"></div>
      <p style="margin-top: 10px;">${searchingText}</p>
    </div>
  `;
  mapSearchResults.classList.add("show");
}

function showNoResults() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const noResultsText =
    lang === "en" ? "No places found" : "No se encontraron lugares";

  mapSearchResults.innerHTML = `
    <div class="search-no-results">
      <div class="search-no-results-icon">🔍</div>
      <p>${noResultsText}</p>
    </div>
  `;
  mapSearchResults.classList.add("show");
}

function showSearchError() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const errorText =
    lang === "en" ? "Error searching places" : "Error al buscar lugares";

  mapSearchResults.innerHTML = `
    <div class="search-no-results">
      <div class="search-no-results-icon">⚠️</div>
      <p>${errorText}</p>
    </div>
  `;
  mapSearchResults.classList.add("show");
}

function hideSearchResults() {
  mapSearchResults.classList.remove("show");
}
