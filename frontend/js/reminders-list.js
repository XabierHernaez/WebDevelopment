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
const welcomeMessage = document.getElementById("welcomeMessage");
const newReminderBtn = document.getElementById("newReminderBtn");
const remindersList = document.getElementById("remindersList");
const logoutBtn = document.getElementById("logoutBtn");
const calendarBtn = document.getElementById("calendarBtn");

// Mostrar nombre del usuario
welcomeMessage.textContent = `Hola, ${currentUser.name} 👋`;

// Logout
logoutBtn.addEventListener("click", () => {
  if (confirm("¿Seguro que quieres cerrar sesión?")) {
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
    } else {
      remindersList.innerHTML =
        '<div class="loading">❌ Error al cargar recordatorios</div>';
    }
  } catch (error) {
    console.error("Error al cargar recordatorios:", error);
    remindersList.innerHTML = '<div class="loading">❌ Error de conexión</div>';
  }
}

// Renderizar recordatorios
function renderReminders() {
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

  remindersList.innerHTML = reminders
    .map((reminder) => {
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

      return `
            <div class="reminder-item ${typeClass} ${completedClass} ${notifiedClass}" data-id="${
        reminder.id
      }">
                <div class="reminder-header">
                    <h3 class="reminder-title">
                        <span class="reminder-emoji">${emoji}</span>
                        ${reminder.title}
                    </h3>
                    <div class="reminder-actions">
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
    })
    .join("");
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
      loadReminders();
    }
  } catch (error) {
    console.error("Error al actualizar:", error);
    alert("Error al actualizar recordatorio");
  }
}

// Eliminar recordatorio
async function deleteReminder(id) {
  if (!confirm("¿Eliminar este recordatorio?")) {
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
    } else {
      alert("Error al eliminar recordatorio");
    }
  } catch (error) {
    console.error("Error al eliminar:", error);
    alert("Error al eliminar recordatorio");
  }
}

// Cargar al iniciar
loadReminders();
