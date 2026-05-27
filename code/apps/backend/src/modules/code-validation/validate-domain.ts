import { query as dbQuery, getSchema } from '../../db/index.js';
import { MemoryCache } from '../../common/memory-cache.js';

const dictTreeCache = new MemoryCache<DictTreeNode[]>();
const DICT_TREE_CACHE_KEY = 'dictTree';
const DICT_TREE_CACHE_TTL = 30 * 60 * 1000; // 30 分钟
/** 用于服务启动时预加载，避免用户首次等待 */
export function prewarmDictTree(): void {
  getDictTree().catch(() => {});
}

export function invalidateDictTreeCache(): void {
  dictTreeCache.del(DICT_TREE_CACHE_KEY);
}

export interface DictTreeNode {
  code: string;
  name: string;
  type: 'typeDomain' | 'secondClass' | 'dataCategory' | 'dataCode';
  isManual?: string;
  sourceTenant?: string;
  children?: DictTreeNode[];
  childCount?: number;
}

export interface ManualStatItem {
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
  createTm: string;
  typeCode?: string;
  typeName?: string;
  status?: string | null;
  rejectReason?: string | null;
  draftId?: number | null;
}

/** 获取字典树数据（三级：类型域→二级类码→数据类码，数据码展开时懒加载） */
export async function getDictTree(): Promise<DictTreeNode[]> {
  // 优先读缓存
  const cached = dictTreeCache.get(DICT_TREE_CACHE_KEY);
  if (cached) return cached;

  // 三个并行轻量查询，不含数据码
  const [typeDomains, secondClasses, dataCategories] = await Promise.all([
    dbQuery<{ td: string }>(
      `SELECT DISTINCT type_domain_code AS td
       FROM ${getSchema()}.cec_new_energy_code_dict
       WHERE if_delete = '0' ORDER BY td`,
    ),
    dbQuery<{ td: string; sc: string; sn: string }>(
      `SELECT DISTINCT type_domain_code AS td,
              second_class_code AS sc, second_class_name AS sn
       FROM ${getSchema()}.cec_new_energy_code_dict
       WHERE if_delete = '0' ORDER BY td, sc`,
    ),
    dbQuery<{ td: string; sc: string; dc: string; dn: string; hm: boolean; cnt: number }>(
      `SELECT type_domain_code AS td, second_class_code AS sc,
              data_category_code AS dc, data_category_name AS dn,
              BOOL_OR(is_manual = '1') AS hm, COUNT(*) AS cnt
       FROM ${getSchema()}.cec_new_energy_code_dict
       WHERE if_delete = '0' AND data_code IS NOT NULL
       GROUP BY td, sc, dc, dn
       ORDER BY td, sc, dc`,
    ),
  ]);

  const typeLabel: Record<string, string> = {
    F: '风电',
    G: '光伏',
    S: '水电',
  };

  const typeDomainMap = new Map<string, DictTreeNode>();
  const secondClassMap = new Map<string, DictTreeNode>();

  for (const row of typeDomains) {
    typeDomainMap.set(row.td, {
      code: row.td,
      name: typeLabel[row.td] || row.td,
      type: 'typeDomain',
      children: [],
    });
  }

  for (const row of secondClasses) {
    const scKey = `${row.td}|${row.sc}`;
    typeDomainMap.get(row.td)?.children!.push(
      secondClassMap.set(scKey, {
        code: row.sc,
        name: row.sn,
        type: 'secondClass',
        children: [],
      }).get(scKey)!,
    );
  }

  for (const row of dataCategories) {
    const scKey = `${row.td}|${row.sc}`;
    secondClassMap.get(scKey)?.children!.push({
      code: row.dc,
      name: row.dn,
      type: 'dataCategory',
      isManual: row.hm ? '1' : '0',
      childCount: Number(row.cnt),
      children: [],
    });
  }

  for (const td of typeDomainMap.values()) {
    for (const sc of td.children!) {
      sc.childCount = sc.children?.length || 0;
    }
    td.childCount = td.children?.length || 0;
  }

  const result = Array.from(typeDomainMap.values());
  dictTreeCache.set(DICT_TREE_CACHE_KEY, result, DICT_TREE_CACHE_TTL);
  return result;
}

