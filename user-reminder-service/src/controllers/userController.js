const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const nodemailer = require("nodemailer");

// Configurar transporter de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generar código de 6 dígitos
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Registrar nuevo usuario
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios (name, email, password)",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Formato de email inválido",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres",
      });
    }

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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    );

    const newUser = result.rows[0];

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

// Login de usuario (Paso 1: verificar credenciales y enviar código)
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son obligatorios",
      });
    }

    const result = await pool.query(
      "SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Generar código de verificación
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Guardar código en la base de datos
    await pool.query(
      `UPDATE users 
       SET verification_code = $1, verification_code_expires = $2 
       WHERE id = $3`,
      [verificationCode, expiresAt, user.id]
    );

    // Enviar email con el código
    await transporter.sendMail({
      from: `"GeoRemind" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: "🔐 Código de verificación - GeoRemind",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🔐 GeoRemind</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hola ${user.name},</h2>
            <p style="color: #6b7280; font-size: 16px;">Tu código de verificación es:</p>
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 8px;">${verificationCode}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Este código expira en <strong>10 minutos</strong>.</p>
            <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este código, ignora este mensaje.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">© 2025 GeoRemind - Tu asistente de recordatorios inteligente</p>
          </div>
        </div>
      `,
    });

    console.log(`✅ Código de verificación enviado a ${user.email}`);

    res.json({
      success: true,
      message: "Código de verificación enviado a tu email",
      requiresVerification: true,
      email: user.email,
    });
  } catch (error) {
    console.error("❌ Error al hacer login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Verificar código (Paso 2: verificar código y devolver token)
const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email y código son obligatorios",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, verification_code, verification_code_expires, created_at 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const user = result.rows[0];

    if (user.verification_code !== code) {
      return res.status(401).json({
        success: false,
        message: "Código de verificación incorrecto",
      });
    }

    if (new Date() > new Date(user.verification_code_expires)) {
      return res.status(401).json({
        success: false,
        message: "El código ha expirado. Inicia sesión de nuevo.",
      });
    }

    // Limpiar el código usado
    await pool.query(
      `UPDATE users 
       SET verification_code = NULL, verification_code_expires = NULL 
       WHERE id = $1`,
      [user.id]
    );

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    console.log(`✅ Login completo para ${user.email}`);

    res.json({
      success: true,
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("❌ Error al verificar código:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Reenviar código de verificación
const resendCode = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email es obligatorio",
      });
    }

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const user = result.rows[0];

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `UPDATE users 
       SET verification_code = $1, verification_code_expires = $2 
       WHERE id = $3`,
      [verificationCode, expiresAt, user.id]
    );

    await transporter.sendMail({
      from: `"GeoRemind" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: "🔐 Nuevo código de verificación - GeoRemind",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🔐 GeoRemind</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hola ${user.name},</h2>
            <p style="color: #6b7280; font-size: 16px;">Tu nuevo código de verificación es:</p>
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 8px;">${verificationCode}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Este código expira en <strong>10 minutos</strong>.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">© 2025 GeoRemind</p>
          </div>
        </div>
      `,
    });

    console.log(`✅ Código reenviado a ${user.email}`);

    res.json({
      success: true,
      message: "Nuevo código enviado a tu email",
    });
  } catch (error) {
    console.error("❌ Error al reenviar código:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyCode,
  resendCode,
};
