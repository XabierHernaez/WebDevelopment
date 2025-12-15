// ===== SISTEMA DE AMIGOS =====

const FRIENDS_API_URL = "http://localhost:5000/api/friends";

// Estado del modal de amigos
let friendsModalOpen = false;
let currentFriendsTab = "friends";
let searchTimeout = null;

// Inicializar el sistema de amigos
function initFriendsSystem() {
  const friendsBtn = document.getElementById("friendsBtn");
  if (friendsBtn) {
    // Remover el listener anterior que mostraba "Próximamente"
    friendsBtn.replaceWith(friendsBtn.cloneNode(true));

    // Añadir nuevo listener
    document.getElementById("friendsBtn").addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("userAvatarContainer").classList.remove("active");
      openFriendsModal();
    });
  }
}

// Abrir modal de amigos
async function openFriendsModal() {
  // Crear el modal si no existe
  if (!document.getElementById("friendsModal")) {
    createFriendsModalHTML();
  }

  const modal = document.getElementById("friendsModal");
  modal.classList.add("show");
  friendsModalOpen = true;

  // Cargar datos iniciales
  await switchFriendsTab("friends");
  await loadPendingRequestsCount();
}

// Cerrar modal de amigos
function closeFriendsModal() {
  const modal = document.getElementById("friendsModal");
  if (modal) {
    modal.classList.remove("show");
  }
  friendsModalOpen = false;
}

