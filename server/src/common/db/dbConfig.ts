import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT),
  // ssl: { rejectUnauthorized: false },
  // idleTimeoutMillis: 30000,
});

export const query = async (text: string, params?: any[], userId?: number) => {
  const client = await pool.connect();
  try {
    if (userId) {
      await client.query('SET app.user_id = $1', [userId]);
    }
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
};

export const checkDbConnection = async (): Promise<boolean> => {
  try {
    const rows = await query('SELECT 1 AS ok');
    if (rows?.[0]?.ok === 1) {
      console.log('Postgre OK');
      return true;
    }
  } catch (e) {
    console.error('Postgre connection error', e);
  }
  return false;
};