/** 懒加载获取指定数据类码下的数据码 */
export async function getDictTreeDataCodes(
  typeDomainCode: string,
  secondClassCode: string,
  dataCategoryCode: string,
): Promise<DictTreeNode[]> {
  const rows = await dbQuery<{ dcode: string; dname: string; im: string; st: string | null }>(
    `SELECT data_code AS dcode, data_name AS dname, is_manual AS im, source_tenant AS st
     FROM ${getSchema()}.cec_new_energy_code_dict
     WHERE if_delete = '0'
       AND type_domain_code = $1
       AND second_class_code = $2
       AND data_category_code = $3
       AND data_code IS NOT NULL
       AND data_code != data_name
     ORDER BY data_code`,
    [typeDomainCode, secondClassCode, dataCategoryCode],
  );
  return rows.map(r => ({
    code: r.dcode,
    name: r.dname,
    type: 'dataCode' as const,
    isManual: r.im,
    sourceTenant: r.st || undefined,
  }));
}


/** 根据 type_code 获取 type_domain_code（F1→F, G1→G, S1→S, Y0→null） */
function typeCodeToDomain(typeCode: string): string | null {
  if (typeCode.startsWith('F')) return 'F';
  if (typeCode.startsWith('G')) return 'G';
  if (typeCode.startsWith('S')) return 'S';
  return null;
}

/** 排序字段白名单，防止 SQL 注入 */
const SORT_COLUMNS: Record<string, string> = {
  secondClassCode: 'd.second_class_code',
  dataCategoryCode: 'd.data_category_code',
  dataCode: 'd.data_code',
  createTm: 'd.create_tm',
};

