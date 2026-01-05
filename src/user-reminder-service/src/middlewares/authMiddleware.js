const jwt = require("jsonwebtoken");

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  // 1. Obtener token del header Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token no proporcionado",
    });
  }

  // 2. Verificar token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    // 3. Guardar información del usuario en la request
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
