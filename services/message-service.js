
import { query, pool } from '../config/db.js';
import { isMember } from './conversation-service.js';

// ===================================
// GET MESSAGES
// ===================================

export async function getMessages(
  conversationId,
  userId,
  before,
  beforeId
) {
  // Check conversation membership.
  if (!(await isMember(conversationId, userId))) {
    const error = new Error(
      'You are not a member of this conversation'
    );
    error.status = 403;
    throw error;
  }

  // Cursor pagination requires both values.
  if ((before && !beforeId) || (!before && beforeId)) {
    const error = new Error(
      'Both before and beforeId are required for pagination'
    );
    error.status = 400;
    throw error;
  }

  const { rows } = await query(
    `SELECT
       m.id,
       m.conversation_id,
       m.sender_id,
       m.content AS body,
       m.created_at,
       json_build_object(
         'id', u.id,
         'username', u.username,
         'fullName', u.full_name,
         'avatarUrl', u.profile_picture
       ) AS sender
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = $1
       AND m.deleted_at IS NULL
       AND (
         $2::timestamptz IS NULL
         OR (m.created_at, m.id) < ($2::timestamptz, $3::uuid)
       )
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT 50`,
    [conversationId, before || null, beforeId || null]
  );

  // Return messages in chronological order.
  return rows.reverse();
}

// ===================================
// SEND MESSAGE
// ===================================

export async function sendMessage(
  userId,
  { conversationId, body } = {}
) {
  if (
    !conversationId ||
    typeof body !== 'string' ||
    !body.trim()
  ) {
    const error = new Error(
      'Conversation ID and message body are required'
    );
    error.status = 400;
    throw error;
  }

  const content = body.trim();

  if (content.length > 5000) {
    const error = new Error(
      'Message cannot exceed 5000 characters'
    );
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    // Verify conversation membership.
    const membership = await client.query(
      `SELECT 1
       FROM conversation_participants
       WHERE conversation_id = $1
         AND user_id = $2
       FOR KEY SHARE`,
      [conversationId, userId]
    );

    if (membership.rowCount === 0) {
      const error = new Error(
        'You are not a member of this conversation'
      );
      error.status = 403;
      throw error;
    }

    // Insert message using the actual database column: content.
    const result = await client.query(
      `WITH inserted AS (
         INSERT INTO messages (
           conversation_id,
           sender_id,
           content
         )
         VALUES ($1, $2, $3)
         RETURNING
           id,
           conversation_id,
           sender_id,
           content,
           created_at
       )
       SELECT
         i.id,
         i.conversation_id,
         i.sender_id,
         i.content AS body,
         i.created_at,
         json_build_object(
           'id', u.id,
           'username', u.username,
           'fullName', u.full_name,
           'avatarUrl', u.profile_picture
         ) AS sender
       FROM inserted i
       JOIN users u ON u.id = i.sender_id`,
      [conversationId, userId, content]
    );

    // Update conversation activity timestamps.
    await client.query(
      `UPDATE conversations
       SET
         updated_at = NOW(),
         last_message_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return result.rows[0];
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Message transaction rollback failed:',
          rollbackError
        );
      }
    }

    throw error;
  } finally {
    client.release();
  }
}

// ===================================
// MARK CONVERSATION AS READ
// ===================================

export async function markRead(conversationId, userId) {
  const { rows } = await query(
    `UPDATE conversation_participants
     SET last_read_at = NOW()
     WHERE conversation_id = $1
       AND user_id = $2
     RETURNING last_read_at`,
    [conversationId, userId]
  );

  if (rows.length === 0) {
    const error = new Error(
      'You are not a member of this conversation'
    );
    error.status = 403;
    throw error;
  }

  return {
    conversationId,
    userId,
    readAt: rows[0].last_read_at,
  };
}


// ===================================
// DELETE MESSAGE (SOFT DELETE)
// ===================================

export async function deleteMessage(messageId, userId) {
  const { rows } = await query(
    `UPDATE messages
     SET deleted_at = NOW()
     WHERE id = $1
       AND sender_id = $2
       AND deleted_at IS NULL
     RETURNING id, conversation_id, deleted_at`,
    [messageId, userId]
  );

  if (rows.length === 0) {
    const error = new Error(
      'Message not found or you are not authorized to delete it'
    );

    error.status = 404;
    throw error;
  }

  return {
    id: rows[0].id,
    conversationId: rows[0].conversation_id,
    deletedAt: rows[0].deleted_at,
  };
}
