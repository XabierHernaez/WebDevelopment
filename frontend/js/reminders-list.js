// Configuración
const API_URL = "http://localhost:5000/api";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user"));
let reminders = [];
let filteredReminders = [];

// Verificar autenticación
if (!token || !currentUser) {
  window.location.href = "index.html";
}

// Elementos del DOM
const welcomeMessage = document.getElementById("welcomeMessage");
const newReminderBtn = document.getElementById("newReminderBtn");
const remindersList = document.getElementById("remindersList");
const calendarBtn = document.getElementById("calendarBtn");

const searchContainer = document.getElementById("searchContainer");
const searchToggleBtn = document.getElementById("searchToggleBtn");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

// ===== AVATAR DEL USUARIO =====

// Generar color consistente basado en el email
function generateAvatarColor(email) {
  const colors = [
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#d946ef", // fuchsia
    "#ec4899", // pink
    "#f43f5e", // rose
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#84cc16", // lime
    "#22c55e", // green
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#0ea5e9", // sky
    "#3b82f6", // blue
  ];

  // Usar el email para generar un índice consistente
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Obtener inicial del usuario
function getUserInitial(name, email) {
  if (name && name.trim()) {
    return name.trim().charAt(0).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return "?";
}

// Inicializar avatar
function initUserAvatar() {
  const avatar = document.getElementById("userAvatar");
  const dropdownAvatar = document.getElementById("dropdownAvatar");
  const dropdownUserName = document.getElementById("dropdownUserName");
  const dropdownUserEmail = document.getElementById("dropdownUserEmail");
  const avatarContainer = document.getElementById("userAvatarContainer");

  if (!currentUser || !avatar) return;

  const initial = getUserInitial(currentUser.name, currentUser.email);
  const color = generateAvatarColor(currentUser.email);

  // Aplicar al avatar del header
  avatar.textContent = initial;
  avatar.style.backgroundColor = color;

  // Aplicar al avatar del dropdown
  if (dropdownAvatar) {
    dropdownAvatar.textContent = initial;
  }

  // Info del usuario en dropdown
  if (dropdownUserName) {
    dropdownUserName.textContent = currentUser.name || "Usuario";
  }
  if (dropdownUserEmail) {
    dropdownUserEmail.textContent = currentUser.email || "";
  }

  // Toggle dropdown al hacer click
  avatar.addEventListener("click", (e) => {
    e.stopPropagation();
    avatarContainer.classList.toggle("active");
  });

  // Cerrar dropdown al hacer click fuera
  document.addEventListener("click", (e) => {
    if (!avatarContainer.contains(e.target)) {
      avatarContainer.classList.remove("active");
    }
  });

  // Cerrar con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      avatarContainer.classList.remove("active");
    }
  });

  // Logout desde dropdown
  const dropdownLogoutBtn = document.getElementById("dropdownLogoutBtn");
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      avatarContainer.classList.remove("active");

      const title =
        typeof t === "function"
          ? t("confirmLogout")
          : "¿Seguro que quieres cerrar sesión?";
      const message =
        typeof t === "function"
          ? t("sessionWillClose")
          : "Se cerrará tu sesión actual";

      const confirmed = await showConfirm(message, title, "🚪");

      if (confirmed) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      }
    });
  }

  // Perfil (por ahora muestra info)
  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      avatarContainer.classList.remove("active");
      const profileTitle =
        typeof t === "function" ? t("myProfile") : "Mi Perfil";
      const profileMsg = `Nombre: ${currentUser.name}\nEmail: ${currentUser.email}`;
      showInfo(profileMsg, profileTitle, "👤");
    });
  }

  // Amigos (próximamente)
  const friendsBtn = document.getElementById("friendsBtn");
  if (friendsBtn) {
    friendsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      avatarContainer.classList.remove("active");
      const comingSoonTitle =
        typeof t === "function" ? t("comingSoon") : "Próximamente";
      const comingSoonMsg =
        typeof t === "function"
          ? t("friendsComingSoon")
          : "La funcionalidad de amigos estará disponible pronto";
      showInfo(comingSoonMsg, comingSoonTitle, "👥");
    });
  }

  // Configuración (próximamente)
  const settingsBtn = document.getElementById("settingsBtn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      avatarContainer.classList.remove("active");
      const comingSoonTitle =
        typeof t === "function" ? t("comingSoon") : "Próximamente";
      const comingSoonMsg =
        typeof t === "function"
          ? t("settingsComingSoon")
          : "La configuración estará disponible pronto";
      showInfo(comingSoonMsg, comingSoonTitle, "⚙️");
    });
  }
}

