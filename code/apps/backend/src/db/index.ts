import pg from 'pg';
import { config } from '../config/index.js';
import { loadDatasourceConfig, type DatasourceConfig } from '../config/datasource-store.js';

const { Pool } = pg;

function buildPoolConfig(dbConfig?: DatasourceConfig) {
  const cfg = dbConfig || loadDatasourceConfig();
  return {
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    max: config.db.maxPoolSize,
    ssl: cfg.ssl ? { rejectUnauthorized: false } : false,
  };
}

let pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

/** 获取当前连接池 */
export function getPool(): pg.Pool {
  return pool;
}

/** 替换连接池（运行时切换数据源） */
export async function replacePool(dbConfig: DatasourceConfig): Promise<void> {
  const newPool = new Pool(buildPoolConfig(dbConfig));

  // 测试新连接
  const client = await newPool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }

  // 关闭旧连接池
  const oldPool = pool;
  pool = newPool;
  // 异步关闭旧池，不阻塞返回
  oldPool.end().catch((err) => {
    console.error('Error draining old pool:', err);
  });
}

/** 执行查询 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query({ text, values: params });
  return result.rows as T[];
}

/** 执行单行查询 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query({ text, values: params });
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

/** 使用指定配置测试连接 */
export async function testConnectionWith(config: DatasourceConfig): Promise<{ ok: boolean; message: string }> {
  const testPool = new Pool(buildPoolConfig(config));
  try {
    const client = await testPool.connect();
    try {
      await client.query('SELECT 1');
      return { ok: true, message: '连接成功' };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return { ok: false, message: err.message || '连接失败' };
  } finally {
    testPool.end().catch(() => {});
  }
}
