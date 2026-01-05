const pool = require("../config/database");
const geoService = require("../services/geoService");
const {
  getNextOccurrence,
  generateOccurrences,
  isValidPattern,
  shouldRenew,
} = require("../utils/recurrenceHelper");

// CREATE - Crear nuevo recordatorio
const createReminder = async (req, res) => {
  const {
    title,
    description,
    reminder_type,
    datetime,
    address,
    is_recurring,
    recurrence_pattern,
    share_with, // Array de IDs de amigos para compartir
  } = req.body;
  const userId = req.user.userId;

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

    // Si es tipo location, debe tener dirección
    if (
      (reminder_type === "location" || reminder_type === "both") &&
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "Los recordatorios de tipo location requieren una dirección",
      });
    }

    // Validar recurrencia si se proporciona
    if (is_recurring && !isValidPattern(recurrence_pattern)) {
      return res.status(400).json({
        success: false,
        message:
          "Patrón de recurrencia inválido. Usa: daily, weekly, monthly, yearly",
      });
    }

    let locationId = null;
    let coordinates = null;

    // Si tiene ubicación, geocodificar y guardar
    if (reminder_type === "location" || reminder_type === "both") {
      // 1. Geocodificar la dirección
      const geocodeResult = await geoService.geocodeAddress(address);

      if (!geocodeResult.success) {
        return res.status(400).json({
          success: false,
          message: "No se pudo geocodificar la dirección",
          error: geocodeResult.error,
        });
      }

      coordinates = {
        lat: geocodeResult.data.lat,
        lng: geocodeResult.data.lng,
      };

      // 2. Guardar ubicación en MongoDB
      const saveLocationResult = await geoService.saveLocation({
        name: title,
        lat: coordinates.lat,
        lng: coordinates.lng,
        address: address,
        user_id: userId,
      });

      if (!saveLocationResult.success) {
        return res.status(500).json({
          success: false,
          message: "Error al guardar la ubicación",
          error: saveLocationResult.error,
        });
      }

      locationId = saveLocationResult.location_id;
    }

    // Insertar recordatorio en PostgreSQL
    const result = await pool.query(
      `INSERT INTO reminders (user_id, title, description, reminder_type, datetime, location_id, is_recurring, recurrence_pattern, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [
        userId,
        title,
        description || null,
        reminder_type,
        datetime || null,  // ← Añadido ::timestamptz en la query
        locationId,
        is_recurring || false,
        recurrence_pattern || null,
      ]
    );

    const reminder = result.rows[0];

    // ✨ COMPARTIR con amigos si se especifica
    if (share_with && Array.isArray(share_with) && share_with.length > 0) {
      // Verificar que todos son amigos del usuario
      const friendsCheck = await pool.query(
        `SELECT CASE 
           WHEN requester_id = $1 THEN addressee_id 
           ELSE requester_id 
         END as friend_id
         FROM friendships 
         WHERE (requester_id = $1 OR addressee_id = $1) 
           AND status = 'accepted'`,
        [userId]
      );

      const friendIds = friendsCheck.rows.map((r) => r.friend_id);

      // Filtrar solo los que son amigos válidos
      const validShareIds = share_with.filter((id) => friendIds.includes(id));

      // Insertar en shared_reminders
      for (const friendId of validShareIds) {
        await pool.query(
          `INSERT INTO shared_reminders (reminder_id, owner_id, shared_with_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (reminder_id, shared_with_id) DO NOTHING`,
          [reminder.id, userId, friendId]
        );
      }

      reminder.shared_with = validShareIds;
    }

    // Añadir coordenadas a la respuesta si existen
    if (coordinates) {
      reminder.coordinates = coordinates;
      reminder.address = address;
    }

    res.status(201).json({
      success: true,
      message: "Recordatorio creado exitosamente",
      reminder: reminder,
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

// READ - Obtener todos los recordatorios del usuario (propios + compartidos por amigos + compartidos por grupos)
const getReminders = async (req, res) => {
  const userId = req.user.userId;

  try {
    // 1. Obtener recordatorios propios
    const ownReminders = await pool.query(
      `SELECT r.*, 
              NULL as shared_by_id,
              NULL as shared_by_name,
              NULL as shared_by_email,
              NULL as shared_via_group,
              NULL as group_name,
              NULL as group_color,
              TRUE as is_owner
       FROM reminders r
       WHERE r.user_id = $1 
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // 2. Obtener recordatorios compartidos conmigo directamente (por amigos)
    // ✅ FIX: Excluir recordatorios donde el usuario es el creador original
    const sharedByFriends = await pool.query(
      `SELECT r.*, 
              sr.owner_id as shared_by_id,
              u.name as shared_by_name,
              u.email as shared_by_email,
              'friend' as shared_via_group,
              NULL as group_name,
              NULL as group_color,
              FALSE as is_owner,
              sr.can_edit
       FROM reminders r
       JOIN shared_reminders sr ON r.id = sr.reminder_id
       JOIN users u ON sr.owner_id = u.id
       WHERE sr.shared_with_id = $1 AND r.user_id != $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // 3. Obtener recordatorios compartidos conmigo a través de grupos
    // ✅ FIX: Excluir recordatorios donde el usuario es el creador original
    const sharedByGroups = await pool.query(
      `SELECT DISTINCT r.*, 
              gr.shared_by as shared_by_id,
              u.name as shared_by_name,
              u.email as shared_by_email,
              'group' as shared_via_group,
              g.name as group_name,
              g.color as group_color,
              FALSE as is_owner
       FROM reminders r
       JOIN group_reminders gr ON r.id = gr.reminder_id
       JOIN groups g ON gr.group_id = g.id
       JOIN group_members gm ON g.id = gm.group_id
       JOIN users u ON gr.shared_by = u.id
       WHERE gm.user_id = $1 AND gr.shared_by != $1 AND r.user_id != $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // Combinar todos los recordatorios
    const allReminders = [
      ...ownReminders.rows,
      ...sharedByFriends.rows,
      ...sharedByGroups.rows,
    ];

    // ✅ FIX: Lógica de deduplicación simplificada
    // Ahora que las queries ya excluyen los propios, solo necesitamos
    // evitar duplicados entre amigos y grupos
    const uniqueReminders = [];
    const seenIds = new Set();

    for (const reminder of allReminders) {
      if (!seenIds.has(reminder.id)) {
        seenIds.add(reminder.id);
        uniqueReminders.push(reminder);
      }
    }

    // Ordenar por fecha de creación
    uniqueReminders.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    // Para cada recordatorio propio, obtener con quién está compartido
    for (const reminder of uniqueReminders) {
      if (reminder.is_owner) {
        // Compartido con amigos
        const sharedWithFriends = await pool.query(
          `SELECT u.id, u.name, u.email, 'friend' as type
           FROM shared_reminders sr
           JOIN users u ON sr.shared_with_id = u.id
           WHERE sr.reminder_id = $1`,
          [reminder.id]
        );

        // Compartido con grupos
        const sharedWithGroups = await pool.query(
          `SELECT g.id, g.name, g.color, 'group' as type
           FROM group_reminders gr
           JOIN groups g ON gr.group_id = g.id
           WHERE gr.reminder_id = $1`,
          [reminder.id]
        );

        reminder.shared_with_friends = sharedWithFriends.rows;
        reminder.shared_with_groups = sharedWithGroups.rows;
        reminder.is_shared =
          sharedWithFriends.rows.length > 0 || sharedWithGroups.rows.length > 0;
      }
    }

    res.json({
      success: true,
      count: uniqueReminders.length,
      reminders: uniqueReminders,
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
    // Buscar en propios o compartidos
    const result = await pool.query(
      `SELECT r.*, 
              CASE WHEN r.user_id = $2 THEN TRUE ELSE FALSE END as is_owner
       FROM reminders r
       LEFT JOIN shared_reminders sr ON r.id = sr.reminder_id AND sr.shared_with_id = $2
       WHERE r.id = $1 AND (r.user_id = $2 OR sr.shared_with_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    const reminder = result.rows[0];

    // Si es propietario, obtener con quién está compartido
    if (reminder.is_owner) {
      const shared = await pool.query(
        `SELECT u.id, u.name, u.email 
         FROM shared_reminders sr
         JOIN users u ON sr.shared_with_id = u.id
         WHERE sr.reminder_id = $1`,
        [reminder.id]
      );
      reminder.shared_with = shared.rows;
    }

    res.json({
      success: true,
      reminder,
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
  const { title, description, datetime, address, is_completed, is_notified } =
    req.body;
  const userId = req.user.userId;

  try {
    // Verificar que el recordatorio existe y pertenece al usuario (o tiene permiso)
    const checkResult = await pool.query(
      `SELECT r.*, sr.can_edit 
       FROM reminders r
       LEFT JOIN shared_reminders sr ON r.id = sr.reminder_id AND sr.shared_with_id = $2
       WHERE r.id = $1 AND (r.user_id = $2 OR sr.shared_with_id = $2)`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    const existingReminder = checkResult.rows[0];
    const isOwner = existingReminder.user_id === userId;

    // Si no es propietario y no tiene permiso de editar, solo puede marcar completado
    if (!isOwner && !existingReminder.can_edit) {
      if (is_completed === undefined && is_notified === undefined) {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para editar este recordatorio",
        });
      }
    }

    // Si se marca como completado y es recurrente, renovar
    if (is_completed === true && existingReminder.is_recurring) {
      const nextOccurrence = getNextOccurrence(
        existingReminder.datetime,
        existingReminder.recurrence_pattern
      );

      if (
        shouldRenew(
          existingReminder.recurrence_pattern,
          existingReminder.recurrence_end_date
        )
      ) {
        await pool.query(
          `UPDATE reminders 
           SET is_completed = false, 
               datetime = $1, 
               is_notified = false,
               updated_at = NOW()
           WHERE id = $2`,
          [nextOccurrence, id]
        );

        const renewedReminder = await pool.query(
          "SELECT * FROM reminders WHERE id = $1",
          [id]
        );

        return res.json({
          success: true,
          message: "Recordatorio renovado automáticamente",
          reminder: renewedReminder.rows[0],
          renewed: true,
          next_occurrence: nextOccurrence,
        });
      }
    }

    // Actualización normal - solo el propietario puede actualizar todos los campos
    if (isOwner) {
      const result = await pool.query(
        `UPDATE reminders 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             datetime = COALESCE($3, datetime),
             is_completed = COALESCE($4, is_completed),
             is_notified = COALESCE($5, is_notified),
             updated_at = NOW()
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [title, description, datetime, is_completed, is_notified, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Recordatorio no encontrado",
        });
      }

      return res.json({
        success: true,
        message: "Recordatorio actualizado exitosamente",
        reminder: result.rows[0],
      });
    } else {
      // Si es compartido, solo puede marcar completado (no modificar otros campos)
      const sharedUpdate = await pool.query(
        `UPDATE reminders 
         SET is_completed = COALESCE($1, is_completed),
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [is_completed, id]
      );

      if (sharedUpdate.rows.length > 0) {
        return res.json({
          success: true,
          message: "Recordatorio actualizado",
          reminder: sharedUpdate.rows[0],
        });
      }

      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }
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
      "DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado o no tienes permiso",
      });
    }

    // También eliminar de MongoDB si tenía ubicación
    if (result.rows[0].location_id) {
      await geoService.deleteLocation(result.rows[0].location_id);
    }

    res.json({
      success: true,
      message: "Recordatorio eliminado exitosamente",
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

// Activar/actualizar recurrencia
const setRecurrence = async (req, res) => {
  const { id } = req.params;
  const { recurrence_pattern, recurrence_end_date } = req.body;
  const userId = req.user.userId;

  try {
    if (!isValidPattern(recurrence_pattern)) {
      return res.status(400).json({
        success: false,
        message:
          "Patrón de recurrencia inválido. Usa: daily, weekly, monthly, yearly",
      });
    }

    const result = await pool.query(
      `UPDATE reminders 
       SET is_recurring = true, 
           recurrence_pattern = $1, 
           recurrence_end_date = $2,
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [recurrence_pattern, recurrence_end_date || null, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Recurrencia activada exitosamente",
      reminder: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al activar recurrencia:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Desactivar recurrencia
const removeRecurrence = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `UPDATE reminders 
       SET is_recurring = false, 
           recurrence_pattern = NULL, 
           recurrence_end_date = NULL,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
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
      message: "Recurrencia desactivada exitosamente",
      reminder: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al desactivar recurrencia:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener próximas ocurrencias de un recordatorio recurrente
const getOccurrences = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const result = await pool.query(
      "SELECT * FROM reminders WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    const reminder = result.rows[0];

    if (!reminder.is_recurring) {
      return res.status(400).json({
        success: false,
        message: "Este recordatorio no es recurrente",
      });
    }

    // Generar próximas ocurrencias
    const occurrences = generateOccurrences(
      reminder.datetime,
      reminder.recurrence_pattern,
      limit,
      reminder.recurrence_end_date
    );

    res.json({
      success: true,
      reminder: {
        id: reminder.id,
        title: reminder.title,
        recurrence_pattern: reminder.recurrence_pattern,
      },
      occurrences: occurrences,
      count: occurrences.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener ocurrencias:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ✨ Compartir recordatorio con amigos
const shareReminder = async (req, res) => {
  const { id } = req.params;
  const { friend_ids } = req.body; // Array de IDs de amigos
  const userId = req.user.userId;

  try {
    // Verificar que el recordatorio existe y es del usuario
    const reminderCheck = await pool.query(
      "SELECT * FROM reminders WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (reminderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    if (!friend_ids || !Array.isArray(friend_ids) || friend_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debes especificar al menos un amigo",
      });
    }

    // Verificar que todos son amigos del usuario
    const friendsCheck = await pool.query(
      `SELECT CASE 
         WHEN requester_id = $1 THEN addressee_id 
         ELSE requester_id 
       END as friend_id
       FROM friendships 
       WHERE (requester_id = $1 OR addressee_id = $1) 
         AND status = 'accepted'`,
      [userId]
    );

    const friendIds = friendsCheck.rows.map((r) => r.friend_id);
    const validFriendIds = friend_ids.filter((fid) => friendIds.includes(fid));

    if (validFriendIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Ninguno de los usuarios especificados es tu amigo",
      });
    }

    // Insertar en shared_reminders
    const sharedWith = [];
    for (const friendId of validFriendIds) {
      try {
        await pool.query(
          `INSERT INTO shared_reminders (reminder_id, owner_id, shared_with_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (reminder_id, shared_with_id) DO NOTHING`,
          [id, userId, friendId]
        );
        sharedWith.push(friendId);
      } catch (err) {
        console.error(`Error compartiendo con ${friendId}:`, err);
      }
    }

    // Obtener nombres de los amigos con los que se compartió
    const sharedUsers = await pool.query(
      `SELECT id, name, email FROM users WHERE id = ANY($1)`,
      [sharedWith]
    );

    console.log(
      `✅ Recordatorio ${id} compartido con ${sharedWith.length} amigos`
    );

    res.json({
      success: true,
      message: `Recordatorio compartido con ${sharedWith.length} amigo(s)`,
      shared_with: sharedUsers.rows,
    });
  } catch (error) {
    console.error("❌ Error al compartir recordatorio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ✨ Dejar de compartir recordatorio con un amigo
const unshareReminder = async (req, res) => {
  const { id, friendId } = req.params;
  const userId = req.user.userId;

  try {
    // Verificar que el recordatorio es del usuario
    const reminderCheck = await pool.query(
      "SELECT * FROM reminders WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (reminderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    // Eliminar compartición
    const result = await pool.query(
      `DELETE FROM shared_reminders 
       WHERE reminder_id = $1 AND owner_id = $2 AND shared_with_id = $3
       RETURNING *`,
      [id, userId, friendId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Este recordatorio no estaba compartido con ese usuario",
      });
    }

    res.json({
      success: true,
      message: "Se ha dejado de compartir el recordatorio",
    });
  } catch (error) {
    console.error("❌ Error al dejar de compartir:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ✨ Obtener recordatorios compartidos conmigo
const getSharedWithMe = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT r.*, 
              u.id as owner_id,
              u.name as owner_name,
              u.email as owner_email,
              sr.created_at as shared_at
       FROM reminders r
       JOIN shared_reminders sr ON r.id = sr.reminder_id
       JOIN users u ON sr.owner_id = u.id
       WHERE sr.shared_with_id = $1
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      reminders: result.rows,
    });
  } catch (error) {
    console.error("❌ Error al obtener recordatorios compartidos:", error);
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
  setRecurrence,
  removeRecurrence,
  getOccurrences,
  shareReminder,
  unshareReminder,
  getSharedWithMe,
};
