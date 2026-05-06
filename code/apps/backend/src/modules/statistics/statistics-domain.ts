import { query, queryOne } from '../../db/index.js';
import { config } from '../../config/index.js';

const dbc = config.db;

// ========== 编码生成统计 ==========

/** 编码生成概览 */
export async function getCodeGenOverview(): Promise<{
  totalCodes: number;
  todayCodes: number;
  thisWeekCodes: number;
  thisMonthCodes: number;
}> {
  const sql = `
    SELECT
      COUNT(*) AS total_codes,
      COUNT(CASE WHEN create_tm >= CURRENT_DATE THEN 1 END) AS today_codes,
      COUNT(CASE WHEN create_tm >= date_trunc('week', CURRENT_DATE) THEN 1 END) AS week_codes,
      COUNT(CASE WHEN create_tm >= date_trunc('month', CURRENT_DATE) THEN 1 END) AS month_codes
    FROM ${dbc.schema}.cec_new_energy_createcode
    WHERE if_delete = '0'`;
  const r = await query<{
    total_codes: string; today_codes: string;
    week_codes: string; month_codes: string;
  }>(sql);
  return {
    totalCodes: Number(r[0]?.total_codes || 0),
    todayCodes: Number(r[0]?.today_codes || 0),
    thisWeekCodes: Number(r[0]?.week_codes || 0),
    thisMonthCodes: Number(r[0]?.month_codes || 0),
  };
}

/** 编码生成按类型统计（风电/光伏/水电/其他） */
export async function getCodeGenByType(): Promise<{
  windCount: number; solarCount: number; hydroCount: number; otherCount: number;
}> {
  const sql = `
    SELECT
      COUNT(CASE WHEN SUBSTRING(code, 5, 2) LIKE 'F%' OR SUBSTRING(code, 5, 2) = '01' THEN 1 END) AS wind,
      COUNT(CASE WHEN SUBSTRING(code, 5, 2) LIKE 'G%' OR SUBSTRING(code, 5, 2) = '02' THEN 1 END) AS solar,
      COUNT(CASE WHEN SUBSTRING(code, 5, 2) LIKE 'S%' OR SUBSTRING(code, 5, 2) = '05' THEN 1 END) AS hydro,
      COUNT(CASE WHEN NOT (SUBSTRING(code, 5, 2) LIKE 'F%' OR SUBSTRING(code, 5, 2) = '01'
                        OR SUBSTRING(code, 5, 2) LIKE 'G%' OR SUBSTRING(code, 5, 2) = '02'
                        OR SUBSTRING(code, 5, 2) LIKE 'S%' OR SUBSTRING(code, 5, 2) = '05') THEN 1 END) AS other
    FROM ${dbc.schema}.cec_new_energy_createcode
    WHERE if_delete = '0'`;
  const r = await query<{ wind: string; solar: string; hydro: string; other: string }>(sql);
  return {
    windCount: Number(r[0]?.wind || 0),
    solarCount: Number(r[0]?.solar || 0),
    hydroCount: Number(r[0]?.hydro || 0),
    otherCount: Number(r[0]?.other || 0),
  };
}

/** 按维度统计编码生成 */
export async function getCodeGenByDimension(
  dimension: string,
  startTime?: string,
  endTime?: string,
): Promise<{ dimension: string; items: Array<{ name: string; value: number; percentage: number }> }> {
  const dimMap: Record<string, string> = {
    typeCode: "SUBSTRING(code, 5, 2)",
    stationCode: "SUBSTRING(code, 1, 4)",
    secondClassCode: "SUBSTRING(code, 13, 3)",
    firstClassCode: "SUBSTRING(code, 11, 2)",
    dataCategoryCode: "SUBSTRING(code, 27, 2)",
  };
  const col = dimMap[dimension] || dimMap.typeCode;

  let conditions = "if_delete = '0'";
  const params: string[] = [];
  if (startTime) {
    conditions += ` AND create_tm >= $${params.length + 1}`;
    params.push(startTime);
  }
  if (endTime) {
    conditions += ` AND create_tm <= $${params.length + 1}::date + 1`;
    params.push(endTime);
  }

  const sql = `SELECT ${col} AS name, COUNT(*) AS cnt
    FROM ${dbc.schema}.cec_new_energy_createcode
    WHERE ${conditions}
    GROUP BY ${col} ORDER BY cnt DESC`;
  const rows = await query<{ name: string; cnt: string }>(sql, params);
  const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
  const items = rows.map(r => ({
    name: r.name || '(空)',
    value: Number(r.cnt),
    percentage: total > 0 ? Math.round((Number(r.cnt) / total) * 1000) / 10 : 0,
  }));
  return { dimension, items };
}

/** 编码生成按二级类码统计（编码 + 名称） */
export async function getCodeGenBySecondClass(
  typeFilter?: 'wind' | 'solar' | 'hydro',
): Promise<{
  items: Array<{ name: string; value: number; percentage: number }>
}> {
  let typeCondition = '';
  let dictTypeCondition = '';
  if (typeFilter === 'wind') {
    typeCondition = "AND (SUBSTRING(code, 5, 2) LIKE 'F%' OR SUBSTRING(code, 5, 2) = '01')";
    dictTypeCondition = "AND (type_code LIKE 'F%' OR type_code = '01')";
  } else if (typeFilter === 'solar') {
    typeCondition = "AND (SUBSTRING(code, 5, 2) LIKE 'G%' OR SUBSTRING(code, 5, 2) = '02')";
    dictTypeCondition = "AND (type_code LIKE 'G%' OR type_code = '02')";
  } else if (typeFilter === 'hydro') {
    typeCondition = "AND (SUBSTRING(code, 5, 2) LIKE 'S%' OR SUBSTRING(code, 5, 2) = '05')";
    dictTypeCondition = "AND (type_code LIKE 'S%' OR type_code = '05')";
  }
  const sql = `
    SELECT t.code_val, d.second_class_name AS name_val, t.cnt
    FROM (
      SELECT SUBSTRING(code, 13, 3) AS code_val, COUNT(*) AS cnt
      FROM ${dbc.schema}.cec_new_energy_createcode
      WHERE if_delete = '0' ${typeCondition}
      GROUP BY SUBSTRING(code, 13, 3)
    ) t
    LEFT JOIN (SELECT second_class_code, MIN(second_class_name) AS second_class_name FROM ${dbc.schema}.cec_new_energy_second_class_type_dict WHERE if_delete = '0' ${dictTypeCondition} GROUP BY second_class_code) d
      ON t.code_val = d.second_class_code
    ORDER BY t.cnt DESC`;
  const rows = await query<{ code_val: string; name_val: string | null; cnt: string }>(sql);
  const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
  const items = rows.map(r => ({
    name: r.name_val ? `${r.code_val} ${r.name_val}` : r.code_val,
    value: Number(r.cnt),
    percentage: total > 0 ? Math.round((Number(r.cnt) / total) * 1000) / 10 : 0,
  }));
  return { items };
}

