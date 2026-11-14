const { query } = require("../config/db");

// Create a new message
const createMessage = async ({
  conversationId,
  senderId,
  content,
  type = "text",
}) => {
  const result = await query(
    `INSERT INTO messages
      (conversation_id, sender_id, content, type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [conversationId, senderId, content, type]
  );

  return result.rows[0];
};

// Find message by ID
const findById = async (messageId) => {
  const result = await query(
    `SELECT *
     FROM messages
     WHERE id = $1`,
    [messageId]
  );

  return result.rows[0] || null;
};

// Get messages in a conversation
const findByConversationId = async (
  conversationId,
  limit = 50,
  offset = 0
) => {
  const result = await query(
    `SELECT
       m.*,
       u.full_name AS sender_name,
       u.avatar_url AS sender_avatar
     FROM messages m
     INNER JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );

  return result.rows;
};

// Update a message
const updateMessage = async (messageId, senderId, content) => {
  const result = await query(
    `UPDATE messages
     SET content = $3
     WHERE id = $1 AND sender_id = $2
     RETURNING *`,
    [messageId, senderId, content]
  );

  return result.rows[0] || null;
};

// Delete a message
const deleteMessage = async (messageId, senderId) => {
  const result = await query(
    `DELETE FROM messages
     WHERE id = $1 AND sender_id = $2
     RETURNING *`,
    [messageId, senderId]
  );

  return result.rows[0] || null;
};

// Get latest message in a conversation
const findLatestByConversationId = async (conversationId) => {
  const result = await query(
    `SELECT *
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [conversationId]
  );

  return result.rows[0] || null;
};

// Export functions
module.exports = {
  createMessage,
  findById,
  findByConversationId,
  updateMessage,
  deleteMessage,
  findLatestByConversationId,
};