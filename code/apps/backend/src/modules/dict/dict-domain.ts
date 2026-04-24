import { query } from '../../db/index.js';
import { config } from '../../config/index.js';

export interface DictItem {
  code: string;
  name: string;
  parentCode?: string;
}

const schema = config.db.schema;

/** 获取场站字典列表 */
export async function getStationDict(): Promise<DictItem[]> {
  const sql = `SELECT station_code AS code, station_name AS name
    FROM ${schema}.cec_new_energy_station_dict
    WHERE if_delete = '0' ORDER BY station_code`;
  return query(sql);
}

/** 获取类型字典列表 */
export async function getTypeDict(): Promise<DictItem[]> {
  const sql = `SELECT type_code AS code, type_name AS name
    FROM ${schema}.cec_new_energy_type_dict
    WHERE if_delete = '0' ORDER BY type_code`;
  return query(sql);
}

/** 获取前缀字典列表 */
export async function getPrefixDict(): Promise<DictItem[]> {
  const sql = `SELECT prefix_no AS code, prefix_name AS name
    FROM ${schema}.cec_new_energy_prefix_dict
    WHERE if_delete = '0' ORDER BY prefix_no`;
  return query(sql);
}

/** 获取项目期号&并网线路字典列表 */
export async function getProjectLineDict(): Promise<DictItem[]> {
  const sql = `SELECT project_line_code AS code, project_line_name AS name
    FROM ${schema}.cec_new_energy_project_line_dict
    WHERE if_delete = '0' ORDER BY project_line_code`;
  return query(sql);
}

/** 根据类型代码获取type_domain_code */
function getTypeDomainCode(typeCode?: string): string | null {
  if (!typeCode) return null;

  // 如果typeCode长度为3，可能是二级类码，不是类型代码
  if (typeCode.length === 3) {
    return null;
  }

  // 支持多种类型代码格式：
  // 1. F1, F2, F3, F4 -> F (风力发电)
  // 2. G1, G2 -> G (光伏发电)
  // 3. Y0 -> 返回null，表示不过滤类型（通用）
  // 4. 01 -> F (假设01对应风力发电)
  // 5. 02 -> G (假设02对应光伏发电)
  // 6. 03 -> Y (假设03对应水力发电)
  // 7. 04 -> Y (假设04对应储能电站)

  if (typeCode.startsWith('F') || typeCode === '01') {
    return 'F';
  } else if (typeCode.startsWith('G') || typeCode === '02') {
    return 'G';
  } else if (typeCode === 'Y0' || typeCode === '03' || typeCode === '04') {
    // Y表示通用，不过滤类型
    return null;
  }
  return null;
}

/** 获取标准编码字典列表（按层级过滤） */
export async function getCodeDictByParent(parentCode?: string, typeCode?: string): Promise<DictItem[]> {
  const typeDomainCode = getTypeDomainCode(typeCode);

  if (!parentCode) {
    // 第一级：返回所有一级类码（从一级类码表获取，不按类型过滤）
    return getFirstClassDict();
  }

  // 判断parentCode的长度来确定层级
  // 一级类码长度为2，二级类码长度为3，数据类码长度为2，数据编码长度为3
  if (parentCode.length === 2) {
    // parentCode可能是一级类码或数据类码
    // 先检查是否是一级类码
    const checkFirstSql = `SELECT COUNT(*) as cnt FROM ${schema}.cec_new_energy_first_class_dict WHERE first_class_code = $1`;
    const checkResult = await query<{ cnt: number }>(checkFirstSql, [parentCode]);
    if (checkResult[0].cnt > 0) {
      // 是一级类码，返回对应的二级类码
      // 如果typeCode是类型代码（长度2），则从二级类码类型表查询
      if (typeCode && typeCode.length === 2) {
        // 从二级类码类型表查询该类型下的所有二级类码
        return getSecondClassByType(typeCode);
      } else {
        // 使用原来的逻辑，从标准编码字典表查询
        let level2Sql = `SELECT DISTINCT second_class_code AS code, second_class_name AS name
          FROM ${schema}.cec_new_energy_code_dict
          WHERE if_delete = '0' AND first_class_code = $1 AND second_class_code IS NOT NULL`;

        const params: any[] = [parentCode];
        if (typeDomainCode) {
          level2Sql += ` AND type_domain_code = $2`;
          params.push(typeDomainCode);
        }

        level2Sql += ` ORDER BY second_class_code`;
        return query(level2Sql, params);
      }
    } else {
      // 可能是数据类码，返回对应的数据编码
      let dataCodeSql = `SELECT DISTINCT data_code AS code, data_name AS name
        FROM ${schema}.cec_new_energy_code_dict
        WHERE if_delete = '0' AND data_category_code = $1 AND data_code IS NOT NULL`;

      const params: any[] = [parentCode];
      if (typeDomainCode) {
        dataCodeSql += ` AND type_domain_code = $2`;
        params.push(typeDomainCode);
      }

      dataCodeSql += ` ORDER BY data_code`;
      return query(dataCodeSql, params);
    }
  } else if (parentCode.length === 3) {
    // parentCode是二级类码，直接查询三级类码表
    let thirdClassSql = `SELECT DISTINCT third_class_code AS code, third_class_name AS name
      FROM ${schema}.cec_new_energy_third_class_dict
      WHERE if_delete = '0' AND second_class_code = $1`;

    const params: any[] = [parentCode];
    let paramIndex = 2;

    // 类型过滤：如果typeCode存在，过滤type_code字段
    if (typeCode) {
      thirdClassSql += ` AND type_code = $${paramIndex}`;
      params.push(typeCode);
      paramIndex++;
    }

    thirdClassSql += ` ORDER BY third_class_code`;
    return query(thirdClassSql, params);
  } else if (parentCode.length === 4) {
    // parentCode可能是二级扩展码，不再使用，返回空数组
    return [];
  }

  // 默认返回空数组
  return [];
}

