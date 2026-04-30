import { stringSimilarity } from '@cec/shared';
import { parseCode, isValidCodeFormat } from '../code-generation/code-domain.js';
import { query as dbQuery } from '../../db/index.js';
import { config } from '../../config/index.js';
import { MemoryCache } from '../../common/memory-cache.js';

const schema = config.db.schema;

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

/** 校验单条编码 */
export function validateSingleCode(code: string, dictItems: Record<string, Set<string>>): {
  result: 'COMPLIANT' | 'ABNORMAL';
  errorReason?: string;
} {
  if (!isValidCodeFormat(code)) {
    return { result: 'ABNORMAL', errorReason: '编码格式不正确，必须为31位字母数字组合' };
  }

  const segments = parseCode(code);
  if (segments.length !== 11) {
    return { result: 'ABNORMAL', errorReason: '编码段数不正确' };
  }

  const segmentNames = [
    '场站编码', '类型编码', '项目期号编码', '前缀号',
    '一级类码', '二级类码', '二级类扩展码', '三级类码',
    '三级类扩展码', '数据类码', '数据码',
  ];

  for (let i = 0; i < segments.length; i++) {
    const dictKey = getDictKeyForSegment(i);
    const dictSet = dictItems[dictKey];
    if (dictSet && !dictSet.has(segments[i])) {
      return {
        result: 'ABNORMAL',
        errorReason: `${segmentNames[i]}"${segments[i]}"不在字典范围内`,
      };
    }
  }

  return { result: 'COMPLIANT' };
}

/** 获取纠错建议（编辑距离匹配） */
export function getCorrectionSuggestions(
  code: string,
  dictItems: Record<string, Array<{ code: string; name: string }>>,
): Array<{ code: string; name: string; similarity: number }> {
  const allCandidates: Array<{ code: string; name: string; similarity: number }> = [];

  for (const [, items] of Object.entries(dictItems)) {
    for (const item of items) {
      const sim = stringSimilarity(code, item.code);
      if (sim >= 0.6) {
        allCandidates.push({ ...item, similarity: sim });
      }
    }
  }

  allCandidates.sort((a, b) => b.similarity - a.similarity);
  return allCandidates.slice(0, 3);
}

function getDictKeyForSegment(segmentIndex: number): string {
  const keys = [
    'station', 'type', 'projectLine', 'prefix',
    'firstClass', 'secondClass', 'secondExt', 'thirdClass',
    'thirdExt', 'dataType', 'dataCode',
  ];
  return keys[segmentIndex] || 'unknown';
}

/** ---- 以下为编码校验页面3个模块新增的函数 ---- */

export interface DictTreeNode {
  code: string;
  name: string;
  type: 'secondClass' | 'dataCategory' | 'dataCode';
  isManual?: string;
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
}