/** 分页查询手动添加的编码记录 */
export async function getManualStatistics(
  pageNum: number,
  pageSize: number,
  secondClassCode?: string,
  typeCode?: string,
  sortBy?: string,
  sortOrder?: string,
): Promise<{
  items: ManualStatItem[];
  total: number;
  secondClassOptions: Array<{ code: string; name: string }>;
  typeOptions: Array<{ code: string; name: string }>;
}> {
  // 动态构建过滤条件
  // 数据过滤条件（含所有筛选）
  const dataConditions: string[] = ["d.if_delete = '0'", "d.is_manual = '1'"];
  // 选项过滤条件（不含 secondClassCode，避免选中后选项列表只剩当前项）
  const optConditions: string[] = ["d.if_delete = '0'", "d.is_manual = '1'"];
  const params: any[] = [];
  const optParams: any[] = [];
  let paramIdx = 1;
  let optParamIdx = 1;

  if (secondClassCode) {
    // 支持 "code|name" 格式，同时匹配编码和名称
    const parts = secondClassCode.split('|');
    const scIdx = paramIdx++;
    params.push(parts[0]);
    dataConditions.push(`d.second_class_code = $${scIdx}`);
    if (parts.length > 1) {
      const snIdx = paramIdx++;
      params.push(parts[1]);
      dataConditions.push(`d.second_class_name = $${snIdx}`);
    }
  }
  if (typeCode) {
    const domainCode = typeCodeToDomain(typeCode);

    // 数据查询参数
    const tcIdx = paramIdx++;
    params.push(typeCode);
    // 选项查询参数（独立索引，不包含 secondClassCode）
    const optTcIdx = optParamIdx++;
    optParams.push(typeCode);

    if (domainCode) {
      const domIdx = paramIdx++;
      params.push(domainCode);
      const optDomIdx = optParamIdx++;
      optParams.push(domainCode);

      const dataFilter = `(
        d.type_code LIKE $${tcIdx} || '%'
        OR (d.type_code IS NULL AND d.type_domain_code = $${domIdx})
      )`;
      dataConditions.push(dataFilter);

      const optFilter = `(
        d.type_code LIKE $${optTcIdx} || '%'
        OR (d.type_code IS NULL AND d.type_domain_code = $${optDomIdx})
      )`;
      optConditions.push(optFilter);
    } else {
      const dataFilter = `(
        d.type_code = $${tcIdx}
        OR (d.type_code IS NULL AND d.second_class_code IN (
          SELECT second_class_code FROM ${getSchema()}.cec_new_energy_second_class_type_dict
          WHERE type_code = $${tcIdx} AND if_delete = '0'
        ))
      )`;
      dataConditions.push(dataFilter);

      const optFilter = `(
        d.type_code = $${optTcIdx}
        OR (d.type_code IS NULL AND d.second_class_code IN (
          SELECT second_class_code FROM ${getSchema()}.cec_new_energy_second_class_type_dict
          WHERE type_code = $${optTcIdx} AND if_delete = '0'
        ))
      )`;
      optConditions.push(optFilter);
    }
  }

  const whereClause = dataConditions.join(' AND ');
  const optionWhereClause = optConditions.join(' AND ');

  // 总数
  const countResult = await dbQuery<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM ${getSchema()}.cec_new_energy_code_dict d WHERE ${whereClause}`,
    params,
  );
  const total = Number(countResult[0].cnt);

  // 二级类码选项（不含 secondClassCode 过滤，避免选中后选项只剩当前项）
  const optionRows = await dbQuery<{ code: string; name: string }>(
    `SELECT DISTINCT d.second_class_code AS code, d.second_class_name AS name
     FROM ${getSchema()}.cec_new_energy_code_dict d
     WHERE ${optionWhereClause} ORDER BY code`,
    optParams,
  );

  // 所有类型选项（按域级聚合: F/G）
  const typeRows = await dbQuery<{ code: string; name: string }>(
    `SELECT SUBSTRING(type_code, 1, 1) AS code,
            CASE WHEN SUBSTRING(type_code, 1, 1) = 'F' THEN '风电'
                 WHEN SUBSTRING(type_code, 1, 1) = 'G' THEN '光伏'
                 WHEN SUBSTRING(type_code, 1, 1) = 'S' THEN '水电'
                 ELSE '其他' END AS name
     FROM ${getSchema()}.cec_new_energy_type_dict
     WHERE if_delete = '0'
     GROUP BY SUBSTRING(type_code, 1, 1)
     ORDER BY code`,
  );

  // 排序（多列联动：sortBy="col1,col2" sortOrder="asc,desc"，最后添加的优先级最高）
  let orderBy = 'd.create_tm DESC';
  if (sortBy && sortOrder) {
    const cols = sortBy.split(',');
    const dirs = sortOrder.split(',');
    const clauses: string[] = [];
    // 反转：前端最后添加的优先级最高 → SQL 最左边的优先级最高
    for (let i = cols.length - 1; i >= 0; i--) {
      const col = SORT_COLUMNS[cols[i]];
      if (col) {
        clauses.push(`${col} ${dirs[i] === 'ascending' ? 'ASC' : 'DESC'}`);
      }
    }
    if (clauses.length > 0) orderBy = clauses.join(', ');
  }

  // 分页数据
  const offset = (pageNum - 1) * pageSize;
  const itemsParams = [...params, pageSize, offset];
  const items = await dbQuery<ManualStatItem>(
    `SELECT d.second_class_code AS "secondClassCode",
            d.second_class_name AS "secondClassName",
            d.data_category_code AS "dataCategoryCode",
            d.data_category_name AS "dataCategoryName",
            d.data_code AS "dataCode",
            d.data_name AS "dataName",
            d.create_tm AS "createTm",
            COALESCE(d.type_code, (
              SELECT t.type_code FROM ${getSchema()}.cec_new_energy_second_class_type_dict sct
              JOIN ${getSchema()}.cec_new_energy_type_dict t ON t.type_code = sct.type_code
              WHERE sct.second_class_code = d.second_class_code
                AND sct.type_code LIKE d.type_domain_code || '%'
                AND sct.if_delete = '0' AND t.if_delete = '0'
              LIMIT 1
            )) AS "typeCode",
            COALESCE(
              (SELECT t.type_name FROM ${getSchema()}.cec_new_energy_type_dict t
               WHERE t.type_code = d.type_code AND t.if_delete = '0' LIMIT 1),
              (SELECT t.type_name FROM ${getSchema()}.cec_new_energy_second_class_type_dict sct
               JOIN ${getSchema()}.cec_new_energy_type_dict t ON t.type_code = sct.type_code
               WHERE sct.second_class_code = d.second_class_code
                 AND sct.type_code LIKE d.type_domain_code || '%'
                 AND sct.if_delete = '0' AND t.if_delete = '0'
               LIMIT 1)
            ) AS "typeName",
            dr.status AS "status",
            dr.reject_reason AS "rejectReason",
            dr.draft_id AS "draftId"
     FROM ${getSchema()}.cec_new_energy_code_dict d
     LEFT JOIN ${getSchema()}.cec_new_energy_code_draft dr
       ON dr.type_code = d.type_domain_code
      AND dr.second_class_code = d.second_class_code
      AND dr.data_category_code = d.data_category_code
      AND dr.data_code = d.data_code
      AND dr.status IN ('submitted', 'approved', 'rejected')
     WHERE ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    itemsParams,
  );

  return {
    items,
    total,
    secondClassOptions: optionRows.map((r) => ({ code: r.code, name: r.name })),
    typeOptions: typeRows.map((r) => ({ code: r.code, name: r.name })),
  };
}