// Crear el HTML del modal
function createFriendsModalHTML() {
  const modalHTML = `
    <div class="custom-modal-overlay" id="friendsModal">
      <div class="custom-modal friends-modal">
        <div class="custom-modal-header info">
          <button class="friends-modal-close" onclick="closeFriendsModal()">✕</button>
          <div class="custom-modal-icon">👥</div>
          <h2 data-i18n="friendsTitle">Amigos</h2>
        </div>
        
        <div class="custom-modal-body">
          <!-- Tabs -->
          <div class="friends-tabs">
            <button class="friends-tab active" data-tab="friends" onclick="switchFriendsTab('friends')">
              👥 <span data-i18n="myFriends">Mis Amigos</span>
            </button>
            <button class="friends-tab" data-tab="requests" onclick="switchFriendsTab('requests')">
              📩 <span data-i18n="requests">Solicitudes</span>
              <span class="friends-tab-badge" id="requestsBadge" style="display: none;">0</span>
            </button>
            <button class="friends-tab" data-tab="search" onclick="switchFriendsTab('search')">
              🔍 <span data-i18n="addFriend">Añadir</span>
            </button>
          </div>
          
          <!-- Tab: Mis Amigos -->
          <div class="friends-tab-content active" id="tabFriends">
            <div class="friends-loading" id="friendsLoading">
              <div class="friends-loading-spinner"></div>
              <p data-i18n="loading">Cargando...</p>
            </div>
            <div class="friends-list" id="friendsList"></div>
          </div>
          
          <!-- Tab: Solicitudes -->
          <div class="friends-tab-content" id="tabRequests">
            <div class="friends-loading" id="requestsLoading">
              <div class="friends-loading-spinner"></div>
              <p data-i18n="loading">Cargando...</p>
            </div>
            <div class="friends-list" id="requestsList"></div>
          </div>
          
          <!-- Tab: Buscar/Añadir -->
          <div class="friends-tab-content" id="tabSearch">
            <div class="friends-search-container">
              <input 
                type="email" 
                class="friends-search-input" 
                id="friendSearchInput"
                placeholder="Buscar por email..."
                data-i18n-placeholder="searchByEmail"
                autocomplete="off"
              >
              <p class="friends-search-hint" data-i18n="searchHint">Escribe al menos 3 caracteres para buscar</p>
            </div>
            <div class="friends-loading" id="searchLoading" style="display: none;">
              <div class="friends-loading-spinner"></div>
              <p data-i18n="searching">Buscando...</p>
            </div>
            <div class="friends-list" id="searchResults"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Event listeners
  const modal = document.getElementById("friendsModal");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeFriendsModal();
    }
  });

  // Búsqueda con debounce
  const searchInput = document.getElementById("friendSearchInput");
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 3) {
      document.getElementById("searchResults").innerHTML = "";
      return;
    }

    searchTimeout = setTimeout(() => {
      searchUsers(query);
    }, 300);
  });

  // Cerrar con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && friendsModalOpen) {
      closeFriendsModal();
    }
  });
}

// Cambiar de tab
async function switchFriendsTab(tabName) {
  currentFriendsTab = tabName;

  // Actualizar tabs activos
  document.querySelectorAll(".friends-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  // Mostrar contenido correcto
  document.querySelectorAll(".friends-tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  const tabContent = document.getElementById(
    `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`
  );
  if (tabContent) {
    tabContent.classList.add("active");
  }

  // Cargar datos según el tab
  if (tabName === "friends") {
    await loadFriends();
  } else if (tabName === "requests") {
    await loadPendingRequests();
  } else if (tabName === "search") {
    document.getElementById("friendSearchInput").focus();
  }
}

// Cargar lista de amigos
async function loadFriends() {
  const loading = document.getElementById("friendsLoading");
  const list = document.getElementById("friendsList");

  loading.style.display = "block";
  list.innerHTML = "";

  try {
    const response = await fetch(`${FRIENDS_API_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    loading.style.display = "none";

    if (data.success && data.friends.length > 0) {
      list.innerHTML = data.friends
        .map((friend) => createFriendItemHTML(friend, "friend"))
        .join("");
    } else {
      list.innerHTML = `
        <div class="friends-empty">
          <div class="friends-empty-icon">👥</div>
          <h4 data-i18n="noFriendsYet">Aún no tienes amigos</h4>
          <p data-i18n="noFriendsHint">Busca usuarios por email para añadirlos</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error al cargar amigos:", error);
    loading.style.display = "none";
    list.innerHTML = `
      <div class="friends-empty">
        <div class="friends-empty-icon">❌</div>
        <h4>Error al cargar</h4>
        <p>No se pudieron cargar los amigos</p>
      </div>
    `;
  }
}

// Cargar solicitudes pendientes
async function loadPendingRequests() {
  const loading = document.getElementById("requestsLoading");
  const list = document.getElementById("requestsList");

  loading.style.display = "block";
  list.innerHTML = "";

  try {
    const response = await fetch(`${FRIENDS_API_URL}/requests/pending`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    loading.style.display = "none";

    if (data.success && data.requests.length > 0) {
      list.innerHTML = data.requests
        .map((request) => createFriendItemHTML(request, "request"))
        .join("");
    } else {
      list.innerHTML = `
        <div class="friends-empty">
          <div class="friends-empty-icon">📭</div>
          <h4 data-i18n="noRequests">Sin solicitudes</h4>
          <p data-i18n="noRequestsHint">No tienes solicitudes de amistad pendientes</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
    loading.style.display = "none";
  }
}

// Cargar contador de solicitudes pendientes
async function loadPendingRequestsCount() {
  try {
    const response = await fetch(`${FRIENDS_API_URL}/requests/pending`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    const badge = document.getElementById("requestsBadge");

    if (data.success && data.count > 0) {
      badge.textContent = data.count;
      badge.style.display = "inline";
    } else {
      badge.style.display = "none";
    }
  } catch (error) {
    console.error("Error al cargar contador:", error);
  }
}

// Buscar usuarios
async function searchUsers(query) {
  const loading = document.getElementById("searchLoading");
  const results = document.getElementById("searchResults");

  loading.style.display = "block";
  results.innerHTML = "";

  try {
    const response = await fetch(
      `${FRIENDS_API_URL}/search?email=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    loading.style.display = "none";

    if (data.success && data.users.length > 0) {
      results.innerHTML = data.users
        .map((user) => createFriendItemHTML(user, "search"))
        .join("");
    } else {
      results.innerHTML = `
        <div class="friends-empty">
          <div class="friends-empty-icon">🔍</div>
          <h4 data-i18n="noUsersFound">No se encontraron usuarios</h4>
          <p data-i18n="tryAnotherEmail">Prueba con otro email</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    loading.style.display = "none";
  }
}

// Crear HTML de un item de amigo/usuario
function createFriendItemHTML(user, type) {
  const initial = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();
  const color = generateAvatarColor(user.email);

  let actionsHTML = "";

  if (type === "friend") {
    actionsHTML = `
      <button class="friend-action-btn remove" onclick="removeFriend(${user.id}, '${user.name}')">
        Eliminar
      </button>
    `;
  } else if (type === "request") {
    actionsHTML = `
      <button class="friend-action-btn accept" onclick="respondRequest(${user.friendship_id}, 'accept')">
        ✓ Aceptar
      </button>
      <button class="friend-action-btn reject" onclick="respondRequest(${user.friendship_id}, 'reject')">
        ✕
      </button>
    `;
  } else if (type === "search") {
    if (user.friendship_status === "accepted") {
      actionsHTML = `<span class="friend-action-btn pending">✓ Amigos</span>`;
    } else if (user.friendship_status === "pending") {
      actionsHTML = `<span class="friend-action-btn pending">⏳ Pendiente</span>`;
    } else {
      actionsHTML = `
        <button class="friend-action-btn add" onclick="sendFriendRequest(${user.id}, this)">
          + Añadir
        </button>
      `;
    }
  }

  return `
    <div class="friend-item" data-user-id="${user.id}">
      <div class="friend-avatar" style="background-color: ${color};">${initial}</div>
      <div class="friend-info">
        <div class="friend-name">${user.name || "Usuario"}</div>
        <div class="friend-email">${user.email}</div>
      </div>
      <div class="friend-actions">
        ${actionsHTML}
      </div>
    </div>
  `;
}

// Enviar solicitud de amistad
async function sendFriendRequest(userId, button) {
  button.disabled = true;
  button.textContent = "...";

  try {
    const response = await fetch(`${FRIENDS_API_URL}/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ addressee_id: userId }),
    });

    const data = await response.json();

    if (data.success) {
      button.className = "friend-action-btn pending";
      button.textContent = "⏳ Pendiente";
      button.disabled = true;
      showSuccess("Solicitud enviada correctamente", "Solicitud enviada", "✅");
    } else {
      button.disabled = false;
      button.textContent = "+ Añadir";
      showError(data.message || "Error al enviar solicitud");
    }
  } catch (error) {
    console.error("Error:", error);
    button.disabled = false;
    button.textContent = "+ Añadir";
    showError("Error de conexión");
  }
}

// Responder a solicitud
async function respondRequest(friendshipId, action) {
  try {
    const response = await fetch(`${FRIENDS_API_URL}/request/${friendshipId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    const data = await response.json();

    if (data.success) {
      const message =
        action === "accept" ? "Solicitud aceptada" : "Solicitud rechazada";
      showSuccess(
        message,
        action === "accept" ? "¡Nuevo amigo!" : "Rechazada",
        action === "accept" ? "🎉" : "👋"
      );

      // Recargar solicitudes y amigos
      await loadPendingRequests();
      await loadPendingRequestsCount();

      if (action === "accept") {
        // Si aceptó, también actualizar la lista de amigos
        await loadFriends();
      }
    } else {
      showError(data.message || "Error al responder");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Error de conexión");
  }
}

// Eliminar amigo
async function removeFriend(friendId, friendName) {
  const confirmed = await showConfirm(
    `¿Eliminar a ${friendName} de tus amigos?`,
    "Eliminar amigo",
    "👋"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${FRIENDS_API_URL}/${friendId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      showSuccess("Amigo eliminado correctamente", "Eliminado", "✅");
      await loadFriends();
    } else {
      showError(data.message || "Error al eliminar");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Error de conexión");
  }
}

// Inicializar cuando cargue la página
document.addEventListener("DOMContentLoaded", () => {
  // Esperar un poco para que se cargue el avatar
  setTimeout(() => {
    initFriendsSystem();
  }, 100);
});
