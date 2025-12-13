const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyCode,
  resendCode,
} = require("../controllers/userController");
const authenticateToken = require("../middlewares/authMiddleware");

// POST /api/auth/register - Registrar nuevo usuario
router.post("/register", registerUser);

// POST /api/auth/login - Login de usuario (envía código por email)
router.post("/login", loginUser);

// POST /api/auth/verify-code - Verificar código 2FA
router.post("/verify-code", verifyCode);

// POST /api/auth/resend-code - Reenviar código
router.post("/resend-code", resendCode);

// GET /api/auth/profile - Obtener perfil (ruta protegida de prueba)
router.get("/profile", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil obtenido correctamente",
    user: req.user,
  });
});

module.exports = router;