/** 获取所有手动添加记录（不分页，用于导出） */
export async function getAllManualStatistics(secondClassCode?: string, typeCode?: string, sortBy?: string, sortOrder?: string): Promise<ManualStatItem[]> {
  const conditions: string[] = ["d.if_delete = '0'", "d.is_manual = '1'"];
  const params: any[] = [];
  let paramIdx = 1;

  if (secondClassCode) {
    // 支持 "code|name" 格式，同时匹配编码和名称
    const parts = secondClassCode.split('|');
    conditions.push(`d.second_class_code = $${paramIdx++}`);
    params.push(parts[0]);
    if (parts.length > 1) {
      conditions.push(`d.second_class_name = $${paramIdx++}`);
      params.push(parts[1]);
    }
  }
  if (typeCode) {
    const domainCode = typeCodeToDomain(typeCode);
    const tcIdx = paramIdx++;
    params.push(typeCode);
    if (domainCode) {
      const domIdx = paramIdx++;
      params.push(domainCode);
      conditions.push(`(
        d.type_code LIKE $${tcIdx} || '%'
        OR (d.type_code IS NULL AND d.type_domain_code = $${domIdx})
      )`);
    } else {
      conditions.push(`(
        d.type_code = $${tcIdx}
        OR (d.type_code IS NULL AND d.second_class_code IN (
          SELECT second_class_code FROM ${getSchema()}.cec_new_energy_second_class_type_dict
          WHERE type_code = $${tcIdx} AND if_delete = '0'
        ))
      )`);
    }
  }

  // 排序（多列联动，最后添加的优先级最高）
  let orderBy = 'd.create_tm DESC';
  if (sortBy && sortOrder) {
    const cols = sortBy.split(',');
    const dirs = sortOrder.split(',');
    const clauses: string[] = [];
    for (let i = cols.length - 1; i >= 0; i--) {
      const col = SORT_COLUMNS[cols[i]];
      if (col) {
        clauses.push(`${col} ${dirs[i] === 'ascending' ? 'ASC' : 'DESC'}`);
      }
    }
    if (clauses.length > 0) orderBy = clauses.join(', ');
  }

  const whereClause = conditions.join(' AND ');

  return dbQuery<ManualStatItem>(
    `SELECT d.second_class_code AS "secondClassCode",
            d.second_class_name AS "secondClassName",
            d.data_category_code AS "dataCategoryCode",
            d.data_category_name AS "dataCategoryName",
            d.data_code AS "dataCode",
            d.data_name AS "dataName",
            d.create_tm AS "createTm",
            COALESCE(d.type_code, (
              SELECT t.type_code FROM ${getSchema()}.cec_new_energy_second_class_type_dict sct
              JOIN ${getSchema()}.cec_new_energy_type_dict t ON t.type_code = sct.type_code
              WHERE sct.second_class_code = d.second_class_code
                AND sct.type_code LIKE d.type_domain_code || '%'
                AND sct.if_delete = '0' AND t.if_delete = '0'
              LIMIT 1
            )) AS "typeCode",
            COALESCE(
              (SELECT t.type_name FROM ${getSchema()}.cec_new_energy_type_dict t
               WHERE t.type_code = d.type_code AND t.if_delete = '0' LIMIT 1),
              (SELECT t.type_name FROM ${getSchema()}.cec_new_energy_second_class_type_dict sct
               JOIN ${getSchema()}.cec_new_energy_type_dict t ON t.type_code = sct.type_code
               WHERE sct.second_class_code = d.second_class_code
                 AND sct.type_code LIKE d.type_domain_code || '%'
                 AND sct.if_delete = '0' AND t.if_delete = '0'
               LIMIT 1)
            ) AS "typeName"
     FROM ${getSchema()}.cec_new_energy_code_dict d
     WHERE ${whereClause}
     ORDER BY ${orderBy}`,
    params,
  );
}

