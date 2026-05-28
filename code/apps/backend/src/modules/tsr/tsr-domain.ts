import pg from 'pg';
import { query, queryOne, getSchema } from '../../db/index.js';

/**
 * TSR 模块数据库操作
 * 使用平台 tenant-aware 连接池，数据存储在登录用户的租户 schema 下
 * 表名前缀 tsr_ 避免与现有表冲突
 */

/** 获取当前租户的 schema 名 */
export function getCurrentSchema(): string {
  return getSchema();
}

// ==================== 建表迁移 ====================

/** 初始化 TSR 相关表 */
export async function initTables(): Promise<void> {
  const s = getCurrentSchema();
  await query('CREATE TABLE IF NOT EXISTS "' + s + '".tsr_station (station_code TEXT, station_name TEXT)');
  await query('CREATE TABLE IF NOT EXISTS "' + s + '".tsr_measure_data (cd_code TEXT, cd_name TEXT)');
  await query(`CREATE TABLE IF NOT EXISTS "${s}".tsr_standard_list (
    energy_type TEXT, module_source TEXT, second_code TEXT, second_name TEXT,
    measure_code TEXT, measure_name TEXT, tb_windows TEXT, ss_windows TEXT,
    ss_threshold TEXT, yx_range TEXT, zd_duration TEXT
  )`);
  await query(`CREATE TABLE IF NOT EXISTS "${s}".tsr_import_list_sz (
    module_source TEXT, energy_type TEXT, standard_name TEXT,
    sz_threshold DOUBLE PRECISION, sz_windows DOUBLE PRECISION,
    sliding_step DOUBLE PRECISION, begin_time TEXT, end_time TEXT,
    measure_name TEXT, cd_code TEXT
  )`);
  await query(`CREATE TABLE IF NOT EXISTS "${s}".tsr_import_list_tb (
    module_source TEXT, energy_type TEXT, standard_name TEXT,
    tb_windows DOUBLE PRECISION, sliding_step DOUBLE PRECISION,
    begin_time TEXT, end_time TEXT, measure_name TEXT, cd_code TEXT
  )`);
  await query(`CREATE TABLE IF NOT EXISTS "${s}".tsr_import_list_yx (
    module_source TEXT, energy_type TEXT, standard_name TEXT,
    lower_range DOUBLE PRECISION, upper_range DOUBLE PRECISION,
    begin_time TEXT, end_time TEXT, measure_name TEXT, cd_code TEXT
  )`);
  await query(`CREATE TABLE IF NOT EXISTS "${s}".tsr_import_list_zd (
    module_source TEXT, energy_type TEXT, standard_name TEXT,
    zd_duration DOUBLE PRECISION, begin_time TEXT, end_time TEXT,
    measure_name TEXT, cd_code TEXT
  )`);
}

