// Configuración
const API_URL = "http://localhost:3001/api";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user"));
let reminders = [];

// Verificar autenticación
if (!token || !currentUser) {
  window.location.href = "index.html";
}

// Elementos del DOM
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const remindersList = document.getElementById("remindersList");
const newReminderBtn = document.getElementById("newReminderBtn");
const reminderModal = document.getElementById("reminderModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const reminderForm = document.getElementById("reminderForm");
const reminderType = document.getElementById("reminderType");
const datetimeGroup = document.getElementById("datetimeGroup");
const locationGroup = document.getElementById("locationGroup");
const myLocationBtn = document.getElementById("myLocationBtn");

// Mostrar nombre del usuario
userName.textContent = currentUser.name;

// Logout
logoutBtn.addEventListener("click", async () => {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const title =
    lang === "en"
      ? "Are you sure you want to log out?"
      : "¿Seguro que quieres cerrar sesión?";
  const message =
    lang === "en"
      ? "Your current session will be closed"
      : "Se cerrará tu sesión actual";

  const confirmed = await showConfirm(message, title, "🚪");

  if (confirmed) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }
});

// Abrir modal para nuevo recordatorio
newReminderBtn.addEventListener("click", () => {
  openModal();
});

// Cerrar modal
closeModal.addEventListener("click", closeModalFn);
cancelBtn.addEventListener("click", closeModalFn);

// Click fuera del modal para cerrar
reminderModal.addEventListener("click", (e) => {
  if (e.target === reminderModal) {
    closeModalFn();
  }
});

// Cambiar campos según tipo de recordatorio
reminderType.addEventListener("change", () => {
  const type = reminderType.value;

  if (type === "datetime") {
    datetimeGroup.style.display = "block";
    locationGroup.style.display = "none";
    document.getElementById("reminderDatetime").required = true;
    document.getElementById("reminderAddress").required = false;
  } else if (type === "location") {
    datetimeGroup.style.display = "none";
    locationGroup.style.display = "block";
    document.getElementById("reminderDatetime").required = false;
    document.getElementById("reminderAddress").required = true;
  } else if (type === "both") {
    datetimeGroup.style.display = "block";
    locationGroup.style.display = "block";
    document.getElementById("reminderDatetime").required = true;
    document.getElementById("reminderAddress").required = true;
  }
});

// Botón de mi ubicación
myLocationBtn.addEventListener("click", () => {
  getMyLocation();
});

// Funciones del modal
function openModal() {
  reminderModal.classList.add("active");
  reminderForm.reset();
  reminderType.dispatchEvent(new Event("change"));
  selectedCoords = null;
  document.getElementById("selectedLocation").innerHTML = "";
}

function closeModalFn() {
  reminderModal.classList.remove("active");
  reminderForm.reset();
  selectedCoords = null;

  // Remover marcador temporal
  if (window.tempMarker) {
    map.removeLayer(window.tempMarker);
  }
}

