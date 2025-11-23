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
          !reminder.is_notified &&
          !shownNotifications.has(reminder.id) // ✨ IMPORTANTE: Verificar que no se haya mostrado ya
        ) {
          const reminderTime = new Date(reminder.datetime);
          const diffMinutes = Math.floor((reminderTime - now) / (1000 * 60));

          // Si la hora ya pasó o está a punto (0-1 minutos)
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
                ${
                  reminder.is_recurring
                    ? `
                    <div class="notification-time" style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); color: #6366f1; border: 2px solid #6366f1; margin-top: 10px;">
                        🔄 Recordatorio recurrente - Se renovará automáticamente
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
                }" data-recurring="${reminder.is_recurring || false}">
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

  try {
    if (isRecurring) {
      // ✨ RECORDATORIO RECURRENTE: Marcar como notificado Y renovar inmediatamente
      const response = await fetch(`${API_URL}/reminders/${reminderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_notified: true,
          is_completed: true, // Esto dispara la renovación automática en el backend
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Recordatorio recurrente renovado automáticamente");

        // ✨ IMPORTANTE: Remover de la lista de notificaciones mostradas
        // para que pueda volver a notificar en el próximo ciclo
        shownNotifications.delete(reminderId);

        // Cerrar overlay ANTES de mostrar el mensaje de éxito
        closeNotification(overlay);

        if (data.renewed) {
          await showSuccess(
            `Próxima vez: ${formatDateTime(data.next_occurrence)}`,
            "Recordatorio renovado",
            "🔄"
          );
        }

        // Recargar lista si estamos en la página de recordatorios
        if (typeof loadReminders === "function") {
          loadReminders();
        }
      }
    } else {
      // ❌ RECORDATORIO NORMAL: Solo marcar como notificado (se queda amarillo)
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
    }
  } catch (error) {
    console.error("Error al aceptar notificación:", error);
    closeNotification(overlay);
  }
}

// Formatear fecha/hora
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("es-ES", options);
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

      // ✨ Limpiar de la lista de notificaciones mostradas
      shownNotifications.delete(reminderId);

      closeNotification(overlay);

      // Recargar lista si estamos en la página de recordatorios
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
// ========== GEOFENCING (Verificación de ubicación) ==========

let geofencingInterval = null;
let shownLocationNotifications = new Set();

async function startGeofencing() {
  console.log("📍 Sistema de geofencing iniciado");

  // Primero verificar si el navegador ya tiene permisos guardados
  const browserPermission = await checkBrowserPermission();

  if (browserPermission === "granted") {
    // Ya tiene permisos, iniciar directamente SIN pedir nada
    console.log("✅ Permisos ya concedidos previamente");
    geofencingInterval = setInterval(checkLocationReminders, 10000);
    checkLocationReminders();
    return;
  }

  if (browserPermission === "denied") {
    // Usuario denegó permisos, no molestar
    console.log("⚠️ Permisos denegados por el usuario");
    return;
  }

  // Si no tiene permisos (prompt), verificar si ya preguntamos
  const alreadyAsked = checkLocationPermission();

  if (alreadyAsked) {
    // Ya preguntamos antes pero no respondió o cambió de página
    // No volver a molestar
    console.log("🔕 Ya se solicitaron permisos anteriormente");
    return;
  } else {
    // Primera vez, mostrar modal educativo
    showPermissionRequestModal();
  }
}

// Nueva función: Verificar permisos del navegador
async function checkBrowserPermission() {
  if (!navigator.permissions) {
    return "prompt"; // No soportado, asumir que debe preguntar
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state; // 'granted', 'denied', o 'prompt'
  } catch (error) {
    console.log("No se pudo verificar permisos del navegador");
    return "prompt";
  }
}

// Verificar si ya preguntamos por permisos
function checkLocationPermission() {
  // Solo verificar si ya preguntamos antes
  const alreadyAsked = localStorage.getItem("location_permission_asked");
  return alreadyAsked === "true";
}