/** 编码生成按场站统计（编码 + 名称） */
export async function getCodeGenByStation(): Promise<{
  items: Array<{ name: string; value: number; percentage: number }>
}> {
  const sql = `
    SELECT t.code_val, d.station_name AS name_val, t.cnt
    FROM (
      SELECT SUBSTRING(code, 1, 4) AS code_val, COUNT(*) AS cnt
      FROM ${dbc.schema}.cec_new_energy_createcode
      WHERE if_delete = '0'
      GROUP BY SUBSTRING(code, 1, 4)
    ) t
    LEFT JOIN (SELECT DISTINCT station_code, station_name FROM ${dbc.schema}.cec_new_energy_station_dict WHERE if_delete = '0') d
      ON t.code_val = d.station_code
    ORDER BY t.cnt DESC`;
  const rows = await query<{ code_val: string; name_val: string | null; cnt: string }>(sql);
  const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
  const items = rows.map(r => ({
    name: r.name_val ? `${r.code_val} ${r.name_val}` : r.code_val,
    value: Number(r.cnt),
    percentage: total > 0 ? Math.round((Number(r.cnt) / total) * 1000) / 10 : 0,
  }));
  return { items };
}

/** 编码生成每日趋势 */
export async function getCodeGenTrend(
  days: number = 30,
): Promise<{ items: Array<{ date: string; count: number }> }> {
  const sql = `SELECT TO_CHAR(create_tm, 'YYYY-MM-DD') AS dt, COUNT(*) AS cnt
    FROM ${dbc.schema}.cec_new_energy_createcode
    WHERE if_delete = '0' AND create_tm >= CURRENT_DATE - $1::integer
    GROUP BY dt ORDER BY dt`;
  const rows = await query<{ dt: string; cnt: string }>(sql, [String(days)]);
  return { items: rows.map(r => ({ date: r.dt, count: Number(r.cnt) })) };
}