/** 获取数据类字典 */
export async function getDataTypeDict(): Promise<DictItem[]> {
  const sql = `SELECT DISTINCT data_category_code AS code, data_category_name AS name
    FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND data_category_code IS NOT NULL ORDER BY data_category_code`;
  return query(sql);
}

/** 获取一级类码字典 */
export async function getFirstClassDict(): Promise<DictItem[]> {
  const sql = `SELECT first_class_code AS code, first_class_name AS name
    FROM ${schema}.cec_new_energy_first_class_dict
    WHERE if_delete = '0' ORDER BY first_class_code`;
  return query(sql);
}

/** 根据类型代码获取二级类码列表 */
export async function getSecondClassByType(typeCode: string): Promise<DictItem[]> {
  const sql = `SELECT second_class_code AS code, second_class_name AS name
    FROM ${schema}.cec_new_energy_second_class_type_dict
    WHERE if_delete = '0' AND type_code = $1
    ORDER BY second_class_code`;
  return query(sql, [typeCode]);
}

/** 获取数据码（根据数据类码过滤） */
export async function getDataCodeByDataType(dataTypeCode: string, secondClassCode?: string, typeCode?: string): Promise<DictItem[]> {
  const typeDomainCode = getTypeDomainCode(typeCode);

  let sql = `SELECT data_code AS code, data_name AS name
    FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND data_category_code = $1`;

  const params: any[] = [dataTypeCode];
  let paramIndex = 2;

  if (secondClassCode) {
    sql += ` AND second_class_code = $${paramIndex}`;
    params.push(secondClassCode);
    paramIndex++;
  }

  if (typeDomainCode) {
    sql += ` AND type_domain_code = $${paramIndex}`;
    params.push(typeDomainCode);
    paramIndex++;
  }

  sql += ` ORDER BY data_code`;
  return query(sql, params);
}

/** 快捷搜索：根据数据码名称模糊匹配 */
export async function quickSearchDict(searchText: string): Promise<{
  items: Array<{
    typeCode: string;
    secondClassCode: string; secondClassName: string;
    dataCategoryCode: string; dataCategoryName: string;
    dataCode: string; dataName: string;
    isManual: string;
  }>;
  total: number;
}> {
  const countSql = `SELECT COUNT(*) AS cnt FROM ${schema}.cec_new_energy_code_dict WHERE if_delete = '0' AND data_name LIKE $1`;
  const countResult = await query<{ cnt: number }>(countSql, [`%${searchText}%`]);
  const total = Number(countResult[0].cnt);

  const sql = `SELECT DISTINCT type_domain_code AS "typeCode",
    second_class_code AS "secondClassCode", second_class_name AS "secondClassName",
    data_category_code AS "dataCategoryCode", data_category_name AS "dataCategoryName",
    data_code AS "dataCode", data_name AS "dataName",
    is_manual AS "isManual"
    FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND data_name LIKE $1
    ORDER BY is_manual, type_domain_code, second_class_code, data_category_code, data_code
    LIMIT 50`;
  const items = await query(sql, [`%${searchText}%`]);

  return { items, total };
}

/** 手动新增编码字典项 */
export async function createManualCode(input: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName?: string;
  dataCode: string;
  dataName?: string;
  creator: string;
}): Promise<{ codeDictId: number; isManual: string }> {
  const typeDomainCode = getTypeDomainCode(input.typeCode) || 'Y';

  // 默认一级类码
  const firstClassCode = 'B1';
  const firstClassName = '生产运行';
  const dataCategoryName = input.dataCategoryName || input.dataCategoryCode;
  const dataName = input.dataName || input.dataCode;

  const sql = `INSERT INTO ${schema}.cec_new_energy_code_dict
    (type_domain_code, first_class_code, first_class_name,
     second_class_code, second_class_name,
     data_category_code, data_category_name, data_code, data_name,
     is_manual, creator, create_tm, modifier, modify_tm)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '1', $10, NOW(), $10, NOW())
    RETURNING code_dict_id`;

  const result = await query<{ code_dict_id: number }>(sql, [
    typeDomainCode,
    firstClassCode,
    firstClassName,
    input.secondClassCode,
    input.secondClassName,
    input.dataCategoryCode,
    dataCategoryName,
    input.dataCode,
    dataName,
    input.creator,
  ]);

  return { codeDictId: result[0].code_dict_id, isManual: '1' };
}