// Cargar recordatorios
async function loadReminders() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const errorText =
    lang === "en" ? "Error loading reminders" : "Error al cargar recordatorios";

  try {
    const response = await fetch(`${API_URL}/reminders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      reminders = data.reminders;
      renderReminders();
      updateMapMarkers();
    }
  } catch (error) {
    console.error("Error al cargar recordatorios:", error);
    remindersList.innerHTML = `<div class="loading">${errorText}</div>`;
  }
}

// Renderizar lista de recordatorios
function renderReminders() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const locale = lang === "en" ? "en-US" : "es-ES";

  const noRemindersText =
    lang === "en"
      ? "You don't have any reminders yet. Create a new one!"
      : "No tienes recordatorios aún. ¡Crea uno nuevo!";
  const markPendingText =
    lang === "en" ? "Mark as pending" : "Marcar como pendiente";
  const markCompletedText =
    lang === "en" ? "Mark as completed" : "Marcar como completado";
  const deleteText = lang === "en" ? "Delete" : "Eliminar";
  const viewOnMapText = lang === "en" ? "View on map" : "Ver en mapa";

  if (reminders.length === 0) {
    remindersList.innerHTML = `<div class="loading">${noRemindersText}</div>`;
    return;
  }

  remindersList.innerHTML = reminders
    .map(
      (reminder) => `
        <div class="reminder-card ${
          reminder.is_completed ? "completed" : ""
        }" data-id="${reminder.id}">
            <div class="reminder-title">${reminder.title}</div>
            ${
              reminder.description
                ? `<div style="font-size: 0.9em; color: #666; margin-top: 4px;">${reminder.description}</div>`
                : ""
            }
            <div class="reminder-meta">
                ${reminder.reminder_type === "datetime" ? "⏰" : ""}
                ${reminder.reminder_type === "location" ? "📍" : ""}
                ${reminder.reminder_type === "both" ? "⏰📍" : ""}
                <span>${getReminderTypeText(reminder.reminder_type)}</span>
            </div>
            ${
              reminder.datetime
                ? `<div class="reminder-meta">📅 ${new Date(
                    reminder.datetime
                  ).toLocaleString(locale)}</div>`
                : ""
            }
            ${
              reminder.address
                ? `<div class="reminder-meta">📍 ${reminder.address}</div>`
                : ""
            }
            <div class="reminder-actions">
                <button class="btn-icon" onclick="toggleComplete(${
                  reminder.id
                }, ${!reminder.is_completed})" title="${
        reminder.is_completed ? markPendingText : markCompletedText
      }">
                    ${reminder.is_completed ? "↩️" : "✅"}
                </button>
                <button class="btn-icon" onclick="deleteReminder(${
                  reminder.id
                })" title="${deleteText}">🗑️</button>
                ${
                  reminder.coordinates
                    ? `<button class="btn-icon" onclick="focusOnMap(${reminder.coordinates.lat}, ${reminder.coordinates.lng})" title="${viewOnMapText}">🗺️</button>`
                    : ""
                }
            </div>
        </div>
    `
    )
    .join("");
}

// Actualizar marcadores en el mapa
function updateMapMarkers() {
  clearReminderMarkers();

  reminders.forEach((reminder) => {
    if (reminder.coordinates) {
      addReminderMarker(reminder);
    }
  });
}

// Obtener texto del tipo de recordatorio
function getReminderTypeText(type) {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  const types = {
    es: {
      datetime: "Fecha/Hora",
      location: "Ubicación",
      both: "Fecha + Ubicación",
    },
    en: {
      datetime: "Date/Time",
      location: "Location",
      both: "Date + Location",
    },
  };

  return (types[lang] || types.es)[type] || type;
}

// Crear recordatorio
reminderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  const title = document.getElementById("reminderTitle").value;
  const description = document.getElementById("reminderDescription").value;
  const type = reminderType.value;
  const datetime = document.getElementById("reminderDatetime").value;
  const address = document.getElementById("reminderAddress").value;

  const reminderData = {
    title,
    description,
    reminder_type: type,
  };

  if (type === "datetime" || type === "both") {
    reminderData.datetime = datetime;
  }

  if (type === "location" || type === "both") {
    reminderData.address = address;
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
      const successTitle =
        lang === "en" ? "Reminder created!" : "¡Recordatorio creado!";
      const successMsg =
        lang === "en"
          ? "Your reminder has been created successfully"
          : "Tu recordatorio ha sido creado correctamente";
      await showSuccess(successMsg, successTitle, "✅");
      window.location.href = "reminders-list.html";
    } else {
      const errorTitle = lang === "en" ? "Error creating" : "Error al crear";
      const errorMsg =
        lang === "en"
          ? "Could not create the reminder"
          : "No se pudo crear el recordatorio";
      await showError(data.message || errorMsg, errorTitle);
    }
  } catch (error) {
    console.error("Error al crear recordatorio:", error);
    const errorTitle = lang === "en" ? "Connection error" : "Error de conexión";
    const errorMsg =
      lang === "en"
        ? "There was a problem creating the reminder"
        : "Hubo un problema al crear el recordatorio";
    await showError(errorMsg, errorTitle);
  }
});

// Marcar como completado/pendiente
async function toggleComplete(id, isCompleted) {
  try {
    const response = await fetch(`${API_URL}/reminders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_completed: isCompleted }),
    });

    const data = await response.json();

    if (data.success) {
      loadReminders();
    }
  } catch (error) {
    console.error("Error al actualizar recordatorio:", error);
  }
}

// Eliminar recordatorio
async function deleteReminder(id) {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  const confirmTitle =
    lang === "en" ? "Delete this reminder?" : "¿Eliminar este recordatorio?";
  const confirmMsg =
    lang === "en"
      ? "This action cannot be undone"
      : "Esta acción no se puede deshacer";

  const confirmed = await showConfirm(confirmMsg, confirmTitle, "🗑️");

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/reminders/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      loadReminders();
      const successTitle =
        lang === "en" ? "Reminder deleted" : "Recordatorio eliminado";
      const successMsg =
        lang === "en"
          ? "The reminder has been deleted"
          : "El recordatorio ha sido eliminado";
      await showSuccess(successMsg, successTitle, "✅");
    }
  } catch (error) {
    console.error("Error al eliminar recordatorio:", error);
    const errorTitle = lang === "en" ? "Error deleting" : "Error al eliminar";
    const errorMsg =
      lang === "en"
        ? "Could not delete the reminder"
        : "No se pudo eliminar el recordatorio";
    await showError(errorMsg, errorTitle);
  }
}

// Enfocar mapa en ubicación
function focusOnMap(lat, lng) {
  centerMap(lat, lng, 16);
}

// Cargar recordatorios al iniciar
loadReminders();