// ===== FIN AVATAR =====

// Función para actualizar el saludo
function updateWelcomeMessage() {
  const greeting = typeof t === "function" ? t("hello") : "Hola";
  welcomeMessage.textContent = `${greeting}, ${currentUser.name} 👋`;
}

// Mostrar nombre del usuario
updateWelcomeMessage();

// Inicializar traducciones cuando cargue la página
document.addEventListener("DOMContentLoaded", () => {
  initLanguageSelector("langContainer");
  applyTranslations();
  updateWelcomeMessage();
  initUserAvatar(); // Inicializar avatar
});

// Actualizar cuando cambie el idioma
document.addEventListener("languageChanged", () => {
  updateWelcomeMessage();
  renderReminders();
});

// Ir a crear nuevo recordatorio
newReminderBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// Ir al calendario
calendarBtn.addEventListener("click", () => {
  window.location.href = "calendar.html";
});

// Toggle del buscador
searchToggleBtn.addEventListener("click", () => {
  searchContainer.classList.toggle("expanded");

  if (searchContainer.classList.contains("expanded")) {
    setTimeout(() => {
      searchInput.focus();
    }, 300);
  } else {
    clearSearch();
  }
});

// Input de búsqueda en tiempo real
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.trim().toLowerCase();

  if (searchTerm === "") {
    filteredReminders = [...reminders];
    searchContainer.classList.remove("has-results", "no-results");
  } else {
    filteredReminders = reminders.filter((reminder) => {
      const titleMatch = reminder.title.toLowerCase().includes(searchTerm);
      const descMatch =
        reminder.description?.toLowerCase().includes(searchTerm) || false;
      const addressMatch =
        reminder.address?.toLowerCase().includes(searchTerm) || false;

      return titleMatch || descMatch || addressMatch;
    });

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

// Limpiar búsqueda
clearSearchBtn.addEventListener("click", () => {
  clearSearch();
});

function clearSearch() {
  searchInput.value = "";
  filteredReminders = [...reminders];
  searchContainer.classList.remove("has-results", "no-results", "expanded");
  renderReminders();
}

// Cerrar búsqueda con ESC
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
      filteredReminders = [...reminders];
      renderReminders();
    } else {
      const errorMsg =
        typeof t === "function"
          ? t("loadError")
          : "❌ Error al cargar recordatorios";
      remindersList.innerHTML = `<div class="loading">${errorMsg}</div>`;
    }
  } catch (error) {
    console.error("Error al cargar recordatorios:", error);
    remindersList.innerHTML = '<div class="loading">❌ Error de conexión</div>';
  }
}

