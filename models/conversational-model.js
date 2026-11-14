const { query } = require("../config/db");

// Create a conversation
const createConversation = async (createdBy, type = "private", title = null) => {
  const result = await query(
    `INSERT INTO conversations (type, title, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [type, title, createdBy]
  );

  return result.rows[0];
};

// Find conversation by ID
const findById = async (conversationId) => {
  const result = await query(
    `SELECT * FROM conversations
     WHERE id = $1`,
    [conversationId]
  );

  return result.rows[0] || null;
};

// Get conversations belonging to a user
const findByUserId = async (userId) => {
  const result = await query(
    `SELECT
       c.*,
       cm.role,
       cm.joined_at
     FROM conversations c
     INNER JOIN conversation_members cm
       ON cm.conversation_id = c.id
     WHERE cm.user_id = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  );

  return result.rows;
};

// Add a member to a conversation
const addMember = async (conversationId, userId, role = "member") => {
  const result = await query(
    `INSERT INTO conversation_members
       (conversation_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (conversation_id, user_id) DO NOTHING
     RETURNING *`,
    [conversationId, userId, role]
  );

  return result.rows[0] || null;
};

// Get conversation members
const getMembers = async (conversationId) => {
  const result = await query(
    `SELECT u.id, u.full_name, u.email, u.avatar_url, cm.role
     FROM conversation_members cm
     INNER JOIN users u ON u.id = cm.user_id
     WHERE cm.conversation_id = $1`,
    [conversationId]
  );

  return result.rows;
};

// Remove a member
const removeMember = async (conversationId, userId) => {
  const result = await query(
    `DELETE FROM conversation_members
     WHERE conversation_id = $1 AND user_id = $2
     RETURNING *`,
    [conversationId, userId]
  );

  return result.rows[0] || null;
};

module.exports = {
  createConversation,
  findById,
  findByUserId,
  addMember,
  getMembers,
  removeMember,
};