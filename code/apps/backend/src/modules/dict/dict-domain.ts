import { query, getSchema } from '../../db/index.js';

export interface DictItem {
  code: string;
  name: string;
  parentCode?: string;
}

/** 获取场站字典列表（含类型） */
export async function getStationDict(): Promise<DictItem[]> {
  const sql = `SELECT station_code AS code, station_name AS name, station_type AS "parentCode"
    FROM ${getSchema()}.cec_new_energy_station_dict
    WHERE if_delete = '0' ORDER BY station_code`;
  return query(sql);
}

/** 获取场站名称到编码的映射（含类型） */
export async function getStationDictWithType(): Promise<Array<{ code: string; name: string; stationType: string | null }>> {
  const sql = `SELECT station_code AS code, station_name AS name, station_type
    FROM ${getSchema()}.cec_new_energy_station_dict
    WHERE if_delete = '0'`;
  return query(sql);
}

/** 获取类型字典列表 */
export async function getTypeDict(): Promise<DictItem[]> {
  const sql = `SELECT type_code AS code, type_name AS name
    FROM ${getSchema()}.cec_new_energy_type_dict
    WHERE if_delete = '0' ORDER BY type_code`;
  return query(sql);
}

/** 获取前缀字典列表 */
export async function getPrefixDict(): Promise<DictItem[]> {
  const sql = `SELECT prefix_no AS code, prefix_name AS name
    FROM ${getSchema()}.cec_new_energy_prefix_dict
    WHERE if_delete = '0' ORDER BY prefix_no`;
  return query(sql);
}

/** 获取项目期号&并网线路字典列表 */
export async function getProjectLineDict(): Promise<DictItem[]> {
  const sql = `SELECT project_line_code AS code, project_line_name AS name
    FROM ${getSchema()}.cec_new_energy_project_line_dict
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
  // 3. S1, S2 -> S (水力发电)
  // 4. Y0 -> 返回null，表示不过滤类型（通用）
  // 5. 01 -> F (假设01对应风力发电)
  // 6. 02 -> G (假设02对应光伏发电)
  // 7. 03 -> Y (假设03对应水力发电)
  // 8. 04 -> Y (假设04对应储能电站)

  if (typeCode.startsWith('F') || typeCode === '01') {
    return 'F';
  } else if (typeCode.startsWith('G') || typeCode === '02') {
    return 'G';
  } else if (typeCode.startsWith('S') || typeCode === '05') {
    return 'S';
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
    const checkFirstSql = `SELECT COUNT(*) as cnt FROM ${getSchema()}.cec_new_energy_first_class_dict WHERE first_class_code = $1`;
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
          FROM ${getSchema()}.cec_new_energy_code_dict
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
        FROM ${getSchema()}.cec_new_energy_code_dict
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
      FROM ${getSchema()}.cec_new_energy_third_class_dict
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
    FROM ${getSchema()}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND data_category_code IS NOT NULL ORDER BY data_category_code`;
  return query(sql);
}

/** 获取一级类码字典 */
export async function getFirstClassDict(): Promise<DictItem[]> {
  const sql = `SELECT first_class_code AS code, first_class_name AS name
    FROM ${getSchema()}.cec_new_energy_first_class_dict
    WHERE if_delete = '0' ORDER BY first_class_code`;
  return query(sql);
}

/** 根据类型代码获取二级类码列表 */
export async function getSecondClassByType(typeCode: string): Promise<DictItem[]> {
  const sql = `SELECT second_class_code AS code, second_class_name AS name
    FROM ${getSchema()}.cec_new_energy_second_class_type_dict
    WHERE if_delete = '0' AND type_code = $1
    ORDER BY second_class_code`;
  return query(sql, [typeCode]);
}

