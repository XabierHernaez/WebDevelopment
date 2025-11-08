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
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
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
    remindersList.innerHTML =
      '<div class="loading">Error al cargar recordatorios</div>';
  }
}

// Renderizar lista de recordatorios
function renderReminders() {
  if (reminders.length === 0) {
    remindersList.innerHTML =
      '<div class="loading">No tienes recordatorios aún. ¡Crea uno nuevo!</div>';
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
                  ).toLocaleString("es-ES")}</div>`
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
        reminder.is_completed
          ? "Marcar como pendiente"
          : "Marcar como completado"
      }">
                    ${reminder.is_completed ? "↩️" : "✅"}
                </button>
                <button class="btn-icon" onclick="deleteReminder(${
                  reminder.id
                })" title="Eliminar">🗑️</button>
                ${
                  reminder.coordinates
                    ? `<button class="btn-icon" onclick="focusOnMap(${reminder.coordinates.lat}, ${reminder.coordinates.lng})" title="Ver en mapa">🗺️</button>`
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
  const types = {
    datetime: "Fecha/Hora",
    location: "Ubicación",
    both: "Fecha + Ubicación",
  };
  return types[type] || type;
}

// Crear recordatorio
reminderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

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
      closeModalFn();
      loadReminders();
      alert("✅ Recordatorio creado exitosamente");
    } else {
      alert("❌ Error: " + data.message);
    }
  } catch (error) {
    console.error("Error al crear recordatorio:", error);
    alert("❌ Error al crear recordatorio");
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
  if (!confirm("¿Estás seguro de que quieres eliminar este recordatorio?")) {
    return;
  }

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
      alert("✅ Recordatorio eliminado");
    }
  } catch (error) {
    console.error("Error al eliminar recordatorio:", error);
    alert("❌ Error al eliminar recordatorio");
  }
}

// Enfocar mapa en ubicación
function focusOnMap(lat, lng) {
  centerMap(lat, lng, 16);
}

// Cargar recordatorios al iniciar
loadReminders();