/** 查询编码生成分组列表（按维度分组统计数量） */
export async function getCodeGenList(
  pageNum: number,
  pageSize: number,
  filters: {
    typeCode?: string;
    stationCode?: string;
    secondClassCode?: string;
    dataTypeCode?: string;
  },
): Promise<{
  list: Array<{
    type_code: string;
    station_code: string;
    second_class_code: string;
    third_class_code: string;
    data_type_code: string;
    data_code: string;
    type_name: string;
    station_name: string;
    second_class_name: string;
    third_class_name: string;
    data_type_name: string;
    data_name: string;
    code_count: number;
  }>;
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
  filterOptions: {
    typeCodes: Array<{ code: string; name: string }>;
    stationCodes: Array<{ code: string; name: string }>;
    secondClassCodes: Array<{ code: string; name: string }>;
    dataTypeCodes: Array<{ code: string; name: string }>;
  };
}> {
  const conditions: string[] = [`c.if_delete = '0'`];
  const params: string[] = [];
  let paramIdx = 1;

  if (filters.typeCode) {
    conditions.push(`SUBSTRING(c.code, 5, 2) = $${paramIdx++}`);
    params.push(filters.typeCode);
  }
  if (filters.stationCode) {
    conditions.push(`SUBSTRING(c.code, 1, 4) = $${paramIdx++}`);
    params.push(filters.stationCode);
  }
  if (filters.secondClassCode) {
    conditions.push(`SUBSTRING(c.code, 13, 3) = $${paramIdx++}`);
    params.push(filters.secondClassCode);
  }
  if (filters.dataTypeCode) {
    conditions.push(`SUBSTRING(c.code, 27, 2) = $${paramIdx++}`);
    params.push(filters.dataTypeCode);
  }

  const whereClause = conditions.join(' AND ');

  // 优化：CTE 预计算段码 → 纯 GROUP BY（无 JOIN）→ 分页 → 最后查字典名称
  // 避免在 GROUP BY 之前做 6 个 LEFT JOIN，字典查询只作用于分页后的少量数据
  const ctePrefix = `
    WITH segments AS (
      SELECT
        SUBSTRING(c.code, 5, 2) AS type_code,
        SUBSTRING(c.code, 1, 4) AS station_code,
        SUBSTRING(c.code, 13, 3) AS second_class_code,
        SUBSTRING(c.code, 20, 3) AS third_class_code,
        SUBSTRING(c.code, 27, 2) AS data_type_code,
        SUBSTRING(c.code, 29, 3) AS data_code,
        c.create_tm
      FROM ${dbc.schema}.cec_new_energy_createcode c
      WHERE ${whereClause}
    ),
    grouped AS (
      SELECT
        type_code, station_code, second_class_code,
        third_class_code, data_type_code, data_code,
        COUNT(*) AS code_count,
        MAX(create_tm) AS max_create_tm
      FROM segments
      GROUP BY type_code, station_code, second_class_code,
               third_class_code, data_type_code, data_code
    )`;

  const countSql = `${ctePrefix}
    SELECT COUNT(*) AS total FROM grouped`;
  const countResult = await queryOne<{ total: string }>(countSql, params);
  const total = Number(countResult?.total || 0);

  if (total === 0) {
    return {
      list: [], total: 0, pageNum, pageSize, pages: 0,
      filterOptions: { typeCodes: [], stationCodes: [], secondClassCodes: [], dataTypeCodes: [] },
    };
  }

  const offset = (pageNum - 1) * pageSize;
  const listSql = `${ctePrefix},
    paged AS (
      SELECT * FROM grouped
      ORDER BY max_create_tm DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    )
    SELECT
      p.type_code, p.station_code, p.second_class_code,
      p.third_class_code, p.data_type_code, p.data_code,
      COALESCE(t.type_name, '') AS type_name,
      COALESCE(s.station_name, '') AS station_name,
      COALESCE(sc.second_class_name, '') AS second_class_name,
      COALESCE(tc.third_class_name, '') AS third_class_name,
      COALESCE(dtd_type.data_type_name, '') AS data_type_name,
      COALESCE(dtd_code.data_name, '') AS data_name,
      p.code_count, p.max_create_tm
    FROM paged p
    LEFT JOIN (SELECT type_code, MIN(type_name) AS type_name FROM ${dbc.schema}.cec_new_energy_type_dict WHERE if_delete = '0' GROUP BY type_code) t ON p.type_code = t.type_code
    LEFT JOIN (SELECT station_code, MIN(station_name) AS station_name FROM ${dbc.schema}.cec_new_energy_station_dict WHERE if_delete = '0' GROUP BY station_code) s ON p.station_code = s.station_code
    LEFT JOIN (SELECT second_class_code, type_code, MIN(second_class_name) AS second_class_name FROM ${dbc.schema}.cec_new_energy_second_class_type_dict WHERE if_delete = '0' AND second_class_code IS NOT NULL GROUP BY second_class_code, type_code) sc ON p.second_class_code = sc.second_class_code AND p.type_code = sc.type_code
    LEFT JOIN (SELECT third_class_code, second_class_code, type_code, MIN(third_class_name) AS third_class_name FROM ${dbc.schema}.cec_new_energy_third_class_dict WHERE if_delete = '0' AND third_class_code IS NOT NULL GROUP BY third_class_code, second_class_code, type_code) tc ON p.third_class_code = tc.third_class_code AND p.second_class_code = tc.second_class_code AND p.type_code = tc.type_code
    LEFT JOIN (SELECT data_category_code, type_domain_code, MIN(data_category_name) AS data_type_name FROM ${dbc.schema}.cec_new_energy_code_dict WHERE if_delete = '0' AND data_category_code IS NOT NULL GROUP BY data_category_code, type_domain_code) dtd_type ON p.data_type_code = dtd_type.data_category_code AND SUBSTRING(p.type_code, 1, 1) = dtd_type.type_domain_code
    LEFT JOIN (SELECT data_category_code, data_code, type_domain_code, MIN(data_name) AS data_name FROM ${dbc.schema}.cec_new_energy_code_dict WHERE if_delete = '0' AND data_code IS NOT NULL AND data_name IS NOT NULL GROUP BY data_category_code, data_code, type_domain_code) dtd_code ON p.data_type_code = dtd_code.data_category_code AND p.data_code = dtd_code.data_code AND SUBSTRING(p.type_code, 1, 1) = dtd_code.type_domain_code
    ORDER BY p.max_create_tm DESC`;
  const listParams = [...params, pageSize, offset];
  const list = await query(listSql, listParams);

  // 筛选条件选项（联动过滤：类型→二级类码→数据类码）
  const [typeOptions, stationOptions, secondClassOptions, dataTypeOptions] = await Promise.all([
    query<{ code: string; name: string }>(
      `SELECT type_code AS code, type_name AS name FROM ${dbc.schema}.cec_new_energy_type_dict WHERE if_delete = '0' ORDER BY type_code`),

    query<{ code: string; name: string }>(
      `SELECT station_code AS code, station_name AS name FROM ${dbc.schema}.cec_new_energy_station_dict WHERE if_delete = '0' ORDER BY station_code`),

    // 二级类码：如果已选类型则按类型过滤
    (() => {
      let sql = `SELECT second_class_code AS code, MIN(second_class_name) AS name FROM ${dbc.schema}.cec_new_energy_second_class_type_dict WHERE if_delete = '0' AND second_class_code IS NOT NULL`;
      const p: string[] = [];
      if (filters.typeCode) {
        sql += ` AND type_code = $1`;
        p.push(filters.typeCode);
      }
      sql += ` GROUP BY second_class_code ORDER BY code`;
      return query<{ code: string; name: string }>(sql, p);
    })(),

    // 数据类码：如果已选二级类码则按二级类码过滤
    (() => {
      let sql = `SELECT data_category_code AS code, MIN(data_category_name) AS name FROM ${dbc.schema}.cec_new_energy_code_dict WHERE if_delete = '0' AND data_category_code IS NOT NULL`;
      const p: string[] = [];
      if (filters.secondClassCode) {
        sql += ` AND second_class_code = $1`;
        p.push(filters.secondClassCode);
      }
      sql += ` GROUP BY data_category_code ORDER BY code`;
      return query<{ code: string; name: string }>(sql, p);
    })(),
  ]);

  return {
    list,
    total,
    pageNum,
    pageSize,
    pages: Math.ceil(total / pageSize),
    filterOptions: {
      typeCodes: typeOptions,
      stationCodes: stationOptions,
      secondClassCodes: secondClassOptions,
      dataTypeCodes: dataTypeOptions,
    },
  };
}

