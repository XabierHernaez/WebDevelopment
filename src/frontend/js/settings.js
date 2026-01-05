// ===== SISTEMA DE CONFIGURACIÓN =====

// Configuración por defecto
const DEFAULT_SETTINGS = {
  // Notificaciones
  notifications_enabled: true,
  notification_sound: true,
  geofencing_radius: 2, // km

  // Apariencia
  dark_mode: false,
  accent_color: "#6366f1", // indigo por defecto
};

// Colores de acento disponibles
const ACCENT_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Violeta", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Verde", value: "#10b981" },
  { name: "Naranja", value: "#f59e0b" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Azul", value: "#3b82f6" },
];

// Opciones de radio de geofencing
const GEOFENCING_OPTIONS = [
  { label: "500 metros", value: 0.5 },
  { label: "1 kilómetro", value: 1 },
  { label: "2 kilómetros", value: 2 },
  { label: "5 kilómetros", value: 5 },
];

// Obtener configuración actual
function getSettings() {
  const saved = localStorage.getItem("georemind_settings");
  if (saved) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
  return { ...DEFAULT_SETTINGS };
}

// Guardar configuración
function saveSettings(settings) {
  localStorage.setItem("georemind_settings", JSON.stringify(settings));
  applySettings(settings);
}

// Aplicar configuración (tema, colores, etc.)
function applySettings(settings) {
  const root = document.documentElement;

  // Aplicar tema oscuro
  if (settings.dark_mode) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  // Aplicar color de acento
  root.style.setProperty("--primary", settings.accent_color);
  root.style.setProperty(
    "--primary-dark",
    adjustColor(settings.accent_color, -20)
  );
  root.style.setProperty("--secondary", adjustColor(settings.accent_color, 20));
}

// Ajustar brillo de un color
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Inicializar configuración al cargar la página
function initSettings() {
  const settings = getSettings();
  applySettings(settings);
}

