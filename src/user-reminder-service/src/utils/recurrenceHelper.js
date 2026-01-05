// Utilidades para manejo de recurrencia de recordatorios

/**
 * Calcula la próxima fecha de ocurrencia según el patrón de recurrencia
 * @param {Date|string} currentDate - Fecha actual del recordatorio
 * @param {string} pattern - Patrón: 'daily', 'weekly', 'monthly', 'yearly'
 * @returns {Date} - Próxima fecha de ocurrencia
 */
function getNextOccurrence(currentDate, pattern) {
  const date = new Date(currentDate);

  switch (pattern) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;

    case "weekly":
      date.setDate(date.getDate() + 7);
      break;

    case "monthly":
      // Mantener el mismo día del mes
      date.setMonth(date.getMonth() + 1);
      break;

    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;

    default:
      throw new Error(`Patrón de recurrencia inválido: ${pattern}`);
  }

  return date;
}

/**
 * Genera múltiples ocurrencias futuras
 * @param {Date|string} startDate - Fecha inicial
 * @param {string} pattern - Patrón de recurrencia
 * @param {number} count - Cantidad de ocurrencias a generar
 * @param {Date|null} endDate - Fecha límite opcional
 * @returns {Date[]} - Array de fechas futuras
 */
function generateOccurrences(startDate, pattern, count = 10, endDate = null) {
  const occurrences = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    currentDate = getNextOccurrence(currentDate, pattern);

    // Si hay fecha límite y la superamos, parar
    if (endDate && currentDate > new Date(endDate)) {
      break;
    }

    occurrences.push(new Date(currentDate));
  }

  return occurrences;
}

/**
 * Valida si un patrón de recurrencia es válido
 * @param {string} pattern - Patrón a validar
 * @returns {boolean}
 */
function isValidPattern(pattern) {
  const validPatterns = ["daily", "weekly", "monthly", "yearly"];
  return validPatterns.includes(pattern);
}

/**
 * Obtiene el texto legible del patrón
 * @param {string} pattern - Patrón de recurrencia
 * @returns {string} - Texto en español
 */
function getPatternLabel(pattern) {
  const labels = {
    daily: "Diaria",
    weekly: "Semanal",
    monthly: "Mensual",
    yearly: "Anual",
  };
  return labels[pattern] || pattern;
}

/**
 * Verifica si un recordatorio recurrente debe renovarse
 * @param {Date|string} datetime - Fecha del recordatorio
 * @param {boolean} isCompleted - Si está completado
 * @returns {boolean}
 */
function shouldRenew(datetime, isCompleted) {
  const reminderDate = new Date(datetime);
  const now = new Date();

  // Renovar si ya pasó la fecha Y está completado
  return reminderDate < now && isCompleted;
}

module.exports = {
  getNextOccurrence,
  generateOccurrences,
  isValidPattern,
  getPatternLabel,
  shouldRenew,
};