/** 查询编码生成分组详情（展开某组查看具体编码） */
export async function getCodeGenGroupDetail(
  group: {
    typeCode: string;
    stationCode: string;
    secondClassCode: string;
    thirdClassCode: string;
    dataTypeCode: string;
    dataCode: string;
  },
): Promise<Array<{ code: string; name: string; create_date: string }>> {
  const sql = `
    SELECT code, name, TO_CHAR(create_tm, 'YYYY-MM-DD') AS create_date
    FROM ${dbc.schema}.cec_new_energy_createcode
    WHERE if_delete = '0'
      AND SUBSTRING(code, 5, 2) = $1
      AND SUBSTRING(code, 1, 4) = $2
      AND SUBSTRING(code, 13, 3) = $3
      AND SUBSTRING(code, 20, 3) = $4
      AND SUBSTRING(code, 27, 2) = $5
      AND SUBSTRING(code, 29, 3) = $6
    ORDER BY code`;
  return query<{ code: string; name: string; create_date: string }>(sql, [
    group.typeCode, group.stationCode, group.secondClassCode,
    group.thirdClassCode, group.dataTypeCode, group.dataCode,
  ]);
}

/** 按分组维度软删除编码生成记录 */
export async function deleteCodeGenGroups(
  groups: Array<{
    typeCode: string;
    stationCode: string;
    secondClassCode: string;
    thirdClassCode: string;
    dataTypeCode: string;
    dataCode: string;
  }>,
): Promise<number> {
  if (groups.length === 0) return 0;
  let totalDeleted = 0;
  for (const g of groups) {
    const sql = `
      UPDATE ${dbc.schema}.cec_new_energy_createcode
      SET if_delete = '1', modify_tm = NOW()
      WHERE if_delete = '0'
        AND SUBSTRING(code, 5, 2) = $1
        AND SUBSTRING(code, 1, 4) = $2
        AND SUBSTRING(code, 13, 3) = $3
        AND SUBSTRING(code, 20, 3) = $4
        AND SUBSTRING(code, 27, 2) = $5
        AND SUBSTRING(code, 29, 3) = $6`;
    const result = await query(sql, [
      g.typeCode, g.stationCode, g.secondClassCode,
      g.thirdClassCode, g.dataTypeCode, g.dataCode,
    ]);
    totalDeleted += (result as any)?.rowCount || 0;
  }
  return totalDeleted;
}

// ========== 2. 编码字典统计 ==========

/** 字典整体概览（按风电/光伏/水电拆分） */
export async function getDictOverview(): Promise<{
  wind: {
    firstClassCount: number; secondClassCount: number; thirdClassCount: number;
    dataCategoryCount: number; dataCodeGroup: number; dataCodeManual: number;
  };
  solar: {
    firstClassCount: number; secondClassCount: number; thirdClassCount: number;
    dataCategoryCount: number; dataCodeGroup: number; dataCodeManual: number;
  };
  hydro: {
    firstClassCount: number; secondClassCount: number; thirdClassCount: number;
    dataCategoryCount: number; dataCodeGroup: number; dataCodeManual: number;
  };
}> {
  // 一次查询获取三个类型域的主表聚合数据
  const [mainRows, thirdRows] = await Promise.all([
    query<{
      td: string; fc: string; sc: string; dc: string; dg: string; dm: string;
    }>(
      `SELECT
         type_domain_code AS td,
         COUNT(DISTINCT first_class_code) AS fc,
         COUNT(DISTINCT second_class_code) AS sc,
         COUNT(DISTINCT data_category_code) AS dc,
         COUNT(*) FILTER (WHERE data_code IS NOT NULL AND (is_manual IS NULL OR is_manual = '0')) AS dg,
         COUNT(*) FILTER (WHERE data_code IS NOT NULL AND is_manual = '1') AS dm
       FROM ${dbc.schema}.cec_new_energy_code_dict
       WHERE if_delete = '0' AND type_domain_code IN ('F', 'G', 'S')
       GROUP BY type_domain_code`),
    // 一次查询获取三个类型域的三级类码计数（使用子查询避免慢 JOIN）
    query<{ td: string; c: string }>(
      `SELECT d.type_domain_code AS td, COUNT(DISTINCT t.third_class_code) AS c
       FROM ${dbc.schema}.cec_new_energy_third_class_dict t
       INNER JOIN (SELECT DISTINCT type_domain_code, second_class_code
                   FROM ${dbc.schema}.cec_new_energy_code_dict
                   WHERE if_delete = '0' AND type_domain_code IN ('F', 'G', 'S')) d
         ON d.second_class_code = t.second_class_code
       WHERE t.if_delete = '0'
       GROUP BY d.type_domain_code`),
  ]);

  function toMap(rows: { td: string; [key: string]: any }[]): Record<string, any> {
    const map: Record<string, any> = {};
    for (const r of rows) map[r.td] = r;
    return map;
  }

  const mainMap = toMap(mainRows);
  const thirdMap = toMap(thirdRows);

  function build(td: string) {
    const m = mainMap[td];
    const t = thirdMap[td];
    return {
      firstClassCount: Number(m?.fc || 0),
      secondClassCount: Number(m?.sc || 0),
      thirdClassCount: Number(t?.c || 0),
      dataCategoryCount: Number(m?.dc || 0),
      dataCodeGroup: Number(m?.dg || 0),
      dataCodeManual: Number(m?.dm || 0),
    };
  }

  return { wind: build('F'), solar: build('G'), hydro: build('S') };
}

