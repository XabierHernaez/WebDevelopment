// Configuración
const API_URL = "http://localhost:3001/api";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user"));

// Verificar autenticación
if (!token || !currentUser) {
  window.location.href = "index.html";
}

// Elementos del DOM
const backBtn = document.getElementById("backBtn");
const reminderForm = document.getElementById("reminderForm");
const reminderType = document.getElementById("reminderType");
const datetimeGroup = document.getElementById("datetimeGroup");
const recurrenceGroup = document.getElementById("recurrenceGroup");
const locationGroup = document.getElementById("locationGroup");
const mapSection = document.getElementById("mapSection");
const infoPanel = document.getElementById("infoPanel");
const mapContainer = document.getElementById("mapContainer");
const searchBtn = document.getElementById("searchBtn");
const reminderAddress = document.getElementById("reminderAddress");
const selectedLocationInfo = document.getElementById("selectedLocationInfo");
const selectedAddress = document.getElementById("selectedAddress");
const selectedCoords = document.getElementById("selectedCoords");

// Variables globales
let selectedLocation = null;

// Volver a la lista
backBtn.addEventListener("click", () => {
  window.location.href = "reminders-list.html";
});

// Cambiar campos según tipo de recordatorio
reminderType.addEventListener("change", () => {
  const type = reminderType.value;

  if (type === "datetime") {
    // Solo fecha/hora → Mostrar panel de info
    datetimeGroup.style.display = "block";
    locationGroup.style.display = "none";
    infoPanel.style.display = "flex";
    mapContainer.style.display = "none";
    document.getElementById("reminderDatetime").required = true;
    reminderAddress.required = false;
  } else if (type === "location") {
    // Solo ubicación → Mostrar mapa
    datetimeGroup.style.display = "none";
    locationGroup.style.display = "block";
    infoPanel.style.display = "none";
    mapContainer.style.display = "block";
    document.getElementById("reminderDatetime").required = false;
    reminderAddress.required = true;

    // Inicializar mapa si no existe
    setTimeout(() => {
      initializeMap();
      // Forzar que Leaflet recalcule el tamaño
      if (window.map) {
        window.map.invalidateSize();
      }
    }, 150);
  } else if (type === "both") {
    // Ambos → Mostrar mapa
    datetimeGroup.style.display = "block";
    locationGroup.style.display = "block";
    infoPanel.style.display = "none";
    mapContainer.style.display = "block";
    document.getElementById("reminderDatetime").required = true;
    reminderAddress.required = true;

    // Inicializar mapa si no existe
    setTimeout(() => initializeMap(), 100);
  }
});

// Buscar dirección manualmente
searchBtn.addEventListener("click", async () => {
  const address = reminderAddress.value.trim();

  if (!address) {
    await showInfo(
      "Por favor, introduce una dirección",
      "Dirección requerida",
      "📍"
    );
    return;
  }

  await geocodeAddress(address);
});

// Geocodificar dirección
async function geocodeAddress(address) {
  try {
    searchBtn.textContent = "🔍 Buscando...";
    searchBtn.disabled = true;

    const response = await fetch("http://localhost:8000/api/geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    const result = await response.json();

    if (result.success) {
      const { lat, lng, display_name } = result.data;

      // Guardar ubicación seleccionada
      selectedLocation = { lat, lng, address: display_name };

      // Actualizar interfaz
      showSelectedLocation(display_name, lat, lng);

      // Centrar mapa
      if (window.map) {
        centerMapOnLocation(lat, lng);
        addMapMarker(lat, lng, display_name);
      }
    } else {
      await showError(
        "No se encontró la ubicación. Intenta con otra dirección.",
        "Ubicación no encontrada",
        "🔍"
      );
    }
  } catch (error) {
    console.error("Error al geocodificar:", error);
    await showError(
      "Hubo un problema al buscar la ubicación. Verifica tu conexión.",
      "Error de búsqueda",
      "⚠️"
    );
  } finally {
    searchBtn.textContent = "🔍 Buscar";
    searchBtn.disabled = false;
  }
}

// Mostrar ubicación seleccionada
function showSelectedLocation(address, lat, lng) {
  selectedLocationInfo.style.display = "block";
  selectedAddress.textContent = address;
  selectedCoords.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
}

// Esta función será llamada desde create-reminder-map.js cuando se haga click en el mapa
window.onMapClick = function (lat, lng, address) {
  selectedLocation = { lat, lng, address };
  reminderAddress.value = address;
  showSelectedLocation(address, lat, lng);
};

// Crear recordatorio
reminderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("reminderTitle").value;
  const description = document.getElementById("reminderDescription").value;
  const type = reminderType.value;
  const datetime = document.getElementById("reminderDatetime").value;

  // ✨ OBTENER RECURRENCIA SELECCIONADA
  const recurrenceValue = document.querySelector(
    'input[name="recurrence"]:checked'
  )?.value;

  // Validar según tipo
  if ((type === "location" || type === "both") && !selectedLocation) {
    await showInfo(
      "Debes seleccionar una ubicación en el mapa o buscar una dirección",
      "Ubicación requerida",
      "📍"
    );
    return;
  }

  const reminderData = {
    title,
    description,
    reminder_type: type,
  };

  if (type === "datetime" || type === "both") {
    if (!datetime) {
      await showInfo(
        "Debes seleccionar una fecha y hora",
        "Fecha requerida",
        "📅"
      );
      return;
    }
    reminderData.datetime = datetime;

    // ✨ AGREGAR RECURRENCIA SI SE SELECCIONÓ
    if (recurrenceValue && recurrenceValue !== "none") {
      reminderData.is_recurring = true;
      reminderData.recurrence_pattern = recurrenceValue;
    }
  }

  if (type === "location" || type === "both") {
    reminderData.address = selectedLocation.address;
  }

  try {
    const response = await fetch(`${API_URL}/reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reminderData),
    });

    const data = await response.json();

    if (data.success) {
      // ✨ MENSAJE ESPECIAL SI ES RECURRENTE
      if (reminderData.is_recurring) {
        const patternLabels = {
          daily: "diariamente",
          weekly: "semanalmente",
          monthly: "mensualmente",
          yearly: "anualmente",
        };
        await showSuccess(
          `Este recordatorio se repetirá ${patternLabels[recurrenceValue]}`,
          "Recordatorio recurrente creado",
          "🔄"
        );
      } else if (type === "location" || type === "both") {
        await showSuccess(
          "Se te recordará cuando te acerques al lugar indicado",
          "Recordatorio creado con ubicación",
          "📍"
        );
      } else {
        await showSuccess(
          "Tu recordatorio ha sido guardado correctamente",
          "¡Recordatorio creado!",
          "✅"
        );
      }
      window.location.href = "reminders-list.html";
    } else {
      await showError(
        data.message || "No se pudo crear el recordatorio",
        "Error al crear"
      );
    }
  } catch (error) {
    console.error("Error al crear recordatorio:", error);
    await showError(
      "Hubo un problema al guardar el recordatorio. Intenta de nuevo.",
      "Error de conexión"
    );
  }
});