// Mostrar modal de solicitud de permisos
function showPermissionRequestModal() {
  const modal = document.createElement("div");
  modal.className = "permission-modal-overlay";
  modal.innerHTML = `
        <div class="permission-modal">
            <div class="permission-header">
                <div class="permission-icon">📍</div>
                <h2>Ubicación Requerida</h2>
            </div>
            
            <div class="permission-body">
                <h3>GeoRemind necesita tu ubicación</h3>
                <p>Para notificarte cuando te acerques a tus recordatorios guardados, necesitamos acceso a tu ubicación.</p>
                
                <div class="permission-features">
                    <div class="permission-feature">
                        <span class="permission-feature-icon">🔔</span>
                        <span class="permission-feature-text">Recordatorios automáticos al acercarte a un lugar</span>
                    </div>
                    <div class="permission-feature">
                        <span class="permission-feature-icon">🗺️</span>
                        <span class="permission-feature-text">Centrado automático del mapa en tu posición</span>
                    </div>
                    <div class="permission-feature">
                        <span class="permission-feature-icon">🔒</span>
                        <span class="permission-feature-text">Tu ubicación es privada y segura</span>
                    </div>
                </div>
            </div>
            
            <div class="permission-actions">
                <button class="btn-permission btn-deny" id="denyPermissionBtn">
                    Ahora no
                </button>
                <button class="btn-permission btn-allow" id="allowPermissionBtn">
                    ✓ Permitir ubicación
                </button>
            </div>
            
            <p class="permission-note">Solo se te preguntará esta vez. Puedes cambiar los permisos desde la configuración del navegador.</p>
        </div>
    `;

  document.body.appendChild(modal);

  // Event listeners
  document
    .getElementById("allowPermissionBtn")
    .addEventListener("click", () => {
      requestLocationPermission(modal);
    });

  document.getElementById("denyPermissionBtn").addEventListener("click", () => {
    // Marcar que ya preguntamos (para no volver a mostrar el modal)
    localStorage.setItem("location_permission_asked", "true");
    modal.remove();
    console.log("Usuario rechazó permisos de ubicación");
  });
}

// Solicitar permisos de ubicación
function requestLocationPermission(modal) {
  // Marcar que ya preguntamos
  localStorage.setItem("location_permission_asked", "true");

  // Cerrar modal primero
  modal.remove();

  // Ahora el navegador pedirá permisos (con su diálogo nativo)
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("✅ Permisos de ubicación concedidos");

      // Iniciar verificación de ubicaciones
      startLocationChecking();
    },
    (error) => {
      console.warn("⚠️ Permisos denegados:", error.message);

      if (error.code === 1) {
        // PERMISSION_DENIED
        alert(
          "⚠️ Has bloqueado el acceso a la ubicación. Las notificaciones por proximidad no funcionarán.\n\nPara activarlo, ve a la configuración de tu navegador."
        );
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

  // Primero verificar si tenemos permisos sin pedirlos
  navigator.geolocation.getCurrentPosition(
    (position) => {
      // Tenemos permisos, iniciar verificaciones periódicas
      console.log("✅ Permisos ya concedidos, iniciando verificaciones");
      geofencingInterval = setInterval(checkLocationReminders, 10000);
      checkLocationReminders();
    },
    (error) => {
      // No tenemos permisos o fueron denegados
      if (error.code === 1) {
        console.log("⚠️ Permisos de ubicación denegados");
      } else {
        console.log("⚠️ Error al obtener ubicación:", error.message);
      }
    },
    {
      enableHighAccuracy: false, // No necesitamos alta precisión para verificar
      timeout: 5000,
      maximumAge: 300000, // Usar caché de 5 minutos
    }
  );
}

// Verificar recordatorios por ubicación
async function checkLocationReminders() {
  const token = localStorage.getItem("token");
  if (!token) return;

  // Obtener ubicación actual del usuario
  if (!navigator.geolocation) {
    console.warn("Geolocalización no disponible");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      console.log("📍 Ubicación actual:", userLat, userLng);

      // Obtener recordatorios con ubicación
      try {
        const response = await fetch(`${API_URL}/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          data.reminders.forEach(async (reminder) => {
            // Solo recordatorios con ubicación, no completados, no notificados
            if (
              (reminder.reminder_type === "location" ||
                reminder.reminder_type === "both") &&
              !reminder.is_completed &&
              !reminder.is_notified &&
              !shownLocationNotifications.has(reminder.id)
            ) {
              // Obtener coordenadas del recordatorio desde Geo Service
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

                // Si está a menos de 2km
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
      // No mostrar warnings si el usuario denegó permisos (code 1)
      if (error.code !== 1) {
        console.warn("No se pudo obtener ubicación:", error.message);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // Usar caché de 30 segundos
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
  const R = 6371; // Radio de la Tierra en km
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

  const overlay = document.createElement("div");
  overlay.className = "notification-overlay";
  overlay.innerHTML = `
        <div class="notification-modal">
            <div class="notification-header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <div class="notification-icon">📍</div>
                <h2>¡Estás cerca!</h2>
            </div>
            
            <div class="notification-body">
                <h3>${reminder.title}</h3>
                ${reminder.description ? `<p>${reminder.description}</p>` : ""}
                <div class="notification-location">
                    📍 ${reminder.address || "Ubicación guardada"}
                </div>
                <div class="notification-time" style="background: #d1fae5; color: #065f46;">
                    📏 Estás a ${
                      distance < 1
                        ? Math.round(distance * 1000) + " metros"
                        : distance.toFixed(1) + " km"
                    }
                </div>
                ${
                  reminder.is_recurring
                    ? `
                    <div class="notification-time" style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); color: #6366f1; border: 2px solid #6366f1; margin-top: 10px;">
                        🔄 Recordatorio recurrente - Se renovará automáticamente
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
                }" data-recurring="${reminder.is_recurring || false}">
                    ✅ Aceptar
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
