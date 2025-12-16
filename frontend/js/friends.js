// ===== SISTEMA DE AMIGOS Y GRUPOS =====

const FRIENDS_API_URL = "http://localhost:5000/api/friends";
const GROUPS_API_URL = "http://localhost:5000/api/groups";

// Estado del modal
let friendsModalOpen = false;
let currentFriendsTab = "friends";
let searchTimeout = null;
let currentGroupView = null; // Para ver detalles de un grupo

// Inicializar el sistema de amigos
function initFriendsSystem() {
  const friendsBtn = document.getElementById("friendsBtn");
  if (friendsBtn) {
    // Remover el listener anterior
    friendsBtn.replaceWith(friendsBtn.cloneNode(true));

    // Añadir nuevo listener
    document.getElementById("friendsBtn").addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("userAvatarContainer").classList.remove("active");
      openFriendsModal();
    });

    // Quitar el badge de "Próximamente" si existe
    const comingSoonBadge = document.querySelector("#friendsBtn .coming-soon");
    if (comingSoonBadge) {
      comingSoonBadge.remove();
    }
  }
}

// Abrir modal de amigos
async function openFriendsModal() {
  if (!document.getElementById("friendsModal")) {
    createFriendsModalHTML();
  }

  const modal = document.getElementById("friendsModal");
  modal.classList.add("show");
  friendsModalOpen = true;
  currentGroupView = null;

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
  currentGroupView = null;
}

