const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authMiddleware");
const {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  setRecurrence,
  removeRecurrence,
  getOccurrences,
} = require("../controllers/reminderController");

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/reminders - Crear recordatorio
router.post("/", createReminder);

// GET /api/reminders - Obtener todos los recordatorios del usuario
router.get("/", getReminders);

// GET /api/reminders/:id - Obtener un recordatorio específico
router.get("/:id", getReminderById);

// PUT /api/reminders/:id - Actualizar recordatorio
router.put("/:id", updateReminder);

// DELETE /api/reminders/:id - Eliminar recordatorio
router.delete("/:id", deleteReminder);

// ✨ NUEVAS RUTAS DE RECURRENCIA

// PUT /api/reminders/:id/recurring - Activar/actualizar recurrencia
router.put("/:id/recurring", setRecurrence);

// DELETE /api/reminders/:id/recurring - Desactivar recurrencia
router.delete("/:id/recurring", removeRecurrence);

// GET /api/reminders/:id/occurrences - Obtener próximas ocurrencias
router.get("/:id/occurrences", getOccurrences);

module.exports = router;
