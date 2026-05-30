import pg from 'pg';
import { config } from '../config/index.js';
import { loadDatasourceConfig, type DatasourceConfig } from '../config/datasource-store.js';
import { TENANTS } from '../config/tenants.js';
import { getCurrentTenantId, getCurrentSchema, tenantStorage } from './tenant-context.js';

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

// ====== 默认连接池（集团侧 / 后备） ======
let pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// ====== 多租户连接池注册表 ======
const tenantPools = new Map<string, { pool: pg.Pool; schema: string }>();

/** 初始化所有租户的连接池 */
export async function initTenantPools(): Promise<void> {
  for (const tenant of TENANTS) {
    try {
      const tp = new Pool(buildPoolConfig(tenant.datasource));
      const client = await tp.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }
      tenantPools.set(tenant.id, { pool: tp, schema: tenant.datasource.schema });
      console.log(`  ✅ 租户 "${tenant.displayName}" (${tenant.id}) 连接池初始化成功`);
    } catch (err) {
      console.warn(`  ⚠️ 租户 "${tenant.displayName}" (${tenant.id}) 连接失败:`, (err as Error).message);
    }
  }
}

/** 获取当前租户的连接池 */
function getCurrentPool(): pg.Pool {
  const tenantId = getCurrentTenantId();
  // admin（集团侧）始终走默认连接池，默认连接池由系统配置页面控制
  if (tenantId && tenantId !== 'admin' && tenantPools.has(tenantId)) {
    return tenantPools.get(tenantId)!.pool;
  }
  return pool;
}

/** 获取当前请求的 schema（与 tenant-context 保持一致） */
export function getSchema(): string {
  return getCurrentSchema();
}

// ====== 原有 API 保持兼容，内部变为租户感知 ======

/** 获取当前连接池 */
export function getPool(): pg.Pool {
  return getCurrentPool();
}

/** 替换默认连接池（运行时切换数据源，仅影响集团侧） */
export async function replacePool(dbConfig: DatasourceConfig): Promise<void> {
  const newPool = new Pool(buildPoolConfig(dbConfig));

  const client = await newPool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }

  const oldPool = pool;
  pool = newPool;
  oldPool.end().catch((err) => {
    console.error('Error draining old pool:', err);
  });
}

/** 执行查询（自动感知当前租户） */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getCurrentPool();
  const result = await p.query({ text, values: params });
  return result.rows as T[];
}

/** 执行单行查询（自动感知当前租户） */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const p = getCurrentPool();
  const result = await p.query({ text, values: params });
  return (result.rows[0] as T) || null;
}

/** 测试数据库连接 */
export async function testConnection(): Promise<boolean> {
  try {
    await getCurrentPool().query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/** 在指定租户下执行查询（用于跨租户操作，如用户管理始终走集团侧） */
export async function queryAsTenant<T = any>(tenantId: string, text: string, params?: any[]): Promise<T[]> {
  const entry = tenantPools.get(tenantId);
  if (!entry) {
    // 降级到默认 pool
    return query(text, params);
  }
  const result = await entry.pool.query({ text, values: params });
  return result.rows as T[];
}

/** 获取租户连接池的专用客户端（用于事务等需要保持同一连接的场景） */
export async function getTenantClient(tenantId: string) {
  const entry = tenantPools.get(tenantId);
  if (!entry) {
    return pool.connect();
  }
  return entry.pool.connect();
}

/** 在指定租户下执行单行查询 */
export async function queryOneAsTenant<T = any>(tenantId: string, text: string, params?: any[]): Promise<T | null> {
  const entry = tenantPools.get(tenantId);
  if (!entry) {
    return queryOne(text, params);
  }
  const result = await entry.pool.query({ text, values: params });
  return (result.rows[0] as T) || null;
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
