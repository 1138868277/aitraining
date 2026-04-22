import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: config.db.maxPoolSize,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

/** 执行查询 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query({ text, params });
  return result.rows as T[];
}

/** 执行单行查询 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query({ text, params });
  return (result.rows[0] as T) || null;
}

/** 测试数据库连接 */
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
