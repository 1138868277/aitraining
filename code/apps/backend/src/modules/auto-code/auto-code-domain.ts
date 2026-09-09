import { query, getSchema } from '../../db/index.js';

/** 自动编码匹配结果 - 单个字段 */
export interface AutoMatchField {
  fieldKey: string;
  fieldLabel: string;
  sourceValue: string;
  matchedCode: string | null;
  matchedName: string | null;
  status: 'matched' | 'not_found' | 'empty';
}

/** 自动编码匹配结果 - 整行 */
export interface AutoMatchResult {
  rowIndex: number;
  name: string;
  fields: AutoMatchField[];
  allMatched: boolean;
}

export interface ImportRow {
  name: string;
  stationName?: string;
  secondClassName?: string;
  thirdClassName?: string;
  dataTypeName?: string;
  dataName?: string;
  projectLineCode?: string;
  [key: string]: any;
}

/** 从测点名称中提取数字列表 */
export function extractNumbers(name: string): number[] {
  const matches = name.match(/\d+/g);
  if (!matches) return [];
  return matches.map(Number);
}

/** 将数字格式化为4位扩展码 */
export function toExtCode(num: number): string {
  return Math.min(num, 9999).toString().padStart(4, '0');
}

/** 查找下一个可用的扩展码组合（避免重复，使用完整31位编码做冲突检测）
 *
 * buildFull 可选：把 (二级扩展码, 三级扩展码) 拼成最终完整编码的回调。
 * 传入时可保证按"真实生成的 31 位码"判重，避免可空分段拼串不一致导致漏判。
 */
export async function findNextAvailableExtCodes(
  existingFullCodes: string[],
  codePrefix: string,
  thirdClassCode: string,
  dataTypeCode: string,
  dataCode: string,
  secondExtBase: number,
  thirdExtBase: number,
  buildFull?: (secondExtCode: string, thirdExtCode: string) => string,
): Promise<{ secondExtCode: string; thirdExtCode: string }> {
  // 如果没有已有编码，直接返回基础值
  if (!existingFullCodes || existingFullCodes.length === 0) {
    return { secondExtCode: toExtCode(secondExtBase), thirdExtCode: toExtCode(thirdExtBase) };
  }

  const existingSet = new Set(existingFullCodes);
  let secondExt = secondExtBase;
  let thirdExt = thirdExtBase;

  // 构造某组扩展码对应的完整编码（默认手工拼段；传入 buildFull 时使用真实拼码结果）
  const fullOf = (se: number, te: number): string => {
    if (buildFull) return buildFull(toExtCode(se), toExtCode(te));
    return codePrefix + toExtCode(se) + thirdClassCode + toExtCode(te) + dataTypeCode + dataCode;
  };

  // 从基础值起，三级类扩展码优先自增，二级类扩展码满 9999 后进位并清零三级。
  // 兜底保障：保证一定找到与"存量编码集合"不重复的码，因此不设随意的小上限，
  // 而是扫描完整扩展空间（0~9999 × 0~9999）。正常几次到几十次即可命中；
  // 仅当存量把同一组合的扩展码占满（实际不可能）才在扫完后抛错。
  const MAX_TRIES = 10000 * 10000;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    if (!existingSet.has(fullOf(secondExt, thirdExt))) {
      return { secondExtCode: toExtCode(secondExt), thirdExtCode: toExtCode(thirdExt) };
    }
    // 三级类扩展码先自增；满 9999 后二级进位并清零三级
    thirdExt++;
    if (thirdExt > 9999) {
      secondExt++;
      thirdExt = 0;
    }
    // 二级也扫满一圈后回到 0000 重新覆盖整个空间，保证必能找到可用编码
    if (secondExt > 9999) {
      secondExt = 0;
      thirdExt = 0;
    }
  }

  throw new Error('扩展码已无可用值，请联系管理员核查存量编码是否占满');
}

/** 查询数据库中已有的编码列表（用于冲突检测） */
export async function findExistingCodes(
  stationCode: string,
  typeCode: string,
  projectLineCode: string,
  prefixNo: string,
  firstClassCode: string,
  secondClassCode: string,
  thirdClassCode: string,
  dataTypeCode: string,
  dataCode: string,
): Promise<Array<{ code: string }>> {
  // 先查 measurement_points 表
  const schema = getSchema();
  const sql = `SELECT code FROM ${schema}.cec_new_energy_measurement_points
    WHERE if_delete = '0'
      AND station_code = $1
      AND type_code = $2
      AND project_line_code = $3
      AND prefix_no = $4
      AND first_class_code = $5
      AND second_class_code = $6
      AND third_class_code = $7
      AND data_category_code = $8
      AND data_code = $9`;
  return query(sql, [
    stationCode, typeCode, projectLineCode, prefixNo,
    firstClassCode, secondClassCode, thirdClassCode,
    dataTypeCode, dataCode,
  ]);
}