// Crear el HTML del modal
function createFriendsModalHTML() {
  const modalHTML = `
    <div class="custom-modal-overlay" id="friendsModal">
      <div class="custom-modal friends-modal">
        <div class="custom-modal-header info">
          <button class="friends-modal-close" onclick="closeFriendsModal()">✕</button>
          <div class="custom-modal-icon">👥</div>
          <h2 id="friendsModalTitle" data-i18n="friendsTitle">Amigos y Grupos</h2>
        </div>
        
        <div class="custom-modal-body">
          <!-- Tabs -->
          <div class="friends-tabs">
            <button class="friends-tab active" data-tab="friends" onclick="switchFriendsTab('friends')">
              👥 <span data-i18n="myFriends">Amigos</span>
            </button>
            <button class="friends-tab" data-tab="requests" onclick="switchFriendsTab('requests')">
              📩 <span data-i18n="requests">Solicitudes</span>
              <span class="friends-tab-badge" id="requestsBadge" style="display: none;">0</span>
            </button>
            <button class="friends-tab" data-tab="groups" onclick="switchFriendsTab('groups')">
              👨‍👩‍👧‍👦 <span data-i18n="groups">Grupos</span>
            </button>
            <button class="friends-tab" data-tab="search" onclick="switchFriendsTab('search')">
              🔍 <span data-i18n="add">Añadir</span>
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
          
          <!-- Tab: Grupos -->
          <div class="friends-tab-content" id="tabGroups">
            <div class="friends-loading" id="groupsLoading">
              <div class="friends-loading-spinner"></div>
              <p data-i18n="loading">Cargando...</p>
            </div>
            <div id="groupsContainer">
              <button class="btn-create-group" onclick="showCreateGroupForm()">
                ➕ <span data-i18n="createGroup">Crear Grupo</span>
              </button>
              <div class="friends-list" id="groupsList"></div>
            </div>
            <!-- Vista de detalle de grupo -->
            <div id="groupDetailView" style="display: none;"></div>
            <!-- Formulario crear grupo -->
            <div id="createGroupForm" style="display: none;"></div>
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
      if (currentGroupView) {
        backToGroupsList();
      } else {
        closeFriendsModal();
      }
    }
  });
}

// Cambiar de tab
async function switchFriendsTab(tabName) {
  currentFriendsTab = tabName;
  currentGroupView = null;

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
  } else if (tabName === "groups") {
    await loadGroups();
  } else if (tabName === "search") {
    document.getElementById("friendSearchInput").focus();
  }
}

// ===== FUNCIONES DE AMIGOS =====

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

      await loadPendingRequests();
      await loadPendingRequestsCount();

      if (action === "accept") {
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

// ===== FUNCIONES DE GRUPOS =====

async function loadGroups() {
  const loading = document.getElementById("groupsLoading");
  const list = document.getElementById("groupsList");
  const container = document.getElementById("groupsContainer");
  const detailView = document.getElementById("groupDetailView");
  const createForm = document.getElementById("createGroupForm");

  // Mostrar vista de lista
  container.style.display = "block";
  detailView.style.display = "none";
  createForm.style.display = "none";

  loading.style.display = "block";
  list.innerHTML = "";

  try {
    const response = await fetch(`${GROUPS_API_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    loading.style.display = "none";

    if (data.success && data.groups.length > 0) {
      list.innerHTML = data.groups
        .map((group) => createGroupItemHTML(group))
        .join("");
    } else {
      list.innerHTML = `
        <div class="friends-empty">
          <div class="friends-empty-icon">👨‍👩‍👧‍👦</div>
          <h4 data-i18n="noGroupsYet">Aún no tienes grupos</h4>
          <p data-i18n="noGroupsHint">Crea un grupo para compartir recordatorios</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error al cargar grupos:", error);
    loading.style.display = "none";
    list.innerHTML = `
      <div class="friends-empty">
        <div class="friends-empty-icon">❌</div>
        <h4>Error al cargar</h4>
        <p>No se pudieron cargar los grupos</p>
      </div>
    `;
  }
}

function createGroupItemHTML(group) {
  const initial = group.name.charAt(0).toUpperCase();
  const color = group.color || "#6366f1";
  const memberCount = group.member_count || group.members?.length || 0;

  return `
    <div class="friend-item group-item" data-group-id="${
      group.id
    }" onclick="viewGroupDetails(${group.id})">
      <div class="friend-avatar group-avatar" style="background-color: ${color};">${initial}</div>
      <div class="friend-info">
        <div class="friend-name">${group.name}</div>
        <div class="friend-email">${memberCount} miembro${
    memberCount !== 1 ? "s" : ""
  }</div>
        ${
          group.my_role === "admin"
            ? '<span class="group-role-badge">Admin</span>'
            : ""
        }
      </div>
      <div class="friend-actions">
        <span class="group-arrow">→</span>
      </div>
    </div>
  `;
}

function showCreateGroupForm() {
  const container = document.getElementById("groupsContainer");
  const createForm = document.getElementById("createGroupForm");

  container.style.display = "none";
  createForm.style.display = "block";

  createForm.innerHTML = `
    <div class="group-form">
      <div class="group-form-header">
        <button class="btn-back-small" onclick="backToGroupsList()">← Volver</button>
        <h3>Crear Nuevo Grupo</h3>
      </div>
      
      <div class="form-group">
        <label for="groupName">Nombre del grupo *</label>
        <input type="text" id="groupName" class="friends-search-input" placeholder="Ej: Familia, Trabajo..." maxlength="50">
      </div>
      
      <div class="form-group">
        <label for="groupDescription">Descripción (opcional)</label>
        <input type="text" id="groupDescription" class="friends-search-input" placeholder="Descripción del grupo..." maxlength="150">
      </div>
      
      <div class="form-group">
        <label>Color del grupo</label>
        <div class="color-picker">
          <label class="color-option">
            <input type="radio" name="groupColor" value="#6366f1" checked>
            <span class="color-dot" style="background-color: #6366f1;"></span>
          </label>
          <label class="color-option">
            <input type="radio" name="groupColor" value="#8b5cf6">
            <span class="color-dot" style="background-color: #8b5cf6;"></span>
          </label>
          <label class="color-option">
            <input type="radio" name="groupColor" value="#ec4899">
            <span class="color-dot" style="background-color: #ec4899;"></span>
          </label>
          <label class="color-option">
            <input type="radio" name="groupColor" value="#10b981">
            <span class="color-dot" style="background-color: #10b981;"></span>
          </label>
          <label class="color-option">
            <input type="radio" name="groupColor" value="#f59e0b">
            <span class="color-dot" style="background-color: #f59e0b;"></span>
          </label>
          <label class="color-option">
            <input type="radio" name="groupColor" value="#ef4444">
            <span class="color-dot" style="background-color: #ef4444;"></span>
          </label>
        </div>
      </div>
      
      <div class="form-group">
        <label>Añadir miembros (opcional)</label>
        <div id="friendsToAdd" class="friends-to-add">
          <p class="loading-text">Cargando amigos...</p>
        </div>
      </div>
      
      <button class="btn-create-group-submit" onclick="createGroup()">
        ✓ Crear Grupo
      </button>
    </div>
  `;

  // Cargar amigos para añadir
  loadFriendsForGroup();
}

async function loadFriendsForGroup() {
  const container = document.getElementById("friendsToAdd");

  try {
    const response = await fetch(`${FRIENDS_API_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success && data.friends.length > 0) {
      container.innerHTML = data.friends
        .map((friend) => {
          const initial = friend.name
            ? friend.name.charAt(0).toUpperCase()
            : friend.email.charAt(0).toUpperCase();
          const color = generateAvatarColor(friend.email);

          return `
            <label class="friend-checkbox">
              <input type="checkbox" name="groupMembers" value="${friend.id}">
              <div class="friend-avatar-small" style="background-color: ${color};">${initial}</div>
              <span class="friend-checkbox-name">${
                friend.name || friend.email
              }</span>
            </label>
          `;
        })
        .join("");
    } else {
      container.innerHTML = `<p class="no-friends-text">No tienes amigos para añadir. Puedes añadirlos después.</p>`;
    }
  } catch (error) {
    console.error("Error al cargar amigos:", error);
    container.innerHTML = `<p class="error-text">Error al cargar amigos</p>`;
  }
}

