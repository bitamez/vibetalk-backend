
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Validate database configuration
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from your .env file');
}

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle unexpected pool errors
pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

// Test database connection
export const connectDB = async () => {
  let client;

  try {
    client = await pool.connect();

    const result = await client.query('SELECT NOW() AS current_time');

    console.log('PostgreSQL connected successfully');
    console.log('Database time:', result.rows[0].current_time);

    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  } finally {
    client?.release();
  }
};

// Execute SQL queries
export const query = async (text, params = []) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query failed:', error.message);
    throw error;
  }
};

// Close database connection pool
export const closeDB = async () => {
  try {
    await pool.end();
    console.log('PostgreSQL connection pool closed');
  } catch (error) {
    console.error('Error closing PostgreSQL pool:', error.message);
    throw error;
  }
};
