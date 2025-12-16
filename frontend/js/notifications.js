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
  notificationCheckInterval = setInterval(checkReminders, 10000);
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
        const isOwner = reminder.is_owner !== false;

        // Para recordatorios propios: respetar is_notified
        // Para recordatorios compartidos: ignorar is_notified (solo usar control local)
        const shouldCheckNotified = isOwner ? !reminder.is_notified : true;

        if (
          reminder.datetime &&
          !reminder.is_completed &&
          shouldCheckNotified &&
          !shownNotifications.has(reminder.id)
        ) {
          const reminderTime = new Date(reminder.datetime);
          const diffMs = reminderTime - now;

          // Solo mostrar si ya llegó la hora (diferencia negativa o cero)
          // Usamos milisegundos para mayor precisión
          if (diffMs <= 0) {
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

  // Detectar si el usuario es el dueño del recordatorio
  const isOwner = reminder.is_owner !== false; // Si no viene o es true, es owner

  // Traducciones
  const reminderText = lang === "en" ? "Reminder!" : "¡Recordatorio!";
  const discardText = lang === "en" ? "🗑️ Discard" : "🗑️ Descartar";
  const acceptText = lang === "en" ? "✅ Accept" : "✅ Aceptar";
  const okText = lang === "en" ? "👍 OK" : "👍 Entendido";
  const recurringText =
    lang === "en"
      ? "🔄 Recurring reminder - Will renew automatically"
      : "🔄 Recordatorio recurrente - Se renovará automáticamente";
  const sharedByText = lang === "en" ? "Shared by" : "Compartido por";

  // Construir info de compartido si aplica
  let sharedInfo = "";
  if (!isOwner && reminder.shared_by_name) {
    const viaGroup =
      reminder.shared_via_group === "group" && reminder.group_name
        ? ` (${reminder.group_name})`
        : "";
    sharedInfo = `
      <div class="notification-time" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #92400e; border: 2px solid #f59e0b; margin-bottom: 10px;">
        👥 ${sharedByText}: ${reminder.shared_by_name}${viaGroup}
      </div>
    `;
  }

  // Construir botones según si es owner o no
  let actionsHTML = "";
  if (isOwner) {
    // Es el dueño: puede aceptar (marcar notificado) o descartar (eliminar)
    actionsHTML = `
      <button class="btn-notification btn-discard" data-id="${reminder.id}">
        ${discardText}
      </button>
      <button class="btn-notification btn-accept" data-id="${
        reminder.id
      }" data-recurring="${reminder.is_recurring || false}">
        ${acceptText}
      </button>
    `;
  } else {
    // Es compartido: solo puede cerrar el modal (OK)
    actionsHTML = `
      <button class="btn-notification btn-accept" data-id="${reminder.id}" data-shared="true" style="flex: 1;">
        ${okText}
      </button>
    `;
  }

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
        ${sharedInfo}
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
        ${actionsHTML}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add("show");
  }, 10);

  // Event listeners según tipo
  const acceptBtn = overlay.querySelector(".btn-accept");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", (e) => {
      const isShared = e.target.dataset.shared === "true";
      if (isShared) {
        // Solo cerrar el modal para recordatorios compartidos
        acknowledgeSharedNotification(reminder.id, overlay);
      } else {
        const isRecurring = e.target.dataset.recurring === "true";
        acceptNotification(reminder.id, overlay, isRecurring);
      }
    });
  }

  const discardBtn = overlay.querySelector(".btn-discard");
  if (discardBtn) {
    discardBtn.addEventListener("click", () => {
      discardNotification(reminder.id, overlay);
    });
  }
}

// ✨ NUEVA FUNCIÓN: Reconocer notificación de recordatorio compartido (solo cierra el modal)
async function acknowledgeSharedNotification(reminderId, overlay) {
  console.log("👍 Reconociendo notificación compartida:", reminderId);

  // Simplemente cerrar el modal - no modificamos el recordatorio porque no somos el dueño
  shownNotifications.add(reminderId); // Evitar que vuelva a mostrarse en esta sesión
  closeNotification(overlay);

  // Opcional: Recargar la lista si existe la función
  if (typeof loadReminders === "function") {
    loadReminders();
  }
}

