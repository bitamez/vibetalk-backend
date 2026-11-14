import { query } from "../config/db.js";

export async function createUser(user) {
  const { username, fullName, email, passwordHash } = user;

  const { rows } = await query(
    `INSERT INTO users
      (username, full_name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, full_name, email`,
    [username, fullName, email, passwordHash]
  );

  return rows[0];
}

export async function findUserByEmail(email) {
  const { rows } = await query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  return rows[0];
}

export async function findUserById(id) {
  const { rows } = await query(
    `SELECT id, username, full_name, email,
            avatar_url, bio
     FROM users
     WHERE id = $1`,
    [id]
  );

  return rows[0];
}