/** 检查并初始化 standard_list 数据（从旧 postgres 库同步） */
export async function ensureStandardList(): Promise<void> {
  const s = getCurrentSchema();
  const exist = await queryOne(`SELECT COUNT(*) AS cnt FROM "${s}".tsr_standard_list`);
  const count = exist ? parseInt((exist as any).cnt, 10) : 0;
  if (count > 0) return;

  let seedPool: pg.Pool | null = null;
  try {
    seedPool = new pg.Pool({
      host: 'localhost', port: 5432, database: 'postgres',
      user: 'liuhaojun', password: 'Stephencurry521', max: 2,
      connectionTimeoutMillis: 5000,
    });
    const q = await seedPool.query('SELECT * FROM "通用".standard_list');
    for (const row of q.rows) {
      await query(`INSERT INTO "${s}".tsr_standard_list VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
        row.energy_type, row.module_source, row.second_code, row.second_name,
        row.measure_code, row.measure_name, row.tb_windows, row.ss_windows,
        row.ss_threshold, row.yx_range, row.zd_duration,
      ]);
    }
    console.log(`  ✅ 已同步 ${q.rows.length} 条标准规则到 ${s}.tsr_standard_list`);
  } catch (err) {
    console.warn(`  ⚠️ 同步 standard_list 失败:`, (err as Error).message);
  } finally {
    if (seedPool) await seedPool.end().catch(() => {});
  }
}

// ==================== 导入 ====================

export async function batchInsertStations(area: string, stations: { station_code: string; station_name: string }[]) {
  const s = getCurrentSchema();
  await query(`TRUNCATE "${s}".tsr_station`);
  for (const st of stations) {
    await query(`INSERT INTO "${s}".tsr_station (station_code, station_name) VALUES ($1, $2)`, [st.station_code, st.station_name]);
  }
}

export async function batchInsertMeasures(area: string, measures: { cd_code: string; cd_name: string }[]) {
  const s = getCurrentSchema();
  await query(`TRUNCATE "${s}".tsr_measure_data`);
  for (const m of measures) {
    await query(`INSERT INTO "${s}".tsr_measure_data (cd_code, cd_name) VALUES ($1, $2)`, [m.cd_code, m.cd_name]);
  }
}

// ==================== 规则生成 ====================

export async function truncateImportTables(area: string): Promise<void> {
  const s = getCurrentSchema();
  await query(`TRUNCATE "${s}".tsr_import_list_sz, "${s}".tsr_import_list_tb, "${s}".tsr_import_list_yx, "${s}".tsr_import_list_zd`);
}

/** 执行 SQL（替换占位符后执行） */
export async function executeRuleSql(area: string, sql: string): Promise<number> {
  const s = getCurrentSchema();
  // __schema__ → tenant schema, __标准表__ → tsr_standard_list
  const finalSql = sql
    .replace(/__schema__/g, `"${s}"`)
    .replace(/__标准表__/g, `"${s}".tsr_standard_list`);
  const result = await query(finalSql);
  return result.length;
  // 注意: 对于 INSERT，query 返回的是 rows[]，但 INSERT 语句的 rows 为空
  // 需要使用 rowCount，但 db/index.ts 的 query 函数只返回 rows
  // 需要改为更底层的 pool.query
}

// 重写一个直接返回 rowCount 的版本
import { getPool } from '../../db/index.js';

export async function executeSqlRaw(sql: string): Promise<number> {
  const pool = getPool();
  const result = await pool.query(sql);
  return result.rowCount ?? 0;
}

// ==================== 导出 ====================

export async function queryExportList(area: string, type: 'sz' | 'tb' | 'yx' | 'zd') {
  const s = getCurrentSchema();
  const table = `tsr_import_list_${type}`;

  const fields: Record<string, string[]> = {
    sz: ['module_source', 'energy_type', 'standard_name', 'sz_threshold', 'sz_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
    tb: ['module_source', 'energy_type', 'standard_name', 'tb_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
    yx: ['module_source', 'energy_type', 'standard_name', 'lower_range', 'upper_range', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
    zd: ['module_source', 'energy_type', 'standard_name', 'zd_duration', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
  };

  const cols = fields[type].join(', ');
  const result = await query(`SELECT ${cols} FROM "${s}".${table} ORDER BY standard_name, measure_name`);
  return result;
}

// ==================== 概览 ====================

export async function getOverview(area: string): Promise<Record<string, number>> {
  const s = getCurrentSchema();
  const tables: { key: string; table: string }[] = [
    { key: 'station', table: 'tsr_station' },
    { key: 'measure', table: 'tsr_measure_data' },
    { key: 'sz', table: 'tsr_import_list_sz' },
    { key: 'tb', table: 'tsr_import_list_tb' },
    { key: 'yx', table: 'tsr_import_list_yx' },
    { key: 'zd', table: 'tsr_import_list_zd' },
  ];

  const result: Record<string, number> = {};
  const pool = getPool();
  for (const t of tables) {
    try {
      const q = await pool.query(`SELECT COUNT(*) AS cnt FROM "${s}".${t.table}`);
      result[t.key] = parseInt(q.rows[0].cnt, 10);
    } catch {
      result[t.key] = 0;
    }
  }
  return result;
}

/** 获取当前租户可用的区域列表（基于当前 schema 返回对应区域名） */
export async function listRegions(): Promise<string[]> {
  return [getCurrentSchema()];
}
