
import { query } from '../config/db.js';

// Convert database fields to API-friendly camelCase
const formatUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    avatarUrl: user.profile_picture,
    bio: user.bio,
    createdAt: user.created_at,
  };
};

// ===================================
// GET CURRENT USER PROFILE
// ===================================

export async function getMe(id) {
  const { rows } = await query(
    `SELECT
       id,
       username,
       full_name,
       email,
       profile_picture,
       bio,
       created_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return formatUser(rows[0]);
}

// ===================================
// UPDATE CURRENT USER PROFILE
// ===================================

export async function updateMe(id, data) {
  const fields = {
    username: data.username,
    full_name: data.fullName,
    bio: data.bio,
    profile_picture: data.avatarUrl,
  };

  const sets = [];
  const values = [];

  for (const [column, value] of Object.entries(fields)) {
    if (value !== undefined) {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    }
  }

  if (sets.length === 0) {
    return getMe(id);
  }

  values.push(id);

  const { rows } = await query(
    `UPDATE users
     SET ${sets.join(', ')},
         updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING
       id,
       username,
       full_name,
       email,
       profile_picture,
       bio,
       created_at`,
    values
  );

  return formatUser(rows[0]);
}

// ===================================
// SEARCH USERS
// ===================================

export async function searchUsers(userId, term = '') {
  const searchTerm = String(term).trim().slice(0, 100);

  const { rows } = await query(
    `SELECT
       id,
       username,
       full_name,
       profile_picture,
       bio
     FROM users
     WHERE id <> $1
       AND (
         username ILIKE $2
         OR full_name ILIKE $2
       )
     ORDER BY username ASC
     LIMIT 20`,
    [userId, `%${searchTerm}%`]
  );

  return rows.map((user) => ({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    avatarUrl: user.profile_picture,
    bio: user.bio,
  }));
}
