// Sistema de notificaciones para recordatorios
let notificationCheckInterval = null;
let shownNotifications = new Set();

// Iniciar el sistema de notificaciones
function startNotificationSystem() {
  // Verificar si las notificaciones están habilitadas
  if (
    typeof areNotificationsEnabled === "function" &&
    !areNotificationsEnabled()
  ) {
    console.log("🔕 Notificaciones deshabilitadas en configuración");
    return;
  }

  console.log("🔔 Sistema de notificaciones iniciado");
  notificationCheckInterval = setInterval(checkReminders, 30000);
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
  // Verificar si las notificaciones están habilitadas
  if (
    typeof areNotificationsEnabled === "function" &&
    !areNotificationsEnabled()
  ) {
    return;
  }

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
        if (
          reminder.datetime &&
          !reminder.is_completed &&
          !reminder.is_notified &&
          !shownNotifications.has(reminder.id)
        ) {
          const reminderTime = new Date(reminder.datetime);
          const diffMinutes = Math.floor((reminderTime - now) / (1000 * 60));

          if (diffMinutes <= 0) {
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

  // Reproducir sonido solo si está habilitado
  if (
    typeof isNotificationSoundEnabled !== "function" ||
    isNotificationSoundEnabled()
  ) {
    playNotificationSound();
  }

  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const locale = lang === "en" ? "en-US" : "es-ES";

  // Traducciones
  const reminderText = lang === "en" ? "Reminder!" : "¡Recordatorio!";
  const discardText = lang === "en" ? "🗑️ Discard" : "🗑️ Descartar";
  const acceptText = lang === "en" ? "✅ Accept" : "✅ Aceptar";
  const recurringText =
    lang === "en"
      ? "🔄 Recurring reminder - Will renew automatically"
      : "🔄 Recordatorio recurrente - Se renovará automáticamente";

  const overlay = document.createElement("div");
  overlay.className = "notification-overlay";
  overlay.innerHTML = `
    <div class="notification-modal">
      <div class="notification-header">
        <div class="notification-icon">⏰</div>
        <h2>${reminderText}</h2>
      </div>
      
      <div class="notification-body">
        <h3>${reminder.title}</h3>
        ${reminder.description ? `<p>${reminder.description}</p>` : ""}
        <div class="notification-time">
          📅 ${new Date(reminder.datetime).toLocaleString(locale)}
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
        ${
          reminder.is_recurring
            ? `
          <div class="notification-time" style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); color: #6366f1; border: 2px solid #6366f1; margin-top: 10px;">
            ${recurringText}
          </div>
        `
            : ""
        }
      </div>
      
      <div class="notification-actions">
        <button class="btn-notification btn-discard" data-id="${reminder.id}">
          ${discardText}
        </button>
        <button class="btn-notification btn-accept" data-id="${
          reminder.id
        }" data-recurring="${reminder.is_recurring || false}">
          ${acceptText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add("show");
  }, 10);

  overlay.querySelector(".btn-accept").addEventListener("click", (e) => {
    const isRecurring = e.target.dataset.recurring === "true";
    acceptNotification(reminder.id, overlay, isRecurring);
  });

  overlay.querySelector(".btn-discard").addEventListener("click", () => {
    discardNotification(reminder.id, overlay);
  });
}

// Aceptar notificación
async function acceptNotification(reminderId, overlay, isRecurring) {
  const token = localStorage.getItem("token");
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  try {
    if (isRecurring) {
      const response = await fetch(`${API_URL}/reminders/${reminderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_notified: true,
          is_completed: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Recordatorio recurrente renovado automáticamente");

        shownNotifications.delete(reminderId);
        closeNotification(overlay);

        if (data.renewed) {
          const title =
            lang === "en" ? "Reminder renewed" : "Recordatorio renovado";
          const nextText = lang === "en" ? "Next time" : "Próxima vez";
          await showSuccess(
            `${nextText}: ${formatDateTime(data.next_occurrence)}`,
            title,
            "🔄"
          );
        }

        if (typeof loadReminders === "function") {
          loadReminders();
        }
      }
    } else {
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

        if (typeof loadReminders === "function") {
          loadReminders();
        }
      }
    }
  } catch (error) {
    console.error("Error al aceptar notificación:", error);
    closeNotification(overlay);
  }
}

// Formatear fecha/hora
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const locale = lang === "en" ? "en-US" : "es-ES";
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString(locale, options);
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
      shownNotifications.delete(reminderId);
      closeNotification(overlay);

      if (typeof loadReminders === "function") {
        loadReminders();
      }
    }
  } catch (error) {
    console.error("Error al descartar notificación:", error);
    closeNotification(overlay);
  }
}

// Cerrar notificación con animación
function closeNotification(overlay) {
  overlay.classList.remove("show");
  setTimeout(() => {
    overlay.remove();
  }, 300);
}