// Agrupar recordatorios por fecha de creación
function groupRemindersByDate(reminders) {
  const groups = {};

  reminders.forEach((reminder) => {
    const createdDate = new Date(reminder.created_at);
    const dateKey = createdDate.toDateString();

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

// Formatear fecha del grupo
function formatGroupDate(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  const todayText = typeof t === "function" ? t("today") : "📅 Hoy";
  const yesterdayText = typeof t === "function" ? t("yesterday") : "📅 Ayer";
  const locale =
    typeof getLanguage === "function" && getLanguage() === "en"
      ? "en-US"
      : "es-ES";

  if (compareDate.getTime() === today.getTime()) {
    return todayText;
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return yesterdayText;
  } else {
    const options = { weekday: "long", day: "numeric", month: "long" };
    return "📅 " + date.toLocaleDateString(locale, options);
  }
}

// Renderizar recordatorios agrupados por fecha
function renderReminders() {
  const noRemindersTitle =
    typeof t === "function" ? t("noReminders") : "No tienes recordatorios aún";
  const createFirstText =
    typeof t === "function"
      ? t("createFirst")
      : '¡Crea tu primer recordatorio haciendo click en "+ Nuevo Recordatorio"!';
  const noResultsTitle =
    typeof t === "function" ? t("noResults") : "No se encontraron resultados";
  const noMatchText =
    typeof t === "function"
      ? t("noMatchFor")
      : "No hay recordatorios que coincidan con";
  const clearSearchText =
    typeof t === "function" ? t("clearSearch") : "✨ Limpiar búsqueda";

  // Si no hay recordatorios en absoluto
  if (reminders.length === 0) {
    remindersList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>${noRemindersTitle}</h3>
        <p>${createFirstText}</p>
      </div>
    `;
    return;
  }

  // Si hay búsqueda activa pero sin resultados
  if (filteredReminders.length === 0 && searchInput.value.trim() !== "") {
    remindersList.innerHTML = `
      <div class="no-results-message">
        <div class="no-results-icon">🔍</div>
        <h3>${noResultsTitle}</h3>
        <p>${noMatchText} "<strong>${searchInput.value}</strong>"</p>
        <button class="btn-clear-search-big" onclick="clearSearch()">
          ${clearSearchText}
        </button>
      </div>
    `;
    return;
  }

  const grouped = groupRemindersByDate(filteredReminders);

  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    return b[1].date - a[1].date;
  });

  let html = "";

  sortedGroups.forEach(([dateKey, group]) => {
    html += `<div class="date-group-header">${formatGroupDate(
      group.date
    )}</div>`;

    group.reminders.forEach((reminder) => {
      let typeClass = "";
      if (reminder.reminder_type === "location") typeClass = "location";
      if (reminder.reminder_type === "both") typeClass = "both";

      const completedClass = reminder.is_completed ? "completed" : "";
      const notifiedClass = reminder.is_notified ? "notified" : "";

      let emoji = "📌";
      if (reminder.reminder_type === "location") emoji = "📍";
      if (reminder.reminder_type === "datetime") emoji = "⏰";
      if (reminder.reminder_type === "both") emoji = "⏰📍";

      const recurrenceBadge = reminder.is_recurring
        ? `<span class="recurrence-badge">${getRecurrenceIcon(
            reminder.recurrence_pattern
          )} ${getRecurrenceLabel(reminder.recurrence_pattern)}</span>`
        : "";

      const deactivateText =
        typeof t === "function"
          ? t("deactivateRecurrence")
          : "Desactivar recurrencia";
      const makeRecurrentText =
        typeof t === "function" ? t("makeRecurrent") : "Hacer recurrente";
      const markPendingText =
        typeof t === "function" ? t("markPending") : "Marcar pendiente";
      const completeText =
        typeof t === "function" ? t("complete") : "Completar";
      const deleteText = typeof t === "function" ? t("delete") : "Eliminar";

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
                            ? deactivateText
                            : makeRecurrentText
                        }">
                    🔄
                </button>
              `
                  : ""
              }
              <button class="btn-action" onclick="toggleComplete(${
                reminder.id
              }, ${!reminder.is_completed})" title="${
        reminder.is_completed ? markPendingText : completeText
      }">
                ${reminder.is_completed ? "↩️" : "✅"}
              </button>
              <button class="btn-action" onclick="deleteReminder(${
                reminder.id
              })" title="${deleteText}">
                🗑️
              </button>
            </div>
          </div>

          ${
            reminder.description
              ? `<p class="reminder-description">${reminder.description}</p>`
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
  const locale =
    typeof getLanguage === "function" && getLanguage() === "en"
      ? "en-US"
      : "es-ES";
  const options = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString(locale, options);
}

