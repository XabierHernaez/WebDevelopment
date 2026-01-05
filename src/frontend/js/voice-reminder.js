// =====================================================
// SISTEMA DE CREACIÓN RÁPIDA POR VOZ - GeoRemind
// =====================================================

// Verificar soporte de Web Speech API
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

// Inicializar reconocimiento de voz
function initVoiceRecognition() {
  if (!SpeechRecognition) {
    console.warn("⚠️ Web Speech API no soportada en este navegador");
    return false;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = getVoiceLanguage();

  recognition.onstart = () => {
    isListening = true;
    updateVoiceModal("listening");
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");

    updateVoiceModal("processing", transcript);

    // Si es resultado final, procesar
    if (event.results[0].isFinal) {
      processVoiceCommand(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.error("Error de reconocimiento:", event.error);
    if (event.error === "no-speech") {
      updateVoiceModal("no-speech");
    } else if (event.error === "not-allowed") {
      updateVoiceModal("not-allowed");
    } else {
      updateVoiceModal("error", event.error);
    }
    isListening = false;
  };

  recognition.onend = () => {
    isListening = false;
  };

  return true;
}

// Obtener idioma para reconocimiento
function getVoiceLanguage() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  return lang === "en" ? "en-US" : "es-ES";
}

// =====================================================
// PARSEO DE LENGUAJE NATURAL
// =====================================================

function parseVoiceCommand(text) {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const now = new Date();

  let result = {
    title: text,
    datetime: null,
    address: null,
    reminder_type: "datetime",
    confidence: 0,
  };

  // Normalizar texto
  const normalizedText = text.toLowerCase().trim();

  // ===== PATRONES DE TIEMPO =====

  // "mañana a las X"
  const tomorrowPattern =
    lang === "en"
      ? /tomorrow\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
      : /mañana\s+a\s+las?\s+(\d{1,2})(?::(\d{2}))?/i;

  // "hoy a las X"
  const todayPattern =
    lang === "en"
      ? /today\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
      : /hoy\s+a\s+las?\s+(\d{1,2})(?::(\d{2}))?/i;

  // "en X horas/minutos"
  const inTimePattern =
    lang === "en"
      ? /in\s+(\d+)\s*(hour|hours|minute|minutes|min|mins)/i
      : /en\s+(\d+)\s*(hora|horas|minuto|minutos|min)/i;

  // "a las X"
  const atTimePattern =
    lang === "en"
      ? /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
      : /a\s+las?\s+(\d{1,2})(?::(\d{2}))?/i;

  // "el lunes/martes/..."
  const dayNames =
    lang === "en"
      ? [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ]
      : [
          "domingo",
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
        ];

  // "pasado mañana"
  const dayAfterTomorrowPattern =
    lang === "en" ? /day\s+after\s+tomorrow/i : /pasado\s+mañana/i;

  // ===== PATRONES DE UBICACIÓN =====
  const locationPatterns =
    lang === "en"
      ? [/when\s+i\s+(get|arrive)\s+(to|at)\s+(.+)/i, /at\s+(.+)/i]
      : [
          /cuando\s+llegue\s+a\s+(.+)/i,
          /al\s+llegar\s+a\s+(.+)/i,
          /en\s+(.+)/i,
        ];

  // ===== PROCESAR PATRONES DE TIEMPO =====

  let match;
  let extractedTime = null;
  let timeText = "";

  // Mañana a las X
  if ((match = normalizedText.match(tomorrowPattern))) {
    const hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const isPM = match[3]?.toLowerCase() === "pm";

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(isPM && hours < 12 ? hours + 12 : hours, minutes, 0, 0);

    extractedTime = tomorrow;
    timeText = match[0];
    result.confidence += 0.3;
  }

  // Hoy a las X
  else if ((match = normalizedText.match(todayPattern))) {
    const hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const isPM = match[3]?.toLowerCase() === "pm";

    const today = new Date(now);
    today.setHours(isPM && hours < 12 ? hours + 12 : hours, minutes, 0, 0);

    // Si la hora ya pasó, asumir mañana
    if (today < now) {
      today.setDate(today.getDate() + 1);
    }

    extractedTime = today;
    timeText = match[0];
    result.confidence += 0.3;
  }

  // En X horas/minutos
  else if ((match = normalizedText.match(inTimePattern))) {
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    const future = new Date(now);
    if (unit.startsWith("hour") || unit.startsWith("hora")) {
      future.setHours(future.getHours() + amount);
    } else {
      future.setMinutes(future.getMinutes() + amount);
    }

    extractedTime = future;
    timeText = match[0];
    result.confidence += 0.3;
  }

  // Pasado mañana
  else if ((match = normalizedText.match(dayAfterTomorrowPattern))) {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(9, 0, 0, 0); // Por defecto a las 9:00

    extractedTime = dayAfter;
    timeText = match[0];
    result.confidence += 0.2;

    // Buscar hora específica
    const timeMatch = normalizedText.match(atTimePattern);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      extractedTime.setHours(hours, minutes, 0, 0);
      timeText += " " + timeMatch[0];
      result.confidence += 0.1;
    }
  }

  // Día de la semana (el lunes, el martes...)
  else {
    for (let i = 0; i < dayNames.length; i++) {
      const dayPattern = new RegExp(`(el\\s+)?${dayNames[i]}`, "i");
      if ((match = normalizedText.match(dayPattern))) {
        const targetDay = i;
        const currentDay = now.getDay();
        let daysUntil = targetDay - currentDay;

        if (daysUntil <= 0) {
          daysUntil += 7; // Próxima semana
        }

        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysUntil);
        targetDate.setHours(9, 0, 0, 0); // Por defecto a las 9:00

        extractedTime = targetDate;
        timeText = match[0];
        result.confidence += 0.2;

        // Buscar hora específica
        const timeMatch = normalizedText.match(atTimePattern);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          extractedTime.setHours(hours, minutes, 0, 0);
          timeText += " " + timeMatch[0];
          result.confidence += 0.1;
        }

        break;
      }
    }
  }

  // Solo "a las X" sin día específico (asumir hoy o mañana)
  if (!extractedTime && (match = normalizedText.match(atTimePattern))) {
    const hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const isPM = match[3]?.toLowerCase() === "pm";

    const target = new Date(now);
    target.setHours(isPM && hours < 12 ? hours + 12 : hours, minutes, 0, 0);

    // Si la hora ya pasó, asumir mañana
    if (target < now) {
      target.setDate(target.getDate() + 1);
    }

    extractedTime = target;
    timeText = match[0];
    result.confidence += 0.2;
  }

  // ===== PROCESAR UBICACIÓN =====

  // Patrones de ubicación conocidos
  const knownLocations =
    lang === "en"
      ? {
          home: "casa",
          work: "trabajo",
          office: "oficina",
          gym: "gimnasio",
          supermarket: "supermercado",
        }
      : {
          casa: "casa",
          trabajo: "trabajo",
          oficina: "oficina",
          gimnasio: "gimnasio",
          supermercado: "supermercado",
          super: "supermercado",
        };

  const locationKeywords =
    lang === "en"
      ? ["when i get to", "when i arrive at", "when i reach", "at the"]
      : ["cuando llegue a", "al llegar a", "cuando esté en", "en el", "en la"];

  for (const keyword of locationKeywords) {
    const idx = normalizedText.indexOf(keyword);
    if (idx !== -1) {
      let locationText = normalizedText.substring(idx + keyword.length).trim();

      // Limpiar el texto de ubicación
      locationText = locationText.replace(/a\s+las?\s+\d+.*/i, "").trim();

      if (locationText) {
        result.address = locationText;
        result.reminder_type = extractedTime ? "both" : "location";
        result.confidence += 0.2;

        // Quitar la parte de ubicación del título
        result.title = normalizedText
          .replace(new RegExp(keyword + ".*", "i"), "")
          .trim();
        break;
      }
    }
  }

  // ===== LIMPIAR TÍTULO =====

  if (timeText && !result.address) {
    // Quitar la parte de tiempo del título
    result.title = text.replace(new RegExp(timeText, "i"), "").trim();
  }

  // Limpiar palabras comunes del inicio
  const prefixPatterns =
    lang === "en"
      ? [
          /^remind\s+me\s+to\s+/i,
          /^remember\s+to\s+/i,
          /^don't\s+forget\s+to\s+/i,
        ]
      : [
          /^recuérdame\s+/i,
          /^recordarme\s+/i,
          /^acordarme\s+de\s+/i,
          /^no\s+olvidar\s+/i,
        ];

  for (const pattern of prefixPatterns) {
    result.title = result.title.replace(pattern, "");
  }

  // Capitalizar primera letra
  if (result.title) {
    result.title = result.title.charAt(0).toUpperCase() + result.title.slice(1);
  }

  // Asignar fecha/hora
  if (extractedTime) {
    // Formatear como ISO string LOCAL (sin convertir a UTC)
    result.datetime = formatLocalDateTime(extractedTime);
    result.confidence += 0.2;
  }

  // Si no hay nada de tiempo ni ubicación, poner recordatorio para dentro de 1 hora por defecto
  if (!result.datetime && !result.address) {
    const defaultTime = new Date(now);
    defaultTime.setHours(defaultTime.getHours() + 1);
    defaultTime.setMinutes(0, 0, 0);
    result.datetime = formatLocalDateTime(defaultTime);
    result.reminder_type = "datetime";
    result.confidence = 0.1; // Baja confianza
  }

  return result;
}

