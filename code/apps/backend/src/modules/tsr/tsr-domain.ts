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
  await query('CREATE TABLE IF NOT EXISTS "' + s + '".tsr_measure_data (cd_code TEXT, cd_name TEXT, station_code TEXT, energy_type TEXT, measure_code TEXT, second_code TEXT)');
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

/** 迁移：为 tsr_measure_data 补充预计算列并建索引 */
export async function migrateMeasureDataColumns(): Promise<void> {
  const s = getCurrentSchema();
  const pool = getPool();
  try {
    // 新增列（幂等）
    await pool.query(`ALTER TABLE "${s}".tsr_measure_data ADD COLUMN IF NOT EXISTS station_code TEXT`);
    await pool.query(`ALTER TABLE "${s}".tsr_measure_data ADD COLUMN IF NOT EXISTS energy_type TEXT`);
    await pool.query(`ALTER TABLE "${s}".tsr_measure_data ADD COLUMN IF NOT EXISTS measure_code TEXT`);
    await pool.query(`ALTER TABLE "${s}".tsr_measure_data ADD COLUMN IF NOT EXISTS second_code TEXT`);
    await pool.query(`ALTER TABLE "${s}".tsr_measure_data ADD COLUMN IF NOT EXISTS extra_code TEXT`);

    // 回填已有数据的预计算列
    await pool.query(`
      UPDATE "${s}".tsr_measure_data SET
        station_code = LEFT(cd_code, 4),
        energy_type  = SUBSTRING(cd_code, 5, 1),
        measure_code = RIGHT(cd_code, 12),
        second_code  = SUBSTRING(cd_code, 13, 3),
        extra_code   = SUBSTRING(cd_code, 20, 3)
      WHERE station_code IS NULL OR extra_code IS NULL
    `);

    // 索引
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_measure_data_station ON "${s}".tsr_measure_data (station_code)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_measure_data_energy ON "${s}".tsr_measure_data (energy_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_measure_data_measure ON "${s}".tsr_measure_data (measure_code)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_measure_data_second ON "${s}".tsr_measure_data (second_code)`);
    // 复合索引：WHERE 条件中同时用 energy_type + second_code
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_measure_data_energy_second ON "${s}".tsr_measure_data (energy_type, second_code)`);
    // 光伏特有：extra_code 过滤 (substring(cd_code,20,3) in ('003','005'))
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_measure_data_extra ON "${s}".tsr_measure_data (extra_code)`);
    // 光伏查询组合索引 (energy_type + second_code + extra_code)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_measure_data_energy_second_extra ON "${s}".tsr_measure_data (energy_type, second_code, extra_code)`);

    // standard_list 索引
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_standard_list_module ON "${s}".tsr_standard_list (module_source)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_standard_list_energy ON "${s}".tsr_standard_list (energy_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_standard_list_measure ON "${s}".tsr_standard_list (measure_code)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_standard_list_second ON "${s}".tsr_standard_list (second_code)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tsr_standard_list_module_energy ON "${s}".tsr_standard_list (module_source, energy_type)`);

    console.log(`  ✅ 测点表预计算列、索引迁移完成`);
  } catch (err) {
    console.warn(`  ⚠️ 测点表迁移失败（可能已存在）:`, (err as Error).message);
  }
}

/** 检查并初始化 standard_list 数据（从旧 postgres 库同步） */
export async function ensureStandardList(): Promise<void> {
  const s = getCurrentSchema();
  const pool = getPool();

  // 检查旧库数据总量
  let seedPool: pg.Pool | null = null;
  try {
    seedPool = new pg.Pool({
      host: 'localhost', port: 5432, database: 'postgres',
      user: 'liuhaojun', password: 'Stephencurry521', max: 2,
      connectionTimeoutMillis: 5000,
    });
    const sourceCount = await seedPool.query('SELECT COUNT(*) AS cnt FROM "通用".standard_list');
    const total = parseInt(sourceCount.rows[0].cnt, 10);

    // 检查当前表是否已有完整数据
    const exist = await pool.query(`SELECT COUNT(*) AS cnt FROM "${s}".tsr_standard_list`);
    const current = parseInt(exist.rows[0].cnt, 10);
    if (current === total) return;

    // 数据不完整，清空重同步
    if (current > 0) {
      console.log(`  ⚠️ standard_list 数据不完整（当前 ${current}，应有 ${total}），重新同步`);
      await pool.query(`TRUNCATE "${s}".tsr_standard_list`);
    }

    const q = await seedPool.query('SELECT * FROM "通用".standard_list ORDER BY energy_type, module_source, second_code, measure_code');
    // 批量插入，一次 500 条
    const CHUNK = 500;
    for (let i = 0; i < q.rows.length; i += CHUNK) {
      const chunk = q.rows.slice(i, i + CHUNK);
      const placeholders: string[] = [];
      const params: string[] = [];
      let idx = 1;
      for (const row of chunk) {
        placeholders.push(`($${idx},$${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6},$${idx + 7},$${idx + 8},$${idx + 9},$${idx + 10})`);
        params.push(row.energy_type, row.module_source, row.second_code, row.second_name,
          row.measure_code, row.measure_name, row.tb_windows, row.ss_windows,
          row.ss_threshold, row.yx_range, row.zd_duration);
        idx += 11;
      }
      await pool.query(
        `INSERT INTO "${s}".tsr_standard_list (energy_type, module_source, second_code, second_name, measure_code, measure_name, tb_windows, ss_windows, ss_threshold, yx_range, zd_duration) VALUES ${placeholders.join(', ')}`,
        params,
      );
    }
    console.log(`  ✅ 已同步 ${q.rows.length} 条标准规则到 ${s}.tsr_standard_list`);
  } catch (err) {
    console.warn(`  ⚠️ 同步 standard_list 失败:`, (err as Error).message);
  } finally {
    if (seedPool) await seedPool.end().catch(() => {});
  }
}

// ==================== 导入进度跟踪 ====================

interface ImportProgress {
  total: number;
  done: number;
  status: string;
  cancel?: boolean;
}

const progressMap = new Map<string, ImportProgress>();

export function setProgress(key: string, total: number, done: number, status: string, cancel?: boolean) {
  progressMap.set(key, { total, done, status, cancel });
}

export function getProgress(key: string): ImportProgress {
  return progressMap.get(key) || { total: 0, done: 0, status: 'idle' };
}

export function clearProgress(key: string) {
  progressMap.delete(key);
}

export function requestCancel(key: string) {
  const p = progressMap.get(key);
  if (p) {
    p.cancel = true;
  }
}

export function isCancelRequested(key: string): boolean {
  return progressMap.get(key)?.cancel === true;
}

// ==================== 生成进度 ====================

export interface GenerateStep {
  module: string;
  energy: string;
  ruleType: string;
  status: 'running' | 'completed' | 'error';
  rows: number;
}

let currentGenerateStep: GenerateStep | null = null;
const generateStepsDone: GenerateStep[] = [];

export function setGenerateStep(step: GenerateStep | null) {
  if (step && step.status === 'running') {
    currentGenerateStep = step;
  } else if (step && (step.status === 'completed' || step.status === 'error')) {
    // 把之前的 running 步骤移到已完成列表
    if (currentGenerateStep) {
      generateStepsDone.push({ ...currentGenerateStep, status: step.status, rows: step.rows });
    }
    currentGenerateStep = null;
  } else if (step === null) {
    currentGenerateStep = null;
  }
}

export function getGenerateProgress() {
  return {
    current: currentGenerateStep,
    done: [...generateStepsDone],
  };
}

export function clearGenerateProgress() {
  currentGenerateStep = null;
  generateStepsDone.length = 0;
  // 同时清除进度 Map 中的残留，避免前端轮询读到旧数据
  const s = getCurrentSchema();
  progressMap.delete(`${s}:generate`);
}

// ==================== 导入 ====================

export async function batchInsertStations(area: string, stations: { station_code: string; station_name: string }[], onProgress?: (done: number, total: number) => void, progressKey?: string) {
  const s = getCurrentSchema();
  const pool = getPool();
  await query(`TRUNCATE "${s}".tsr_station`);

  const CHUNK = 2000;
  const client = await pool.connect();
  let shouldCommit = true;
  try {
    await client.query('BEGIN');
    for (let i = 0; i < stations.length; i += CHUNK) {
      if (progressKey && isCancelRequested(progressKey)) {
        shouldCommit = false;
        setProgress(progressKey, stations.length, Math.min(i, stations.length), 'cancelled');
        break;
      }

      const chunk = stations.slice(i, i + CHUNK);
      const placeholders: string[] = [];
      const params: string[] = [];
      let idx = 1;
      for (const st of chunk) {
        placeholders.push(`($${idx}, $${idx + 1})`);
        params.push(st.station_code, st.station_name);
        idx += 2;
      }
      await client.query(
        `INSERT INTO "${s}".tsr_station (station_code, station_name) VALUES ${placeholders.join(', ')}`,
        params,
      );
      const done = Math.min(i + CHUNK, stations.length);
      if (onProgress) onProgress(done, stations.length);
    }
    if (shouldCommit) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function batchInsertMeasures(area: string, measures: { cd_code: string; cd_name: string }[], onProgress?: (done: number, total: number) => void, progressKey?: string) {
  const s = getCurrentSchema();
  const pool = getPool();
  await query(`TRUNCATE "${s}".tsr_measure_data`);

  const CHUNK = 2000;
  const client = await pool.connect();
  let shouldCommit = true;
  try {
    await client.query('BEGIN');
    for (let i = 0; i < measures.length; i += CHUNK) {
      if (progressKey && isCancelRequested(progressKey)) {
        shouldCommit = false;
        setProgress(progressKey, measures.length, Math.min(i, measures.length), 'cancelled');
        break;
      }

      const chunk = measures.slice(i, i + CHUNK);
      const placeholders: string[] = [];
      const params: string[] = [];
      let idx = 1;
      for (const m of chunk) {
        const station_code = m.cd_code.substring(0, 4);
        const energy_type = m.cd_code.substring(4, 5);
        const measure_code = m.cd_code.slice(-12);
        const second_code = m.cd_code.substring(12, 15);
        placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`);
        params.push(m.cd_code, m.cd_name, station_code, energy_type, measure_code, second_code);
        idx += 6;
      }
      try {
        await client.query(
          `INSERT INTO "${s}".tsr_measure_data (cd_code, cd_name, station_code, energy_type, measure_code, second_code) VALUES ${placeholders.join(', ')}`,
          params,
        );
      } catch (e) {
        console.error(`  [batchInsertMeasures] 批次 ${i}-${i + chunk.length} 写入失败:`, e);
        throw e;
      }
      const done = Math.min(i + CHUNK, measures.length);
      if (onProgress) onProgress(done, measures.length);
    }
    if (shouldCommit) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
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

