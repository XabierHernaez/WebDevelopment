// Configuración
const API_URL = "http://localhost:5000/api";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user"));

// Verificar autenticación
if (!token || !currentUser) {
  window.location.href = "index.html";
}

// Variables globales
let currentDate = new Date();
let reminders = [];
let expandedReminders = [];

// Elementos del DOM
const backBtn = document.getElementById("backBtn");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const currentMonthEl = document.getElementById("currentMonth");
const calendarGrid = document.getElementById("calendarGrid");
const dayModal = document.getElementById("dayModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalDate = document.getElementById("modalDate");
const modalReminders = document.getElementById("modalReminders");
const weekdaysContainer = document.getElementById("weekdaysContainer");

// Inicializar traducciones
document.addEventListener("DOMContentLoaded", () => {
  initLanguageSelector("langContainer");
  applyTranslations();
  updateWeekdays();
});

// Actualizar cuando cambie el idioma
document.addEventListener("languageChanged", () => {
  updateWeekdays();
  renderCalendar();
});

// Actualizar días de la semana según idioma
function updateWeekdays() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  const weekdays = {
    es: ["L", "M", "X", "J", "V", "S", "D"],
    en: ["M", "T", "W", "T", "F", "S", "S"],
  };

  const days = weekdays[lang] || weekdays.es;
  const weekdayEls = weekdaysContainer.querySelectorAll(".weekday");

  weekdayEls.forEach((el, index) => {
    el.textContent = days[index];
  });
}

// Volver a la lista
backBtn.addEventListener("click", () => {
  window.location.href = "reminders-list.html";
});

// Navegación de meses
prevMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// Cerrar modal
closeModalBtn.addEventListener("click", () => {
  dayModal.style.display = "none";
});

dayModal.addEventListener("click", (e) => {
  if (e.target === dayModal) {
    dayModal.style.display = "none";
  }
});

// Generar ocurrencias para recordatorios de ubicación sin fecha
function generateLocationOccurrences(reminder, startDate, endDate) {
  const occurrences = [];
  let currentDateLoop = new Date(startDate);
  currentDateLoop.setHours(9, 0, 0, 0);

  while (currentDateLoop <= endDate) {
    occurrences.push({
      ...reminder,
      datetime: new Date(currentDateLoop).toISOString(),
      isRecurringOccurrence: true,
      isLocationOnly: true,
    });

    switch (reminder.recurrence_pattern) {
      case "daily":
        currentDateLoop.setDate(currentDateLoop.getDate() + 1);
        break;
      case "weekly":
        currentDateLoop.setDate(currentDateLoop.getDate() + 7);
        break;
      case "monthly":
        currentDateLoop.setMonth(currentDateLoop.getMonth() + 1);
        break;
      case "yearly":
        currentDateLoop.setFullYear(currentDateLoop.getFullYear() + 1);
        break;
      default:
        return [];
    }
  }

  return occurrences;
}

// Generar ocurrencias futuras de un recordatorio recurrente
function generateOccurrences(reminder, startDate, endDate) {
  if (!reminder.is_recurring || !reminder.recurrence_pattern) {
    return [reminder];
  }

  if (!reminder.datetime && reminder.reminder_type === "location") {
    return generateLocationOccurrences(reminder, startDate, endDate);
  }

  const occurrences = [];
  let currentOccurrence = new Date(reminder.datetime);

  const maxDate = new Date(endDate);
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  while (currentOccurrence <= maxDate) {
    if (currentOccurrence >= startDate && currentOccurrence <= endDate) {
      occurrences.push({
        ...reminder,
        datetime: new Date(currentOccurrence).toISOString(),
        isRecurringOccurrence: true,
      });
    }

    switch (reminder.recurrence_pattern) {
      case "daily":
        currentOccurrence.setDate(currentOccurrence.getDate() + 1);
        break;
      case "weekly":
        currentOccurrence.setDate(currentOccurrence.getDate() + 7);
        break;
      case "monthly":
        currentOccurrence.setMonth(currentOccurrence.getMonth() + 1);
        break;
      case "yearly":
        currentOccurrence.setFullYear(currentOccurrence.getFullYear() + 1);
        break;
      default:
        return [reminder];
    }
  }

  return occurrences;
}

