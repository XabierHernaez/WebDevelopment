// Configuración
const API_URL = "http://localhost:5000/api";
const FRIENDS_API_URL = "http://localhost:5000/api/friends";
const GROUPS_API_URL = "http://localhost:5000/api/groups";

let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user"));

// Verificar autenticación
if (!token || !currentUser) {
  window.location.href = "index.html";
}

// Estado de compartir
let selectedFriends = [];
let selectedGroups = [];

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

  // Añadir sección de compartir después de recurrencia
  addShareSection();
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

// ===== SECCIÓN DE COMPARTIR =====

function addShareSection() {
  // Crear la sección de compartir
  const shareHTML = `
    <div class="form-group" id="shareGroup">
      <label data-i18n="shareWith">👥 Compartir con (opcional)</label>
      <div class="share-section">
        <div class="share-loading" id="shareLoading">
          <span class="share-spinner"></span>
          <span>Cargando...</span>
        </div>
        <div id="shareContent" style="display: none;">
          <!-- Amigos -->
          <div class="share-category" id="friendsShareCategory" style="display: none;">
            <div class="share-category-title">
              <span>👤 Amigos</span>
              <span class="share-count" id="friendsCount">(0)</span>
            </div>
            <div class="share-chips" id="friendsChips"></div>
          </div>
          
          <!-- Grupos -->
          <div class="share-category" id="groupsShareCategory" style="display: none;">
            <div class="share-category-title">
              <span>👨‍👩‍👧‍👦 Grupos</span>
              <span class="share-count" id="groupsCount">(0)</span>
            </div>
            <div class="share-chips" id="groupsChips"></div>
          </div>
          
          <!-- Mensaje si no hay amigos ni grupos -->
          <div class="share-empty" id="shareEmpty" style="display: none;">
            <p>No tienes amigos ni grupos todavía.</p>
            <a href="#" onclick="goToFriends()" class="share-link">+ Añadir amigos</a>
          </div>
          
          <!-- Resumen de seleccionados -->
          <div class="share-summary" id="shareSummary" style="display: none;">
            <span id="shareSummaryText">0 seleccionados</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insertar después del grupo de recurrencia
  const recurrenceGroup = document.getElementById("recurrenceGroup");
  recurrenceGroup.insertAdjacentHTML("afterend", shareHTML);

  // Cargar amigos y grupos
  loadShareOptions();
}

async function loadShareOptions() {
  const loading = document.getElementById("shareLoading");
  const content = document.getElementById("shareContent");

  try {
    // Cargar amigos y grupos en paralelo
    const [friendsRes, groupsRes] = await Promise.all([
      fetch(`${FRIENDS_API_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${GROUPS_API_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const friendsData = await friendsRes.json();
    const groupsData = await groupsRes.json();

    loading.style.display = "none";
    content.style.display = "block";

    const hasFriends = friendsData.success && friendsData.friends.length > 0;
    const hasGroups = groupsData.success && groupsData.groups.length > 0;

    if (!hasFriends && !hasGroups) {
      document.getElementById("shareEmpty").style.display = "block";
      return;
    }

    // Renderizar amigos
    if (hasFriends) {
      document.getElementById("friendsShareCategory").style.display = "block";
      document.getElementById("friendsChips").innerHTML = friendsData.friends
        .map((friend) => createShareChip(friend, "friend"))
        .join("");
    }

    // Renderizar grupos
    if (hasGroups) {
      document.getElementById("groupsShareCategory").style.display = "block";
      document.getElementById("groupsChips").innerHTML = groupsData.groups
        .map((group) => createShareChip(group, "group"))
        .join("");
    }
  } catch (error) {
    console.error("Error al cargar opciones de compartir:", error);
    loading.innerHTML = '<span class="share-error">Error al cargar</span>';
  }
}

function createShareChip(item, type) {
  const isGroup = type === "group";
  const id = item.id;
  const name = item.name || item.email;
  const initial = name.charAt(0).toUpperCase();
  const color = isGroup
    ? item.color || "#6366f1"
    : generateAvatarColor(item.email);

  return `
    <div class="share-chip" 
         data-type="${type}" 
         data-id="${id}"
         onclick="toggleShareChip(this)">
      <div class="share-chip-avatar ${
        isGroup ? "group" : ""
      }" style="background-color: ${color};">
        ${initial}
      </div>
      <span class="share-chip-name">${name}</span>
      <span class="share-chip-check">✓</span>
    </div>
  `;
}

function toggleShareChip(chip) {
  const type = chip.dataset.type;
  const id = parseInt(chip.dataset.id);

  chip.classList.toggle("selected");

  if (type === "friend") {
    if (chip.classList.contains("selected")) {
      if (!selectedFriends.includes(id)) {
        selectedFriends.push(id);
      }
    } else {
      selectedFriends = selectedFriends.filter((f) => f !== id);
    }
  } else if (type === "group") {
    if (chip.classList.contains("selected")) {
      if (!selectedGroups.includes(id)) {
        selectedGroups.push(id);
      }
    } else {
      selectedGroups = selectedGroups.filter((g) => g !== id);
    }
  }

  updateShareSummary();
}

function updateShareSummary() {
  const totalSelected = selectedFriends.length + selectedGroups.length;
  const summary = document.getElementById("shareSummary");
  const summaryText = document.getElementById("shareSummaryText");

  if (totalSelected > 0) {
    summary.style.display = "block";

    let text = "";
    if (selectedFriends.length > 0) {
      text += `${selectedFriends.length} amigo${
        selectedFriends.length > 1 ? "s" : ""
      }`;
    }
    if (selectedGroups.length > 0) {
      if (text) text += " y ";
      text += `${selectedGroups.length} grupo${
        selectedGroups.length > 1 ? "s" : ""
      }`;
    }

    summaryText.textContent = `✓ ${text} seleccionado${
      totalSelected > 1 ? "s" : ""
    }`;
  } else {
    summary.style.display = "none";
  }
}

function goToFriends() {
  window.location.href = "reminders-list.html";
  // El usuario puede abrir el modal de amigos desde allí
}

// Función auxiliar para generar color de avatar
function generateAvatarColor(str) {
  if (!str) return "#6366f1";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
  ];
  return colors[Math.abs(hash) % colors.length];
}

