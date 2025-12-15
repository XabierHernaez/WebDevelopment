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
  shareReminder,
  unshareReminder,
  getSharedWithMe,
} = require("../controllers/reminderController");

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/reminders - Crear recordatorio
router.post("/", createReminder);

// GET /api/reminders - Obtener todos los recordatorios del usuario (propios + compartidos)
router.get("/", getReminders);

// GET /api/reminders/shared - Obtener solo recordatorios compartidos conmigo
router.get("/shared", getSharedWithMe);

// GET /api/reminders/:id - Obtener un recordatorio específico
router.get("/:id", getReminderById);

// PUT /api/reminders/:id - Actualizar recordatorio
router.put("/:id", updateReminder);

// DELETE /api/reminders/:id - Eliminar recordatorio
router.delete("/:id", deleteReminder);

// ===== RUTAS DE RECURRENCIA =====

// PUT /api/reminders/:id/recurring - Activar/actualizar recurrencia
router.put("/:id/recurring", setRecurrence);

// DELETE /api/reminders/:id/recurring - Desactivar recurrencia
router.delete("/:id/recurring", removeRecurrence);

// GET /api/reminders/:id/occurrences - Obtener próximas ocurrencias
router.get("/:id/occurrences", getOccurrences);

// ===== RUTAS DE COMPARTIR =====

// POST /api/reminders/:id/share - Compartir recordatorio con amigos
router.post("/:id/share", shareReminder);

// DELETE /api/reminders/:id/share/:friendId - Dejar de compartir con un amigo
router.delete("/:id/share/:friendId", unshareReminder);

module.exports = router;