/** 字典新增情况 */
export async function getDictNewAddition(
  startTime?: string, endTime?: string,
): Promise<{
  totalNewCodes: number; manualCodes: number; autoCodes: number;
  newCodesBySecondClass: Array<{ secondClassCode: string; secondClassName: string; count: number }>;
  newCodesByDate: Array<{ date: string; count: number }>;
}> {
  let cond = "if_delete = '0'";
  const params: string[] = [];
  if (startTime) { cond += ` AND create_tm >= $${params.length + 1}`; params.push(startTime); }
  if (endTime) { cond += ` AND create_tm <= $${params.length + 1}::date + 1`; params.push(endTime); }

  const [totalRes, manualRes, scRes, dateRes] = await Promise.all([
    query<{ c: string }>(`SELECT COUNT(*) AS c FROM ${dbc.schema}.cec_new_energy_code_dict WHERE ${cond}`, params),
    query<{ c: string }>(`SELECT COUNT(*) AS c FROM ${dbc.schema}.cec_new_energy_code_dict WHERE ${cond} AND is_manual = '1'`, params),
    query<{ sc: string; sn: string; c: string }>(
      `SELECT second_class_code AS sc, second_class_name AS sn, COUNT(*) AS c
       FROM ${dbc.schema}.cec_new_energy_code_dict WHERE ${cond}
       GROUP BY second_class_code, second_class_name ORDER BY c DESC LIMIT 20`, params),
    query<{ dt: string; c: string }>(
      `SELECT TO_CHAR(create_tm, 'YYYY-MM-DD') AS dt, COUNT(*) AS c
       FROM ${dbc.schema}.cec_new_energy_code_dict WHERE ${cond}
       GROUP BY dt ORDER BY dt`, params),
  ]);

  return {
    totalNewCodes: Number(totalRes[0]?.c || 0),
    manualCodes: Number(manualRes[0]?.c || 0),
    autoCodes: Number(totalRes[0]?.c || 0) - Number(manualRes[0]?.c || 0),
    newCodesBySecondClass: scRes.map(r => ({ secondClassCode: r.sc, secondClassName: r.sn, count: Number(r.c) })),
    newCodesByDate: dateRes.map(r => ({ date: r.dt, count: Number(r.c) })),
  };
}

/** 类型域分布 */
export async function getDictTypeDomainDist(): Promise<{
  items: Array<{
    typeDomainCode: string; typeDomainName: string;
    secondClassCount: number; dataCategoryCount: number; dataCodeCount: number;
  }>;
}> {
  const sql = `SELECT
      COALESCE(type_domain_code, 'OTHER') AS td,
      CASE WHEN type_domain_code = 'F' THEN '风电'
           WHEN type_domain_code = 'G' THEN '光伏'
           WHEN type_domain_code = 'S' THEN '水电'
           ELSE '其他' END AS tn,
      COUNT(DISTINCT second_class_code) AS sc,
      COUNT(DISTINCT data_category_code) AS dc,
      COUNT(*) AS cc
    FROM ${dbc.schema}.cec_new_energy_code_dict
    WHERE if_delete = '0'
    GROUP BY type_domain_code ORDER BY type_domain_code`;
  const rows = await query<{ td: string; tn: string; sc: string; dc: string; cc: string }>(sql);
  return {
    items: rows.map(r => ({
      typeDomainCode: r.td, typeDomainName: r.tn,
      secondClassCount: Number(r.sc), dataCategoryCount: Number(r.dc), dataCodeCount: Number(r.cc),
    })),
  };
}

// ========== 3. 全量测点统计 ==========

/** 导入状态存储 */
export interface ImportTask {
  importing: boolean;
  batchId: string | null;
  totalRows: number;
  importedRows: number;
  validRows: number;
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  message?: string;
  startTime?: number;
  cancelRequested?: boolean;
}

const importStore: ImportTask = {
  importing: false, batchId: null,
  totalRows: 0, importedRows: 0, validRows: 0,
  status: 'IDLE',
};

export function getImportStatus(): ImportTask {
  return { ...importStore, cancelRequested: false };
}

export function cancelImport(): void {
  importStore.cancelRequested = true;
}

/** 解析31位编码各段 */
function parseCodeSegments(code: string): Record<string, string> | null {
  if (!/^[A-Za-z0-9]{31}$/.test(code)) return null;
  return {
    station_code: code.substring(0, 4),
    type_code: code.substring(4, 6),
    project_line_code: code.substring(6, 9),
    prefix_no: code.substring(9, 10),
    first_class_code: code.substring(10, 12),
    second_class_code: code.substring(12, 15),
    second_ext_code: code.substring(15, 19),
    third_class_code: code.substring(19, 22),
    third_ext_code: code.substring(22, 26),
    data_category_code: code.substring(26, 28),
    data_code: code.substring(28, 31),
  };
}

/** 批量插入测点数据 */
async function batchInsertPoints(
  batchId: string, rows: Array<{ code: string; seg: Record<string, string> }>,
): Promise<void> {
  if (rows.length === 0) return;
  const values: string[] = [];
  const params: string[] = [];
  let idx = 1;
  for (const { code, seg } of rows) {
    values.push(`($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},'system',NOW(),NOW(),'0')`);
    params.push(code, seg.station_code, seg.type_code, seg.project_line_code,
      seg.prefix_no, seg.first_class_code, seg.second_class_code,
      seg.second_ext_code, seg.third_class_code, seg.third_ext_code,
      seg.data_category_code, seg.data_code, batchId);
  }
  const sql = `INSERT INTO ${dbc.schema}.cec_new_energy_measurement_points
    (code, station_code, type_code, project_line_code, prefix_no,
     first_class_code, second_class_code, second_ext_code,
     third_class_code, third_ext_code, data_category_code, data_code,
     import_batch_id, creator, create_tm, modify_tm, if_delete)
    VALUES ${values.join(',')}`;
  await query(sql, params);
}

