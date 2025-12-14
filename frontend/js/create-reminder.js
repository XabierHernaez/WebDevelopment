// Configuración
const API_URL = "http://localhost:5000/api";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user"));

// Verificar autenticación
if (!token || !currentUser) {
  window.location.href = "index.html";
}

// Inicializar Quill Editor
const quill = new Quill("#reminderDescription", {
  theme: "snow",
  placeholder:
    typeof t === "function"
      ? t("descriptionPlaceholder")
      : "Detalles adicionales...",
  modules: {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ header: [1, 2, 3, false] }],
      ["clean"],
    ],
  },
});

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

// Inicializar traducciones
document.addEventListener("DOMContentLoaded", () => {
  initLanguageSelector("langContainer");
  applyTranslations();
  updateSelectOptions();
  updateQuillPlaceholder();
});

// Actualizar cuando cambie el idioma
document.addEventListener("languageChanged", () => {
  updateSelectOptions();
  updateQuillPlaceholder();
});

// Actualizar opciones del select
function updateSelectOptions() {
  const options = reminderType.querySelectorAll("option");
  options.forEach((option) => {
    const key = option.getAttribute("data-i18n");
    if (key && typeof t === "function") {
      option.textContent = t(key);
    }
  });
}

// Actualizar placeholder de Quill
function updateQuillPlaceholder() {
  if (typeof t === "function") {
    const placeholder = t("descriptionPlaceholder");
    quill.root.setAttribute("data-placeholder", placeholder);
  }
}

// Volver a la lista
backBtn.addEventListener("click", () => {
  window.location.href = "reminders-list.html";
});

// Cambiar campos según tipo de recordatorio
reminderType.addEventListener("change", () => {
  const type = reminderType.value;

  if (type === "datetime") {
    datetimeGroup.style.display = "block";
    recurrenceGroup.style.display = "block";
    locationGroup.style.display = "none";
    infoPanel.style.display = "flex";
    mapContainer.style.display = "none";
    document.getElementById("reminderDatetime").required = true;
    reminderAddress.required = false;
  } else if (type === "location") {
    datetimeGroup.style.display = "none";
    recurrenceGroup.style.display = "block";
    locationGroup.style.display = "block";
    infoPanel.style.display = "none";
    mapContainer.style.display = "block";
    document.getElementById("reminderDatetime").required = false;
    reminderAddress.required = true;

    setTimeout(() => {
      initializeMap();
      if (window.map) {
        window.map.invalidateSize();
      }
    }, 150);
  } else if (type === "both") {
    datetimeGroup.style.display = "block";
    recurrenceGroup.style.display = "block";
    locationGroup.style.display = "block";
    infoPanel.style.display = "none";
    mapContainer.style.display = "block";
    document.getElementById("reminderDatetime").required = true;
    reminderAddress.required = true;

    setTimeout(() => initializeMap(), 100);
  }
});

// Buscar dirección manualmente
searchBtn.addEventListener("click", async () => {
  const address = reminderAddress.value.trim();

  if (!address) {
    const title =
      typeof t === "function" ? t("addressRequired") : "Dirección requerida";
    const message =
      typeof t === "function"
        ? t("pleaseEnterAddress")
        : "Por favor, introduce una dirección";
    await showInfo(message, title, "📍");
    return;
  }

  await geocodeAddress(address);
});