export interface ResolvedCodeItem {
  typeCode: string;
  typeName: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
  matchedCodes: Array<{ code: string; name: string }>;
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
       FROM ${schema}.cec_new_energy_code_dict
       WHERE if_delete = '0' ORDER BY td`,
    ),
    dbQuery<{ td: string; sc: string; sn: string }>(
      `SELECT DISTINCT type_domain_code AS td,
              second_class_code AS sc, second_class_name AS sn
       FROM ${schema}.cec_new_energy_code_dict
       WHERE if_delete = '0' ORDER BY td, sc`,
    ),
    dbQuery<{ td: string; sc: string; dc: string; dn: string; hm: boolean; cnt: number }>(
      `SELECT type_domain_code AS td, second_class_code AS sc,
              data_category_code AS dc, data_category_name AS dn,
              BOOL_OR(is_manual = '1') AS hm, COUNT(*) AS cnt
       FROM ${schema}.cec_new_energy_code_dict
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
  const rows = await dbQuery<{ dcode: string; dname: string; im: string }>(
    `SELECT data_code AS dcode, data_name AS dname, is_manual AS im
     FROM ${schema}.cec_new_energy_code_dict
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
  }));
}


/** 根据 type_code 获取 type_domain_code（F1→F, G1→G, S1→S, Y0→null） */
function typeCodeToDomain(typeCode: string): string | null {
  if (typeCode.startsWith('F')) return 'F';
  if (typeCode.startsWith('G')) return 'G';
  if (typeCode.startsWith('S')) return 'S';
  return null;
}

/** 分页查询手动添加的编码记录 */
export async function getManualStatistics(
  pageNum: number,
  pageSize: number,
  secondClassCode?: string,
  typeCode?: string,
): Promise<{
  items: ManualStatItem[];
  total: number;
  secondClassOptions: Array<{ code: string; name: string }>;
  typeOptions: Array<{ code: string; name: string }>;
}> {
  // 动态构建过滤条件
  const conditions: string[] = ["d.if_delete = '0'", "d.is_manual = '1'"];
  const params: any[] = [];
  let paramIdx = 1;

  if (secondClassCode) {
    conditions.push(`d.second_class_code = $${paramIdx++}`);
    params.push(secondClassCode);
  }
  if (typeCode) {
    const domainCode = typeCodeToDomain(typeCode);
    const tcIdx = paramIdx++;
    params.push(typeCode);
    // 域级筛选（如 'F' 匹配 F1/F2/F3/F4）
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
          SELECT second_class_code FROM ${schema}.cec_new_energy_second_class_type_dict
          WHERE type_code = $${tcIdx} AND if_delete = '0'
        ))
      )`);
    }
  }

  const whereClause = conditions.join(' AND ');

  // 总数
  const countResult = await dbQuery<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM ${schema}.cec_new_energy_code_dict d WHERE ${whereClause}`,
    params,
  );
  const total = Number(countResult[0].cnt);

  // 二级类码选项（受 typeCode 过滤）
  const optionRows = await dbQuery<{ code: string; name: string }>(
    `SELECT DISTINCT d.second_class_code AS code, d.second_class_name AS name
     FROM ${schema}.cec_new_energy_code_dict d
     WHERE ${whereClause} ORDER BY code`,
    params,
  );

  // 所有类型选项（按域级聚合: F/G）
  const typeRows = await dbQuery<{ code: string; name: string }>(
    `SELECT SUBSTRING(type_code, 1, 1) AS code,
            CASE WHEN SUBSTRING(type_code, 1, 1) = 'F' THEN '风电'
                 WHEN SUBSTRING(type_code, 1, 1) = 'G' THEN '光伏'
                 WHEN SUBSTRING(type_code, 1, 1) = 'S' THEN '水电'
                 ELSE '其他' END AS name
     FROM ${schema}.cec_new_energy_type_dict
     WHERE if_delete = '0'
     GROUP BY SUBSTRING(type_code, 1, 1)
     ORDER BY code`,
  );

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
              SELECT t.type_code FROM ${schema}.cec_new_energy_second_class_type_dict sct
              JOIN ${schema}.cec_new_energy_type_dict t ON t.type_code = sct.type_code
              WHERE sct.second_class_code = d.second_class_code
                AND sct.type_code LIKE d.type_domain_code || '%'
                AND sct.if_delete = '0' AND t.if_delete = '0'
              LIMIT 1
            )) AS "typeCode",
            COALESCE(
              (SELECT t.type_name FROM ${schema}.cec_new_energy_type_dict t
               WHERE t.type_code = d.type_code AND t.if_delete = '0' LIMIT 1),
              (SELECT t.type_name FROM ${schema}.cec_new_energy_second_class_type_dict sct
               JOIN ${schema}.cec_new_energy_type_dict t ON t.type_code = sct.type_code
               WHERE sct.second_class_code = d.second_class_code
                 AND sct.type_code LIKE d.type_domain_code || '%'
                 AND sct.if_delete = '0' AND t.if_delete = '0'
               LIMIT 1)
            ) AS "typeName"
     FROM ${schema}.cec_new_energy_code_dict d
     WHERE ${whereClause}
     ORDER BY d.create_tm DESC
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
export async function getAllManualStatistics(secondClassCode?: string, typeCode?: string): Promise<ManualStatItem[]> {
  const conditions: string[] = ["d.if_delete = '0'", "d.is_manual = '1'"];
  const params: any[] = [];
  let paramIdx = 1;

  if (secondClassCode) {
    conditions.push(`d.second_class_code = $${paramIdx++}`);
    params.push(secondClassCode);
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
          SELECT second_class_code FROM ${schema}.cec_new_energy_second_class_type_dict
          WHERE type_code = $${tcIdx} AND if_delete = '0'
        ))
      )`);
    }
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
              SELECT t.type_code FROM ${schema}.cec_new_energy_second_class_type_dict sct
              JOIN ${schema}.cec_new_energy_type_dict t ON t.type_code = sct.type_code
              WHERE sct.second_class_code = d.second_class_code
                AND sct.type_code LIKE d.type_domain_code || '%'
                AND sct.if_delete = '0' AND t.if_delete = '0'
              LIMIT 1
            )) AS "typeCode",
            COALESCE(
              (SELECT t.type_name FROM ${schema}.cec_new_energy_type_dict t
               WHERE t.type_code = d.type_code AND t.if_delete = '0' LIMIT 1),
              (SELECT t.type_name FROM ${schema}.cec_new_energy_second_class_type_dict sct
               JOIN ${schema}.cec_new_energy_type_dict t ON t.type_code = sct.type_code
               WHERE sct.second_class_code = d.second_class_code
                 AND sct.type_code LIKE d.type_domain_code || '%'
                 AND sct.if_delete = '0' AND t.if_delete = '0'
               LIMIT 1)
            ) AS "typeName"
     FROM ${schema}.cec_new_energy_code_dict d
     WHERE ${whereClause}
     ORDER BY d.create_tm DESC`,
    params,
  );
}

/**
 * 批量解析编码列表
 * 从31位编码中截取: 类型(5-6位)、二级类码(13-15位)、数据类码(27-28位)、数据码(29-31位)
 */
export async function resolveCodesFromDB(
  codeList: Array<{ code: string; name?: string }>,
): Promise<ResolvedCodeItem[]> {
  const extractedMap = new Map<string, {
    typeCode: string;
    secondClassCode: string;
    dataCategoryCode: string;
    dataCode: string;
    matchedCodes: Array<{ code: string; name: string }>;
  }>();

  for (const item of codeList) {
    const code = item.code;
    if (code.length < 31) continue;

    const typeCode = code.substring(4, 6);
    const secondClassCode = code.substring(12, 15);
    const dataCategoryCode = code.substring(26, 28);
    const dataCode = code.substring(28, 31);

    const key = `${typeCode}|${secondClassCode}|${dataCategoryCode}|${dataCode}`;

    if (!extractedMap.has(key)) {
      extractedMap.set(key, {
        typeCode,
        secondClassCode,
        dataCategoryCode,
        dataCode,
        matchedCodes: [],
      });
    }
    extractedMap.get(key)!.matchedCodes.push({
      code: item.code,
      name: item.name || '',
    });
  }

  const keys = Array.from(extractedMap.keys()).sort();
  const result: ResolvedCodeItem[] = [];

  for (const key of keys) {
    const entry = extractedMap.get(key)!;
    const typeCode = entry.typeCode;
    // 类型域编码：取类型第一位（如 F1→F, G1→G, Y0→Y）
    const typeDomainCode = typeCode.substring(0, 1);

    // 查询类型名称
    const typeRows = await dbQuery<{ type_name: string }>(
      `SELECT type_name FROM ${schema}.cec_new_energy_type_dict
       WHERE type_code = $1 AND if_delete = '0' LIMIT 1`,
      [typeCode],
    );
    const typeName = typeRows.length > 0 ? typeRows[0].type_name : typeCode;

    // 分层匹配：二级类码
    const scRows = await dbQuery<{ second_class_name: string }>(
      `SELECT DISTINCT second_class_name FROM ${schema}.cec_new_energy_code_dict
       WHERE if_delete = '0' AND type_domain_code = $1 AND second_class_code = $2
       LIMIT 1`,
      [typeDomainCode, entry.secondClassCode],
    );
    const secondClassName = scRows.length > 0
      ? scRows[0].second_class_name
      : `未识别`;

    // 分层匹配：数据类码（在类型域+二级类码下搜索）
    const dcRows = await dbQuery<{ data_category_name: string }>(
      `SELECT DISTINCT data_category_name FROM ${schema}.cec_new_energy_code_dict
       WHERE if_delete = '0' AND type_domain_code = $1 AND second_class_code = $2 AND data_category_code = $3
       LIMIT 1`,
      [typeDomainCode, entry.secondClassCode, entry.dataCategoryCode],
    );
    const dataCategoryName = dcRows.length > 0
      ? dcRows[0].data_category_name
      : `未识别`;

    // 分层匹配：数据码（在类型域+二级类码+数据类码下搜索）
    const dRows = await dbQuery<{ data_name: string }>(
      `SELECT data_name FROM ${schema}.cec_new_energy_code_dict
       WHERE if_delete = '0' AND type_domain_code = $1 AND second_class_code = $2
         AND data_category_code = $3 AND data_code = $4
       LIMIT 1`,
      [typeDomainCode, entry.secondClassCode, entry.dataCategoryCode, entry.dataCode],
    );
    const dataName = dRows.length > 0
      ? dRows[0].data_name
      : `未识别`;

    result.push({
      typeCode,
      typeName,
      secondClassCode: entry.secondClassCode,
      secondClassName,
      dataCategoryCode: entry.dataCategoryCode,
      dataCategoryName,
      dataCode: entry.dataCode,
      dataName,
      matchedCodes: entry.matchedCodes,
    });
  }

  return result;
}

/** 保存编码修改映射 */
export async function saveCodeMapping(input: {
  oldCode: string;
  newCode: string;
  oldName: string;
  newName: string;
  creator: string;
}): Promise<void> {
  await dbQuery(
    `CREATE TABLE IF NOT EXISTS ${schema}.cec_new_energy_code_mapping (
      id BIGSERIAL PRIMARY KEY,
      old_code VARCHAR(31) NOT NULL,
      new_code VARCHAR(31) NOT NULL,
      old_name VARCHAR(500),
      new_name VARCHAR(500),
      creator VARCHAR(50),
      create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await dbQuery(
    `INSERT INTO ${schema}.cec_new_energy_code_mapping
     (old_code, new_code, old_name, new_name, creator, create_tm)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [input.oldCode, input.newCode, input.oldName, input.newName, input.creator],
  );
}
