const express = require("express");
const router = express.Router();
const {
  searchUsers,
  sendFriendRequest,
  respondFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  removeFriend,
  cancelFriendRequest,
} = require("../controllers/friendController");
const authenticateToken = require("../middlewares/authMiddleware");

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/friends/search?email=xxx - Buscar usuarios por email
router.get("/search", searchUsers);

// GET /api/friends - Obtener lista de amigos
router.get("/", getFriends);

// GET /api/friends/requests/pending - Solicitudes recibidas pendientes
router.get("/requests/pending", getPendingRequests);

// GET /api/friends/requests/sent - Solicitudes enviadas
router.get("/requests/sent", getSentRequests);

// POST /api/friends/request - Enviar solicitud de amistad
router.post("/request", sendFriendRequest);

// PUT /api/friends/request/:friendship_id - Responder solicitud (accept/reject)
router.put("/request/:friendship_id", respondFriendRequest);

// DELETE /api/friends/request/:friendship_id - Cancelar solicitud enviada
router.delete("/request/:friendship_id", cancelFriendRequest);

// DELETE /api/friends/:friend_id - Eliminar amigo
router.delete("/:friend_id", removeFriend);

module.exports = router;
