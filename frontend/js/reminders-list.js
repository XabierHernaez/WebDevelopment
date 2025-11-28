// Configuración
const API_URL = "http://localhost:5000/api";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user"));
let reminders = [];
let filteredReminders = []; // ✨ Array para recordatorios filtrados

// Verificar autenticación
if (!token || !currentUser) {
  window.location.href = "index.html";
}

// Elementos del DOM
const welcomeMessage = document.getElementById("welcomeMessage");
const newReminderBtn = document.getElementById("newReminderBtn");
const remindersList = document.getElementById("remindersList");
const logoutBtn = document.getElementById("logoutBtn");
const calendarBtn = document.getElementById("calendarBtn");

// ✨ NUEVOS: Elementos del buscador
const searchContainer = document.getElementById("searchContainer");
const searchToggleBtn = document.getElementById("searchToggleBtn");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

// Mostrar nombre del usuario
welcomeMessage.textContent = `Hola, ${currentUser.name} 👋`;

// Logout
logoutBtn.addEventListener("click", async () => {
  const confirmed = await showConfirm(
    "Se cerrará tu sesión actual",
    "¿Seguro que quieres cerrar sesión?",
    "🚪"
  );

  if (confirmed) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }
});

// Ir a crear nuevo recordatorio
newReminderBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// Ir al calendario
calendarBtn.addEventListener("click", () => {
  window.location.href = "calendar.html";
});

// ✨ NUEVO: Toggle del buscador
searchToggleBtn.addEventListener("click", () => {
  searchContainer.classList.toggle("expanded");

  if (searchContainer.classList.contains("expanded")) {
    // Expandido - dar foco al input
    setTimeout(() => {
      searchInput.focus();
    }, 300);
  } else {
    // Colapsado - limpiar búsqueda
    clearSearch();
  }
});

// ✨ NUEVO: Input de búsqueda en tiempo real
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.trim().toLowerCase();

  if (searchTerm === "") {
    filteredReminders = [...reminders];
    searchContainer.classList.remove("has-results", "no-results");
  } else {
    filteredReminders = reminders.filter((reminder) => {
      // Buscar en título, descripción y dirección
      const titleMatch = reminder.title.toLowerCase().includes(searchTerm);
      const descMatch =
        reminder.description?.toLowerCase().includes(searchTerm) || false;
      const addressMatch =
        reminder.address?.toLowerCase().includes(searchTerm) || false;

      return titleMatch || descMatch || addressMatch;
    });

    // Actualizar estado visual
    if (filteredReminders.length > 0) {
      searchContainer.classList.add("has-results");
      searchContainer.classList.remove("no-results");
    } else {
      searchContainer.classList.add("no-results");
      searchContainer.classList.remove("has-results");
    }
  }

  renderReminders();
});

// ✨ NUEVO: Limpiar búsqueda
clearSearchBtn.addEventListener("click", () => {
  clearSearch();
});

function clearSearch() {
  searchInput.value = "";
  filteredReminders = [...reminders];
  searchContainer.classList.remove("has-results", "no-results", "expanded");
  renderReminders();
}

// ✨ NUEVO: Cerrar búsqueda con ESC
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    clearSearch();
  }
});

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
      filteredReminders = [...reminders]; // ✨ Inicializar filtrados
      renderReminders();
    } else {
      remindersList.innerHTML =
        '<div class="loading">❌ Error al cargar recordatorios</div>';
    }
  } catch (error) {
    console.error("Error al cargar recordatorios:", error);
    remindersList.innerHTML = '<div class="loading">❌ Error de conexión</div>';
  }
}

// ✨ MODIFICADA: Renderizar recordatorios (usa filteredReminders)
// ✨ NUEVA FUNCIÓN: Agrupar recordatorios por fecha de creación
function groupRemindersByDate(reminders) {
  const groups = {};

  reminders.forEach((reminder) => {
    const createdDate = new Date(reminder.created_at);
    const dateKey = createdDate.toDateString(); // "Thu Nov 28 2024"

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: createdDate,
        reminders: [],
      };
    }

    groups[dateKey].reminders.push(reminder);
  });

  return groups;
}

