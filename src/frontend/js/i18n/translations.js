// Sistema de internacionalización (i18n)
const translations = {
  es: {

    // Sistema de Amigos y Grupos
    friendsTitle: "Amigos y Grupos",
    myFriends: "Amigos",
    requests: "Solicitudes",
    groups: "Grupos",
    add: "Añadir",
    loading: "Cargando...",
    noFriendsYet: "Aún no tienes amigos",
    noFriendsHint: "Busca usuarios por email para añadirlos",
    noRequests: "Sin solicitudes",
    noRequestsHint: "No tienes solicitudes de amistad pendientes",
    searchByEmail: "Buscar por email...",
    searchHint: "Escribe al menos 3 caracteres para buscar",
    searching: "Buscando...",
    noUsersFound: "No se encontraron usuarios",
    tryAnotherEmail: "Prueba con otro email",
    remove: "Eliminar",
    accept: "Aceptar",
    friends: "Amigos",
    pending: "Pendiente",
    addFriend: "Añadir",
    requestSent: "Solicitud enviada",
    requestSentSuccess: "Solicitud enviada correctamente",
    requestAccepted: "Solicitud aceptada",
    newFriend: "¡Nuevo amigo!",
    requestRejected: "Solicitud rechazada",
    rejected: "Rechazada",
    removeFriend: "¿Eliminar a {name} de tus amigos?",
    removeFriendTitle: "Eliminar amigo",
    friendRemoved: "Amigo eliminado correctamente",
    removed: "Eliminado",
    connectionError: "Error de conexión",

    // Grupos
    noGroupsYet: "Aún no tienes grupos",
    noGroupsHint: "Crea un grupo para compartir recordatorios",
    createGroup: "Crear Grupo",
    member: "miembro",
    members: "miembros",
    admin: "Admin",
    groupCreated: "¡Grupo creado!",
    groupDeleted: "Grupo eliminado",
    groupLeft: "Grupo abandonado",
    memberAdded: "Miembro añadido",
    memberRemoved: "Miembro eliminado",
    backToList: "← Volver",
    groupName: "Nombre del grupo",
    groupNamePlaceholder: "Ej: Familia, Trabajo...",
    groupDescription: "Descripción (opcional)",
    groupDescriptionPlaceholder: "Descripción del grupo...",
    groupColor: "Color del grupo",
    addMembers: "Añadir miembros (opcional)",
    loadingFriends: "Cargando amigos...",
    noFriendsToAdd: "No tienes amigos para añadir. Puedes añadirlos después.",
    errorLoadingFriends: "Error al cargar amigos",
    groupNameRequired: "El nombre del grupo es obligatorio",
    fieldRequired: "Campo requerido",
    createGroupSuccess: "Grupo \"{name}\" creado correctamente",
    createGroupError: "Error al crear el grupo",
    loadingGroup: "Cargando grupo...",
    addMember: "+ Añadir miembro",
    deleteGroup: "Eliminar grupo",
    groupMembers: "Miembros",
    leaveGroup: "🚪 Abandonar grupo",
    creator: "👑 Creador",
    you: "(Tú)",
    addMemberTitle: "Añadir miembro",
    noMoreFriends: "No tienes más amigos para añadir a este grupo",
    addedToGroup: "{name} añadido al grupo",
    removeMemberConfirm: "¿Eliminar a {name} del grupo?",
    removeMemberTitle: "Eliminar miembro",
    leaveGroupConfirm: "¿Seguro que quieres abandonar este grupo?",
    leaveGroupTitle: "Abandonar grupo",
    youLeftGroup: "Has abandonado el grupo",
    deleteGroupConfirm: "¿Eliminar el grupo \"{name}\"? Esta acción no se puede deshacer.",
    deleteGroupTitle: "Eliminar grupo",
    groupDeletedSuccess: "Grupo eliminado correctamente",
    // Index.html - Login
    appName: "🗺️ GeoRemind",
    appSlogan: "Recordatorios inteligentes basados en ubicación",
    login: "Iniciar Sesión",
    email: "📧 Email",
    password: "🔒 Contraseña",
    emailPlaceholder: "tu@email.com",
    passwordPlaceholder: "Mínimo 6 caracteres",
    loginButton: "Iniciar Sesión",
    noAccount: "¿No tienes cuenta?",
    registerHere: "Regístrate aquí",

    // Registro
    createAccount: "Crear Cuenta",
    name: "👤 Nombre",
    namePlaceholder: "Tu nombre completo",
    registerButton: "Registrarse",
    hasAccount: "¿Ya tienes cuenta?",
    loginHere: "Inicia sesión aquí",

    // Verificación 2FA
    verification: "🔐 Verificación",
    verificationDesc: "Hemos enviado un código de 6 dígitos a",
    verificationCode: "Código de verificación",
    verificationPlaceholder: "000000",
    verifyButton: "Verificar código",
    resendCode: "📧 Reenviar código",
    backToLogin: "← Volver al login",

    // Mensajes
    verifyingCredentials: "Verificando credenciales...",
    codeSent: "📧 Código enviado a tu email",
    verifyingCode: "Verificando código...",
    loginSuccess: "✅ ¡Login exitoso! Redirigiendo...",
    resendingCode: "Reenviando código...",
    newCodeSent: "✅ Nuevo código enviado a tu email",
    registerSuccess: "¡Registro exitoso! Ahora puedes iniciar sesión",
    connectionError: "Error de conexión con el servidor",
    codeLength: "El código debe tener 6 dígitos",
    passwordLength: "La contraseña debe tener al menos 6 caracteres",

    // Reminders List
    myReminders: "📝 Mis Recordatorios",
    hello: "Hola",
    viewCalendar: "📅 Ver Calendario",
    newReminder: "+ Nuevo Recordatorio",
    searchPlaceholder: "Buscar recordatorios...",
    loading: "Cargando recordatorios...",
    loadError: "❌ Error al cargar recordatorios",
    noReminders: "No tienes recordatorios aún",
    createFirst:
      '¡Crea tu primer recordatorio haciendo click en "+ Nuevo Recordatorio"!',
    noResults: "No se encontraron resultados",
    noMatchFor: "No hay recordatorios que coincidan con",
    clearSearch: "✨ Limpiar búsqueda",
    logout: "Cerrar Sesión",

    // Fechas
    today: "📅 Hoy",
    yesterday: "📅 Ayer",

    // Recurrencia
    daily: "Diaria",
    weekly: "Semanal",
    monthly: "Mensual",
    yearly: "Anual",

    // Acciones
    deactivateRecurrence: "Desactivar recurrencia",
    makeRecurrent: "Hacer recurrente",
    markPending: "Marcar pendiente",
    complete: "Completar",
    delete: "Eliminar",

    // Dashboard - Crear recordatorio
    createNewReminder: "Crear Nuevo Recordatorio",
    title: "Título",
    titlePlaceholder: "Ej: Comprar leche",
    description: "Descripción",
    descriptionPlaceholder: "Detalles adicionales...",
    reminderType: "Tipo de recordatorio",
    byDateTime: "⏰ Por fecha y hora",
    byLocation: "📍 Por ubicación",
    byBoth: "⏰📍 Ambos",
    dateAndTime: "Fecha y hora",
    makeRecurrentQuestion: "¿Hacer recurrente? 🔄",
    no: "No",
    searchLocation: "Buscar ubicación",
    searchLocationPlaceholder: "Busca una dirección o lugar...",
    search: "🔍 Buscar",
    searching: "🔍 Buscando...",
    selectedLocation: "📍 Ubicación seleccionada:",
    saveReminder: "Guardar Recordatorio",
    dateTimeReminder: "Recordatorio por Fecha y Hora",
    dateTimeReminderDesc:
      "Este recordatorio se activará en la fecha y hora que selecciones. Recibirás una notificación para recordarte tu tarea.",
    tips: "💡 Consejos:",
    tip1: "Sé específico con el título",
    tip2: "Añade detalles en la descripción",
    tip3: "Configura la hora con anticipación",
    tip4: "Marca como completado al terminar",
    searchPlaceOnMap: "🔍 Buscar un lugar en el mapa...",

    // Mensajes de validación
    addressRequired: "Dirección requerida",
    pleaseEnterAddress: "Por favor, introduce una dirección",
    locationNotFound: "Ubicación no encontrada",
    locationNotFoundDesc:
      "No se encontró la ubicación. Intenta con otra dirección.",
    searchError: "Error de búsqueda",
    searchErrorDesc:
      "Hubo un problema al buscar la ubicación. Verifica tu conexión.",
    locationRequired: "Ubicación requerida",
    locationRequiredDesc:
      "Debes seleccionar una ubicación en el mapa o buscar una dirección",
    dateRequired: "Fecha requerida",
    dateRequiredDesc: "Debes seleccionar una fecha y hora",

    //Perfil
    name: "Nombre",
    email: "Email",

    // Mensajes de éxito
    recurringLocationCreated: "Recordatorio recurrente por ubicación creado",
    recurringLocationCreatedDesc:
      "Cada vez que te acerques al lugar, se activará {frequency}",
    recurringCreated: "Recordatorio recurrente creado",
    recurringCreatedDesc: "Este recordatorio se repetirá {frequency}",
    locationReminderCreated: "Recordatorio creado con ubicación",
    locationReminderCreatedDesc:
      "Se te recordará cuando te acerques al lugar indicado",
    reminderCreated: "¡Recordatorio creado!",
    reminderCreatedDesc: "Tu recordatorio ha sido guardado correctamente",
    createError: "Error al crear",
    saveErrorDesc:
      "Hubo un problema al guardar el recordatorio. Intenta de nuevo.",

    // Frecuencias
    frequencyDaily: "diariamente",
    frequencyWeekly: "semanalmente",
    frequencyMonthly: "mensualmente",
    frequencyYearly: "anualmente",

    // Modales
    confirmLogout: "¿Seguro que quieres cerrar sesión?",
    sessionWillClose: "Se cerrará tu sesión actual",
    confirmDelete: "¿Eliminar este recordatorio?",
    actionCantUndo: "Esta acción no se puede deshacer",
    reminderDeleted: "Recordatorio eliminado",
    reminderDeletedDesc: "El recordatorio ha sido eliminado",

    // Modales
    cancel: "Cancelar",
    accept: "Aceptar",
    understood: "Entendido",
    reminderWillStop: "El recordatorio dejará de repetirse automáticamente",
    recurrenceDeactivated: "El recordatorio ya no se repetirá",
    recurrenceDeactivatedTitle: "Recurrencia desactivada",
    activateRecurrence: "Activar recurrencia",
    recurrenceActivatedTitle: "Recurrencia activada",

    // Calendario
    reminderCalendar: "📅 Calendario de Recordatorios",
    back: "← Volver",
    previous: "◀ Anterior",
    next: "Siguiente ▶",
    remindersFor: "Recordatorios del",
    noRemindersThisDay: "No hay recordatorios para este día",
    allDay: "Todo el día",

    // Selector de idioma
    language: "Idioma",
    spanish: "Español",
    english: "English",
  },

  en: {

    // Friends and Groups System
    friendsTitle: "Friends and Groups",
    myFriends: "Friends",
    requests: "Requests",
    groups: "Groups",
    add: "Add",
    loading: "Loading...",
    noFriendsYet: "You don't have friends yet",
    noFriendsHint: "Search users by email to add them",
    noRequests: "No requests",
    noRequestsHint: "You don't have pending friend requests",
    searchByEmail: "Search by email...",
    searchHint: "Type at least 3 characters to search",
    searching: "Searching...",
    noUsersFound: "No users found",
    tryAnotherEmail: "Try another email",
    remove: "Remove",
    accept: "Accept",
    friends: "Friends",
    pending: "Pending",
    addFriend: "Add",
    requestSent: "Request sent",
    requestSentSuccess: "Request sent successfully",
    requestAccepted: "Request accepted",
    newFriend: "New friend!",
    requestRejected: "Request rejected",
    rejected: "Rejected",
    removeFriend: "Remove {name} from your friends?",
    removeFriendTitle: "Remove friend",
    friendRemoved: "Friend removed successfully",
    removed: "Removed",
    connectionError: "Connection error",

    // Groups
    noGroupsYet: "You don't have groups yet",
    noGroupsHint: "Create a group to share reminders",
    createGroup: "Create Group",
    member: "member",
    members: "members",
    admin: "Admin",
    groupCreated: "Group created!",
    groupDeleted: "Group deleted",
    groupLeft: "Group left",
    memberAdded: "Member added",
    memberRemoved: "Member removed",
    backToList: "← Back",
    groupName: "Group name",
    groupNamePlaceholder: "E.g.: Family, Work...",
    groupDescription: "Description (optional)",
    groupDescriptionPlaceholder: "Group description...",
    groupColor: "Group color",
    addMembers: "Add members (optional)",
    loadingFriends: "Loading friends...",
    noFriendsToAdd: "You don't have friends to add. You can add them later.",
    errorLoadingFriends: "Error loading friends",
    groupNameRequired: "Group name is required",
    fieldRequired: "Required field",
    createGroupSuccess: "Group \"{name}\" created successfully",
    createGroupError: "Error creating group",
    loadingGroup: "Loading group...",
    addMember: "+ Add member",
    deleteGroup: "Delete group",
    groupMembers: "Members",
    leaveGroup: "🚪 Leave group",
    creator: "👑 Creator",
    you: "(You)",
    addMemberTitle: "Add member",
    noMoreFriends: "You don't have more friends to add to this group",
    addedToGroup: "{name} added to group",
    removeMemberConfirm: "Remove {name} from the group?",
    removeMemberTitle: "Remove member",
    leaveGroupConfirm: "Are you sure you want to leave this group?",
    leaveGroupTitle: "Leave group",
    youLeftGroup: "You left the group",
    deleteGroupConfirm: "Delete group \"{name}\"? This action cannot be undone.",
    deleteGroupTitle: "Delete group",
    groupDeletedSuccess: "Group deleted successfully",
    // Index.html - Login
    appName: "🗺️ GeoRemind",
    appSlogan: "Smart location-based reminders",
    login: "Log In",
    email: "📧 Email",
    password: "🔒 Password",
    emailPlaceholder: "your@email.com",
    passwordPlaceholder: "Minimum 6 characters",
    loginButton: "Log In",
    noAccount: "Don't have an account?",
    registerHere: "Register here",

    // Modales
    cancel: "Cancel",
    accept: "Accept",
    understood: "Got it",
    reminderWillStop: "The reminder will stop repeating automatically",
    recurrenceDeactivated: "The reminder will no longer repeat",
    recurrenceDeactivatedTitle: "Recurrence deactivated",
    activateRecurrence: "Activate recurrence",
    recurrenceActivatedTitle: "Recurrence activated",

    // Dashboard - Crear recordatorio
    createNewReminder: "Create New Reminder",
    title: "Title",
    titlePlaceholder: "E.g.: Buy milk",
    description: "Description",
    descriptionPlaceholder: "Additional details...",
    reminderType: "Reminder type",
    byDateTime: "⏰ By date and time",
    byLocation: "📍 By location",
    byBoth: "⏰📍 Both",
    dateAndTime: "Date and time",
    makeRecurrentQuestion: "Make recurrent? 🔄",
    no: "No",
    searchLocation: "Search location",
    searchLocationPlaceholder: "Search for an address or place...",
    search: "🔍 Search",
    searching: "🔍 Searching...",
    selectedLocation: "📍 Selected location:",
    saveReminder: "Save Reminder",
    dateTimeReminder: "Date and Time Reminder",
    dateTimeReminderDesc:
      "This reminder will activate at the date and time you select. You will receive a notification to remind you of your task.",
    tips: "💡 Tips:",
    tip1: "Be specific with the title",
    tip2: "Add details in the description",
    tip3: "Set the time in advance",
    tip4: "Mark as completed when done",
    searchPlaceOnMap: "🔍 Search for a place on the map...",

    // Mensajes de validación
    addressRequired: "Address required",
    pleaseEnterAddress: "Please enter an address",
    locationNotFound: "Location not found",
    locationNotFoundDesc: "The location was not found. Try another address.",
    searchError: "Search error",
    searchErrorDesc:
      "There was a problem searching for the location. Check your connection.",
    locationRequired: "Location required",
    locationRequiredDesc:
      "You must select a location on the map or search for an address",
    dateRequired: "Date required",
    dateRequiredDesc: "You must select a date and time",

    // Mensajes de éxito
    recurringLocationCreated: "Recurring location reminder created",
    recurringLocationCreatedDesc:
      "Every time you approach the place, it will activate {frequency}",
    recurringCreated: "Recurring reminder created",
    recurringCreatedDesc: "This reminder will repeat {frequency}",
    locationReminderCreated: "Reminder created with location",
    locationReminderCreatedDesc:
      "You will be reminded when you approach the indicated place",
    reminderCreated: "Reminder created!",
    reminderCreatedDesc: "Your reminder has been saved successfully",
    createError: "Error creating",
    saveErrorDesc: "There was a problem saving the reminder. Try again.",

    // Frecuencias
    frequencyDaily: "daily",
    frequencyWeekly: "weekly",
    frequencyMonthly: "monthly",
    frequencyYearly: "yearly",

    // Registro
    createAccount: "Create Account",
    name: "👤 Name",
    namePlaceholder: "Your full name",
    registerButton: "Register",
    hasAccount: "Already have an account?",
    loginHere: "Log in here",

    // Verificación 2FA
    verification: "🔐 Verification",
    verificationDesc: "We've sent a 6-digit code to",
    verificationCode: "Verification code",
    verificationPlaceholder: "000000",
    verifyButton: "Verify code",
    resendCode: "📧 Resend code",
    backToLogin: "← Back to login",

    // Calendario
    reminderCalendar: "📅 Reminder Calendar",
    back: "← Back",
    previous: "◀ Previous",
    next: "Next ▶",
    remindersFor: "Reminders for",
    noRemindersThisDay: "No reminders for this day",
    allDay: "All day",

    // Mensajes
    verifyingCredentials: "Verifying credentials...",
    codeSent: "📧 Code sent to your email",
    verifyingCode: "Verifying code...",
    loginSuccess: "✅ Login successful! Redirecting...",
    resendingCode: "Resending code...",
    newCodeSent: "✅ New code sent to your email",
    registerSuccess: "Registration successful! You can now log in",
    connectionError: "Server connection error",
    codeLength: "Code must be 6 digits",
    passwordLength: "Password must be at least 6 characters",

    // Reminders List
    myReminders: "📝 My Reminders",
    hello: "Hello",
    viewCalendar: "📅 View Calendar",
    newReminder: "+ New Reminder",
    searchPlaceholder: "Search reminders...",
    loading: "Loading reminders...",
    loadError: "❌ Error loading reminders",
    noReminders: "You don't have any reminders yet",
    createFirst: 'Create your first reminder by clicking "+ New Reminder"!',
    noResults: "No results found",
    noMatchFor: "No reminders match",
    clearSearch: "✨ Clear search",
    logout: "Log Out",

    // Fechas
    today: "📅 Today",
    yesterday: "📅 Yesterday",

    // Recurrencia
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",

    //Perfil
    name: "Name",
    email: "Email",
    
    // Acciones
    deactivateRecurrence: "Deactivate recurrence",
    makeRecurrent: "Make recurrent",
    markPending: "Mark as pending",
    complete: "Complete",
    delete: "Delete",

    // Modales
    confirmLogout: "Are you sure you want to log out?",
    sessionWillClose: "Your current session will be closed",
    confirmDelete: "Delete this reminder?",
    actionCantUndo: "This action cannot be undone",
    reminderDeleted: "Reminder deleted",
    reminderDeletedDesc: "The reminder has been deleted",

    // Selector de idioma
    language: "Language",
    spanish: "Español",
    english: "English",
  },
};