async function createGroup() {
  const name = document.getElementById("groupName").value.trim();
  const description = document.getElementById("groupDescription").value.trim();
  const color =
    document.querySelector('input[name="groupColor"]:checked')?.value ||
    "#6366f1";
  const memberCheckboxes = document.querySelectorAll(
    'input[name="groupMembers"]:checked'
  );
  const memberIds = Array.from(memberCheckboxes).map((cb) =>
    parseInt(cb.value)
  );

  if (!name) {
    showError("El nombre del grupo es obligatorio", "Campo requerido");
    return;
  }

  try {
    const response = await fetch(`${GROUPS_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        description: description || null,
        color,
        member_ids: memberIds,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showSuccess(
        `Grupo "${name}" creado correctamente`,
        "¡Grupo creado!",
        "👨‍👩‍👧‍👦"
      );
      await loadGroups();
    } else {
      showError(data.message || "Error al crear el grupo");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Error de conexión");
  }
}

async function viewGroupDetails(groupId) {
  const container = document.getElementById("groupsContainer");
  const detailView = document.getElementById("groupDetailView");

  container.style.display = "none";
  detailView.style.display = "block";

  detailView.innerHTML = `
    <div class="friends-loading">
      <div class="friends-loading-spinner"></div>
      <p>Cargando grupo...</p>
    </div>
  `;

  try {
    const response = await fetch(`${GROUPS_API_URL}/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      currentGroupView = data.group;
      renderGroupDetails(data.group);
    } else {
      showError(data.message || "Error al cargar el grupo");
      backToGroupsList();
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Error de conexión");
    backToGroupsList();
  }
}

function renderGroupDetails(group) {
  const detailView = document.getElementById("groupDetailView");
  const isAdmin = group.my_role === "admin";
  const color = group.color || "#6366f1";

  detailView.innerHTML = `
    <div class="group-detail">
      <div class="group-detail-header">
        <button class="btn-back-small" onclick="backToGroupsList()">← Volver</button>
        <div class="group-detail-title">
          <div class="friend-avatar group-avatar-large" style="background-color: ${color};">
            ${group.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>${group.name}</h3>
            ${
              group.description
                ? `<p class="group-description">${group.description}</p>`
                : ""
            }
          </div>
        </div>
        ${
          isAdmin
            ? `
          <div class="group-admin-actions">
            <button class="btn-add-member" onclick="showAddMemberForm(${group.id})">+ Añadir miembro</button>
            <button class="btn-delete-group" onclick="deleteGroup(${group.id}, '${group.name}')">🗑️</button>
          </div>
        `
            : ""
        }
      </div>
      
      <div class="group-members-section">
        <h4>👥 Miembros (${group.members.length})</h4>
        <div class="friends-list" id="groupMembersList">
          ${group.members
            .map((member) => createGroupMemberHTML(member, group, isAdmin))
            .join("")}
        </div>
      </div>
      
      ${
        !isAdmin
          ? `
        <div class="group-leave-section">
          <button class="btn-leave-group" onclick="leaveGroup(${group.id})">
            🚪 Abandonar grupo
          </button>
        </div>
      `
          : ""
      }
    </div>
    
    <!-- Formulario añadir miembro -->
    <div id="addMemberForm" style="display: none;"></div>
  `;
}

function createGroupMemberHTML(member, group, isAdmin) {
  const initial = member.name
    ? member.name.charAt(0).toUpperCase()
    : member.email.charAt(0).toUpperCase();
  const color = generateAvatarColor(member.email);
  const isOwner = member.id === group.owner_id;
  const isSelf = member.id === currentUser.id;

  let actionsHTML = "";
  if (isAdmin && !isOwner && !isSelf) {
    actionsHTML = `
      <button class="friend-action-btn remove" onclick="removeGroupMember(${group.id}, ${member.id}, '${member.name}')">
        Eliminar
      </button>
    `;
  }

  return `
    <div class="friend-item" data-user-id="${member.id}">
      <div class="friend-avatar" style="background-color: ${color};">${initial}</div>
      <div class="friend-info">
        <div class="friend-name">
          ${member.name || "Usuario"}
          ${isOwner ? '<span class="owner-badge">👑 Creador</span>' : ""}
          ${isSelf ? '<span class="you-badge">(Tú)</span>' : ""}
        </div>
        <div class="friend-email">${member.email}</div>
      </div>
      <div class="friend-actions">
        ${actionsHTML}
      </div>
    </div>
  `;
}

async function showAddMemberForm(groupId) {
  const addMemberForm = document.getElementById("addMemberForm");
  addMemberForm.style.display = "block";
  addMemberForm.innerHTML = `
    <div class="add-member-overlay">
      <div class="add-member-modal">
        <h4>Añadir miembro</h4>
        <div id="availableFriends" class="available-friends">
          <p class="loading-text">Cargando amigos...</p>
        </div>
        <button class="btn-cancel" onclick="hideAddMemberForm()">Cancelar</button>
      </div>
    </div>
  `;

  // Cargar amigos que no están en el grupo
  try {
    const [friendsRes, groupRes] = await Promise.all([
      fetch(`${FRIENDS_API_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${GROUPS_API_URL}/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const friendsData = await friendsRes.json();
    const groupData = await groupRes.json();

    const groupMemberIds = groupData.group.members.map((m) => m.id);
    const availableFriends = friendsData.friends.filter(
      (f) => !groupMemberIds.includes(f.id)
    );

    const container = document.getElementById("availableFriends");

    if (availableFriends.length > 0) {
      container.innerHTML = availableFriends
        .map((friend) => {
          const initial = friend.name
            ? friend.name.charAt(0).toUpperCase()
            : friend.email.charAt(0).toUpperCase();
          const color = generateAvatarColor(friend.email);

          return `
            <div class="friend-item" onclick="addMemberToGroup(${groupId}, ${
            friend.id
          }, '${friend.name}')">
              <div class="friend-avatar" style="background-color: ${color};">${initial}</div>
              <div class="friend-info">
                <div class="friend-name">${friend.name || "Usuario"}</div>
                <div class="friend-email">${friend.email}</div>
              </div>
              <div class="friend-actions">
                <span class="friend-action-btn add">+ Añadir</span>
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      container.innerHTML = `
        <div class="friends-empty">
          <p>No tienes más amigos para añadir a este grupo</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("availableFriends").innerHTML = `
      <p class="error-text">Error al cargar amigos</p>
    `;
  }
}

function hideAddMemberForm() {
  const addMemberForm = document.getElementById("addMemberForm");
  addMemberForm.style.display = "none";
}

async function addMemberToGroup(groupId, userId, userName) {
  try {
    const response = await fetch(`${GROUPS_API_URL}/${groupId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await response.json();

    if (data.success) {
      showSuccess(`${userName} añadido al grupo`, "Miembro añadido", "✅");
      hideAddMemberForm();
      viewGroupDetails(groupId);
    } else {
      showError(data.message || "Error al añadir miembro");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Error de conexión");
  }
}

async function removeGroupMember(groupId, userId, userName) {
  const confirmed = await showConfirm(
    `¿Eliminar a ${userName} del grupo?`,
    "Eliminar miembro",
    "👋"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${GROUPS_API_URL}/${groupId}/members/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      showSuccess("Miembro eliminado del grupo", "Eliminado", "✅");
      viewGroupDetails(groupId);
    } else {
      showError(data.message || "Error al eliminar miembro");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Error de conexión");
  }
}

async function leaveGroup(groupId) {
  const confirmed = await showConfirm(
    "¿Seguro que quieres abandonar este grupo?",
    "Abandonar grupo",
    "🚪"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${GROUPS_API_URL}/${groupId}/members/${currentUser.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      showSuccess("Has abandonado el grupo", "Grupo abandonado", "👋");
      backToGroupsList();
      await loadGroups();
    } else {
      showError(data.message || "Error al abandonar el grupo");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Error de conexión");
  }
}

async function deleteGroup(groupId, groupName) {
  const confirmed = await showConfirm(
    `¿Eliminar el grupo "${groupName}"? Esta acción no se puede deshacer.`,
    "Eliminar grupo",
    "🗑️"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${GROUPS_API_URL}/${groupId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      showSuccess("Grupo eliminado correctamente", "Grupo eliminado", "✅");
      backToGroupsList();
      await loadGroups();
    } else {
      showError(data.message || "Error al eliminar el grupo");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Error de conexión");
  }
}

function backToGroupsList() {
  currentGroupView = null;
  const container = document.getElementById("groupsContainer");
  const detailView = document.getElementById("groupDetailView");
  const createForm = document.getElementById("createGroupForm");

  container.style.display = "block";
  detailView.style.display = "none";
  createForm.style.display = "none";
}

// ===== INICIALIZACIÓN =====

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    initFriendsSystem();
  }, 100);
});