/** 获取指定数据类码下最大数据码 */
export async function getMaxDataCode(
  secondClassCode: string,
  dataCategoryCode: string,
  typeCode: string,
): Promise<string | null> {
  const typeDomainCode = getTypeDomainCode(typeCode) || 'Y';
  const sql = `SELECT MAX(data_code) AS max_code FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND second_class_code = $1 AND data_category_code = $2 AND type_domain_code = $3`;
  const result = await query<{ max_code: string | null }>(sql, [secondClassCode, dataCategoryCode, typeDomainCode]);
  return result[0]?.max_code || null;
}

/** 获取指定二级类码下最大数据类码 */
export async function getMaxDataCategoryCode(
  secondClassCode: string,
  typeCode: string,
): Promise<string | null> {
  const typeDomainCode = getTypeDomainCode(typeCode) || 'Y';
  const sql = `SELECT MAX(data_category_code) AS max_code FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND second_class_code = $1 AND type_domain_code = $2`;
  const result = await query<{ max_code: string | null }>(sql, [secondClassCode, typeDomainCode]);
  return result[0]?.max_code || null;
}

/** 检查数据类码是否已存在（返回已存在的编码列表） */
export async function checkExistingDataCategories(
  secondClassCode: string,
  typeCode: string,
  categoryCodes: string[],
): Promise<string[]> {
  const typeDomainCode = getTypeDomainCode(typeCode) || 'Y';
  const uniqueCodes = [...new Set(categoryCodes)];
  if (uniqueCodes.length === 0) return [];

  const placeholders = uniqueCodes.map((_, i) => `$${i + 3}`);
  const sql = `SELECT DISTINCT data_category_code FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND second_class_code = $1 AND type_domain_code = $2
    AND data_category_code IN (${placeholders.join(',')})`;
  const rows = await query<{ data_category_code: string }>(sql, [secondClassCode, typeDomainCode, ...uniqueCodes]);
  return rows.map(r => r.data_category_code);
}

/** 检查数据码是否已存在（返回已存在的编码列表） */
export async function checkExistingDataCodes(
  secondClassCode: string,
  dataCategoryCode: string,
  typeCode: string,
  dataCodes: string[],
): Promise<string[]> {
  const typeDomainCode = getTypeDomainCode(typeCode) || 'Y';
  const uniqueCodes = [...new Set(dataCodes)];
  if (uniqueCodes.length === 0) return [];

  const placeholders = uniqueCodes.map((_, i) => `$${i + 4}`);
  const sql = `SELECT DISTINCT data_code FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND second_class_code = $1 AND data_category_code = $2
    AND type_domain_code = $3 AND data_code IN (${placeholders.join(',')})`;
  const rows = await query<{ data_code: string }>(sql, [secondClassCode, dataCategoryCode, typeDomainCode, ...uniqueCodes]);
  return rows.map(r => r.data_code);
}

/** 批量新增编码字典项 */
export async function batchCreateManualCode(input: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  entries: Array<{
    dataCategoryCode: string;
    dataCategoryName?: string;
    dataCode: string;
    dataName?: string;
  }>;
  creator: string;
}): Promise<{ insertedCount: number }> {
  const typeDomainCode = getTypeDomainCode(input.typeCode) || 'Y';
  const firstClassCode = 'B1';
  const firstClassName = '生产运行';

  const valuePlaceholders: string[] = [];
  const params: any[] = [];
  let idx = 1;

  for (const entry of input.entries) {
    const dataCategoryName = entry.dataCategoryName || entry.dataCategoryCode;
    const dataName = entry.dataName || entry.dataCode;

    valuePlaceholders.push(
      `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, '1', $${idx + 9}, NOW(), $${idx + 9}, NOW())`,
    );
    params.push(
      typeDomainCode, firstClassCode, firstClassName,
      input.secondClassCode, input.secondClassName,
      entry.dataCategoryCode, dataCategoryName,
      entry.dataCode, dataName,
      input.creator,
    );
    idx += 10;
  }

  const sql = `INSERT INTO ${schema}.cec_new_energy_code_dict
    (type_domain_code, first_class_code, first_class_name,
     second_class_code, second_class_name,
     data_category_code, data_category_name, data_code, data_name,
     is_manual, creator, create_tm, modifier, modify_tm)
    VALUES ${valuePlaceholders.join(', ')}`;

  await query(sql, params);
  return { insertedCount: input.entries.length };
}

/** 根据类型代码和二级类码获取数据类码 */
export async function getDataTypeBySecondClass(typeCode: string, secondClassCode: string): Promise<DictItem[]> {
  const typeDomainCode = getTypeDomainCode(typeCode);

  let sql = `SELECT DISTINCT data_category_code AS code, data_category_name AS name
    FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND second_class_code = $1`;

  const params: any[] = [secondClassCode];
  let paramIndex = 2;

  if (typeDomainCode) {
    sql += ` AND type_domain_code = $${paramIndex}`;
    params.push(typeDomainCode);
    paramIndex++;
  }

  sql += ` ORDER BY data_category_code`;
  return query(sql, params);
}