// ✨ NUEVA FUNCIÓN: Formatear fecha del grupo
function formatGroupDate(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate.getTime() === today.getTime()) {
    return "📅 Hoy";
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return "📅 Ayer";
  } else {
    const options = { weekday: "long", day: "numeric", month: "long" };
    return "📅 " + date.toLocaleDateString("es-ES", options);
  }
}

// ✨ MODIFICADA: Renderizar recordatorios agrupados por fecha
function renderReminders() {
  // Si no hay recordatorios en absoluto
  if (reminders.length === 0) {
    remindersList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No tienes recordatorios aún</h3>
        <p>¡Crea tu primer recordatorio haciendo click en "+ Nuevo Recordatorio"!</p>
      </div>
    `;
    return;
  }

  // Si hay búsqueda activa pero sin resultados
  if (filteredReminders.length === 0 && searchInput.value.trim() !== "") {
    remindersList.innerHTML = `
      <div class="no-results-message">
        <div class="no-results-icon">🔍</div>
        <h3>No se encontraron resultados</h3>
        <p>No hay recordatorios que coincidan con "<strong>${searchInput.value}</strong>"</p>
        <button class="btn-clear-search-big" onclick="clearSearch()">
          ✨ Limpiar búsqueda
        </button>
      </div>
    `;
    return;
  }

  // ✨ AGRUPAR por fecha de creación
  const grouped = groupRemindersByDate(filteredReminders);

  // Ordenar grupos por fecha (más reciente primero)
  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    return b[1].date - a[1].date;
  });

  // Renderizar grupos
  let html = "";

  sortedGroups.forEach(([dateKey, group]) => {
    html += `<div class="date-group-header">${formatGroupDate(
      group.date
    )}</div>`;

    group.reminders.forEach((reminder) => {
      // Determinar clase según tipo
      let typeClass = "";
      if (reminder.reminder_type === "location") typeClass = "location";
      if (reminder.reminder_type === "both") typeClass = "both";

      const completedClass = reminder.is_completed ? "completed" : "";
      const notifiedClass = reminder.is_notified ? "notified" : "";

      // Emoji según tipo
      let emoji = "📌";
      if (reminder.reminder_type === "location") emoji = "📍";
      if (reminder.reminder_type === "datetime") emoji = "⏰";
      if (reminder.reminder_type === "both") emoji = "⏰📍";

      // Badge de recurrencia
      const recurrenceBadge = reminder.is_recurring
        ? `<span class="recurrence-badge">${getRecurrenceIcon(
            reminder.recurrence_pattern
          )} ${getRecurrenceLabel(reminder.recurrence_pattern)}</span>`
        : "";

      html += `
        <div class="reminder-item ${typeClass} ${completedClass} ${notifiedClass}" data-id="${
        reminder.id
      }">
          <div class="reminder-header">
            <h3 class="reminder-title">
              <span class="reminder-emoji">${emoji}</span>
              ${reminder.title}
              ${recurrenceBadge}
            </h3>
            <div class="reminder-actions">
              ${
                !reminder.is_completed
                  ? `
                <button class="btn-action ${
                  reminder.is_recurring ? "recurring-active" : ""
                }" 
                        onclick="toggleRecurrence(${reminder.id}, ${
                      reminder.is_recurring
                    })" 
                        title="${
                          reminder.is_recurring
                            ? "Desactivar recurrencia"
                            : "Hacer recurrente"
                        }">
                    🔄
                </button>
              `
                  : ""
              }
              <button class="btn-action" onclick="toggleComplete(${
                reminder.id
              }, ${!reminder.is_completed})" title="${
        reminder.is_completed ? "Marcar pendiente" : "Completar"
      }">
                ${reminder.is_completed ? "↩️" : "✅"}
              </button>
              <button class="btn-action" onclick="deleteReminder(${
                reminder.id
              })" title="Eliminar">
                🗑️
              </button>
            </div>
          </div>

          ${
            reminder.description
              ? `
            <p class="reminder-description">${reminder.description}</p>
          `
              : ""
          }

          <div class="reminder-meta">
            ${
              reminder.address
                ? `
              <div class="meta-item">
                <span class="meta-icon">📍</span>
                <span>${reminder.address}</span>
              </div>
            `
                : ""
            }
            
            ${
              reminder.datetime
                ? `
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span>${formatDateTime(reminder.datetime)}</span>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;
    });
  });

  remindersList.innerHTML = html;
}

// Formatear fecha
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("es-ES", options);
}

// Obtener etiqueta de recurrencia
function getRecurrenceLabel(pattern) {
  const labels = {
    daily: "Diaria",
    weekly: "Semanal",
    monthly: "Mensual",
    yearly: "Anual",
  };
  return labels[pattern] || pattern;
}

// Obtener icono de recurrencia
function getRecurrenceIcon(pattern) {
  const icons = {
    daily: "📅",
    weekly: "📆",
    monthly: "🗓️",
    yearly: "📖",
  };
  return icons[pattern] || "🔄";
}

// Activar/desactivar recurrencia
async function toggleRecurrence(id, isCurrentlyRecurring) {
  const reminder = reminders.find((r) => r.id === id);

  if (isCurrentlyRecurring) {
    // Desactivar recurrencia
    const confirmed = await showConfirm(
      "El recordatorio dejará de repetirse automáticamente",
      "¿Desactivar recurrencia?",
      "🔄"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/reminders/${id}/recurring`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        await showSuccess(
          "El recordatorio ya no se repetirá",
          "Recurrencia desactivada",
          "✅"
        );
        loadReminders();
      } else {
        await showError(data.message || "Error al desactivar recurrencia");
      }
    } catch (error) {
      console.error("Error:", error);
      await showError("No se pudo desactivar la recurrencia");
    }
  } else {
    // Activar recurrencia - Mostrar modal de selección
    showRecurrenceModal(id, reminder);
  }
}