// Reproducir sonido de notificación
function playNotificationSound() {
  // Verificar si el sonido está habilitado en settings
  if (
    typeof isNotificationSoundEnabled === "function" &&
    !isNotificationSoundEnabled()
  ) {
    return;
  }

  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Crear osciladores para un sonido agradable
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar frecuencias (acorde agradable)
    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5

    oscillator1.type = "sine";
    oscillator2.type = "sine";

    // Envelope del volumen
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

    // Reproducir
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.5);
    oscillator2.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log("No se pudo reproducir sonido:", error);
  }
}

// ===== GEOFENCING =====

let geofencingInterval = null;
let shownLocationNotifications = new Set();

// Iniciar el sistema de geofencing
function startGeofencing() {
  // Verificar si las notificaciones están habilitadas
  if (
    typeof areNotificationsEnabled === "function" &&
    !areNotificationsEnabled()
  ) {
    console.log("🔕 Geofencing deshabilitado (notificaciones deshabilitadas)");
    return;
  }

  console.log("🌍 Iniciando sistema de geofencing");

  // Verificar si ya preguntamos por permisos
  const permissionAsked = localStorage.getItem("location_permission_asked");

  if (!permissionAsked) {
    // Mostrar modal explicativo primero
    showLocationPermissionModal();
  } else {
    // Ya preguntamos antes, intentar iniciar
    startLocationChecking();
  }
}

// Mostrar modal para pedir permisos de ubicación
function showLocationPermissionModal() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  const title = lang === "en" ? "Enable Location?" : "¿Activar ubicación?";
  const benefits =
    lang === "en"
      ? `
      <p><strong>With location enabled, you can:</strong></p>
      <ul>
        <li>📍 Create reminders that activate when you arrive at a place</li>
        <li>🔔 Receive automatic notifications when you're near</li>
        <li>🗺️ See your position on the map</li>
      </ul>
      <p style="margin-top: 15px; color: #6b7280; font-size: 0.9em;">
        Your location is only used for proximity reminders and is never shared.
      </p>
    `
      : `
      <p><strong>Con la ubicación activada podrás:</strong></p>
      <ul>
        <li>📍 Crear recordatorios que se activan al llegar a un lugar</li>
        <li>🔔 Recibir notificaciones automáticas cuando estés cerca</li>
        <li>🗺️ Ver tu posición en el mapa</li>
      </ul>
      <p style="margin-top: 15px; color: #6b7280; font-size: 0.9em;">
        Tu ubicación solo se usa para los recordatorios de proximidad y nunca se comparte.
      </p>
    `;

  const enableText = lang === "en" ? "Enable" : "Activar";
  const laterText = lang === "en" ? "Maybe later" : "Quizás luego";

  const modal = document.createElement("div");
  modal.className = "custom-modal-overlay show";
  modal.innerHTML = `
    <div class="custom-modal">
      <div class="custom-modal-header info">
        <div class="custom-modal-icon">📍</div>
        <h2>${title}</h2>
      </div>
      <div class="custom-modal-body">
        ${benefits}
      </div>
      <div class="custom-modal-actions">
        <button class="custom-modal-btn secondary" id="locationLater">
          ${laterText}
        </button>
        <button class="custom-modal-btn primary" id="locationEnable">
          ${enableText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("locationEnable").onclick = () => {
    requestLocationPermission(modal);
  };

  document.getElementById("locationLater").onclick = () => {
    localStorage.setItem("location_permission_asked", "true");
    modal.remove();
  };
}

// Solicitar permisos de ubicación
function requestLocationPermission(modal) {
  localStorage.setItem("location_permission_asked", "true");
  modal.remove();

  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("✅ Permisos de ubicación concedidos");
      startLocationChecking();
    },
    (error) => {
      console.warn("⚠️ Permisos denegados:", error.message);

      if (error.code === 1) {
        const message =
          lang === "en"
            ? "⚠️ You have blocked location access. Proximity notifications will not work.\n\nTo enable it, go to your browser settings."
            : "⚠️ Has bloqueado el acceso a la ubicación. Las notificaciones por proximidad no funcionarán.\n\nPara activarlo, ve a la configuración de tu navegador.";
        alert(message);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

// Iniciar el loop de verificación de ubicaciones
function startLocationChecking() {
  console.log("🔄 Iniciando verificación de ubicaciones");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("✅ Permisos ya concedidos, iniciando verificaciones");
      geofencingInterval = setInterval(checkLocationReminders, 10000);
      checkLocationReminders();
    },
    (error) => {
      if (error.code === 1) {
        console.log("⚠️ Permisos de ubicación denegados");
      } else {
        console.log("⚠️ Error al obtener ubicación:", error.message);
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 300000,
    }
  );
}

// Verificar recordatorios por ubicación
async function checkLocationReminders() {
  // Verificar si las notificaciones están habilitadas
  if (
    typeof areNotificationsEnabled === "function" &&
    !areNotificationsEnabled()
  ) {
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) return;

  if (!navigator.geolocation) {
    console.warn("Geolocalización no disponible");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      console.log("📍 Ubicación actual:", userLat, userLng);

      try {
        const response = await fetch(`${API_URL}/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          // Obtener el radio de geofencing de la configuración
          const geofencingRadius =
            typeof getGeofencingRadius === "function"
              ? getGeofencingRadius()
              : 2; // 2km por defecto

          data.reminders.forEach(async (reminder) => {
            if (
              (reminder.reminder_type === "location" ||
                reminder.reminder_type === "both") &&
              !reminder.is_completed &&
              !reminder.is_notified &&
              !shownLocationNotifications.has(reminder.id)
            ) {
              const coords = await getReminderCoordinates(reminder.location_id);

              if (coords) {
                const distance = calculateDistance(
                  userLat,
                  userLng,
                  coords.lat,
                  coords.lng
                );

                console.log(
                  `📏 Distancia a "${reminder.title}": ${distance.toFixed(
                    2
                  )} km (radio: ${geofencingRadius} km)`
                );

                // Usar el radio configurado
                if (distance <= geofencingRadius) {
                  showLocationNotification(reminder, distance);
                  shownLocationNotifications.add(reminder.id);
                }
              }
            }
          });
        }
      } catch (error) {
        console.error("Error al verificar ubicaciones:", error);
      }
    },
    (error) => {
      if (error.code !== 1) {
        console.warn("No se pudo obtener ubicación:", error.message);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    }
  );
}