export async function executeSqlRaw(sql: string): Promise<{ rowCount: number; rows: any[] }> {
  const pool = getPool();
  const result = await pool.query(sql);
  return { rowCount: result.rowCount ?? 0, rows: result.rows };
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

  const orderBy: Record<string, string[]> = {
    sz: ['standard_name', 'sz_threshold', 'sz_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name'],
    tb: ['standard_name', 'tb_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name'],
    yx: ['standard_name', 'lower_range', 'upper_range', 'begin_time', 'end_time', 'measure_name'],
    zd: ['standard_name', 'zd_duration', 'begin_time', 'end_time', 'measure_name'],
  };

  const cols = fields[type].join(', ');
  const result = await query(`SELECT ${cols} FROM "${s}".${table} ORDER BY ${orderBy[type].join(', ')}`);
  return result;
}

// ==================== 概览 ====================

export async function getOverview(area: string): Promise<Record<string, number>> {
  const s = getCurrentSchema();
  const pool = getPool();

  const result: Record<string, number> = {};

  // 记录数
  const tables: { key: string; table: string }[] = [
    { key: 'station', table: 'tsr_station' },
    { key: 'measure', table: 'tsr_measure_data' },
    { key: 'sz', table: 'tsr_import_list_sz' },
    { key: 'tb', table: 'tsr_import_list_tb' },
    { key: 'yx', table: 'tsr_import_list_yx' },
    { key: 'zd', table: 'tsr_import_list_zd' },
  ];
  for (const t of tables) {
    try {
      const q = await pool.query(`SELECT COUNT(*) AS cnt FROM "${s}".${t.table}`);
      result[t.key] = parseInt(q.rows[0].cnt, 10);
    } catch {
      result[t.key] = 0;
    }
  }

  // 去重规则数（去重后的标准化名称数量）
  const ruleTables: { key: string; table: string }[] = [
    { key: 'sz_rules', table: 'tsr_import_list_sz' },
    { key: 'tb_rules', table: 'tsr_import_list_tb' },
    { key: 'yx_rules', table: 'tsr_import_list_yx' },
    { key: 'zd_rules', table: 'tsr_import_list_zd' },
  ];
  for (const t of ruleTables) {
    try {
      const q = await pool.query(`SELECT COUNT(DISTINCT standard_name) AS cnt FROM "${s}".${t.table}`);
      result[t.key] = parseInt(q.rows[0].cnt, 10);
    } catch {
      result[t.key] = 0;
    }
  }

  return result;
}

/** 清空所有 TSR 数据（导入数据 + 生成规则） */
export async function truncateAllData(): Promise<void> {
  const s = getCurrentSchema();
  const pool = getPool();
  await pool.query(`TRUNCATE "${s}".tsr_station, "${s}".tsr_measure_data`);
  await pool.query(`TRUNCATE "${s}".tsr_import_list_sz, "${s}".tsr_import_list_tb, "${s}".tsr_import_list_yx, "${s}".tsr_import_list_zd`);
  clearGenerateProgress();
}

/** 获取当前租户可用的区域列表（基于当前 schema 返回对应区域名） */
export async function listRegions(): Promise<string[]> {
  return [getCurrentSchema()];
}