// ===== RESTO DEL CÓDIGO ORIGINAL =====

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
    // 1. Crear el recordatorio
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
      const reminderId = data.reminder.id;

      // 2. Compartir con amigos si hay seleccionados
      if (selectedFriends.length > 0) {
        await shareWithFriends(reminderId, selectedFriends);
      }

      // 3. Compartir con grupos si hay seleccionados
      if (selectedGroups.length > 0) {
        await shareWithGroups(reminderId, selectedGroups);
      }

      // Mostrar mensaje de éxito
      await showSuccessMessage(
        type,
        recurrenceValue,
        reminderData.is_recurring
      );

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

// Compartir con amigos
async function shareWithFriends(reminderId, friendIds) {
  try {
    await fetch(`${API_URL}/reminders/${reminderId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friend_ids: friendIds }),
    });
  } catch (error) {
    console.error("Error al compartir con amigos:", error);
  }
}

// Compartir con grupos
async function shareWithGroups(reminderId, groupIds) {
  for (const groupId of groupIds) {
    try {
      await fetch(`${GROUPS_API_URL}/${groupId}/reminders/${reminderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error(`Error al compartir con grupo ${groupId}:`, error);
    }
  }
}

// Mostrar mensaje de éxito
async function showSuccessMessage(type, recurrenceValue, isRecurring) {
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

  // Mensaje adicional si se compartió
  let shareMsg = "";
  if (selectedFriends.length > 0 || selectedGroups.length > 0) {
    shareMsg = " y compartido";
  }

  if (isRecurring) {
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
            )}${shareMsg}`;
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
            )}${shareMsg}`;
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
        : `Se te recordará cuando te acerques al lugar indicado${shareMsg}`;
    await showSuccess(msgDesc, msgTitle, "📍");
  } else {
    const msgTitle =
      typeof t === "function" ? t("reminderCreated") : "¡Recordatorio creado!";
    const msgDesc =
      typeof t === "function"
        ? t("reminderCreatedDesc")
        : `Tu recordatorio ha sido guardado correctamente${shareMsg}`;
    await showSuccess(msgDesc, msgTitle, "✅");
  }
}