// Formatear fecha/hora en formato ISO pero manteniendo hora local
function formatLocalDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // ✅ Obtener offset de zona horaria
  const offset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, "0");
  const offsetSign = offset >= 0 ? "+" : "-";

  // Formato: "2026-01-05T10:00:00+01:00"
  return `${year}-${month}-${day}T${hours}:${minutes}:00${offsetSign}${offsetHours}:${offsetMinutes}`;
}

// =====================================================
// INTERFAZ DE USUARIO
// =====================================================

// Crear botón flotante
function createVoiceButton() {
  // Verificar si ya existe
  if (document.getElementById("voiceReminderBtn")) return;

  const button = document.createElement("button");
  button.id = "voiceReminderBtn";
  button.className = "voice-fab";
  button.innerHTML = "🎤";
  button.title = typeof t === "function" ? t("voiceReminder") : "Crear con voz";

  button.addEventListener("click", openVoiceModal);

  document.body.appendChild(button);
}

// Abrir modal de voz
function openVoiceModal() {
  // Verificar soporte
  if (!SpeechRecognition) {
    const msg =
      typeof t === "function"
        ? t("voiceNotSupported")
        : "Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.";
    showError(msg, "No soportado");
    return;
  }

  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  const texts = {
    es: {
      title: "🎤 Crear Recordatorio por Voz",
      instruction: "Pulsa el micrófono y di algo como:",
      examples: [
        '"Comprar leche mañana a las 10"',
        '"Llamar al médico el viernes"',
        '"Recoger paquete en 2 horas"',
        '"Comprar pan cuando llegue al super"',
      ],
      startBtn: "🎤 Empezar a escuchar",
      cancelBtn: "Cancelar",
    },
    en: {
      title: "🎤 Create Reminder by Voice",
      instruction: "Press the microphone and say something like:",
      examples: [
        '"Buy milk tomorrow at 10"',
        '"Call the doctor on Friday"',
        '"Pick up package in 2 hours"',
        '"Buy bread when I get to the store"',
      ],
      startBtn: "🎤 Start listening",
      cancelBtn: "Cancel",
    },
  };

  const t_voice = texts[lang] || texts.es;

  const overlay = document.createElement("div");
  overlay.className = "voice-modal-overlay";
  overlay.id = "voiceModalOverlay";
  overlay.innerHTML = `
    <div class="voice-modal">
      <div class="voice-modal-header">
        <h2>${t_voice.title}</h2>
      </div>
      
      <div class="voice-modal-body">
        <div class="voice-status" id="voiceStatus">
          <div class="voice-icon-large">🎤</div>
          <p class="voice-instruction">${t_voice.instruction}</p>
          <div class="voice-examples">
            ${t_voice.examples
              .map((ex) => `<span class="voice-example">${ex}</span>`)
              .join("")}
          </div>
        </div>
        
        <div class="voice-transcript" id="voiceTranscript" style="display: none;">
          <p class="transcript-label">${
            lang === "en" ? "I heard:" : "Escuché:"
          }</p>
          <p class="transcript-text" id="transcriptText"></p>
        </div>
        
        <div class="voice-preview" id="voicePreview" style="display: none;">
          <!-- Se llena dinámicamente -->
        </div>
      </div>
      
      <div class="voice-modal-actions" id="voiceModalActions">
        <button class="voice-btn secondary" id="voiceCancelBtn">${
          t_voice.cancelBtn
        }</button>
        <button class="voice-btn primary" id="voiceStartBtn">${
          t_voice.startBtn
        }</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animación de entrada
  requestAnimationFrame(() => {
    overlay.classList.add("show");
  });

  // Event listeners
  document
    .getElementById("voiceCancelBtn")
    .addEventListener("click", closeVoiceModal);
  document
    .getElementById("voiceStartBtn")
    .addEventListener("click", startListening);

  // Cerrar con click fuera
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeVoiceModal();
    }
  });

  // Cerrar con ESC
  const escHandler = (e) => {
    if (e.key === "Escape") {
      closeVoiceModal();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}

// Cerrar modal
function closeVoiceModal() {
  if (recognition && isListening) {
    recognition.stop();
  }

  const overlay = document.getElementById("voiceModalOverlay");
  if (overlay) {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 300);
  }
}

// Iniciar escucha
function startListening() {
  if (!recognition) {
    if (!initVoiceRecognition()) {
      showError("No se pudo inicializar el reconocimiento de voz");
      return;
    }
  }

  // Actualizar idioma por si cambió
  recognition.lang = getVoiceLanguage();

  try {
    recognition.start();
  } catch (e) {
    console.error("Error al iniciar reconocimiento:", e);
  }
}

// Actualizar estado del modal
function updateVoiceModal(state, data = "") {
  const statusEl = document.getElementById("voiceStatus");
  const transcriptEl = document.getElementById("voiceTranscript");
  const previewEl = document.getElementById("voicePreview");
  const actionsEl = document.getElementById("voiceModalActions");
  const startBtn = document.getElementById("voiceStartBtn");

  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  switch (state) {
    case "listening":
      statusEl.innerHTML = `
        <div class="voice-icon-large listening">🎤</div>
        <p class="voice-instruction">${
          lang === "en" ? "Listening..." : "Escuchando..."
        }</p>
        <div class="voice-waves">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      `;
      transcriptEl.style.display = "none";
      previewEl.style.display = "none";
      startBtn.disabled = true;
      startBtn.textContent =
        lang === "en" ? "🎤 Listening..." : "🎤 Escuchando...";
      break;

    case "processing":
      document.getElementById("transcriptText").textContent = data;
      transcriptEl.style.display = "block";
      statusEl.querySelector(".voice-instruction").textContent =
        lang === "en" ? "Processing..." : "Procesando...";
      break;

    case "no-speech":
      statusEl.innerHTML = `
        <div class="voice-icon-large">🤔</div>
        <p class="voice-instruction">${
          lang === "en"
            ? "I didn't hear anything. Try again?"
            : "No escuché nada. ¿Intentar de nuevo?"
        }</p>
      `;
      startBtn.disabled = false;
      startBtn.textContent =
        lang === "en" ? "🎤 Try again" : "🎤 Intentar de nuevo";
      break;

    case "not-allowed":
      statusEl.innerHTML = `
        <div class="voice-icon-large">🚫</div>
        <p class="voice-instruction">${
          lang === "en"
            ? "Microphone access denied. Please allow access in your browser settings."
            : "Acceso al micrófono denegado. Por favor, permite el acceso en la configuración del navegador."
        }</p>
      `;
      startBtn.disabled = true;
      break;

    case "error":
      statusEl.innerHTML = `
        <div class="voice-icon-large">❌</div>
        <p class="voice-instruction">${
          lang === "en" ? "Error: " : "Error: "
        }${data}</p>
      `;
      startBtn.disabled = false;
      startBtn.textContent =
        lang === "en" ? "🎤 Try again" : "🎤 Intentar de nuevo";
      break;
  }
}

// Procesar comando de voz
function processVoiceCommand(transcript) {
  const parsed = parseVoiceCommand(transcript);
  showVoicePreview(parsed, transcript);
}

// Mostrar preview del recordatorio
function showVoicePreview(parsed, originalText) {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const previewEl = document.getElementById("voicePreview");
  const actionsEl = document.getElementById("voiceModalActions");
  const statusEl = document.getElementById("voiceStatus");

  // Formatear fecha/hora
  let dateTimeText = "";
  if (parsed.datetime) {
    const date = new Date(parsed.datetime);
    const locale = lang === "en" ? "en-US" : "es-ES";
    dateTimeText = date.toLocaleString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Determinar tipo
  let typeIcon = "📅";
  let typeText = lang === "en" ? "Date & time" : "Fecha y hora";
  if (parsed.reminder_type === "location") {
    typeIcon = "📍";
    typeText = lang === "en" ? "Location" : "Ubicación";
  } else if (parsed.reminder_type === "both") {
    typeIcon = "📅📍";
    typeText = lang === "en" ? "Date & location" : "Fecha y ubicación";
  }

  // Confianza
  const confidencePercent = Math.round(parsed.confidence * 100);
  const confidenceClass =
    confidencePercent >= 50
      ? "high"
      : confidencePercent >= 30
      ? "medium"
      : "low";

  statusEl.style.display = "none";

  previewEl.style.display = "block";
  previewEl.innerHTML = `
    <div class="preview-card">
      <h3>${lang === "en" ? "📝 Preview" : "📝 Vista previa"}</h3>
      
      <div class="preview-field">
        <span class="preview-label">${
          lang === "en" ? "Title:" : "Título:"
        }</span>
        <input type="text" class="preview-input" id="previewTitle" value="${escapeHtml(
          parsed.title
        )}">
      </div>
      
      <div class="preview-field">
        <span class="preview-label">${lang === "en" ? "Type:" : "Tipo:"}</span>
        <span class="preview-value">${typeIcon} ${typeText}</span>
      </div>
      
      ${
        parsed.datetime
          ? `
        <div class="preview-field">
          <span class="preview-label">${
            lang === "en" ? "When:" : "Cuándo:"
          }</span>
          <span class="preview-value">📅 ${dateTimeText}</span>
        </div>
      `
          : ""
      }
      
      ${
        parsed.address
          ? `
        <div class="preview-field">
          <span class="preview-label">${
            lang === "en" ? "Where:" : "Dónde:"
          }</span>
          <input type="text" class="preview-input" id="previewAddress" value="${escapeHtml(
            parsed.address
          )}">
        </div>
      `
          : ""
      }
      
      <div class="preview-confidence ${confidenceClass}">
        ${lang === "en" ? "Confidence:" : "Confianza:"} ${confidencePercent}%
      </div>
    </div>
  `;

  // Actualizar botones
  actionsEl.innerHTML = `
    <button class="voice-btn secondary" id="voiceRetryBtn">
      ${lang === "en" ? "🔄 Try again" : "🔄 Intentar de nuevo"}
    </button>
    <button class="voice-btn primary" id="voiceConfirmBtn">
      ${lang === "en" ? "✅ Create reminder" : "✅ Crear recordatorio"}
    </button>
  `;

  // Event listeners
  document.getElementById("voiceRetryBtn").addEventListener("click", () => {
    resetVoiceModal();
    startListening();
  });

  document.getElementById("voiceConfirmBtn").addEventListener("click", () => {
    // Obtener valores editados
    const title = document.getElementById("previewTitle").value;
    const address =
      document.getElementById("previewAddress")?.value || parsed.address;

    createReminderFromVoice({
      ...parsed,
      title: title,
      address: address,
    });
  });
}

// Resetear modal para nuevo intento
function resetVoiceModal() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const statusEl = document.getElementById("voiceStatus");
  const transcriptEl = document.getElementById("voiceTranscript");
  const previewEl = document.getElementById("voicePreview");
  const actionsEl = document.getElementById("voiceModalActions");

  statusEl.style.display = "block";
  statusEl.innerHTML = `
    <div class="voice-icon-large">🎤</div>
    <p class="voice-instruction">${
      lang === "en"
        ? "Press the microphone and speak"
        : "Pulsa el micrófono y habla"
    }</p>
  `;

  transcriptEl.style.display = "none";
  previewEl.style.display = "none";

  actionsEl.innerHTML = `
    <button class="voice-btn secondary" id="voiceCancelBtn">${
      lang === "en" ? "Cancel" : "Cancelar"
    }</button>
    <button class="voice-btn primary" id="voiceStartBtn">${
      lang === "en" ? "🎤 Start listening" : "🎤 Empezar a escuchar"
    }</button>
  `;

  document
    .getElementById("voiceCancelBtn")
    .addEventListener("click", closeVoiceModal);
  document
    .getElementById("voiceStartBtn")
    .addEventListener("click", startListening);
}

// Crear recordatorio desde voz
async function createReminderFromVoice(parsed) {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  // Mostrar loading
  const previewEl = document.getElementById("voicePreview");
  previewEl.innerHTML = `
    <div class="voice-loading">
      <div class="voice-spinner"></div>
      <p>${
        lang === "en" ? "Creating reminder..." : "Creando recordatorio..."
      }</p>
    </div>
  `;

  try {
    const response = await fetch(`${API_URL}/reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: parsed.title,
        description: null,
        reminder_type: parsed.reminder_type,
        datetime: parsed.datetime,
        address: parsed.address,
        is_recurring: false,
      }),
    });

    const data = await response.json();

    if (data.success) {
      closeVoiceModal();
      await showSuccess(
        lang === "en"
          ? "Reminder created successfully!"
          : "¡Recordatorio creado con éxito!",
        parsed.title,
        "✅"
      );
      // Recargar lista
      if (typeof loadReminders === "function") {
        loadReminders();
      }
    } else {
      throw new Error(data.message || "Error al crear recordatorio");
    }
  } catch (error) {
    console.error("Error:", error);
    previewEl.innerHTML = `
      <div class="voice-error">
        <div class="voice-icon-large">❌</div>
        <p>${
          lang === "en"
            ? "Error creating reminder"
            : "Error al crear recordatorio"
        }</p>
        <p class="error-detail">${error.message}</p>
      </div>
    `;
  }
}

// Utilidad para escapar HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// =====================================================
// INICIALIZACIÓN
// =====================================================

// Inicializar cuando cargue la página
document.addEventListener("DOMContentLoaded", () => {
  createVoiceButton();
  initVoiceRecognition();
});