/** 获取数据码（根据数据类码过滤） */
export async function getDataCodeByDataType(dataTypeCode: string, secondClassCode?: string, typeCode?: string): Promise<DictItem[]> {
  const typeDomainCode = getTypeDomainCode(typeCode);

  let sql = `SELECT data_code AS code, data_name AS name
    FROM ${getSchema()}.cec_new_energy_code_dict
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

/** 快捷搜索：根据数据码名称模糊匹配（支持类型和二级类码筛选） */
export async function quickSearchDict(
  searchText: string,
  pageNum: number,
  pageSize: number,
  typeFilter?: string,
  secondClassFilter?: string,
  dataCategoryFilter?: string,
): Promise<{
  items: Array<{
    typeCode: string;
    secondClassCode: string; secondClassName: string;
    dataCategoryCode: string; dataCategoryName: string;
    dataCode: string; dataName: string;
  }>;
  total: number;
  typeOptions: string[];
  secondClassOptions: Array<{ secondClassCode: string; secondClassName: string; typeCode: string }>;
  dataCategoryOptions: Array<{ dataCategoryCode: string; dataCategoryName: string }>;
}> {
  // 如果输入的是5位数字，按数据类码+数据码精确匹配或数据码名称精确匹配
  const isFiveDigits = /^\d{5}$/.test(searchText);
  const searchClause = isFiveDigits
    ? `(data_category_code || data_code = $1 OR data_name = $1)`
    : `data_name LIKE $1`;
  const searchParams: any[] = isFiveDigits ? [searchText] : [`%${searchText}%`];

  const filterClauses: string[] = [];
  const filterParams: any[] = [];
  let filterIdx = 2;

  if (typeFilter) {
    filterClauses.push(`AND type_domain_code = $${filterIdx++}`);
    filterParams.push(typeFilter);
  }
  if (secondClassFilter) {
    filterClauses.push(`AND second_class_code = $${filterIdx++}`);
    filterParams.push(secondClassFilter);
  }
  if (dataCategoryFilter) {
    filterClauses.push(`AND data_category_code = $${filterIdx++}`);
    filterParams.push(dataCategoryFilter);
  }

  const filterSql = filterClauses.join(' ');

  // 1. 总数（带筛选条件）
  const countResult = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM ${getSchema()}.cec_new_energy_code_dict WHERE if_delete = '0' AND ${searchClause} ${filterSql}`,
    [...searchParams, ...filterParams],
  );
  const total = Number(countResult[0].cnt);

  // 构建每个选项查询的筛选 SQL：
  // 每个选项应用「除自身外的所有筛选条件」，实现独立联动
  function buildOptFilter(exclude: string): { sql: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];
    let idx = 2;
    if (typeFilter && exclude !== 'type') {
      clauses.push(`AND type_domain_code = $${idx++}`);
      params.push(typeFilter);
    }
    if (secondClassFilter && exclude !== 'secondClass') {
      clauses.push(`AND second_class_code = $${idx++}`);
      params.push(secondClassFilter);
    }
    if (dataCategoryFilter && exclude !== 'dataCategory') {
      clauses.push(`AND data_category_code = $${idx++}`);
      params.push(dataCategoryFilter);
    }
    return { sql: clauses.join(' '), params };
  }

  // 2. 类型选项（应用二级类码+数据类码筛选）
  const typeOpt = buildOptFilter('type');
  const typeRows = await query<{ typeCode: string }>(
    `SELECT DISTINCT type_domain_code AS "typeCode" FROM ${getSchema()}.cec_new_energy_code_dict
     WHERE if_delete = '0' AND ${searchClause} ${typeOpt.sql} ORDER BY type_domain_code`,
    [...searchParams, ...typeOpt.params],
  );

  // 3. 二级类码选项（应用类型+数据类码筛选）—— 含编码+名称用于区分
  const scOpt = buildOptFilter('secondClass');
  const secondClassRows = await query<{ secondClassCode: string; secondClassName: string; typeCode: string }>(
    `SELECT DISTINCT second_class_code AS "secondClassCode", second_class_name AS "secondClassName", type_domain_code AS "typeCode"
     FROM ${getSchema()}.cec_new_energy_code_dict
     WHERE if_delete = '0' AND ${searchClause} ${scOpt.sql} ORDER BY second_class_code`,
    [...searchParams, ...scOpt.params],
  );

  // 3b. 数据类码选项（应用类型+二级类码筛选）
  const dcOpt = buildOptFilter('dataCategory');
  const dataCategoryRows = await query<{ dataCategoryCode: string; dataCategoryName: string }>(
    `SELECT DISTINCT data_category_code AS "dataCategoryCode", data_category_name AS "dataCategoryName"
     FROM ${getSchema()}.cec_new_energy_code_dict
     WHERE if_delete = '0' AND ${searchClause} ${dcOpt.sql} ORDER BY data_category_code`,
    [...searchParams, ...dcOpt.params],
  );

  // 4. 分页数据（带筛选条件）
  const offset = (pageNum - 1) * pageSize;
  const itemsSql = `SELECT type_domain_code AS "typeCode", second_class_code AS "secondClassCode",
      second_class_name AS "secondClassName", data_category_code AS "dataCategoryCode",
      data_category_name AS "dataCategoryName", data_code AS "dataCode", data_name AS "dataName"
    FROM ${getSchema()}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND ${searchClause} ${filterSql}
    ORDER BY second_class_code, data_category_code, data_code
    LIMIT $${filterIdx} OFFSET $${filterIdx + 1}`;
  const items = await query(itemsSql, [...searchParams, ...filterParams, pageSize, offset]);

  return {
    items,
    total,
    typeOptions: typeRows.map(r => r.typeCode),
    secondClassOptions: secondClassRows,
    dataCategoryOptions: dataCategoryRows,
  };
}

