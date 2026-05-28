import pg from 'pg';

const { Pool } = pg;

/** 连接 postgres 数据库（Python 脚本使用的那个库） */
let pool: pg.Pool | null = null;

export function getTsrPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'liuhaojun',
      password: 'Stephencurry521',
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });
    pool.on('error', (err) => console.error('TSR pool error:', err));
  }
  return pool;
}

export async function closeTsrPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/** 构建模式名：区域名 → 云南区域 */
export function schemaName(area: string): string {
  return `${area}区域`;
}

/** 测试连接 */
export async function testConnection(area: string): Promise<boolean> {
  try {
    const p = getTsrPool();
    await p.query(`SELECT 1 FROM "${schemaName(area)}".dim_station LIMIT 1`);
    return true;
  } catch {
    return false;
  }
}

/** 获取现有区域列表 */
export async function listRegions(): Promise<string[]> {
  const p = getTsrPool();
  const sql = `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '%区域' ORDER BY schema_name`;
  const result = await p.query(sql);
  return result.rows.map(r => r.schema_name.replace(/区域$/, ''));
}

/** 清空指定区域的导入表 */
export async function truncateImportTables(area: string): Promise<void> {
  const p = getTsrPool();
  const schema = schemaName(area);
  await p.query(`
    TRUNCATE "${schema}".import_list_sz,
             "${schema}".import_list_tb,
             "${schema}".import_list_yx,
             "${schema}".import_list_zd
  `);
}

/** 查询测点数据 */
export async function queryMeasureData(area: string) {
  const p = getTsrPool();
  const schema = schemaName(area);
  const result = await p.query(`SELECT cd_code, cd_name FROM "${schema}".measure_data`);
  return result.rows;
}

/** 查询场站数据 */
export async function queryStationData(area: string) {
  const p = getTsrPool();
  const schema = schemaName(area);
  const result = await p.query(`SELECT station_code, station_name FROM "${schema}".dim_station`);
  return result.rows;
}

/** 查询标准规则列表 */
export async function queryStandardList() {
  const p = getTsrPool();
  const result = await p.query(`SELECT * FROM "通用".standard_list`);
  return result.rows;
}

/** 批量插入场站数据 */
export async function batchInsertStations(area: string, stations: { station_code: string; station_name: string }[]) {
  const p = getTsrPool();
  const schema = schemaName(area);
  // 先清空
  await p.query(`TRUNCATE "${schema}".dim_station`);
  // 批量插入
  for (const s of stations) {
    await p.query(`INSERT INTO "${schema}".dim_station (station_code, station_name) VALUES ($1, $2)`, [s.station_code, s.station_name]);
  }
}

/** 批量插入测点数据 */
export async function batchInsertMeasures(area: string, measures: { cd_code: string; cd_name: string }[]) {
  const p = getTsrPool();
  const schema = schemaName(area);
  await p.query(`TRUNCATE "${schema}".measure_data`);
  for (const m of measures) {
    await p.query(`INSERT INTO "${schema}".measure_data (cd_code, cd_name) VALUES ($1, $2)`, [m.cd_code, m.cd_name]);
  }
}

/** 执行一条 SQL 并返回行数 */
export async function executeSql(sql: string): Promise<number> {
  const p = getTsrPool();
  const result = await p.query(sql);
  return result.rowCount ?? 0;
}

/** 在指定区域执行 SQL */
export async function executeSqlInSchema(area: string, sql: string): Promise<number> {
  const p = getTsrPool();
  const schema = schemaName(area);
  // 将 SQL 中的 schema 占位符替换为实际 schema
  const finalSql = sql.replace(/__schema__/g, `"${schema}"`).replace(/__通用__/g, '"通用"');
  const result = await p.query(finalSql);
  return result.rowCount ?? 0;
}

/** 查询导出列表数据 */
export async function queryExportList(area: string, type: 'sz' | 'tb' | 'yx' | 'zd') {
  const p = getTsrPool();
  const schema = schemaName(area);
  const table = `import_list_${type}`;

  // 查询表中所有列的信息（不包括已明确的 fields 时使用）
  const fields: Record<string, string[]> = {
    sz: ['module_source', 'energy_type', 'standard_name', 'sz_threshold', 'sz_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
    tb: ['module_source', 'energy_type', 'standard_name', 'tb_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
    yx: ['module_source', 'energy_type', 'standard_name', 'lower_range', 'upper_range', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
    zd: ['module_source', 'energy_type', 'standard_name', 'zd_duration', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
  };

  const cols = fields[type].join(', ');
  const orderCols = fields[type].slice(2).join(', '); // 从 standard_name 开始排序
  const result = await p.query(`SELECT ${cols} FROM "${schema}".${table} ORDER BY ${orderCols}`);
  return result.rows;
}
