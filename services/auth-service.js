
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

// ===================================
// REGISTER USER
// ===================================

export const registerUser = async ({
  username,
  fullName,
  email,
  password,
}) => {
  // Check existing email or username
  const existingUser = await query(
    `SELECT id
     FROM users
     WHERE email = $1 OR username = $2`,
    [email, username]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('EMAIL_OR_USERNAME_EXISTS');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Save user
  const result = await query(
    `INSERT INTO users
      (username, full_name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, full_name, email, created_at`,
    [username, fullName, email, hashedPassword]
  );

  const user = result.rows[0];

  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    createdAt: user.created_at,
  };
};

// ===================================
// LOGIN USER
// ===================================

export const loginUser = async ({ email, password }) => {
  const result = await query(
    `SELECT id, username, full_name, email, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isPasswordValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Check JWT secret
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.id,
      sub: user.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      algorithm: 'HS256',
    }
  );

  return {
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
    },
    token,
  };
};