/** 手动新增编码草稿 */
export async function createManualCode(input: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName?: string;
  dataCode: string;
  dataName?: string;
  creator: string;
}): Promise<{ draftId: number }> {
  const dataCategoryName = input.dataCategoryName || input.dataCategoryCode;
  const dataName = input.dataName || input.dataCode;

  const sql = `INSERT INTO ${getSchema()}.cec_new_energy_code_draft
    (type_code, second_class_code, second_class_name,
     data_category_code, data_category_name, data_code, data_name,
     status, creator, create_tm)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, NOW())
    RETURNING draft_id`;

  const result = await query<{ draft_id: number }>(sql, [
    input.typeCode,
    input.secondClassCode,
    input.secondClassName,
    input.dataCategoryCode,
    dataCategoryName,
    input.dataCode,
    dataName,
    input.creator,
  ]);

  return { draftId: result[0].draft_id };
}

/** 获取指定数据类码下最大数据码（包含已审批和草稿中的） */
export async function getMaxDataCode(
  secondClassCode: string,
  dataCategoryCode: string,
  typeCode: string,
): Promise<string | null> {
  const typeDomainCode = getTypeDomainCode(typeCode) || 'Y';
  const sql = `SELECT MAX(max_code) AS max_code FROM (
    SELECT MAX(data_code) AS max_code FROM ${getSchema()}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND second_class_code = $1 AND data_category_code = $2 AND type_domain_code = $3
    UNION ALL
    SELECT MAX(data_code) AS max_code FROM ${getSchema()}.cec_new_energy_code_draft
    WHERE status IN ('draft', 'submitted')
      AND second_class_code = $1 AND data_category_code = $2
  ) AS combined`;
  const result = await query<{ max_code: string | null }>(sql, [secondClassCode, dataCategoryCode, typeDomainCode]);
  return result[0]?.max_code || null;
}

/** 获取指定二级类码下最大数据类码 */
export async function getMaxDataCategoryCode(
  secondClassCode: string,
  typeCode: string,
): Promise<string | null> {
  const typeDomainCode = getTypeDomainCode(typeCode) || 'Y';
  const sql = `SELECT MAX(data_category_code) AS max_code FROM ${getSchema()}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND second_class_code = $1 AND type_domain_code = $2`;
  const result = await query<{ max_code: string | null }>(sql, [secondClassCode, typeDomainCode]);
  return result[0]?.max_code || null;
}

/** 检查数据类码是否已存在（包含已审批和草稿中的） */
export async function checkExistingDataCategories(
  secondClassCode: string,
  typeCode: string,
  categoryCodes: string[],
): Promise<string[]> {
  const typeDomainCode = getTypeDomainCode(typeCode) || 'Y';
  const uniqueCodes = [...new Set(categoryCodes)];
  if (uniqueCodes.length === 0) return [];

  const placeholders = uniqueCodes.map((_, i) => `$${i + 3}`);

  // 同时在已审批字典和草稿中检查
  const sql = `SELECT DISTINCT data_category_code FROM (
    SELECT data_category_code FROM ${getSchema()}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND second_class_code = $1 AND type_domain_code = $2
      AND data_category_code IN (${placeholders.join(',')})
    UNION
    SELECT data_category_code FROM ${getSchema()}.cec_new_energy_code_draft
    WHERE status IN ('draft', 'submitted')
      AND second_class_code = $1
      AND data_category_code IN (${placeholders.join(',')})
  ) AS combined`;
  const rows = await query<{ data_category_code: string }>(sql, [secondClassCode, typeDomainCode, ...uniqueCodes]);
  return rows.map(r => r.data_category_code);
}

