// Configuración
const API_URL = "http://localhost:3001/api";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user"));

// Verificar autenticación
if (!token || !currentUser) {
  window.location.href = "index.html";
}

// Variables globales
let currentDate = new Date();
let reminders = [];

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
      reminders = data.reminders.filter((r) => r.datetime); // Solo los que tienen fecha
      renderCalendar();
    }
  } catch (error) {
    console.error("Error al cargar recordatorios:", error);
  }
}

// Renderizar calendario
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Actualizar título
  const monthNames = [
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
  ];
  currentMonthEl.textContent = `${monthNames[month]} ${year}`;

  // Primer día del mes
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Ajustar primer día (lunes = 0)
  let startDay = firstDay.getDay() - 1;
  if (startDay === -1) startDay = 6;

  // Días del mes anterior
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Limpiar grid
  calendarGrid.innerHTML = "";

  // Días del mes anterior
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const dayEl = createDayElement(day, true);
    calendarGrid.appendChild(dayEl);
  }

  // Días del mes actual
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dayReminders = getRemindersForDate(date);
    const isToday = isSameDay(date, new Date());

    const dayEl = createDayElement(day, false, isToday, dayReminders, date);
    calendarGrid.appendChild(dayEl);
  }

  // Días del siguiente mes
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

  // Número del día
  const dayNumber = document.createElement("div");
  dayNumber.className = "day-number";
  dayNumber.textContent = day;
  dayEl.appendChild(dayNumber);

  // Dots de recordatorios
  if (dayReminders.length > 0) {
    const dotsContainer = document.createElement("div");
    dotsContainer.className = "reminder-dots";

    dayReminders.slice(0, 3).forEach((reminder) => {
      const dot = document.createElement("div");
      dot.className = `reminder-dot ${
        reminder.reminder_type === "location"
          ? "location"
          : reminder.reminder_type === "both"
          ? "both"
          : ""
      }`;
      dotsContainer.appendChild(dot);
    });

    dayEl.appendChild(dotsContainer);
  }

  // Click para ver recordatorios
  if (!isOtherMonth && dayReminders.length > 0) {
    dayEl.addEventListener("click", () => {
      showDayReminders(date, dayReminders);
    });
  }

  return dayEl;
}

// Obtener recordatorios para una fecha
function getRemindersForDate(date) {
  return reminders.filter((reminder) => {
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
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  modalDate.textContent = `Recordatorios del ${date.toLocaleDateString(
    "es-ES",
    options
  )}`;

  if (dayReminders.length === 0) {
    modalReminders.innerHTML =
      '<div class="modal-empty">No hay recordatorios para este día</div>';
  } else {
    modalReminders.innerHTML = dayReminders
      .map((reminder) => {
        const time = new Date(reminder.datetime).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const typeClass =
          reminder.reminder_type === "location"
            ? "location"
            : reminder.reminder_type === "both"
            ? "both"
            : "";

        return `
                <div class="modal-reminder-item ${typeClass}">
                    <div class="modal-reminder-title">${reminder.title}</div>
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

// Inicializar
loadReminders();