// Aceptar notificación (solo para recordatorios propios)
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
      } else {
        console.error("Error al aceptar:", data.message);
        closeNotification(overlay);
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
      } else {
        console.error("Error al aceptar:", data.message);
        closeNotification(overlay);
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

// Descartar notificación (eliminar recordatorio) - Solo para propios
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
    } else {
      console.error("Error al eliminar:", data.message);
      // Aunque falle, cerramos el modal para no dejar al usuario bloqueado
      closeNotification(overlay);
    }
  } catch (error) {
    console.error("Error al descartar notificación:", error);
    // Cerrar de todos modos
    closeNotification(overlay);
  }
}

// Cerrar overlay de notificación
function closeNotification(overlay) {
  overlay.classList.remove("show");
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
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

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn("No se pudo reproducir sonido:", error);
  }
}

// === GEOFENCING ===
let geofencingInterval = null;
let shownLocationNotifications = new Set();

// Iniciar sistema de geofencing
function startGeofencing() {
  // Verificar si las notificaciones están habilitadas
  if (
    typeof areNotificationsEnabled === "function" &&
    !areNotificationsEnabled()
  ) {
    console.log("🔕 Notificaciones deshabilitadas - geofencing no iniciado");
    return;
  }

  if (!navigator.geolocation) {
    console.warn("⚠️ Geolocalización no soportada");
    return;
  }

  // Verificar si ya tiene permisos de ubicación
  if (navigator.permissions) {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        // Ya tiene permiso, iniciar directamente
        startLocationChecking();
      } else if (result.state === "prompt") {
        // Mostrar modal educativo antes de pedir permisos
        showLocationPermissionModal();
      } else {
        // Denegado - no hacer nada
        console.log("⚠️ Permisos de ubicación denegados previamente");
      }
    });
  } else {
    // Fallback para navegadores sin API de permisos
    startLocationChecking();
  }
}