/** 检查数据码是否已存在（包含已审批和草稿中的） */
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

  // 同时在已审批字典和草稿中检查
  const sql = `SELECT DISTINCT data_code FROM (
    SELECT data_code FROM ${getSchema()}.cec_new_energy_code_dict
    WHERE if_delete = '0' AND second_class_code = $1 AND data_category_code = $2
      AND type_domain_code = $3 AND data_code IN (${placeholders.join(',')})
    UNION
    SELECT data_code FROM ${getSchema()}.cec_new_energy_code_draft
    WHERE status IN ('draft', 'submitted')
      AND second_class_code = $1 AND data_category_code = $2
      AND data_code IN (${placeholders.join(',')})
  ) AS combined`;
  const rows = await query<{ data_code: string }>(sql, [secondClassCode, dataCategoryCode, typeDomainCode, ...uniqueCodes]);
  return rows.map(r => r.data_code);
}

/** 批量新增编码草稿 */
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
  const valuePlaceholders: string[] = [];
  const params: any[] = [];
  let idx = 1;

  for (const entry of input.entries) {
    const dataCategoryName = entry.dataCategoryName || entry.dataCategoryCode;
    const dataName = entry.dataName || entry.dataCode;

    valuePlaceholders.push(
      `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, 'draft', $${idx + 7}, NOW())`,
    );
    params.push(
      input.typeCode, input.secondClassCode, input.secondClassName,
      entry.dataCategoryCode, dataCategoryName,
      entry.dataCode, dataName,
      input.creator,
    );
    idx += 8;
  }

  const sql = `INSERT INTO ${getSchema()}.cec_new_energy_code_draft
    (type_code, second_class_code, second_class_name,
     data_category_code, data_category_name, data_code, data_name,
     status, creator, create_tm)
    VALUES ${valuePlaceholders.join(', ')}`;

  await query(sql, params);
  return { insertedCount: input.entries.length };
}