/** 查找已有的带二级/三级扩展码的完整编码 */
export async function findExistingCodesWithExt(
  stationCode: string,
  typeCode: string,
  projectLineCode: string,
  prefixNo: string,
  firstClassCode: string,
  secondClassCode: string,
  thirdClassCode: string,
  dataCategoryCode: string,
  dataCode: string,
): Promise<Array<{ code: string }>> {
  const schema = getSchema();
  const sql = `SELECT code FROM ${schema}.cec_new_energy_measurement_points
    WHERE if_delete = '0'
      AND station_code = $1
      AND type_code = $2
      AND project_line_code = $3
      AND prefix_no = $4
      AND first_class_code = $5
      AND second_class_code = $6
      AND third_class_code = $7
      AND data_category_code = $8
      AND data_code = $9`;
  return query(sql, [
    stationCode, typeCode, projectLineCode, prefixNo,
    firstClassCode, secondClassCode, thirdClassCode,
    dataCategoryCode, dataCode,
  ]);
}

// ========== 名称匹配函数 ==========

/** 匹配场站名称 → 编码 */
export async function matchStationCode(
  stationName: string,
): Promise<{ code: string; name: string; stationType: string | null } | null> {
  const sql = `SELECT station_code AS code, station_name AS name, station_type AS "stationType"
    FROM ${getSchema()}.cec_new_energy_station_dict
    WHERE if_delete = '0' AND station_name = $1
    LIMIT 1`;
  const rows = await query<{ code: string; name: string; stationType: string | null }>(sql, [stationName]);
  return rows[0] || null;
}

/** 匹配二级类码名称 → 编码 */
export async function matchSecondClassCode(
  secondClassName: string,
  typeCode: string,
): Promise<{ code: string; name: string } | null> {
  const sql = `SELECT second_class_code AS code, second_class_name AS name
    FROM ${getSchema()}.cec_new_energy_second_class_type_dict
    WHERE if_delete = '0' AND second_class_name = $1 AND type_code = $2
    LIMIT 1`;
  const rows = await query<{ code: string; name: string }>(sql, [secondClassName, typeCode]);
  return rows[0] || null;
}

/** 匹配三级类码名称 → 编码 */
export async function matchThirdClassCode(
  thirdClassName: string,
  typeCode: string,
  secondClassCode: string,
): Promise<{ code: string; name: string } | null> {
  const sql = `SELECT third_class_code AS code, third_class_name AS name
    FROM ${getSchema()}.cec_new_energy_third_class_dict
    WHERE if_delete = '0' AND third_class_name = $1
      AND type_code = $2 AND second_class_code = $3
    LIMIT 1`;
  const rows = await query<{ code: string; name: string }>(sql, [thirdClassName, typeCode, secondClassCode]);
  return rows[0] || null;
}

/** 匹配数据类码名称 → 编码 */
export async function matchDataTypeCode(
  dataTypeName: string,
  secondClassCode: string,
  typeCode: string,
): Promise<{ code: string; name: string } | null> {
  const typeDomainCode = getTypeDomainCode(typeCode);
  let sql = `SELECT DISTINCT data_category_code AS code, data_category_name AS name
    FROM ${getSchema()}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND data_category_name = $1
      AND second_class_code = $2`;
  const params: any[] = [dataTypeName, secondClassCode];
  if (typeDomainCode) {
    sql += ` AND type_domain_code = $3`;
    params.push(typeDomainCode);
  }
  sql += ` LIMIT 1`;
  const rows = await query<{ code: string; name: string }>(sql, params);
  return rows[0] || null;
}

/** 匹配数据码名称 → 编码 */
export async function matchDataCode(
  dataName: string,
  dataTypeCode: string,
  secondClassCode: string,
  typeCode: string,
): Promise<{ code: string; name: string } | null> {
  const typeDomainCode = getTypeDomainCode(typeCode);
  let sql = `SELECT data_code AS code, data_name AS name
    FROM ${getSchema()}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND data_name = $1
      AND data_category_code = $2 AND second_class_code = $3`;
  const params: any[] = [dataName, dataTypeCode, secondClassCode];
  if (typeDomainCode) {
    sql += ` AND type_domain_code = $4`;
    params.push(typeDomainCode);
  }
  sql += ` LIMIT 1`;
  const rows = await query<{ code: string; name: string }>(sql, params);
  return rows[0] || null;
}

function getTypeDomainCode(typeCode?: string): string | null {
  if (!typeCode) return null;
  if (typeCode.startsWith('F') || typeCode === '01') return 'F';
  if (typeCode.startsWith('G') || typeCode === '02') return 'G';
  if (typeCode.startsWith('S') || typeCode === '05') return 'S';
  return null;
}
