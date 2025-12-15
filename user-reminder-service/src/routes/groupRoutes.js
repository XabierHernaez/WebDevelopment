const express = require("express");
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  shareReminderWithGroup,
} = require("../controllers/groupController");
const authenticateToken = require("../middlewares/authMiddleware");

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/groups - Crear grupo
router.post("/", createGroup);

// GET /api/groups - Obtener mis grupos
router.get("/", getMyGroups);

// GET /api/groups/:id - Obtener un grupo
router.get("/:id", getGroupById);

// PUT /api/groups/:id - Actualizar grupo
router.put("/:id", updateGroup);

// DELETE /api/groups/:id - Eliminar grupo
router.delete("/:id", deleteGroup);

// POST /api/groups/:id/members - Añadir miembro
router.post("/:id/members", addMember);

// DELETE /api/groups/:id/members/:userId - Eliminar miembro
router.delete("/:id/members/:userId", removeMember);

// POST /api/groups/:groupId/reminders/:reminderId - Compartir recordatorio con grupo
router.post("/:groupId/reminders/:reminderId", shareReminderWithGroup);

module.exports = router;