// Abrir modal de configuración
function openSettingsModal() {
  // Crear el modal si no existe
  if (document.getElementById("settingsModal")) {
    document.getElementById("settingsModal").remove();
  }

  const settings = getSettings();
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  // Traducciones
  const texts = {
    es: {
      title: "Configuración",
      notifications: "Notificaciones",
      enableNotifications: "Activar notificaciones",
      enableNotificationsDesc:
        "Recibe alertas cuando llegue la hora de tus recordatorios",
      notificationSound: "Sonido de alerta",
      notificationSoundDesc:
        "Reproduce un sonido cuando aparece una notificación",
      geofencingRadius: "Radio de proximidad",
      geofencingRadiusDesc:
        "Distancia a la que se activan los recordatorios por ubicación",
      appearance: "Apariencia",
      darkMode: "Tema oscuro",
      darkModeDesc: "Cambia la apariencia de la aplicación a modo nocturno",
      accentColor: "Color de acento",
      accentColorDesc: "Personaliza el color principal de la aplicación",
      saveChanges: "Guardar cambios",
      cancel: "Cancelar",
    },
    en: {
      title: "Settings",
      notifications: "Notifications",
      enableNotifications: "Enable notifications",
      enableNotificationsDesc: "Receive alerts when your reminders are due",
      notificationSound: "Alert sound",
      notificationSoundDesc: "Play a sound when a notification appears",
      geofencingRadius: "Proximity radius",
      geofencingRadiusDesc:
        "Distance at which location reminders are triggered",
      appearance: "Appearance",
      darkMode: "Dark mode",
      darkModeDesc: "Change the app appearance to night mode",
      accentColor: "Accent color",
      accentColorDesc: "Customize the main color of the app",
      saveChanges: "Save changes",
      cancel: "Cancel",
    },
  };

  const t = texts[lang] || texts.es;

  const modalHTML = `
    <div class="custom-modal-overlay show" id="settingsModal">
      <div class="custom-modal settings-modal">
        <div class="custom-modal-header info">
          <button class="settings-modal-close" onclick="closeSettingsModal()">✕</button>
          <div class="custom-modal-icon">⚙️</div>
          <h2>${t.title}</h2>
        </div>
        
        <div class="custom-modal-body settings-body">
          <!-- Sección: Notificaciones -->
          <div class="settings-section">
            <h3 class="settings-section-title">🔔 ${t.notifications}</h3>
            
            <div class="settings-option">
              <div class="settings-option-info">
                <span class="settings-option-label">${
                  t.enableNotifications
                }</span>
                <span class="settings-option-desc">${
                  t.enableNotificationsDesc
                }</span>
              </div>
              <label class="settings-toggle">
                <input type="checkbox" id="settingsNotificationsEnabled" ${
                  settings.notifications_enabled ? "checked" : ""
                }>
                <span class="settings-toggle-slider"></span>
              </label>
            </div>
            
            <div class="settings-option">
              <div class="settings-option-info">
                <span class="settings-option-label">${
                  t.notificationSound
                }</span>
                <span class="settings-option-desc">${
                  t.notificationSoundDesc
                }</span>
              </div>
              <label class="settings-toggle">
                <input type="checkbox" id="settingsNotificationSound" ${
                  settings.notification_sound ? "checked" : ""
                }>
                <span class="settings-toggle-slider"></span>
              </label>
            </div>
            
            <div class="settings-option">
              <div class="settings-option-info">
                <span class="settings-option-label">${t.geofencingRadius}</span>
                <span class="settings-option-desc">${
                  t.geofencingRadiusDesc
                }</span>
              </div>
              <select id="settingsGeofencingRadius" class="settings-select">
                ${GEOFENCING_OPTIONS.map(
                  (opt) => `
                  <option value="${opt.value}" ${
                    settings.geofencing_radius === opt.value ? "selected" : ""
                  }>
                    ${opt.label}
                  </option>
                `
                ).join("")}
              </select>
            </div>
          </div>
          
          <!-- Sección: Apariencia -->
          <div class="settings-section">
            <h3 class="settings-section-title">🎨 ${t.appearance}</h3>
            
            <div class="settings-option">
              <div class="settings-option-info">
                <span class="settings-option-label">${t.darkMode}</span>
                <span class="settings-option-desc">${t.darkModeDesc}</span>
              </div>
              <label class="settings-toggle">
                <input type="checkbox" id="settingsDarkMode" ${
                  settings.dark_mode ? "checked" : ""
                }>
                <span class="settings-toggle-slider"></span>
              </label>
            </div>
            
            <div class="settings-option color-option">
              <div class="settings-option-info">
                <span class="settings-option-label">${t.accentColor}</span>
                <span class="settings-option-desc">${t.accentColorDesc}</span>
              </div>
              <div class="settings-color-picker" id="settingsColorPicker">
                ${ACCENT_COLORS.map(
                  (color) => `
                  <label class="settings-color-option" title="${color.name}">
                    <input type="radio" name="accentColor" value="${
                      color.value
                    }" ${
                    settings.accent_color === color.value ? "checked" : ""
                  }>
                    <span class="settings-color-dot" style="background-color: ${
                      color.value
                    };"></span>
                  </label>
                `
                ).join("")}
              </div>
            </div>
          </div>
        </div>
        
        <div class="custom-modal-actions settings-actions">
          <button class="custom-modal-btn secondary" onclick="closeSettingsModal()">
            ${t.cancel}
          </button>
          <button class="custom-modal-btn primary" onclick="saveSettingsFromModal()">
            ${t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Event listeners para preview en tiempo real
  document
    .getElementById("settingsDarkMode")
    .addEventListener("change", (e) => {
      if (e.target.checked) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    });

  document.querySelectorAll('input[name="accentColor"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      const color = e.target.value;
      document.documentElement.style.setProperty("--primary", color);
      document.documentElement.style.setProperty(
        "--primary-dark",
        adjustColor(color, -20)
      );
      document.documentElement.style.setProperty(
        "--secondary",
        adjustColor(color, 20)
      );
    });
  });

  // Cerrar con ESC
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      closeSettingsModal();
      document.removeEventListener("keydown", handleEsc);
    }
  };
  document.addEventListener("keydown", handleEsc);

  // Cerrar al hacer clic fuera
  document.getElementById("settingsModal").addEventListener("click", (e) => {
    if (e.target.id === "settingsModal") {
      closeSettingsModal();
    }
  });
}

// Cerrar modal de configuración
function closeSettingsModal() {
  const modal = document.getElementById("settingsModal");
  if (modal) {
    // Restaurar configuración anterior si no se guardó
    const settings = getSettings();
    applySettings(settings);
    modal.remove();
  }
}

// Guardar configuración desde el modal
function saveSettingsFromModal() {
  const settings = {
    notifications_enabled: document.getElementById(
      "settingsNotificationsEnabled"
    ).checked,
    notification_sound: document.getElementById("settingsNotificationSound")
      .checked,
    geofencing_radius: parseFloat(
      document.getElementById("settingsGeofencingRadius").value
    ),
    dark_mode: document.getElementById("settingsDarkMode").checked,
    accent_color: document.querySelector('input[name="accentColor"]:checked')
      .value,
  };

  saveSettings(settings);

  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const title = lang === "en" ? "Settings saved" : "Configuración guardada";
  const message =
    lang === "en"
      ? "Your preferences have been saved"
      : "Tus preferencias han sido guardadas";

  closeSettingsModal();
  showSuccess(message, title, "✅");
}

// Obtener radio de geofencing actual
function getGeofencingRadius() {
  const settings = getSettings();
  return settings.geofencing_radius;
}

// Verificar si las notificaciones están habilitadas
function areNotificationsEnabled() {
  const settings = getSettings();
  return settings.notifications_enabled;
}

// Verificar si el sonido está habilitado
function isNotificationSoundEnabled() {
  const settings = getSettings();
  return settings.notification_sound;
}

// Inicializar cuando carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  initSettings();
});

// También inicializar inmediatamente si el DOM ya está cargado
if (document.readyState !== "loading") {
  initSettings();
}

// Exportar funciones globalmente
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveSettingsFromModal = saveSettingsFromModal;
window.getSettings = getSettings;
window.getGeofencingRadius = getGeofencingRadius;
window.areNotificationsEnabled = areNotificationsEnabled;
window.isNotificationSoundEnabled = isNotificationSoundEnabled;
