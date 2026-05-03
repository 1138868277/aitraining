import { query } from '../../db/index.js';
import { config } from '../../config/index.js';

const dbc = config.db;

export interface StationRow {
  station_id: number;
  station_code: string;
  station_name: string;
  management_domain: string | null;
  creator: string;
  modifier: string;
  create_tm: string;
  modify_tm: string;
}

export interface StationListResult {
  items: StationRow[];
  total: number;
}

/** 分页查询场站列表 */
export async function listStation(
  pageNum: number,
  pageSize: number,
  keyword?: string,
): Promise<StationListResult> {
  const conditions: string[] = [`if_delete = '0'`];
  const params: string[] = [];
  let idx = 1;

  if (keyword) {
    conditions.push(`(station_code ILIKE $${idx} OR station_name ILIKE $${idx})`);
    params.push(`%${keyword}%`);
    idx++;
  }

  const where = conditions.join(' AND ');

  const countResult = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM ${dbc.schema}.cec_new_energy_station_dict WHERE ${where}`,
    params,
  );
  const total = Number(countResult[0].cnt);

  const offset = (pageNum - 1) * pageSize;
  const items = await query<StationRow>(
    `SELECT station_id, station_code, station_name, management_domain,
            creator, modifier, create_tm, modify_tm
     FROM ${dbc.schema}.cec_new_energy_station_dict
     WHERE ${where}
     ORDER BY station_code
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, String(pageSize), String(offset)],
  );

  return { items, total };
}

/** 查询所有场站（用于导出） */
export async function listAllStation(): Promise<StationRow[]> {
  return query<StationRow>(
    `SELECT station_id, station_code, station_name, management_domain,
            creator, modifier, create_tm, modify_tm
     FROM ${dbc.schema}.cec_new_energy_station_dict
     WHERE if_delete = '0'
     ORDER BY station_code`,
  );
}

/** 根据编码查询场站 */
export async function findByCode(code: string): Promise<StationRow | null> {
  const rows = await query<StationRow>(
    `SELECT station_id, station_code, station_name, management_domain,
            creator, modifier, create_tm, modify_tm
     FROM ${dbc.schema}.cec_new_energy_station_dict
     WHERE if_delete = '0' AND station_code = $1`,
    [code],
  );
  return rows[0] || null;
}

/** 根据ID查询场站 */
export async function findById(id: number): Promise<StationRow | null> {
  const rows = await query<StationRow>(
    `SELECT station_id, station_code, station_name, management_domain,
            creator, modifier, create_tm, modify_tm
     FROM ${dbc.schema}.cec_new_energy_station_dict
     WHERE if_delete = '0' AND station_id = $1`,
    [String(id)],
  );
  return rows[0] || null;
}

/** 新增场站 */
export async function createStation(input: {
  stationCode: string;
  stationName: string;
  managementDomain?: string;
  creator: string;
}): Promise<StationRow> {
  const rows = await query<StationRow>(
    `INSERT INTO ${dbc.schema}.cec_new_energy_station_dict
     (station_code, station_name, management_domain, creator, modifier, create_tm, modify_tm)
     VALUES ($1, $2, $3, $4, $4, NOW(), NOW())
     RETURNING station_id, station_code, station_name, management_domain,
               creator, modifier, create_tm, modify_tm`,
    [input.stationCode, input.stationName, input.managementDomain || null, input.creator],
  );
  return rows[0];
}

/** 批量新增场站 */
export async function batchCreateStation(
  entries: Array<{
    stationCode: string;
    stationName: string;
    managementDomain?: string;
  }>,
  creator: string,
): Promise<number> {
  if (entries.length === 0) return 0;

  const valuePlaceholders: string[] = [];
  const params: (string | null)[] = [];
  let idx = 1;

  for (const entry of entries) {
    valuePlaceholders.push(
      `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 3}, NOW(), NOW())`,
    );
    params.push(entry.stationCode, entry.stationName, entry.managementDomain || null, creator);
    idx += 4;
  }

  await query(
    `INSERT INTO ${dbc.schema}.cec_new_energy_station_dict
     (station_code, station_name, management_domain, creator, modifier, create_tm, modify_tm)
     VALUES ${valuePlaceholders.join(', ')}`,
    params,
  );

  return entries.length;
}

/** 更新场站 */
export async function updateStation(
  id: number,
  input: { stationName?: string; managementDomain?: string; modifier: string },
): Promise<StationRow | null> {
  const sets: string[] = [];
  const params: (string | null)[] = [];
  let idx = 1;

  if (input.stationName !== undefined) {
    sets.push(`station_name = $${idx++}`);
    params.push(input.stationName);
  }
  if (input.managementDomain !== undefined) {
    sets.push(`management_domain = $${idx++}`);
    params.push(input.managementDomain || null);
  }

  if (sets.length === 0) return findById(id);

  sets.push(`modifier = $${idx++}`);
  params.push(input.modifier);
  sets.push(`modify_tm = NOW()`);

  params.push(String(id));

  const rows = await query<StationRow>(
    `UPDATE ${dbc.schema}.cec_new_energy_station_dict
     SET ${sets.join(', ')}
     WHERE station_id = $${idx} AND if_delete = '0'
     RETURNING station_id, station_code, station_name, management_domain,
               creator, modifier, create_tm, modify_tm`,
    params,
  );
  return rows[0] || null;
}

/** 逻辑删除场站 */
export async function deleteStation(id: number, modifier: string): Promise<boolean> {
  const result = await query(
    `UPDATE ${dbc.schema}.cec_new_energy_station_dict
     SET if_delete = '1', modifier = $2, modify_tm = NOW()
     WHERE station_id = $1 AND if_delete = '0'`,
    [String(id), modifier],
  );
  return (result as any).rowCount > 0;
}

/** 一键删除所有场站（逻辑删除） */
export async function deleteAllStation(modifier: string): Promise<number> {
  const result = await query(
    `UPDATE ${dbc.schema}.cec_new_energy_station_dict
     SET if_delete = '1', modifier = $1, modify_tm = NOW()
     WHERE if_delete = '0'`,
    [modifier],
  );
  return (result as any).rowCount || 0;
}

/** 检查场站编码是否已存在 */
export async function existsByCode(code: string, excludeId?: number): Promise<boolean> {
  let sql = `SELECT COUNT(*) AS cnt FROM ${dbc.schema}.cec_new_energy_station_dict
    WHERE if_delete = '0' AND station_code = $1`;
  const params: (string | null)[] = [code];
  if (excludeId) {
    sql += ` AND station_id != $2`;
    params.push(String(excludeId));
  }
  const result = await query<{ cnt: number }>(sql, params);
  return Number(result[0].cnt) > 0;
}

export interface StationCodeName {
  stationCode: string;
  stationName: string;
}

/** 检查哪些场站编码已存在（批量导入时使用） */
export async function findExistingCodes(codes: string[]): Promise<StationCodeName[]> {
  if (codes.length === 0) return [];
  const placeholders = codes.map((_, i) => `$${i + 1}`);
  const rows = await query<{ station_code: string; station_name: string }>(
    `SELECT station_code, station_name FROM ${dbc.schema}.cec_new_energy_station_dict
     WHERE if_delete = '0' AND station_code IN (${placeholders.join(',')})`,
    codes,
  );
  return rows.map(r => ({ stationCode: r.station_code, stationName: r.station_name }));
}
