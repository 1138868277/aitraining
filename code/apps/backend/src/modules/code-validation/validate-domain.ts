import { stringSimilarity } from '@cec/shared';
import { parseCode, isValidCodeFormat } from '../code-generation/code-domain.js';
import { query as dbQuery } from '../../db/index.js';
import { config } from '../../config/index.js';
import { MemoryCache } from '../../common/memory-cache.js';

const schema = config.db.schema;

const dictTreeCache = new MemoryCache<DictTreeNode[]>();
const DICT_TREE_CACHE_KEY = 'dictTree';
const DICT_TREE_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

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

/** 获取字典树数据（四层：类型域→二级类码→数据类码→数据码） */
export async function getDictTree(): Promise<DictTreeNode[]> {
  // 优先读缓存
  const cached = dictTreeCache.get(DICT_TREE_CACHE_KEY);
  if (cached) return cached;

  // 一次性查询所有数据，在内存中组装树结构
  const allRows = await dbQuery<{
    second_class_code: string;
    second_class_name: string;
    data_category_code: string;
    data_category_name: string;
    data_code: string;
    data_name: string;
    is_manual: string;
    type_domain_code: string;
  }>(
    `SELECT second_class_code, second_class_name,
            data_category_code, data_category_name,
            data_code, data_name, is_manual, type_domain_code
     FROM ${schema}.cec_new_energy_code_dict
     WHERE if_delete = '0'
       AND NOT (data_code IS NOT NULL AND data_code = data_name)
     ORDER BY type_domain_code, second_class_code, data_category_code, data_code`,
  );

  const typeLabel: Record<string, string> = {
    F: '风电',
    G: '光伏',
  };

  // 使用 Map 去重和组装
  const typeDomainMap = new Map<string, DictTreeNode>();
  const secondClassMap = new Map<string, DictTreeNode>();
  const dcMap = new Map<string, DictTreeNode>();
  const seenDataCodes = new Set<string>();

  for (const row of allRows) {
    const tdCode = row.type_domain_code || 'OTHER';

    // 类型域（最外层 F/G）
    if (!typeDomainMap.has(tdCode)) {
      typeDomainMap.set(tdCode, {
        code: tdCode,
        name: typeLabel[tdCode] || tdCode,
        type: 'typeDomain',
        children: [],
      });
    }

    // 二级类码
    const scKey = `${tdCode}|${row.second_class_code}`;
    if (!secondClassMap.has(scKey)) {
      const scNode: DictTreeNode = {
        code: row.second_class_code,
        name: row.second_class_name,
        type: 'secondClass',
        children: [],
      };
      secondClassMap.set(scKey, scNode);
      typeDomainMap.get(tdCode)!.children!.push(scNode);
    }

    // 数据类码
    const dcKey = `${scKey}|${row.data_category_code}`;
    if (!dcMap.has(dcKey)) {
      const dcNode: DictTreeNode = {
        code: row.data_category_code,
        name: row.data_category_name,
        type: 'dataCategory',
        isManual: row.is_manual,
        children: [],
      };
      dcMap.set(dcKey, dcNode);
      secondClassMap.get(scKey)!.children!.push(dcNode);
    }

    // 数据码（按二级类码+数据类码+数据码去重）
    const dataCodeKey = `${dcKey}|${row.data_code}`;
    if (row.data_code && !seenDataCodes.has(dataCodeKey)) {
      seenDataCodes.add(dataCodeKey);
      const dcNode = dcMap.get(dcKey)!;
      dcNode.children!.push({
        code: row.data_code,
        name: row.data_name,
        type: 'dataCode',
        isManual: row.is_manual,
      });
    }
  }

  // 计算子节点数量，同时根据子节点修正数据类码的 isManual
  for (const td of typeDomainMap.values()) {
    for (const sc of td.children!) {
      for (const dc of sc.children!) {
        dc.childCount = dc.children?.length || 0;
        if (dc.children?.some((child) => child.isManual === '1')) {
          dc.isManual = '1';
        }
      }
      sc.childCount = sc.children?.length || 0;
    }
    td.childCount = td.children?.length || 0;
  }

  const result = Array.from(typeDomainMap.values());
  dictTreeCache.set(DICT_TREE_CACHE_KEY, result, DICT_TREE_CACHE_TTL);
  return result;
}

/** 分页查询手动添加的编码记录 */
export async function getManualStatistics(
  pageNum: number,
  pageSize: number,
  secondClassCode?: string,
): Promise<{ items: ManualStatItem[]; total: number; secondClassOptions: string[] }> {
  const offset = (pageNum - 1) * pageSize;
  const filterSql = secondClassCode ? ` AND second_class_code = $1` : '';
  const filterParams = secondClassCode ? [secondClassCode] : [];

  const countResult = await dbQuery<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM ${schema}.cec_new_energy_code_dict
     WHERE if_delete = '0' AND is_manual = '1'${filterSql}`,
    filterParams,
  );
  const total = Number(countResult[0].cnt);

  // 获取所有二级类码选项（带名称）
  const optionRows = await dbQuery<{ code: string; name: string }>(
    `SELECT DISTINCT second_class_code AS code, second_class_name AS name FROM ${schema}.cec_new_energy_code_dict
     WHERE if_delete = '0' AND is_manual = '1' ORDER BY code`,
  );

  const params: any[] = [...filterParams, pageSize, offset];
  const items = await dbQuery<ManualStatItem>(
    `SELECT second_class_code AS "secondClassCode",
            second_class_name AS "secondClassName",
            data_category_code AS "dataCategoryCode",
            data_category_name AS "dataCategoryName",
            data_code AS "dataCode",
            data_name AS "dataName",
            create_tm AS "createTm"
     FROM ${schema}.cec_new_energy_code_dict
     WHERE if_delete = '0' AND is_manual = '1'${filterSql}
     ORDER BY create_tm DESC
     LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}`,
    params,
  );

  return { items, total, secondClassOptions: optionRows.map((r) => ({ code: r.code, name: r.name })) };
}

/** 获取所有手动添加记录（不分页，用于导出） */
export async function getAllManualStatistics(secondClassCode?: string): Promise<ManualStatItem[]> {
  const filterSql = secondClassCode ? ` AND second_class_code = $1` : '';
  const params = secondClassCode ? [secondClassCode] : [];
  return dbQuery<ManualStatItem>(
    `SELECT second_class_code AS "secondClassCode",
            second_class_name AS "secondClassName",
            data_category_code AS "dataCategoryCode",
            data_category_name AS "dataCategoryName",
            data_code AS "dataCode",
            data_name AS "dataName",
            create_tm AS "createTm"
     FROM ${schema}.cec_new_energy_code_dict
     WHERE if_delete = '0' AND is_manual = '1'${filterSql}
     ORDER BY create_tm DESC`,
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

  const keys = Array.from(extractedMap.keys());
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