// Modal de selección de recurrencia
// Modal de selección de recurrencia
function showRecurrenceModal(reminderId, reminder) {
  const overlay = document.createElement("div");
  overlay.className = "custom-modal-overlay show";

  // ✨ Determinar si tiene fecha o es solo ubicación
  const hasDateTime = Boolean(reminder.datetime);

  overlay.innerHTML = `
    <div class="custom-modal">
      <div class="custom-modal-header info">
        <div class="custom-modal-icon">🔄</div>
        <h2>Hacer recurrente</h2>
      </div>
      <div class="custom-modal-body">
        <p style="margin-bottom: 20px;">El recordatorio "<strong>${
          reminder.title
        }</strong>" se repetirá automáticamente</p>
        
        <div class="recurrence-options">
          <label class="recurrence-option">
            <input type="radio" name="pattern" value="daily">
            <span class="option-content">
              <span class="option-icon">📅</span>
              <span class="option-text">
                <strong>Diaria</strong>
                <small>${
                  hasDateTime
                    ? `Todos los días a las ${formatTime(reminder.datetime)}`
                    : "Cada vez que te acerques (diariamente)"
                }</small>
              </span>
            </span>
          </label>
          
          <label class="recurrence-option">
            <input type="radio" name="pattern" value="weekly" checked>
            <span class="option-content">
              <span class="option-icon">📆</span>
              <span class="option-text">
                <strong>Semanal</strong>
                <small>${
                  hasDateTime
                    ? `Cada ${getDayName(reminder.datetime)} a las ${formatTime(
                        reminder.datetime
                      )}`
                    : "Cada vez que te acerques (semanalmente)"
                }</small>
              </span>
            </span>
          </label>
          
          <label class="recurrence-option">
            <input type="radio" name="pattern" value="monthly">
            <span class="option-content">
              <span class="option-icon">🗓️</span>
              <span class="option-text">
                <strong>Mensual</strong>
                <small>${
                  hasDateTime
                    ? `Día ${getDayNumber(reminder.datetime)} de cada mes`
                    : "Cada vez que te acerques (mensualmente)"
                }</small>
              </span>
            </span>
          </label>
          
          <label class="recurrence-option">
            <input type="radio" name="pattern" value="yearly">
            <span class="option-content">
              <span class="option-icon">📖</span>
              <span class="option-text">
                <strong>Anual</strong>
                <small>${
                  hasDateTime
                    ? `Cada año el ${getFullDate(reminder.datetime)}`
                    : "Cada vez que te acerques (anualmente)"
                }</small>
              </span>
            </span>
          </label>
        </div>
      </div>
      <div class="custom-modal-actions">
        <button class="custom-modal-btn secondary" data-action="cancel">
          Cancelar
        </button>
        <button class="custom-modal-btn primary" data-action="confirm">
          Activar recurrencia
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Manejar confirmación
  overlay.querySelector('[data-action="confirm"]').onclick = async () => {
    const selectedPattern = overlay.querySelector(
      'input[name="pattern"]:checked'
    ).value;
    overlay.remove();
    await activateRecurrence(reminderId, selectedPattern);
  };

  // Manejar cancelación
  overlay.querySelector('[data-action="cancel"]').onclick = () => {
    overlay.remove();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };
}

// Activar recurrencia en el backend
async function activateRecurrence(reminderId, pattern) {
  try {
    const response = await fetch(
      `${API_URL}/reminders/${reminderId}/recurring`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recurrence_pattern: pattern,
          recurrence_end_date: null,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      await showSuccess(
        `El recordatorio se repetirá ${getRecurrenceLabel(
          pattern
        ).toLowerCase()}`,
        "Recurrencia activada",
        "🔄"
      );
      loadReminders();
    } else {
      await showError(data.message || "Error al activar recurrencia");
    }
  } catch (error) {
    console.error("Error:", error);
    await showError("No se pudo activar la recurrencia");
  }
}

// Utilidades de formato
function formatTime(datetime) {
  const date = new Date(datetime);
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayName(datetime) {
  const date = new Date(datetime);
  const days = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  return days[date.getDay()];
}

function getDayNumber(datetime) {
  const date = new Date(datetime);
  return date.getDate();
}

function getFullDate(datetime) {
  const date = new Date(datetime);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

// Marcar como completado
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
      // Si es recurrente y se renovó, mostrar mensaje especial
      if (data.renewed) {
        await showSuccess(
          `Próxima ocurrencia: ${formatDateTime(data.next_occurrence)}`,
          "Recordatorio renovado automáticamente",
          "🔄"
        );
      }
      loadReminders();
    }
  } catch (error) {
    console.error("Error al actualizar:", error);
    await showError(
      "No se pudo actualizar el recordatorio",
      "Error al actualizar"
    );
  }
}

// Eliminar recordatorio
async function deleteReminder(id) {
  const confirmed = await showConfirm(
    "Esta acción no se puede deshacer",
    "¿Eliminar este recordatorio?",
    "🗑️"
  );

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
      await showSuccess(
        "El recordatorio ha sido eliminado",
        "Recordatorio eliminado",
        "✅"
      );
      loadReminders();
    } else {
      await showError(
        "No se pudo eliminar el recordatorio",
        "Error al eliminar"
      );
    }
  } catch (error) {
    console.error("Error al eliminar:", error);
    await showError(
      "Hubo un problema al eliminar el recordatorio",
      "Error de conexión"
    );
  }
}

// Cargar al iniciar
loadReminders();