// Idioma actual (por defecto español, o el guardado en localStorage)
let currentLanguage = localStorage.getItem("language") || "es";

// Obtener traducción
function t(key) {
  return translations[currentLanguage][key] || key;
}

// Cambiar idioma
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
  applyTranslations();
}

// Obtener idioma actual
function getLanguage() {
  return currentLanguage;
}

// Aplicar traducciones a elementos con data-i18n
function applyTranslations() {
  // Traducir elementos con data-i18n (contenido de texto)
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  // Traducir placeholders con data-i18n-placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });

  // Traducir titles con data-i18n-title
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    el.title = t(key);
  });

  // Actualizar el selector de idioma si existe
  const langSelector = document.getElementById("languageSelector");
  if (langSelector) {
    langSelector.value = currentLanguage;
  }

  // Disparar evento para que otros scripts puedan reaccionar
  document.dispatchEvent(
    new CustomEvent("languageChanged", {
      detail: { language: currentLanguage },
    })
  );
}

// Crear selector de idioma
function createLanguageSelector() {
  const selector = document.createElement("div");
  selector.className = "language-selector";
  selector.innerHTML = `
    <select id="languageSelector" title="${t("language")}">
      <option value="es" ${
        currentLanguage === "es" ? "selected" : ""
      }>🇪🇸 ES</option>
      <option value="en" ${
        currentLanguage === "en" ? "selected" : ""
      }>🇬🇧 EN</option>
    </select>
  `;

  return selector;
}

// Inicializar selector de idioma en el header
function initLanguageSelector(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    const selector = createLanguageSelector();
    container.appendChild(selector);

    document
      .getElementById("languageSelector")
      .addEventListener("change", (e) => {
        setLanguage(e.target.value);
      });
  }
}
