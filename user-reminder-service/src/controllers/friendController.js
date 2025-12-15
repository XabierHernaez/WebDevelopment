const pool = require("../config/database");

// Buscar usuarios por email (para añadir amigos)
const searchUsers = async (req, res) => {
  const { email } = req.query;
  const currentUserId = req.user.userId;

  try {
    if (!email || email.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Introduce al menos 3 caracteres para buscar",
      });
    }

    // Buscar usuarios que coincidan con el email (excepto el usuario actual)
    const result = await pool.query(
      `SELECT id, name, email, created_at 
       FROM users 
       WHERE email ILIKE $1 AND id != $2
       LIMIT 10`,
      [`%${email}%`, currentUserId]
    );

    // Para cada usuario, verificar si ya son amigos o hay solicitud pendiente
    const usersWithStatus = await Promise.all(
      result.rows.map(async (user) => {
        const friendshipCheck = await pool.query(
          `SELECT status FROM friendships 
           WHERE (requester_id = $1 AND addressee_id = $2)
              OR (requester_id = $2 AND addressee_id = $1)`,
          [currentUserId, user.id]
        );

        let friendshipStatus = null;
        if (friendshipCheck.rows.length > 0) {
          friendshipStatus = friendshipCheck.rows[0].status;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          friendship_status: friendshipStatus, // null, 'pending', 'accepted', 'rejected'
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStatus,
    });
  } catch (error) {
    console.error("❌ Error al buscar usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Enviar solicitud de amistad
const sendFriendRequest = async (req, res) => {
  const { addressee_id } = req.body;
  const requesterId = req.user.userId;

  try {
    if (!addressee_id) {
      return res.status(400).json({
        success: false,
        message: "ID del usuario destinatario es obligatorio",
      });
    }

    if (addressee_id === requesterId) {
      return res.status(400).json({
        success: false,
        message: "No puedes enviarte una solicitud a ti mismo",
      });
    }

    // Verificar que el usuario destinatario existe
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      addressee_id,
    ]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Verificar si ya existe una relación
    const existingFriendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [requesterId, addressee_id]
    );

    if (existingFriendship.rows.length > 0) {
      const status = existingFriendship.rows[0].status;
      if (status === "accepted") {
        return res.status(400).json({
          success: false,
          message: "Ya sois amigos",
        });
      } else if (status === "pending") {
        return res.status(400).json({
          success: false,
          message: "Ya existe una solicitud pendiente",
        });
      }
    }

    // Crear solicitud de amistad
    const result = await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [requesterId, addressee_id]
    );

    console.log(
      `✅ Solicitud de amistad enviada: ${requesterId} -> ${addressee_id}`
    );

    res.status(201).json({
      success: true,
      message: "Solicitud de amistad enviada",
      friendship: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al enviar solicitud:", error);

    // Error de constraint único (ya existe la relación)
    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "Ya existe una solicitud con este usuario",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Responder a solicitud de amistad (aceptar/rechazar)
const respondFriendRequest = async (req, res) => {
  const { friendship_id } = req.params;
  const { action } = req.body; // 'accept' o 'reject'
  const currentUserId = req.user.userId;

  try {
    if (!action || !["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Acción debe ser 'accept' o 'reject'",
      });
    }

    // Verificar que la solicitud existe y es para el usuario actual
    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending'`,
      [friendship_id, currentUserId]
    );

    if (friendship.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Solicitud no encontrada o ya procesada",
      });
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";

    // Actualizar estado
    await pool.query(
      `UPDATE friendships 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [newStatus, friendship_id]
    );

    const message =
      action === "accept"
        ? "Solicitud de amistad aceptada"
        : "Solicitud de amistad rechazada";

    console.log(`✅ Solicitud ${friendship_id} ${newStatus}`);

    res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("❌ Error al responder solicitud:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Obtener lista de amigos
const getFriends = async (req, res) => {
  const currentUserId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        f.created_at as friends_since
       FROM friendships f
       JOIN users u ON (
         CASE 
           WHEN f.requester_id = $1 THEN f.addressee_id = u.id
           ELSE f.requester_id = u.id
         END
       )
       WHERE (f.requester_id = $1 OR f.addressee_id = $1)
         AND f.status = 'accepted'
       ORDER BY u.name ASC`,
      [currentUserId]
    );

    res.json({
      success: true,
      friends: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener amigos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Obtener solicitudes pendientes (recibidas)
const getPendingRequests = async (req, res) => {
  const currentUserId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT 
        f.id as friendship_id,
        u.id as user_id,
        u.name,
        u.email,
        f.created_at as requested_at
       FROM friendships f
       JOIN users u ON f.requester_id = u.id
       WHERE f.addressee_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [currentUserId]
    );

    res.json({
      success: true,
      requests: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener solicitudes:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Obtener solicitudes enviadas (para ver estado)
const getSentRequests = async (req, res) => {
  const currentUserId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT 
        f.id as friendship_id,
        u.id as user_id,
        u.name,
        u.email,
        f.status,
        f.created_at as sent_at
       FROM friendships f
       JOIN users u ON f.addressee_id = u.id
       WHERE f.requester_id = $1
       ORDER BY f.created_at DESC`,
      [currentUserId]
    );

    res.json({
      success: true,
      requests: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener solicitudes enviadas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Eliminar amigo
const removeFriend = async (req, res) => {
  const { friend_id } = req.params;
  const currentUserId = req.user.userId;

  try {
    const result = await pool.query(
      `DELETE FROM friendships 
       WHERE ((requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1))
         AND status = 'accepted'
       RETURNING *`,
      [currentUserId, friend_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Amistad no encontrada",
      });
    }

    console.log(`✅ Amistad eliminada entre ${currentUserId} y ${friend_id}`);

    res.json({
      success: true,
      message: "Amigo eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error al eliminar amigo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Cancelar solicitud enviada
const cancelFriendRequest = async (req, res) => {
  const { friendship_id } = req.params;
  const currentUserId = req.user.userId;

  try {
    const result = await pool.query(
      `DELETE FROM friendships 
       WHERE id = $1 AND requester_id = $2 AND status = 'pending'
       RETURNING *`,
      [friendship_id, currentUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Solicitud no encontrada o ya procesada",
      });
    }

    res.json({
      success: true,
      message: "Solicitud cancelada",
    });
  } catch (error) {
    console.error("❌ Error al cancelar solicitud:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

module.exports = {
  searchUsers,
  sendFriendRequest,
  respondFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  removeFriend,
  cancelFriendRequest,
};
