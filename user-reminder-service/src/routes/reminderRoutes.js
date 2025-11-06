const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authMiddleware");
const {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
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

module.exports = router;
