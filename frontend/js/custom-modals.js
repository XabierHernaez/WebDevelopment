// === MODALES PERSONALIZADOS ===

// Función para mostrar modal de confirmación
function showConfirm(message, title = "¿Estás seguro?", icon = "⚠️") {
  return new Promise((resolve) => {
    // Crear overlay
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay show";

    // Crear modal
    overlay.innerHTML = `
      <div class="custom-modal">
        <div class="custom-modal-header confirm">
          <div class="custom-modal-icon">${icon}</div>
          <h2>${title}</h2>
        </div>
        <div class="custom-modal-body">
          <p>${message}</p>
        </div>
        <div class="custom-modal-actions">
          <button class="custom-modal-btn secondary" data-action="cancel">
            Cancelar
          </button>
          <button class="custom-modal-btn danger" data-action="confirm">
            Aceptar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Manejar clics
    overlay.querySelector('[data-action="confirm"]').onclick = () => {
      overlay.remove();
      resolve(true);
    };

    overlay.querySelector('[data-action="cancel"]').onclick = () => {
      overlay.remove();
      resolve(false);
    };

    // Cerrar al hacer clic fuera
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    };
  });
}

// Función para mostrar alerta de éxito
function showSuccess(message, title = "¡Éxito!", icon = "✅") {
  return showAlert(message, title, icon, "success");
}

// Función para mostrar alerta de error
function showError(message, title = "Error", icon = "❌") {
  return showAlert(message, title, icon, "error");
}

// Función para mostrar alerta informativa
function showInfo(message, title = "Información", icon = "ℹ️") {
  return showAlert(message, title, icon, "info");
}

// Función genérica para alertas
function showAlert(message, title, icon, type = "info") {
  return new Promise((resolve) => {
    // Crear overlay
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay show";

    // Crear modal
    overlay.innerHTML = `
      <div class="custom-modal">
        <div class="custom-modal-header ${type}">
          <div class="custom-modal-icon">${icon}</div>
          <h2>${title}</h2>
        </div>
        <div class="custom-modal-body">
          <p>${message}</p>
        </div>
        <div class="custom-modal-actions">
          <button class="custom-modal-btn primary" data-action="ok">
            Entendido
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Cerrar modal
    const closeModal = () => {
      overlay.remove();
      resolve();
    };

    overlay.querySelector('[data-action="ok"]').onclick = closeModal;

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    };
  });
}

// Exportar funciones globalmente
window.showConfirm = showConfirm;
window.showSuccess = showSuccess;
window.showError = showError;
window.showInfo = showInfo;