// Obtener coordenadas de un recordatorio desde MongoDB
async function getReminderCoordinates(locationId) {
  if (!locationId) return null;

  try {
    const response = await fetch(
      `http://localhost:8000/api/locations/${locationId}`
    );
    const data = await response.json();

    if (data.success) {
      return {
        lat: data.data.lat,
        lng: data.data.lng,
      };
    }

    return null;
  } catch (error) {
    console.error("Error al obtener coordenadas:", error);
    return null;
  }
}

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Mostrar notificación de ubicación
function showLocationNotification(reminder, distance) {
  console.log("📍 Mostrando notificación de ubicación para:", reminder.title);

  // Reproducir sonido solo si está habilitado
  if (
    typeof isNotificationSoundEnabled !== "function" ||
    isNotificationSoundEnabled()
  ) {
    playNotificationSound();
  }

  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  // Traducciones
  const youAreClose = lang === "en" ? "You're close!" : "¡Estás cerca!";
  const savedLocation = lang === "en" ? "Saved location" : "Ubicación guardada";
  const youAreAt = lang === "en" ? "You are" : "Estás a";
  const metersText = lang === "en" ? "meters" : "metros";
  const discardText = lang === "en" ? "🗑️ Discard" : "🗑️ Descartar";
  const acceptText = lang === "en" ? "✅ Accept" : "✅ Aceptar";
  const recurringText =
    lang === "en"
      ? "🔄 Recurring reminder - Will renew automatically"
      : "🔄 Recordatorio recurrente - Se renovará automáticamente";

  const distanceText =
    distance < 1
      ? `${Math.round(distance * 1000)} ${metersText}`
      : `${distance.toFixed(1)} km`;

  const overlay = document.createElement("div");
  overlay.className = "notification-overlay";
  overlay.innerHTML = `
    <div class="notification-modal">
      <div class="notification-header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
        <div class="notification-icon">📍</div>
        <h2>${youAreClose}</h2>
      </div>
      
      <div class="notification-body">
        <h3>${reminder.title}</h3>
        ${reminder.description ? `<p>${reminder.description}</p>` : ""}
        <div class="notification-location">
          📍 ${reminder.address || savedLocation}
        </div>
        <div class="notification-time" style="background: #d1fae5; color: #065f46;">
          📏 ${youAreAt} ${distanceText}
        </div>
        ${
          reminder.is_recurring
            ? `
          <div class="notification-time" style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); color: #6366f1; border: 2px solid #6366f1; margin-top: 10px;">
            ${recurringText}
          </div>
        `
            : ""
        }
      </div>
      
      <div class="notification-actions">
        <button class="btn-notification btn-discard" data-id="${reminder.id}">
          ${discardText}
        </button>
        <button class="btn-notification btn-accept" data-id="${
          reminder.id
        }" data-recurring="${reminder.is_recurring || false}">
          ${acceptText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => overlay.classList.add("show"), 10);

  overlay.querySelector(".btn-accept").addEventListener("click", (e) => {
    const isRecurring = e.target.dataset.recurring === "true";
    acceptNotification(reminder.id, overlay, isRecurring);
  });

  overlay.querySelector(".btn-discard").addEventListener("click", () => {
    discardNotification(reminder.id, overlay);
  });
}

// Iniciar automáticamente cuando se carga el script
if (localStorage.getItem("token")) {
  startNotificationSystem();
  startGeofencing();
}
