// Sistema de notificaciones para recordatorios
let notificationCheckInterval = null;
let shownNotifications = new Set();

// Iniciar el sistema de notificaciones
function startNotificationSystem() {
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

  playNotificationSound();

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

// ========== GEOFENCING (Verificación de ubicación) ==========

let geofencingInterval = null;
let shownLocationNotifications = new Set();

async function startGeofencing() {
  console.log("📍 Sistema de geofencing iniciado");

  const browserPermission = await checkBrowserPermission();

  if (browserPermission === "granted") {
    console.log("✅ Permisos ya concedidos previamente");
    geofencingInterval = setInterval(checkLocationReminders, 10000);
    checkLocationReminders();
    return;
  }

  if (browserPermission === "denied") {
    console.log("⚠️ Permisos denegados por el usuario");
    return;
  }

  const alreadyAsked = checkLocationPermission();

  if (alreadyAsked) {
    console.log("🔕 Ya se solicitaron permisos anteriormente");
    return;
  } else {
    showPermissionRequestModal();
  }
}

// Verificar permisos del navegador
async function checkBrowserPermission() {
  if (!navigator.permissions) {
    return "prompt";
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state;
  } catch (error) {
    console.log("No se pudo verificar permisos del navegador");
    return "prompt";
  }
}

// Verificar si ya preguntamos por permisos
function checkLocationPermission() {
  const alreadyAsked = localStorage.getItem("location_permission_asked");
  return alreadyAsked === "true";
}

// Mostrar modal de solicitud de permisos
function showPermissionRequestModal() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  // Traducciones
  const texts = {
    es: {
      title: "Ubicación Requerida",
      subtitle: "GeoRemind necesita tu ubicación",
      description:
        "Para notificarte cuando te acerques a tus recordatorios guardados, necesitamos acceso a tu ubicación.",
      feature1: "Recordatorios automáticos al acercarte a un lugar",
      feature2: "Centrado automático del mapa en tu posición",
      feature3: "Tu ubicación es privada y segura",
      denyBtn: "Ahora no",
      allowBtn: "✓ Permitir ubicación",
      note: "Solo se te preguntará esta vez. Puedes cambiar los permisos desde la configuración del navegador.",
    },
    en: {
      title: "Location Required",
      subtitle: "GeoRemind needs your location",
      description:
        "To notify you when you approach your saved reminders, we need access to your location.",
      feature1: "Automatic reminders when approaching a place",
      feature2: "Automatic map centering on your position",
      feature3: "Your location is private and secure",
      denyBtn: "Not now",
      allowBtn: "✓ Allow location",
      note: "You will only be asked this once. You can change permissions from your browser settings.",
    },
  };

  const t = texts[lang] || texts.es;

  const modal = document.createElement("div");
  modal.className = "permission-modal-overlay";
  modal.innerHTML = `
    <div class="permission-modal">
      <div class="permission-header">
        <div class="permission-icon">📍</div>
        <h2>${t.title}</h2>
      </div>
      
      <div class="permission-body">
        <h3>${t.subtitle}</h3>
        <p>${t.description}</p>
        
        <div class="permission-features">
          <div class="permission-feature">
            <span class="permission-feature-icon">🔔</span>
            <span class="permission-feature-text">${t.feature1}</span>
          </div>
          <div class="permission-feature">
            <span class="permission-feature-icon">🗺️</span>
            <span class="permission-feature-text">${t.feature2}</span>
          </div>
          <div class="permission-feature">
            <span class="permission-feature-icon">🔒</span>
            <span class="permission-feature-text">${t.feature3}</span>
          </div>
        </div>
      </div>
      
      <div class="permission-actions">
        <button class="btn-permission btn-deny" id="denyPermissionBtn">
          ${t.denyBtn}
        </button>
        <button class="btn-permission btn-allow" id="allowPermissionBtn">
          ${t.allowBtn}
        </button>
      </div>
      
      <p class="permission-note">${t.note}</p>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("allowPermissionBtn")
    .addEventListener("click", () => {
      requestLocationPermission(modal);
    });

  document.getElementById("denyPermissionBtn").addEventListener("click", () => {
    localStorage.setItem("location_permission_asked", "true");
    modal.remove();
    console.log("Usuario rechazó permisos de ubicación");
  });
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
                  )} km`
                );

                if (distance <= 2) {
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

  playNotificationSound();

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