// Expandir todos los recordatorios recurrentes
function expandRecurringReminders() {
  expandedReminders = [];

  const startDate = new Date(currentDate);
  startDate.setMonth(startDate.getMonth() - 3);
  startDate.setDate(1);

  const endDate = new Date(currentDate);
  endDate.setMonth(endDate.getMonth() + 4);
  endDate.setDate(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  reminders.forEach((reminder) => {
    if (
      reminder.reminder_type === "location" &&
      reminder.is_recurring &&
      !reminder.datetime
    ) {
      const occurrences = generateLocationOccurrences(reminder, today, endDate);
      expandedReminders.push(...occurrences);
    } else if (reminder.datetime) {
      const occurrences = generateOccurrences(reminder, startDate, endDate);
      expandedReminders.push(...occurrences);
    }
  });

  console.log(
    `📅 Expandidos ${expandedReminders.length} recordatorios (${reminders.length} originales)`
  );
}

// Cargar recordatorios
async function loadReminders() {
  try {
    const response = await fetch(`${API_URL}/reminders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      reminders = data.reminders;
      expandRecurringReminders();
      renderCalendar();
    }
  } catch (error) {
    console.error("Error al cargar recordatorios:", error);
  }
}

// Obtener nombres de meses según idioma
function getMonthNames() {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";

  const months = {
    es: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  };

  return months[lang] || months.es;
}

// Renderizar calendario
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  expandRecurringReminders();

  const monthNames = getMonthNames();
  currentMonthEl.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDay = firstDay.getDay() - 1;
  if (startDay === -1) startDay = 6;

  const prevMonthDays = new Date(year, month, 0).getDate();

  calendarGrid.innerHTML = "";

  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const dayEl = createDayElement(day, true);
    calendarGrid.appendChild(dayEl);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dayReminders = getRemindersForDate(date);
    const isToday = isSameDay(date, new Date());

    const dayEl = createDayElement(day, false, isToday, dayReminders, date);
    calendarGrid.appendChild(dayEl);
  }

  const remainingDays = 42 - calendarGrid.children.length;
  for (let day = 1; day <= remainingDays; day++) {
    const dayEl = createDayElement(day, true);
    calendarGrid.appendChild(dayEl);
  }
}

// Crear elemento de día
function createDayElement(
  day,
  isOtherMonth,
  isToday = false,
  dayReminders = [],
  date = null
) {
  const dayEl = document.createElement("div");
  dayEl.className = "calendar-day";

  if (isOtherMonth) {
    dayEl.classList.add("other-month");
  }

  if (isToday) {
    dayEl.classList.add("today");
  }

  if (dayReminders.length > 0) {
    dayEl.classList.add("has-reminders");
  }

  const dayNumber = document.createElement("div");
  dayNumber.className = "day-number";
  dayNumber.textContent = day;
  dayEl.appendChild(dayNumber);

  if (dayReminders.length > 0) {
    const dotsContainer = document.createElement("div");
    dotsContainer.className = "reminder-dots";

    dayReminders.slice(0, 3).forEach((reminder) => {
      const dot = document.createElement("div");

      let dotClass = "reminder-dot";
      if (reminder.reminder_type === "location") {
        dotClass += " location";
      } else if (reminder.reminder_type === "both") {
        dotClass += " both";
      }

      if (reminder.is_recurring) {
        dotClass += " recurring";
      }

      dot.className = dotClass;
      dotsContainer.appendChild(dot);
    });

    dayEl.appendChild(dotsContainer);
  }

  if (!isOtherMonth && dayReminders.length > 0) {
    dayEl.addEventListener("click", () => {
      showDayReminders(date, dayReminders);
    });
  }

  return dayEl;
}

// Obtener recordatorios para una fecha
function getRemindersForDate(date) {
  return expandedReminders.filter((reminder) => {
    if (!reminder.datetime) return false;
    const reminderDate = new Date(reminder.datetime);
    return isSameDay(date, reminderDate);
  });
}

// Comparar si dos fechas son el mismo día
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Mostrar recordatorios del día
function showDayReminders(date, dayReminders) {
  const lang = typeof getLanguage === "function" ? getLanguage() : "es";
  const locale = lang === "en" ? "en-US" : "es-ES";

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const remindersForText =
    typeof t === "function" ? t("remindersFor") : "Recordatorios del";
  modalDate.textContent = `${remindersForText} ${date.toLocaleDateString(
    locale,
    options
  )}`;

  const noRemindersText =
    typeof t === "function"
      ? t("noRemindersThisDay")
      : "No hay recordatorios para este día";
  const allDayText = typeof t === "function" ? t("allDay") : "Todo el día";

  if (dayReminders.length === 0) {
    modalReminders.innerHTML = `<div class="modal-empty">${noRemindersText}</div>`;
  } else {
    modalReminders.innerHTML = dayReminders
      .map((reminder) => {
        const time = reminder.isLocationOnly
          ? allDayText
          : new Date(reminder.datetime).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            });

        const typeClass =
          reminder.reminder_type === "location"
            ? "location"
            : reminder.reminder_type === "both"
            ? "both"
            : "";

        const recurrenceBadge = reminder.is_recurring
          ? `<span class="recurring-badge-modal">${getRecurrenceIcon(
              reminder.recurrence_pattern
            )} ${getRecurrenceLabel(reminder.recurrence_pattern)}</span>`
          : "";

        return `
          <div class="modal-reminder-item ${typeClass}">
            <div class="modal-reminder-title">
              ${reminder.title}
              ${recurrenceBadge}
            </div>
            ${
              reminder.description
                ? `<p style="color: #6b7280; margin: 6px 0; font-size: 0.9rem;">${reminder.description}</p>`
                : ""
            }
            <div class="modal-reminder-time">⏰ ${time}</div>
            ${
              reminder.address
                ? `<div class="modal-reminder-time" style="margin-top: 4px;">📍 ${reminder.address}</div>`
                : ""
            }
          </div>
        `;
      })
      .join("");
  }

  dayModal.style.display = "flex";
}

// Funciones auxiliares para recurrencia
function getRecurrenceLabel(pattern) {
  if (typeof t === "function") {
    return t(pattern);
  }
  const labels = {
    daily: "Diaria",
    weekly: "Semanal",
    monthly: "Mensual",
    yearly: "Anual",
  };
  return labels[pattern] || pattern;
}

function getRecurrenceIcon(pattern) {
  const icons = {
    daily: "📅",
    weekly: "📆",
    monthly: "🗓️",
    yearly: "📖",
  };
  return icons[pattern] || "🔄";
}

// Inicializar
loadReminders();
