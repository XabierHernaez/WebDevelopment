const pool = require("../config/database");

// Crear grupo
const createGroup = async (req, res) => {
  const { name, description, color, member_ids } = req.body;
  const ownerId = req.user.userId;

  try {
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "El nombre del grupo es obligatorio",
      });
    }

    // Crear el grupo
    const groupResult = await pool.query(
      `INSERT INTO groups (name, description, owner_id, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), description || null, ownerId, color || "#6366f1"]
    );

    const group = groupResult.rows[0];

    // Añadir al propietario como miembro (admin)
    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [group.id, ownerId]
    );

    // Añadir miembros adicionales si se especifican
    if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
      // Verificar que son amigos del usuario
      const friendsCheck = await pool.query(
        `SELECT CASE 
           WHEN requester_id = $1 THEN addressee_id 
           ELSE requester_id 
         END as friend_id
         FROM friendships 
         WHERE (requester_id = $1 OR addressee_id = $1) 
           AND status = 'accepted'`,
        [ownerId]
      );

      const friendIds = friendsCheck.rows.map((r) => r.friend_id);

      for (const memberId of member_ids) {
        if (friendIds.includes(memberId)) {
          await pool.query(
            `INSERT INTO group_members (group_id, user_id, role)
             VALUES ($1, $2, 'member')
             ON CONFLICT (group_id, user_id) DO NOTHING`,
            [group.id, memberId]
          );
        }
      }
    }

    // Obtener miembros del grupo
    const members = await getGroupMembers(group.id);

    console.log(`✅ Grupo "${name}" creado por usuario ${ownerId}`);

    res.status(201).json({
      success: true,
      message: "Grupo creado exitosamente",
      group: {
        ...group,
        members: members,
      },
    });
  } catch (error) {
    console.error("❌ Error al crear grupo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Obtener grupos del usuario
const getMyGroups = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT g.*, 
              gm.role as my_role,
              u.name as owner_name,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $1
       JOIN users u ON g.owner_id = u.id
       ORDER BY g.created_at DESC`,
      [userId]
    );

    // Para cada grupo, obtener sus miembros
    const groupsWithMembers = await Promise.all(
      result.rows.map(async (group) => {
        const members = await getGroupMembers(group.id);
        return { ...group, members };
      })
    );

    res.json({
      success: true,
      groups: groupsWithMembers,
      count: groupsWithMembers.length,
    });
  } catch (error) {
    console.error("❌ Error al obtener grupos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Obtener un grupo específico
const getGroupById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Verificar que el usuario es miembro del grupo
    const memberCheck = await pool.query(
      `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No tienes acceso a este grupo",
      });
    }

    const result = await pool.query(
      `SELECT g.*, u.name as owner_name
       FROM groups g
       JOIN users u ON g.owner_id = u.id
       WHERE g.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Grupo no encontrado",
      });
    }

    const group = result.rows[0];
    group.members = await getGroupMembers(group.id);
    group.my_role = memberCheck.rows[0].role;

    res.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("❌ Error al obtener grupo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Actualizar grupo
const updateGroup = async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;
  const userId = req.user.userId;

  try {
    // Verificar que el usuario es el propietario
    const group = await pool.query(
      `SELECT * FROM groups WHERE id = $1 AND owner_id = $2`,
      [id, userId]
    );

    if (group.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Solo el propietario puede editar el grupo",
      });
    }

    const result = await pool.query(
      `UPDATE groups 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color)
       WHERE id = $4
       RETURNING *`,
      [name, description, color, id]
    );

    res.json({
      success: true,
      message: "Grupo actualizado",
      group: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al actualizar grupo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Eliminar grupo
const deleteGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `DELETE FROM groups WHERE id = $1 AND owner_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Solo el propietario puede eliminar el grupo",
      });
    }

    res.json({
      success: true,
      message: "Grupo eliminado",
    });
  } catch (error) {
    console.error("❌ Error al eliminar grupo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Añadir miembro al grupo
const addMember = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  const currentUserId = req.user.userId;

  try {
    // Verificar que el usuario actual es admin del grupo
    const adminCheck = await pool.query(
      `SELECT * FROM group_members 
       WHERE group_id = $1 AND user_id = $2 AND role = 'admin'`,
      [id, currentUserId]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Solo los administradores pueden añadir miembros",
      });
    }

    // Verificar que el nuevo miembro es amigo
    const friendCheck = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1))
         AND status = 'accepted'`,
      [currentUserId, user_id]
    );

    if (friendCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Solo puedes añadir amigos al grupo",
      });
    }

    // Añadir miembro
    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [id, user_id]
    );

    const members = await getGroupMembers(id);

    res.json({
      success: true,
      message: "Miembro añadido al grupo",
      members,
    });
  } catch (error) {
    console.error("❌ Error al añadir miembro:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Eliminar miembro del grupo
const removeMember = async (req, res) => {
  const { id, userId: memberToRemove } = req.params;
  const currentUserId = req.user.userId;

  try {
    // Verificar permisos (admin o el propio usuario saliendo)
    const adminCheck = await pool.query(
      `SELECT * FROM group_members 
       WHERE group_id = $1 AND user_id = $2 AND role = 'admin'`,
      [id, currentUserId]
    );

    const isAdmin = adminCheck.rows.length > 0;
    const isSelf = parseInt(memberToRemove) === currentUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar este miembro",
      });
    }

    // No permitir que el propietario se elimine
    const ownerCheck = await pool.query(
      `SELECT * FROM groups WHERE id = $1 AND owner_id = $2`,
      [id, memberToRemove]
    );

    if (ownerCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "El propietario no puede abandonar el grupo. Elimínalo en su lugar.",
      });
    }

    await pool.query(
      `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [id, memberToRemove]
    );

    const members = await getGroupMembers(id);

    res.json({
      success: true,
      message: isSelf ? "Has abandonado el grupo" : "Miembro eliminado",
      members,
    });
  } catch (error) {
    console.error("❌ Error al eliminar miembro:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Compartir recordatorio con grupo
const shareReminderWithGroup = async (req, res) => {
  const { groupId, reminderId } = req.params;
  const userId = req.user.userId;

  try {
    // Verificar que el usuario es dueño del recordatorio
    const reminderCheck = await pool.query(
      `SELECT * FROM reminders WHERE id = $1 AND user_id = $2`,
      [reminderId, userId]
    );

    if (reminderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recordatorio no encontrado",
      });
    }

    // Verificar que el usuario es miembro del grupo
    const memberCheck = await pool.query(
      `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No eres miembro de este grupo",
      });
    }

    // Compartir el recordatorio
    await pool.query(
      `INSERT INTO group_reminders (reminder_id, group_id, shared_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (reminder_id, group_id) DO NOTHING`,
      [reminderId, groupId, userId]
    );

    res.json({
      success: true,
      message: "Recordatorio compartido con el grupo",
    });
  } catch (error) {
    console.error("❌ Error al compartir con grupo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Función auxiliar para obtener miembros de un grupo
async function getGroupMembers(groupId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, gm.role, gm.joined_at
     FROM group_members gm
     JOIN users u ON gm.user_id = u.id
     WHERE gm.group_id = $1
     ORDER BY gm.role DESC, gm.joined_at ASC`,
    [groupId]
  );
  return result.rows;
}

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  shareReminderWithGroup,
};
