const pool = require("../config/database");

// CREATE - Crear nuevo recordatorio
const createReminder = async (req, res) => {
  const { title, description, reminder_type, datetime, location_id } = req.body;
  const userId = req.user.userId; // Del token JWT

  try {
    // Validaciones
    if (!title || !reminder_type) {
      return res.status(400).json({
        success: false,
        message: "El título y tipo de recordatorio son obligatorios",
      });
    }

    // Validar tipo de recordatorio
    const validTypes = ["datetime", "location", "both"];
    if (!validTypes.includes(reminder_type)) {
      return res.status(400).json({
        success: false,
        message:
          "Tipo de recordatorio inválido. Usa: datetime, location o both",
      });
    }

    // Si es tipo datetime, debe tener fecha
    if (
      (reminder_type === "datetime" || reminder_type === "both") &&
      !datetime
    ) {
      return res.status(400).json({
        success: false,
        message: "Los recordatorios de tipo datetime requieren una fecha",
      });
    }

    // Insertar recordatorio
    const result = await pool.query(
      `INSERT INTO reminders (user_id, title, description, reminder_type, datetime, location_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        userId,
        title,
        description || null,
        reminder_type,
        datetime || null,
        location_id || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Recordatorio creado exitosamente",
      reminder: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al crear recordatorio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// READ - Obtener todos los recordatorios del usuario
const getReminders = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM reminders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      reminders: result.rows,
    });
  } catch (error) {
    console.error("❌ Error al obtener recordatorios:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// READ ONE - Obtener un recordatorio específico
const getReminderById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM reminders 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    res.json({
      success: true,
      reminder: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al obtener recordatorio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// UPDATE - Actualizar recordatorio
const updateReminder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const {
    title,
    description,
    reminder_type,
    datetime,
    location_id,
    is_completed,
  } = req.body;

  try {
    // Verificar que el recordatorio existe y pertenece al usuario
    const checkResult = await pool.query(
      "SELECT id FROM reminders WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    // Construir query dinámicamente solo con campos proporcionados
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (reminder_type !== undefined) {
      updates.push(`reminder_type = $${paramCount++}`);
      values.push(reminder_type);
    }
    if (datetime !== undefined) {
      updates.push(`datetime = $${paramCount++}`);
      values.push(datetime);
    }
    if (location_id !== undefined) {
      updates.push(`location_id = $${paramCount++}`);
      values.push(location_id);
    }
    if (is_completed !== undefined) {
      updates.push(`is_completed = $${paramCount++}`);
      values.push(is_completed);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Solo updated_at
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos para actualizar",
      });
    }

    values.push(id, userId);

    const result = await pool.query(
      `UPDATE reminders 
       SET ${updates.join(", ")}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: "Recordatorio actualizado exitosamente",
      reminder: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al actualizar recordatorio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// DELETE - Eliminar recordatorio
const deleteReminder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `DELETE FROM reminders 
       WHERE id = $1 AND user_id = $2 
       RETURNING id, title`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Recordatorio eliminado exitosamente",
      deleted: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al eliminar recordatorio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

module.exports = {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
};