// Geocodificar dirección
async function geocodeAddress(address) {
  const searchingText =
    typeof t === "function" ? t("searching") : "🔍 Buscando...";
  const searchText = typeof t === "function" ? t("search") : "🔍 Buscar";

  try {
    searchBtn.textContent = searchingText;
    searchBtn.disabled = true;

    const response = await fetch("http://localhost:5000/api/geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    const result = await response.json();

    if (result.success) {
      const { lat, lng, display_name } = result.data;

      selectedLocation = { lat, lng, address: display_name };

      showSelectedLocation(display_name, lat, lng);

      if (window.map) {
        centerMapOnLocation(lat, lng);
        addMapMarker(lat, lng, display_name);
      }
    } else {
      const title =
        typeof t === "function"
          ? t("locationNotFound")
          : "Ubicación no encontrada";
      const message =
        typeof t === "function"
          ? t("locationNotFoundDesc")
          : "No se encontró la ubicación. Intenta con otra dirección.";
      await showError(message, title, "📍");
    }
  } catch (error) {
    console.error("Error al geocodificar:", error);
    const title =
      typeof t === "function" ? t("searchError") : "Error de búsqueda";
    const message =
      typeof t === "function"
        ? t("searchErrorDesc")
        : "Hubo un problema al buscar la ubicación. Verifica tu conexión.";
    await showError(message, title, "⚠️");
  } finally {
    searchBtn.textContent = searchText;
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
  const description = quill.root.innerHTML;
  const type = reminderType.value;
  const datetime = document.getElementById("reminderDatetime").value;

  const recurrenceValue = document.querySelector(
    'input[name="recurrence"]:checked'
  )?.value;

  if ((type === "location" || type === "both") && !selectedLocation) {
    const msgTitle =
      typeof t === "function" ? t("locationRequired") : "Ubicación requerida";
    const msgDesc =
      typeof t === "function"
        ? t("locationRequiredDesc")
        : "Debes seleccionar una ubicación en el mapa o buscar una dirección";
    await showInfo(msgDesc, msgTitle, "📍");
    return;
  }

  const reminderData = {
    title,
    description: description === "<p><br></p>" ? "" : description,
    reminder_type: type,
  };

  if (type === "datetime" || type === "both") {
    if (!datetime) {
      const msgTitle =
        typeof t === "function" ? t("dateRequired") : "Fecha requerida";
      const msgDesc =
        typeof t === "function"
          ? t("dateRequiredDesc")
          : "Debes seleccionar una fecha y hora";
      await showInfo(msgDesc, msgTitle, "📅");
      return;
    }
    reminderData.datetime = datetime;
  }

  if (recurrenceValue && recurrenceValue !== "none") {
    reminderData.is_recurring = true;
    reminderData.recurrence_pattern = recurrenceValue;
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
      // Obtener etiquetas de frecuencia traducidas
      const getPatternLabel = (pattern) => {
        if (typeof t === "function") {
          const labels = {
            daily: t("frequencyDaily"),
            weekly: t("frequencyWeekly"),
            monthly: t("frequencyMonthly"),
            yearly: t("frequencyYearly"),
          };
          return labels[pattern] || pattern;
        }
        const labels = {
          daily: "diariamente",
          weekly: "semanalmente",
          monthly: "mensualmente",
          yearly: "anualmente",
        };
        return labels[pattern] || pattern;
      };

      if (reminderData.is_recurring) {
        if (type === "location") {
          const msgTitle =
            typeof t === "function"
              ? t("recurringLocationCreated")
              : "Recordatorio recurrente por ubicación creado";
          const msgDesc =
            typeof t === "function"
              ? t("recurringLocationCreatedDesc").replace(
                  "{frequency}",
                  getPatternLabel(recurrenceValue)
                )
              : `Cada vez que te acerques al lugar, se activará ${getPatternLabel(
                  recurrenceValue
                )}`;
          await showSuccess(msgDesc, msgTitle, "🔄📍");
        } else {
          const msgTitle =
            typeof t === "function"
              ? t("recurringCreated")
              : "Recordatorio recurrente creado";
          const msgDesc =
            typeof t === "function"
              ? t("recurringCreatedDesc").replace(
                  "{frequency}",
                  getPatternLabel(recurrenceValue)
                )
              : `Este recordatorio se repetirá ${getPatternLabel(
                  recurrenceValue
                )}`;
          await showSuccess(msgDesc, msgTitle, "🔄");
        }
      } else if (type === "location" || type === "both") {
        const msgTitle =
          typeof t === "function"
            ? t("locationReminderCreated")
            : "Recordatorio creado con ubicación";
        const msgDesc =
          typeof t === "function"
            ? t("locationReminderCreatedDesc")
            : "Se te recordará cuando te acerques al lugar indicado";
        await showSuccess(msgDesc, msgTitle, "📍");
      } else {
        const msgTitle =
          typeof t === "function"
            ? t("reminderCreated")
            : "¡Recordatorio creado!";
        const msgDesc =
          typeof t === "function"
            ? t("reminderCreatedDesc")
            : "Tu recordatorio ha sido guardado correctamente";
        await showSuccess(msgDesc, msgTitle, "✅");
      }
      window.location.href = "reminders-list.html";
    } else {
      const msgTitle =
        typeof t === "function" ? t("createError") : "Error al crear";
      await showError(data.message || msgTitle, msgTitle);
    }
  } catch (error) {
    console.error("Error al crear recordatorio:", error);
    const msgTitle =
      typeof t === "function" ? t("connectionError") : "Error de conexión";
    const msgDesc =
      typeof t === "function"
        ? t("saveErrorDesc")
        : "Hubo un problema al guardar el recordatorio. Intenta de nuevo.";
    await showError(msgDesc, msgTitle);
  }
});
