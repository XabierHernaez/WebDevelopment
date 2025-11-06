const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");
const authenticateToken = require("../middlewares/authMiddleware");

// POST /api/users/register - Registrar nuevo usuario
router.post("/register", registerUser);

// POST /api/users/login - Login de usuario
router.post("/login", loginUser);

// GET /api/users/profile - Obtener perfil (ruta protegida de prueba)
router.get("/profile", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil obtenido correctamente",
    user: req.user,
  });
});

module.exports = router;
