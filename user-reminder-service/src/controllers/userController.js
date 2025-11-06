const bcrypt = require("bcrypt");
const pool = require("../config/database");

// Registrar nuevo usuario
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Validar que todos los campos estén presentes
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios (name, email, password)",
      });
    }

    // 2. Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Formato de email inválido",
      });
    }

    // 3. Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres",
      });
    }

    // 4. Verificar si el email ya existe
    const checkEmail = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "El email ya está registrado",
      });
    }

    // 5. Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 6. Insertar usuario en la base de datos
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    );

    const newUser = result.rows[0];

    // 7. Responder con éxito (sin enviar la contraseña)
    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
};