/** 导入测点Excel */
export async function importMeasurementFile(
  fileBuffer: Buffer, fileName: string,
): Promise<{ batchId: string }> {
  if (importStore.importing) {
    throw new Error('IMPORT_BUSY');
  }

  const XLSX = await import('xlsx');
  importStore.importing = true;
  importStore.status = 'PROCESSING';
  importStore.batchId = `batch_${Date.now()}`;
  importStore.totalRows = 0;
  importStore.importedRows = 0;
  importStore.validRows = 0;
  importStore.startTime = Date.now();
  importStore.cancelRequested = false;
  importStore.message = '正在解析文件...';

  const batchId = importStore.batchId;

  // 先清空所有旧数据
  await query(`DELETE FROM ${dbc.schema}.cec_new_energy_measurement_points`);

  try {
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetNames = wb.SheetNames;
    if (!sheetNames.length) throw new Error('IMPORT_DATA_EMPTY');

    // 先统计所有sheet的总行数
    let totalRows = 0;
    for (const name of sheetNames) {
      const ws = wb.Sheets[name];
      if (!ws['!ref']) continue;
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
      totalRows += rows.length;
    }
    importStore.totalRows = totalRows;
    importStore.message = `共读取 ${totalRows} 行（${sheetNames.length} 个Sheet），正在解析...`;

    // 识别测点编码列（从第一个非空sheet获取列名）
    let codeCol = '';
    for (const name of sheetNames) {
      const ws = wb.Sheets[name];
      if (!ws['!ref']) continue;
      const firstRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
      if (firstRows.length) {
        const headers = Object.keys(firstRows[0]);
        codeCol = headers.find(h =>
          h.includes('测点编码') || h.includes('编码') || h.includes('code') || h.includes('Code')
        ) || headers[0];
        break;
      }
    }
    if (!codeCol) throw new Error('IMPORT_DATA_EMPTY');

    const batch: Array<{ code: string; seg: Record<string, string> }> = [];
    let validCount = 0;

    for (const name of sheetNames) {
      if (importStore.cancelRequested) break;
      const ws = wb.Sheets[name];
      if (!ws['!ref']) continue;
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

      for (let i = 0; i < rows.length; i++) {
        if (importStore.cancelRequested) break;
        const raw = String(rows[i][codeCol] || '').trim();
        const seg = parseCodeSegments(raw);
        if (seg) {
          batch.push({ code: raw, seg });
          validCount++;
        }

        if (batch.length >= 500) {
          await batchInsertPoints(batchId, batch);
          importStore.importedRows += batch.length;
          batch.length = 0;
          importStore.message = `已导入 ${importStore.importedRows}/${importStore.totalRows} 行...`;
        }
      }
    }

    if (batch.length > 0) {
      await batchInsertPoints(batchId, batch);
      importStore.importedRows += batch.length;
    }

    if (importStore.cancelRequested) {
      importStore.validRows = validCount;
      importStore.importing = false;
      importStore.status = 'CANCELLED';
      importStore.message = `已终止，已导入 ${importStore.importedRows} 行（有效编码 ${validCount} 条）`;
      return { batchId };
    }

    importStore.validRows = validCount;
    importStore.importing = false;
    importStore.status = 'COMPLETED';
    importStore.message = `导入完成，有效编码 ${validCount} 条（${sheetNames.length} 个Sheet）`;

    return { batchId };
  } catch (err: any) {
    importStore.importing = false;
    importStore.status = 'FAILED';
    importStore.message = err.message || '导入失败';
    throw err;
  }
}

/** 全量测点概览 */
export async function getMeasureOverview(): Promise<{
  totalPoints: number; windCount: number; solarCount: number; otherCount: number; lastImportTime: string | null;
}> {
  const sql = `SELECT
      COUNT(*) AS total,
      COUNT(CASE WHEN type_code LIKE 'F%' OR type_code = '01' THEN 1 END) AS wind,
      COUNT(CASE WHEN type_code LIKE 'G%' OR type_code = '02' THEN 1 END) AS solar,
      COUNT(CASE WHEN type_code NOT LIKE 'F%' AND type_code NOT LIKE 'G%'
             AND type_code != '01' AND type_code != '02' THEN 1 END) AS other,
      MAX(create_tm) AS last_import_time
    FROM ${dbc.schema}.cec_new_energy_measurement_points
    WHERE if_delete = '0'`;
  const r = await query<{ total: string; wind: string; solar: string; other: string; last_import_time: string }>(sql);
  return {
    totalPoints: Number(r[0]?.total || 0),
    windCount: Number(r[0]?.wind || 0),
    solarCount: Number(r[0]?.solar || 0),
    otherCount: Number(r[0]?.other || 0),
    lastImportTime: r[0]?.last_import_time || null,
  };
}

/** 全量测点维度统计 */
export async function getMeasureByDimension(
  dimension: string,
): Promise<{ dimension: string; items: Array<{ name: string; count: number; percentage: number }> }> {
  const dimMap: Record<string, string> = {
    typeCode: 'type_code',
    stationCode: 'station_code',
    secondClassCode: 'second_class_code',
    secondExtCode: 'second_ext_code',
    thirdClassCode: 'third_class_code',
    dataCategoryCode: 'data_category_code',
    dataCode: 'data_code',
  };
  const col = dimMap[dimension] || 'type_code';

  const typeLabel: Record<string, string> = {
    'F': '风电', 'G': '光伏',
    'F1': '风电', 'F2': '风电', 'F3': '风电', 'F4': '风电',
    'G1': '光伏', 'G2': '光伏',
  };

  const sql = `SELECT ${col} AS name, COUNT(*) AS cnt
    FROM ${dbc.schema}.cec_new_energy_measurement_points
    WHERE if_delete = '0' AND ${col} IS NOT NULL
    GROUP BY ${col} ORDER BY cnt DESC LIMIT 50`;
  const rows = await query<{ name: string; cnt: string }>(sql);
  const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
  const items = rows.map(r => ({
    name: typeLabel[r.name] || r.name,
    count: Number(r.cnt),
    percentage: total > 0 ? Math.round((Number(r.cnt) / total) * 1000) / 10 : 0,
  }));
  return { dimension, items };
}

