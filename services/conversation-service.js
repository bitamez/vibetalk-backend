
import { query, pool } from '../config/db.js';

// ===================================
// GET ALL USER CONVERSATIONS
// ===================================

export async function listConversations(userId) {
  const { rows } = await query(
    `SELECT
       c.id,
       c.name,
       c.conversation_type,
       (c.conversation_type = 'group') AS is_group,
       c.created_at,
       c.updated_at,

       -- Conversation members
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'id', u.id,
               'username', u.username,
               'fullName', u.full_name,
               'avatarUrl', u.profile_picture,
               'role', cp2.participant_role
             )
             ORDER BY u.username
           )
           FROM conversation_participants cp2
           JOIN users u ON u.id = cp2.user_id
           WHERE cp2.conversation_id = c.id
         ),
         '[]'::json
       ) AS members,

       -- Latest message
       (
         SELECT json_build_object(
           'id', m.id,
           'body', m.content,
           'senderId', m.sender_id,
           'createdAt', m.created_at
         )
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT 1
       ) AS last_message,

       -- Unread messages
       (
         SELECT COUNT(*)::int
         FROM messages m
         WHERE m.conversation_id = c.id
           AND m.sender_id <> $1
           AND m.created_at > COALESCE(
             cp.last_read_at,
             'epoch'::timestamptz
           )
           AND m.deleted_at IS NULL
       ) AS unread_count

     FROM conversations c
     JOIN conversation_participants cp
       ON cp.conversation_id = c.id
       AND cp.user_id = $1

     ORDER BY COALESCE(
       (
         SELECT MAX(m.created_at)
         FROM messages m
         WHERE m.conversation_id = c.id
       ),
       c.created_at
     ) DESC`,
    [userId]
  );

  return rows;
}

// ===================================
// CREATE DIRECT OR GROUP CONVERSATION
// ===================================

export async function createConversation(
  userId,
  {
    isGroup = false,
    name,
    memberIds = [],
  } = {}
) {
  if (!Array.isArray(memberIds)) {
    const error = new Error('Member IDs must be an array');
    error.status = 400;
    throw error;
  }

  // Include current user and remove duplicates.
  const ids = [...new Set([userId, ...memberIds])];

  // Validate direct conversation members.
  if (!isGroup && ids.length !== 2) {
    const error = new Error(
      'A direct conversation must have exactly two members'
    );
    error.status = 400;
    throw error;
  }

  // Validate group conversation members.
  if (isGroup && ids.length < 2) {
    const error = new Error(
      'A group conversation must have at least two members'
    );
    error.status = 400;
    throw error;
  }

  const groupName = typeof name === 'string' ? name.trim() : '';

  if (isGroup && !groupName) {
    const error = new Error(
      'A group conversation must have a name'
    );
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    // Verify that all requested users exist.
    const usersResult = await client.query(
      `SELECT id
       FROM users
       WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    if (usersResult.rowCount !== ids.length) {
      const error = new Error(
        'One or more users do not exist'
      );
      error.status = 400;
      throw error;
    }

    // Prevent duplicate direct conversations.
    if (!isGroup) {
      const sortedIds = [...ids].sort();
      const lockKey = sortedIds.join(':');

      await client.query(
        `SELECT pg_advisory_xact_lock(
          hashtextextended($1, 0)
        )`,
        [lockKey]
      );

      const existing = await client.query(
        `SELECT c.id
         FROM conversations c
         JOIN conversation_participants cp
           ON cp.conversation_id = c.id
         WHERE c.conversation_type = 'direct'
         GROUP BY c.id
         HAVING COUNT(*) = 2
            AND COUNT(DISTINCT cp.user_id) = 2
            AND COUNT(*) FILTER (
              WHERE cp.user_id = ANY($1::uuid[])
            ) = 2
         LIMIT 1`,
        [sortedIds]
      );

      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        transactionStarted = false;

        return {
          id: existing.rows[0].id,
          existing: true,
        };
      }
    }

    // Create conversation.
    const { rows } = await client.query(
      `INSERT INTO conversations (
         name,
         conversation_type,
         created_by
       )
       VALUES ($1, $2, $3)
       RETURNING id`,
      [
        isGroup ? groupName : null,
        isGroup ? 'group' : 'direct',
        userId,
      ]
    );

    const conversationId = rows[0].id;

    // Add conversation participants.
    for (const id of ids) {
      await client.query(
        `INSERT INTO conversation_participants (
           conversation_id,
           user_id,
           participant_role
         )
         VALUES ($1, $2, $3)`,
        [
          conversationId,
          id,
          id === userId ? 'admin' : 'member',
        ]
      );
    }

    await client.query('COMMIT');
    transactionStarted = false;

    return {
      id: conversationId,
      existing: false,
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Transaction rollback failed:',
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
// CHECK CONVERSATION MEMBERSHIP
// ===================================

export async function isMember(conversationId, userId) {
  const { rowCount } = await query(
    `SELECT 1
     FROM conversation_participants
     WHERE conversation_id = $1
       AND user_id = $2`,
    [conversationId, userId]
  );

  return rowCount > 0;
}