// ========== 编码修正 ==========

/** 编码段位定义 */
export const CODE_SEGMENTS = [
  { label: '场站编码', start: 0, length: 4 },
  { label: '类型编码', start: 4, length: 2 },
  { label: '项目期号', start: 6, length: 3 },
  { label: '前缀号', start: 9, length: 1 },
  { label: '一级类码', start: 10, length: 2 },
  { label: '二级类码', start: 12, length: 3 },
  { label: '二级类扩展码', start: 15, length: 4 },
  { label: '三级类码', start: 19, length: 3 },
  { label: '三级类扩展码', start: 22, length: 4 },
  { label: '数据类码', start: 26, length: 2 },
  { label: '数据码', start: 28, length: 3 },
] as const;

/** 修改内容项 */
export interface ModificationItem {
  segmentLabel: string;
  newValue: string;
}

/** 段位变更记录 */
export interface SegmentChange {
  segmentLabel: string;
  oldValue: string;
  newValue: string;
  start: number;
  length: number;
}

/** 编码修正结果 */
export interface CodeCorrectionResult {
  oldCode: string;
  newCode: string;
  description: string;
  modification: string;
  changes: SegmentChange[];
  duplicate: boolean;
  correctionTime: string;
}

/**
 * 解析修改内容字符串
 * 格式: "数据类码修改为11，数据码修改为112"
 * 支持: 段位名称修改为新值，多条用中文逗号分隔
 */
export function parseModificationContent(content: string): ModificationItem[] {
  const items: ModificationItem[] = [];
  const parts = content.split(/[,，]/).map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    const match = part.match(/^(.+?)修改为(.+)$/);
    if (match) {
      items.push({ segmentLabel: match[1].trim(), newValue: match[2].trim() });
    }
  }

  return items;
}

/**
 * 根据修改内容对31位编码进行修正
 * @returns 修正后的编码和变更段位列表，无效则返回 null
 */
export function applyCodeModifications(
  code: string,
  modifications: ModificationItem[],
): { newCode: string; changes: SegmentChange[] } | null {
  if (!/^[A-Za-z0-9]{31}$/.test(code)) return null;

  const segMap = new Map<string, typeof CODE_SEGMENTS[number]>(CODE_SEGMENTS.map(s => [s.label, s]));
  let newCode = code;
  const changes: SegmentChange[] = [];

  for (const mod of modifications) {
    const seg = segMap.get(mod.segmentLabel);
    if (!seg) continue;

    const oldValue = code.substring(seg.start, seg.start + seg.length);
    if (oldValue === mod.newValue) continue;

    // 校验新值长度
    if (mod.newValue.length !== seg.length) continue;

    newCode = newCode.substring(0, seg.start) + mod.newValue + newCode.substring(seg.start + seg.length);
    changes.push({
      segmentLabel: seg.label,
      oldValue,
      newValue: mod.newValue,
      start: seg.start,
      length: seg.length,
    });
  }

  if (changes.length === 0) return null;
  return { newCode, changes };
}

/**
 * 批量修正编码
 */