/** 按类型下钻二级类码 */
export async function getMeasureDrillDown(
  typeCode: string,
): Promise<{
  typeCode: string; typeName: string; total: number;
  secondClassItems: Array<{ name: string; count: number; percentage: number }>;
}> {
  const typeLabel: Record<string, string> = {
    'F': '风电', 'G': '光伏',
    'F1': '风电', 'F2': '风电', 'F3': '风电', 'F4': '风电',
    'G1': '光伏', 'G2': '光伏',
  };
  let filter: string;
  if (typeCode === 'F' || typeCode === 'G') {
    filter = typeCode === 'F'
      ? "(type_code LIKE 'F%' OR type_code = '01')"
      : "(type_code LIKE 'G%' OR type_code = '02')";
  } else {
    filter = `type_code = $1`;
  }

  const params: string[] = typeCode !== 'F' && typeCode !== 'G' ? [typeCode] : [];

  const totalSql = `SELECT COUNT(*) AS c FROM ${dbc.schema}.cec_new_energy_measurement_points WHERE if_delete = '0' AND ${filter}`;
  const totalRes = await query<{ c: string }>(totalSql, params);
  const total = Number(totalRes[0]?.c || 0);

  const sql2 = `SELECT second_class_code AS name, COUNT(*) AS cnt
    FROM ${dbc.schema}.cec_new_energy_measurement_points
    WHERE if_delete = '0' AND ${filter} AND second_class_code IS NOT NULL
    GROUP BY name ORDER BY cnt DESC`;
  const rows = await query<{ name: string; cnt: string }>(sql2, params);

  return {
    typeCode, typeName: typeLabel[typeCode] || typeCode, total,
    secondClassItems: rows.map(r => ({
      name: r.name, count: Number(r.cnt),
      percentage: total > 0 ? Math.round((Number(r.cnt) / total) * 1000) / 10 : 0,
    })),
  };
}

/** 全量测点按二级类码统计 */
export async function getMeasureBySecondClass(
  typeFilter?: 'wind' | 'solar',
): Promise<{
  items: Array<{ name: string; value: number; percentage: number }>
}> {
  let typeCondition = '';
  let dictTypeCondition = '';
  if (typeFilter === 'wind') {
    typeCondition = "AND (type_code LIKE 'F%' OR type_code = '01')";
    dictTypeCondition = "AND (type_code LIKE 'F%' OR type_code = '01')";
  } else if (typeFilter === 'solar') {
    typeCondition = "AND (type_code LIKE 'G%' OR type_code = '02')";
    dictTypeCondition = "AND (type_code LIKE 'G%' OR type_code = '02')";
  }
  const sql = `
    SELECT t.code_val, d.second_class_name AS name_val, t.cnt
    FROM (
      SELECT second_class_code AS code_val, COUNT(*) AS cnt
      FROM ${dbc.schema}.cec_new_energy_measurement_points
      WHERE if_delete = '0' ${typeCondition}
      GROUP BY second_class_code
    ) t
    LEFT JOIN (SELECT second_class_code, MIN(second_class_name) AS second_class_name FROM ${dbc.schema}.cec_new_energy_second_class_type_dict WHERE if_delete = '0' ${dictTypeCondition} GROUP BY second_class_code) d
      ON t.code_val = d.second_class_code
    ORDER BY t.cnt DESC`;
  const rows = await query<{ code_val: string; name_val: string | null; cnt: string }>(sql);
  const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
  const items = rows.map(r => {
    const cleanName = r.name_val?.replace(/[（(][^）)]*[）)]/g, '').trim() || '';
    return {
      name: cleanName ? `${r.code_val} ${cleanName}` : r.code_val,
      value: Number(r.cnt),
      percentage: total > 0 ? Math.round((Number(r.cnt) / total) * 1000) / 10 : 0,
    };
  });
  return { items };
}

/** 全量测点按场站统计 */
export async function getMeasureByStation(): Promise<{
  items: Array<{ name: string; value: number; percentage: number }>
}> {
  const sql = `
    SELECT t.code_val, d.station_name AS name_val, t.cnt
    FROM (
      SELECT station_code AS code_val, COUNT(*) AS cnt
      FROM ${dbc.schema}.cec_new_energy_measurement_points
      WHERE if_delete = '0'
      GROUP BY station_code
    ) t
    LEFT JOIN (SELECT DISTINCT station_code, station_name FROM ${dbc.schema}.cec_new_energy_station_dict WHERE if_delete = '0') d
      ON t.code_val = d.station_code
    ORDER BY t.cnt DESC`;
  const rows = await query<{ code_val: string; name_val: string | null; cnt: string }>(sql);
  const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
  const items = rows.map(r => ({
    name: r.name_val || r.code_val,
    value: Number(r.cnt),
    percentage: total > 0 ? Math.round((Number(r.cnt) / total) * 1000) / 10 : 0,
  }));
  return { items };
}