// Obtener etiqueta de recurrencia
function getRecurrenceLabel(pattern) {
  if (typeof t === "function") {
    return t(pattern);
  }
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
    const title =
      typeof t === "function"
        ? t("deactivateRecurrence") + "?"
        : "¿Desactivar recurrencia?";
    const message =
      typeof t === "function"
        ? t("reminderWillStop")
        : "El recordatorio dejará de repetirse automáticamente";

    const confirmed = await showConfirm(message, title, "🔄");

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
        const successMsg =
          typeof t === "function"
            ? t("recurrenceDeactivated")
            : "El recordatorio ya no se repetirá";
        const successTitle =
          typeof t === "function"
            ? t("recurrenceDeactivatedTitle")
            : "Recurrencia desactivada";
        await showSuccess(successMsg, successTitle, "✅");
        loadReminders();
      } else {
        await showError(data.message || "Error al desactivar recurrencia");
      }
    } catch (error) {
      console.error("Error:", error);
      await showError("No se pudo desactivar la recurrencia");
    }
  } else {
    showRecurrenceModal(id, reminder);
  }
}

// Modal de selección de recurrencia
function showRecurrenceModal(reminderId, reminder) {
  const overlay = document.createElement("div");
  overlay.className = "custom-modal-overlay show";

  const hasDateTime = Boolean(reminder.datetime);

  const makeRecurrentTitle =
    typeof t === "function" ? t("makeRecurrent") : "Hacer recurrente";
  const cancelText = typeof t === "function" ? t("cancel") : "Cancelar";
  const activateText =
    typeof t === "function" ? t("activateRecurrence") : "Activar recurrencia";
  const dailyText = typeof t === "function" ? t("daily") : "Diaria";
  const weeklyText = typeof t === "function" ? t("weekly") : "Semanal";
  const monthlyText = typeof t === "function" ? t("monthly") : "Mensual";
  const yearlyText = typeof t === "function" ? t("yearly") : "Anual";

  overlay.innerHTML = `
    <div class="custom-modal">
      <div class="custom-modal-header info">
        <div class="custom-modal-icon">🔄</div>
        <h2>${makeRecurrentTitle}</h2>
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
                <strong>${dailyText}</strong>
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
                <strong>${weeklyText}</strong>
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
                <strong>${monthlyText}</strong>
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
                <strong>${yearlyText}</strong>
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
          ${cancelText}
        </button>
        <button class="custom-modal-btn primary" data-action="confirm">
          ${activateText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('[data-action="confirm"]').onclick = async () => {
    const selectedPattern = overlay.querySelector(
      'input[name="pattern"]:checked'
    ).value;
    overlay.remove();
    await activateRecurrence(reminderId, selectedPattern);
  };

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
      const successTitle =
        typeof t === "function"
          ? t("recurrenceActivatedTitle")
          : "Recurrencia activada";
      const patternLabel = getRecurrenceLabel(pattern).toLowerCase();
      await showSuccess(
        `El recordatorio se repetirá ${patternLabel}`,
        successTitle,
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
  const locale =
    typeof getLanguage === "function" && getLanguage() === "en"
      ? "en-US"
      : "es-ES";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayName(datetime) {
  const date = new Date(datetime);
  const locale =
    typeof getLanguage === "function" && getLanguage() === "en"
      ? "en-US"
      : "es-ES";
  return date.toLocaleDateString(locale, { weekday: "long" });
}

function getDayNumber(datetime) {
  const date = new Date(datetime);
  return date.getDate();
}

function getFullDate(datetime) {
  const date = new Date(datetime);
  const locale =
    typeof getLanguage === "function" && getLanguage() === "en"
      ? "en-US"
      : "es-ES";
  return date.toLocaleDateString(locale, { day: "numeric", month: "long" });
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
  const title =
    typeof t === "function"
      ? t("confirmDelete")
      : "¿Eliminar este recordatorio?";
  const message =
    typeof t === "function"
      ? t("actionCantUndo")
      : "Esta acción no se puede deshacer";

  const confirmed = await showConfirm(message, title, "🗑️");

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
      const successTitle =
        typeof t === "function"
          ? t("reminderDeleted")
          : "Recordatorio eliminado";
      const successMsg =
        typeof t === "function"
          ? t("reminderDeletedDesc")
          : "El recordatorio ha sido eliminado";
      await showSuccess(successMsg, successTitle, "✅");
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