// Mostrar modal educativo para permisos de ubicación
function showLocationPermissionModal() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  // Textos en español e inglés
  const texts = {
    es: {
      title: "📍 Permisos de Ubicación",
      subtitle: "¿Por qué necesitamos tu ubicación?",
      description:
        "Para ofrecerte la mejor experiencia con recordatorios basados en ubicación, necesitamos acceder a tu posición.",
      feature1:
        "Recibe alertas cuando llegues a lugares específicos (casa, trabajo, gimnasio...)",
      feature2:
        "Los recordatorios por ubicación se activan automáticamente al acercarte",
      feature3: "Tu ubicación solo se usa localmente, nunca la compartimos",
      note: "Puedes cambiar esto en cualquier momento en la configuración de tu navegador",
      allowBtn: "Permitir ubicación",
      denyBtn: "Ahora no",
    },
    en: {
      title: "📍 Location Permissions",
      subtitle: "Why do we need your location?",
      description:
        "To offer you the best experience with location-based reminders, we need access to your position.",
      feature1:
        "Get alerts when you arrive at specific places (home, work, gym...)",
      feature2: "Location reminders activate automatically when you get close",
      feature3: "Your location is only used locally, we never share it",
      note: "You can change this anytime in your browser settings",
      allowBtn: "Allow location",
      denyBtn: "Not now",
    },
  };

  const t = texts[lang] || texts.es;

  const modalOverlay = document.createElement("div");
  modalOverlay.className = "permission-modal-overlay";
  modalOverlay.innerHTML = `
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
        <button class="btn-permission btn-deny">${t.denyBtn}</button>
        <button class="btn-permission btn-allow">${t.allowBtn}</button>
      </div>
      
      <p class="permission-note">${t.note}</p>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Event listeners
  modalOverlay.querySelector(".btn-allow").addEventListener("click", () => {
    modalOverlay.remove();
    requestLocationPermission();
  });

  modalOverlay.querySelector(".btn-deny").addEventListener("click", () => {
    modalOverlay.remove();
    console.log("Usuario rechazó permisos de ubicación");
  });
}

// Solicitar permisos de ubicación después del modal educativo
function requestLocationPermission() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("✅ Permisos de ubicación concedidos");
      // Iniciar verificaciones de geofencing
      geofencingInterval = setInterval(checkLocationReminders, 10000);
      checkLocationReminders();
    },
    (error) => {
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
            const isOwner = reminder.is_owner !== false;

            // Para recordatorios propios: respetar is_notified
            // Para recordatorios compartidos: ignorar is_notified (solo usar control local)
            const shouldCheckNotified = isOwner ? !reminder.is_notified : true;

            if (
              (reminder.reminder_type === "location" ||
                reminder.reminder_type === "both") &&
              !reminder.is_completed &&
              shouldCheckNotified &&
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

  // Detectar si el usuario es el dueño del recordatorio
  const isOwner = reminder.is_owner !== false;

  // Traducciones
  const youAreClose = lang === "en" ? "You're close!" : "¡Estás cerca!";
  const savedLocation = lang === "en" ? "Saved location" : "Ubicación guardada";
  const youAreAt = lang === "en" ? "You are" : "Estás a";
  const metersText = lang === "en" ? "meters" : "metros";
  const discardText = lang === "en" ? "🗑️ Discard" : "🗑️ Descartar";
  const acceptText = lang === "en" ? "✅ Accept" : "✅ Aceptar";
  const okText = lang === "en" ? "👍 OK" : "👍 Entendido";
  const recurringText =
    lang === "en"
      ? "🔄 Recurring reminder - Will renew automatically"
      : "🔄 Recordatorio recurrente - Se renovará automáticamente";
  const sharedByText = lang === "en" ? "Shared by" : "Compartido por";

  const distanceText =
    distance < 1
      ? `${Math.round(distance * 1000)} ${metersText}`
      : `${distance.toFixed(1)} km`;

  // Construir info de compartido si aplica
  let sharedInfo = "";
  if (!isOwner && reminder.shared_by_name) {
    const viaGroup =
      reminder.shared_via_group === "group" && reminder.group_name
        ? ` (${reminder.group_name})`
        : "";
    sharedInfo = `
      <div class="notification-time" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #92400e; border: 2px solid #f59e0b; margin-bottom: 10px;">
        👥 ${sharedByText}: ${reminder.shared_by_name}${viaGroup}
      </div>
    `;
  }

  // Construir botones según si es owner o no
  let actionsHTML = "";
  if (isOwner) {
    actionsHTML = `
      <button class="btn-notification btn-discard" data-id="${reminder.id}">
        ${discardText}
      </button>
      <button class="btn-notification btn-accept" data-id="${
        reminder.id
      }" data-recurring="${reminder.is_recurring || false}">
        ${acceptText}
      </button>
    `;
  } else {
    actionsHTML = `
      <button class="btn-notification btn-accept" data-id="${reminder.id}" data-shared="true" style="flex: 1;">
        ${okText}
      </button>
    `;
  }

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
        ${sharedInfo}
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
        ${actionsHTML}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => overlay.classList.add("show"), 10);

  // Event listeners según tipo
  const acceptBtn = overlay.querySelector(".btn-accept");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", (e) => {
      const isShared = e.target.dataset.shared === "true";
      if (isShared) {
        acknowledgeSharedNotification(reminder.id, overlay);
      } else {
        const isRecurring = e.target.dataset.recurring === "true";
        acceptNotification(reminder.id, overlay, isRecurring);
      }
    });
  }

  const discardBtn = overlay.querySelector(".btn-discard");
  if (discardBtn) {
    discardBtn.addEventListener("click", () => {
      discardNotification(reminder.id, overlay);
    });
  }
}

// Iniciar automáticamente cuando se carga el script
if (localStorage.getItem("token")) {
  startNotificationSystem();
  startGeofencing();
}