/** 编码解析：根据31位编码查询各段信息 */
export async function parseCode(code: string): Promise<{
  rawCode: string;
  segments: Array<{ label: string; code: string; name: string }>;
  isValid: boolean;
  errorMessage?: string;
}> {
  if (!code || code.length !== 31) {
    return { rawCode: code, segments: [], isValid: false, errorMessage: '编码必须为31位' };
  }

  const stationCode = code.slice(0, 4);
  const typeCode = code.slice(4, 6);
  const projectLineCode = code.slice(6, 9);
  const prefixNo = code.slice(9, 10);
  const firstClassCode = code.slice(10, 12);
  const secondClassCode = code.slice(12, 15);
  const secondExtCode = code.slice(15, 19);
  const thirdClassCode = code.slice(19, 22);
  const thirdExtCode = code.slice(22, 26);
  const dataCategoryCode = code.slice(26, 28);
  const dataCode = code.slice(28, 31);
  const typeDomainCode = typeCode.charAt(0);

  // 并行查询所有段
  const [
    stations, types, prefixes, firstClasses,
    secondClasses, thirdClasses, dataCategories, dataCodes,
  ] = await Promise.all([
    query<{ name: string }>(
      `SELECT station_name AS name FROM ${getSchema()}.cec_new_energy_station_dict WHERE if_delete = '0' AND station_code = $1`,
      [stationCode],
    ),
    query<{ name: string }>(
      `SELECT type_name AS name FROM ${getSchema()}.cec_new_energy_type_dict WHERE if_delete = '0' AND type_code = $1`,
      [typeCode],
    ),
    query<{ name: string }>(
      `SELECT prefix_name AS name FROM ${getSchema()}.cec_new_energy_prefix_dict WHERE if_delete = '0' AND prefix_no = $1`,
      [prefixNo],
    ),
    query<{ name: string }>(
      `SELECT first_class_name AS name FROM ${getSchema()}.cec_new_energy_first_class_dict WHERE if_delete = '0' AND first_class_code = $1`,
      [firstClassCode],
    ),
    query<{ name: string }>(
      `SELECT second_class_name AS name FROM ${getSchema()}.cec_new_energy_second_class_type_dict WHERE if_delete = '0' AND second_class_code = $1 AND type_code = $2`,
      [secondClassCode, typeCode],
    ),
    query<{ name: string }>(
      `SELECT third_class_name AS name FROM ${getSchema()}.cec_new_energy_third_class_dict WHERE if_delete = '0' AND type_code = $1 AND second_class_code = $2 AND third_class_code = $3`,
      [typeCode, secondClassCode, thirdClassCode],
    ),
    query<{ data_category_name: string }>(
      `SELECT data_category_name FROM ${getSchema()}.cec_new_energy_code_dict
       WHERE if_delete = '0' AND second_class_code = $1 AND data_category_code = $2
         AND (type_code = $3 OR (type_code IS NULL AND type_domain_code = $4))
       LIMIT 1`,
      [secondClassCode, dataCategoryCode, typeCode, typeDomainCode],
    ),
    query<{ data_name: string }>(
      `SELECT data_name FROM ${getSchema()}.cec_new_energy_code_dict
       WHERE if_delete = '0' AND second_class_code = $1 AND data_category_code = $2 AND data_code = $3
         AND (type_code = $4 OR (type_code IS NULL AND type_domain_code = $5))
       LIMIT 1`,
      [secondClassCode, dataCategoryCode, dataCode, typeCode, typeDomainCode],
    ),
  ]);

  const segments = [
    { label: '场站', code: stationCode, name: stations[0]?.name || '未识别' },
    { label: '类型', code: typeCode, name: types[0]?.name || '未识别' },
    { label: '项目期号&并网线路', code: projectLineCode, name: '项目期号编码' },
    { label: '前缀号', code: prefixNo, name: prefixes[0]?.name || '未识别' },
    { label: '一级类码', code: firstClassCode, name: firstClasses[0]?.name || '未识别' },
    { label: '二级类码', code: secondClassCode, name: secondClasses[0]?.name || '未识别' },
    { label: '二级类扩展码', code: secondExtCode, name: secondExtCode === '0000' ? '无扩展' : '扩展编码' },
    { label: '三级类码', code: thirdClassCode, name: thirdClasses[0]?.name || '未识别' },
    { label: '三级类扩展码', code: thirdExtCode, name: thirdExtCode === '0000' ? '无扩展' : '扩展编码' },
    { label: '数据类码', code: dataCategoryCode, name: dataCategories[0]?.data_category_name || '未识别' },
    { label: '数据码', code: dataCode, name: dataCodes[0]?.data_name || '未识别' },
  ];

  const unrecognizedCount = segments.filter(s => s.name === '未识别').length;
  const isValid = unrecognizedCount === 0;

  const result: {
    rawCode: string;
    segments: Array<{ label: string; code: string; name: string }>;
    isValid: boolean;
    errorMessage?: string;
  } = {
    rawCode: code,
    segments,
    isValid,
  };
  if (!isValid) {
    result.errorMessage = `有 ${unrecognizedCount} 个段未识别`;
  }
  return result;
}

/** 批量解析编码 */
export async function batchParseCodes(codes: string[]): Promise<Array<{
  rawCode: string;
  segments: Array<{ label: string; code: string; name: string }>;
  isValid: boolean;
  errorMessage?: string;
}>> {
  return Promise.all(codes.map(code => parseCode(code)));
}

/** 根据类型代码和二级类码获取数据类码 */
export async function getDataTypeBySecondClass(typeCode: string, secondClassCode: string): Promise<DictItem[]> {
  const typeDomainCode = getTypeDomainCode(typeCode);

  let sql = `SELECT DISTINCT data_category_code AS code, data_category_name AS name
    FROM ${getSchema()}.cec_new_energy_code_dict
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