export async function batchCorrectCodes(
  items: Array<{ code: string; description: string; modification: string }>,
): Promise<CodeCorrectionResult[]> {
  // 确保修正记录表存在
  await dbQuery(
    `CREATE TABLE IF NOT EXISTS ${getSchema()}.cec_new_energy_code_correction (
      id BIGSERIAL PRIMARY KEY,
      old_code VARCHAR(31) NOT NULL,
      new_code VARCHAR(31) NOT NULL,
      description VARCHAR(500),
      modification TEXT,
      duplicate CHAR(1) DEFAULT '0',
      correction_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  const results: CodeCorrectionResult[] = [];
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newCodes: string[] = [];

  // 第一遍：解析和应用修改，收集新编码
  const parsedItems: Array<{
    original: typeof items[0];
    newCode: string;
    changes: SegmentChange[];
  }> = [];

  for (const item of items) {
    const mods = parseModificationContent(item.modification);
    if (mods.length === 0) continue;

    const result = applyCodeModifications(item.code, mods);
    if (!result) continue;

    parsedItems.push({ original: item, ...result });
    newCodes.push(result.newCode);
  }

  // 批量查询新编码是否在测点表中存在
  const duplicateMap = new Map<string, boolean>();
  if (newCodes.length > 0) {
    const placeholders = newCodes.map((_, i) => `$${i + 1}`).join(',');
    const rows = await dbQuery<{ code: string }>(
      `SELECT code FROM ${getSchema()}.cec_new_energy_measurement_points WHERE code IN (${placeholders}) AND if_delete = '0'`,
      newCodes,
    );
    const existSet = new Set(rows.map(r => r.code));
    for (const nc of newCodes) {
      duplicateMap.set(nc, existSet.has(nc));
    }
  }

  // 统计修正后编码在本次输入中的重复次数
  const inputCountMap = new Map<string, number>();
  for (const nc of newCodes) {
    inputCountMap.set(nc, (inputCountMap.get(nc) || 0) + 1);
  }

  // 第二遍：构建结果并入库
  for (const parsed of parsedItems) {
    // 数据库重复 或 输入内重复 均视为重复
    const duplicate = duplicateMap.get(parsed.newCode) || inputCountMap.get(parsed.newCode)! > 1;
    results.push({
      oldCode: parsed.original.code,
      newCode: parsed.newCode,
      description: parsed.original.description,
      modification: parsed.original.modification,
      changes: parsed.changes,
      duplicate,
      correctionTime: now,
    });

    await dbQuery(
      `INSERT INTO ${getSchema()}.cec_new_energy_code_correction
       (old_code, new_code, description, modification, duplicate, correction_tm)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [parsed.original.code, parsed.newCode, parsed.original.description, parsed.original.modification, duplicate ? '1' : '0', now],
    );
  }

  return results;
}

/** 根据字段查询数据码字典条目 */
export async function getDictEntryByFields(fields: {
  typeDomainCode: string;
  secondClassCode: string;
  dataCategoryCode: string;
  dataCode: string;
}): Promise<{
  secondClassName: string;
  dataCategoryName: string;
  dataName: string;
} | null> {
  const sql = `SELECT second_class_name AS "secondClassName",
                      data_category_name AS "dataCategoryName",
                      data_name AS "dataName"
               FROM ${getSchema()}.cec_new_energy_code_dict
               WHERE type_domain_code = $1
                 AND second_class_code = $2
                 AND data_category_code = $3
                 AND data_code = $4
                 AND if_delete = '0'
                 AND is_manual = '1'
               LIMIT 1`;
  const rows = await dbQuery<any>(sql, [
    fields.typeDomainCode,
    fields.secondClassCode,
    fields.dataCategoryCode,
    fields.dataCode,
  ]);
  return rows[0] || null;
}

/** 软删除手动添加的数据码 */
export async function deleteManualCode(fields: {
  typeDomainCode: string;
  secondClassCode: string;
  dataCategoryCode: string;
  dataCode: string;
}): Promise<boolean> {
  const sql = `UPDATE ${getSchema()}.cec_new_energy_code_dict
               SET if_delete = '1', modify_tm = NOW()
               WHERE type_domain_code = $1
                 AND second_class_code = $2
                 AND data_category_code = $3
                 AND data_code = $4
                 AND if_delete = '0'
                 AND is_manual = '1'
               RETURNING data_code`;
  const result = await dbQuery<{ data_code: string }>(sql, [
    fields.typeDomainCode,
    fields.secondClassCode,
    fields.dataCategoryCode,
    fields.dataCode,
  ]);
  return result.length > 0;
}