/** 全量测点列表（含筛选分页） */
export async function getMeasureList(
  pageNum: number,
  pageSize: number,
  filters: {
    typeCode?: string;
    stationCode?: string;
    secondClassCode?: string;
    dataTypeCode?: string;
  },
): Promise<{
  list: Array<{
    code: string;
    station_code: string;
    type_code: string;
    second_class_code: string;
    third_class_code: string;
    data_category_code: string;
    data_code: string;
    type_name: string;
    station_name: string;
    second_class_name: string;
    third_class_name: string;
    data_type_name: string;
    data_name: string;
  }>;
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
}> {
  const conditions: string[] = [`mp.if_delete = '0'`];
  const params: string[] = [];
  let paramIdx = 1;

  if (filters.typeCode) {
    conditions.push(`mp.type_code = $${paramIdx++}`);
    params.push(filters.typeCode);
  }
  if (filters.stationCode) {
    conditions.push(`mp.station_code = $${paramIdx++}`);
    params.push(filters.stationCode);
  }
  if (filters.secondClassCode) {
    conditions.push(`mp.second_class_code = $${paramIdx++}`);
    params.push(filters.secondClassCode);
  }
  if (filters.dataTypeCode) {
    conditions.push(`mp.data_category_code = $${paramIdx++}`);
    params.push(filters.dataTypeCode);
  }

  const whereClause = conditions.join(' AND ');

  console.log('[DEBUG] getMeasureList: before count query, whereClause:', whereClause, 'params:', params);
  const countSql = `SELECT COUNT(*) AS total FROM ${dbc.schema}.cec_new_energy_measurement_points mp WHERE ${whereClause}`;
  const countResult = await queryOne<{ total: string }>(countSql, params);
  const total = Number(countResult?.total || 0);
  console.log('[DEBUG] getMeasureList: count result:', total);

  const offset = (pageNum - 1) * pageSize;

  // 先查出分页的 code 列表
  const pageSql = `SELECT mp.code FROM ${dbc.schema}.cec_new_energy_measurement_points mp WHERE ${whereClause} ORDER BY mp.create_tm DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  console.log('[DEBUG] getMeasureList: pageSql:', pageSql, 'values:', [...params, pageSize, offset]);
  const pageRows = await query<{ code: string }>(pageSql, [...params, pageSize, offset]);
  const codes = pageRows.map(r => r.code);
  console.log('[DEBUG] getMeasureList: codes count:', codes.length);
  if (codes.length === 0) {
    return { list: [], total, pageNum, pageSize, pages: Math.ceil(total / pageSize) };
  }

  // 根据 code 列表查明细（只查需要的行）
  const placeholders = codes.map((_, i) => `$${i + 1}`).join(',');
  const listSql = `
    SELECT
      mp.code,
      mp.type_code,
      mp.station_code,
      mp.second_class_code,
      mp.third_class_code,
      mp.data_category_code,
      mp.data_code,
      COALESCE(t.type_name, '') AS type_name,
      COALESCE(s.station_name, '') AS station_name,
      COALESCE(sc.second_class_name, '') AS second_class_name,
      COALESCE(tc.third_class_name, '') AS third_class_name,
      COALESCE(dt.data_category_name, '') AS data_type_name,
      COALESCE(dc.data_name, '') AS data_name
    FROM ${dbc.schema}.cec_new_energy_measurement_points mp
    LEFT JOIN (SELECT DISTINCT type_code, type_name FROM ${dbc.schema}.cec_new_energy_type_dict WHERE if_delete = '0') t ON mp.type_code = t.type_code
    LEFT JOIN (SELECT DISTINCT station_code, station_name FROM ${dbc.schema}.cec_new_energy_station_dict WHERE if_delete = '0') s ON mp.station_code = s.station_code
    LEFT JOIN (SELECT second_class_code, second_class_name FROM ${dbc.schema}.cec_new_energy_second_class_type_dict WHERE if_delete = '0' AND second_class_code IS NOT NULL) sc ON mp.second_class_code = sc.second_class_code
    LEFT JOIN (SELECT third_class_code, third_class_name FROM ${dbc.schema}.cec_new_energy_third_class_dict WHERE if_delete = '0' AND third_class_code IS NOT NULL) tc ON mp.third_class_code = tc.third_class_code
    LEFT JOIN (SELECT data_category_code, data_category_name FROM ${dbc.schema}.cec_new_energy_code_dict WHERE if_delete = '0' AND data_category_code IS NOT NULL) dt ON mp.data_category_code = dt.data_category_code
    LEFT JOIN (SELECT data_category_code, data_code, data_name FROM ${dbc.schema}.cec_new_energy_code_dict WHERE if_delete = '0' AND data_code IS NOT NULL AND data_name IS NOT NULL) dc ON mp.data_category_code = dc.data_category_code AND mp.data_code = dc.data_code
    WHERE mp.code IN (${placeholders})
    ORDER BY mp.create_tm DESC`;
  const list = await query(listSql, [...codes]);

  return {
    list,
    total,
    pageNum,
    pageSize,
    pages: Math.ceil(total / pageSize),
  };
}

/** 全量测点筛选条件选项 */
export async function getMeasureFilterOptions(): Promise<{
  typeCodes: Array<{ code: string; name: string }>;
  stationCodes: Array<{ code: string; name: string }>;
  secondClassCodes: Array<{ code: string; name: string }>;
  dataTypeCodes: Array<{ code: string; name: string }>;
}> {
  const [typeOptions, stationOptions, secondClassOptions, dataTypeOptions] = await Promise.all([
    query<{ code: string; name: string }>(
      `SELECT type_code AS code, type_name AS name FROM ${dbc.schema}.cec_new_energy_type_dict WHERE if_delete = '0' ORDER BY type_code`),
    query<{ code: string; name: string }>(
      `SELECT station_code AS code, station_name AS name FROM ${dbc.schema}.cec_new_energy_station_dict WHERE if_delete = '0' ORDER BY station_code`),
    query<{ code: string; name: string }>(
      `SELECT second_class_code AS code, MIN(second_class_name) AS name FROM ${dbc.schema}.cec_new_energy_second_class_type_dict WHERE if_delete = '0' AND second_class_code IS NOT NULL GROUP BY second_class_code ORDER BY code`),
    query<{ code: string; name: string }>(
      `SELECT data_category_code AS code, MIN(data_category_name) AS name FROM ${dbc.schema}.cec_new_energy_code_dict WHERE if_delete = '0' AND data_category_code IS NOT NULL GROUP BY data_category_code ORDER BY code`),
  ]);
  return {
    typeCodes: typeOptions,
    stationCodes: stationOptions,
    secondClassCodes: secondClassOptions,
    dataTypeCodes: dataTypeOptions,
  };
}

export async function clearMeasurementData(): Promise<void> {
  await query(`DELETE FROM ${dbc.schema}.cec_new_energy_measurement_points`);
  importStore.importing = false;
  importStore.batchId = null;
  importStore.totalRows = 0;
  importStore.importedRows = 0;
  importStore.validRows = 0;
  importStore.status = 'IDLE';
  importStore.message = undefined;
}
