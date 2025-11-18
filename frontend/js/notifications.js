// Sistema de notificaciones para recordatorios
let notificationCheckInterval = null;
let shownNotifications = new Set(); // Para no mostrar la misma notificación varias veces

// Iniciar el sistema de notificaciones
function startNotificationSystem() {
  console.log("🔔 Sistema de notificaciones iniciado");

  // Verificar cada 30 segundos (puedes ajustarlo)
  notificationCheckInterval = setInterval(checkReminders, 30000);

  // Verificar inmediatamente al iniciar
  checkReminders();
}

// Detener el sistema
function stopNotificationSystem() {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
    console.log("🔕 Sistema de notificaciones detenido");
  }
}

// Verificar recordatorios pendientes
async function checkReminders() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/reminders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      const now = new Date();

      data.reminders.forEach((reminder) => {
        // Solo procesar recordatorios con fecha/hora que NO están completados ni notificados
        if (
          reminder.datetime &&
          !reminder.is_completed &&
          !reminder.is_notified
        ) {
          const reminderTime = new Date(reminder.datetime);
          const diffMinutes = Math.floor((reminderTime - now) / (1000 * 60));

          // Si la hora ya pasó o está a punto (0-1 minutos)
          if (diffMinutes <= 0 && !shownNotifications.has(reminder.id)) {
            showNotification(reminder);
            shownNotifications.add(reminder.id);
          }
        }
      });
    }
  } catch (error) {
    console.error("Error al verificar recordatorios:", error);
  }
}

// Mostrar notificación emergente
function showNotification(reminder) {
  console.log("🔔 Mostrando notificación para:", reminder.title);

  // Reproducir sonido (opcional)
  playNotificationSound();

  // Crear overlay
  const overlay = document.createElement("div");
  overlay.className = "notification-overlay";
  overlay.innerHTML = `
        <div class="notification-modal">
            <div class="notification-header">
                <div class="notification-icon">⏰</div>
                <h2>¡Recordatorio!</h2>
            </div>
            
            <div class="notification-body">
                <h3>${reminder.title}</h3>
                ${reminder.description ? `<p>${reminder.description}</p>` : ""}
                <div class="notification-time">
                    📅 ${new Date(reminder.datetime).toLocaleString("es-ES")}
                </div>
                ${
                  reminder.address
                    ? `
                    <div class="notification-location">
                        📍 ${reminder.address}
                    </div>
                `
                    : ""
                }
            </div>
            
            <div class="notification-actions">
                <button class="btn-notification btn-discard" data-id="${
                  reminder.id
                }">
                    🗑️ Descartar
                </button>
                <button class="btn-notification btn-accept" data-id="${
                  reminder.id
                }">
                    ✅ Aceptar
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(overlay);

  // Animación de entrada
  setTimeout(() => {
    overlay.classList.add("show");
  }, 10);

  // Event listeners para los botones
  overlay.querySelector(".btn-accept").addEventListener("click", () => {
    acceptNotification(reminder.id, overlay);
  });

  overlay.querySelector(".btn-discard").addEventListener("click", () => {
    discardNotification(reminder.id, overlay);
  });
}

// Aceptar notificación (marcar como notificado, NO eliminar)
async function acceptNotification(reminderId, overlay) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/reminders/${reminderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_notified: true }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Recordatorio marcado como notificado");
      closeNotification(overlay);

      // Recargar lista si estamos en la página de recordatorios
      if (typeof loadReminders === "function") {
        loadReminders();
      }
    }
  } catch (error) {
    console.error("Error al aceptar notificación:", error);
  }
}

// Descartar notificación (eliminar recordatorio)
async function discardNotification(reminderId, overlay) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/reminders/${reminderId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log("🗑️ Recordatorio eliminado");
      closeNotification(overlay);

      // Recargar lista si estamos en la página de recordatorios
      if (typeof loadReminders === "function") {
        loadReminders();
      }
    }
  } catch (error) {
    console.error("Error al descartar notificación:", error);
  }
}

// Cerrar notificación con animación
function closeNotification(overlay) {
  overlay.classList.remove("show");
  setTimeout(() => {
    overlay.remove();
  }, 300);
}

// Reproducir sonido de notificación (opcional)
function playNotificationSound() {
  // Crear un beep simple usando Web Audio API
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log("No se pudo reproducir sonido");
  }
}

// Iniciar automáticamente cuando se carga el script
if (localStorage.getItem("token")) {
  startNotificationSystem();
}
