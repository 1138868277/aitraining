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
  // 3. Y0 -> Y (通用)
  // 4. 01 -> F (假设01对应风力发电)
  // 5. 02 -> G (假设02对应光伏发电)
  // 6. 03 -> Y (假设03对应水力发电)
  // 7. 04 -> Y (假设04对应储能电站)

  if (typeCode.startsWith('F') || typeCode === '01') {
    return 'F';
  } else if (typeCode.startsWith('G') || typeCode === '02') {
    return 'G';
  } else if (typeCode === 'Y0' || typeCode === '03' || typeCode === '04') {
    return 'Y';
  }
  return null;
}

/** 获取标准编码字典列表（按层级过滤） */
export async function getCodeDictByParent(parentCode?: string, typeCode?: string): Promise<DictItem[]> {
  const typeDomainCode = getTypeDomainCode(typeCode);

  if (!parentCode) {
    // 第一级：返回所有一级类码
    let sql = `SELECT DISTINCT first_class_code AS code, first_class_name AS name
      FROM ${schema}.cec_new_energy_code_dict
      WHERE if_delete = '0' AND first_class_code IS NOT NULL`;

    const params: any[] = [];
    if (typeDomainCode) {
      sql += ` AND type_domain_code = $1`;
      params.push(typeDomainCode);
    }

    sql += ` ORDER BY first_class_code`;
    return query(sql, params);
  }

  // 判断parentCode的长度来确定层级
  // 一级类码长度为2，二级类码长度为3，数据类码长度为2，数据编码长度为3
  if (parentCode.length === 2) {
    // parentCode可能是一级类码或数据类码
    // 先检查是否是一级类码
    const checkFirstSql = `SELECT COUNT(*) as cnt FROM ${schema}.cec_new_energy_code_dict WHERE first_class_code = $1`;
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
    // parentCode可能是二级类码
    const checkSecondSql = `SELECT COUNT(*) as cnt FROM ${schema}.cec_new_energy_code_dict WHERE second_class_code = $1`;
    const checkResult = await query<{ cnt: number }>(checkSecondSql, [parentCode]);
    if (checkResult[0].cnt > 0) {
      // 是二级类码，返回对应的数据类码
      let dataCategorySql = `SELECT DISTINCT data_category_code AS code, data_category_name AS name
        FROM ${schema}.cec_new_energy_code_dict
        WHERE if_delete = '0' AND second_class_code = $1 AND data_category_code IS NOT NULL`;

      const params: any[] = [parentCode];
      if (typeDomainCode) {
        dataCategorySql += ` AND type_domain_code = $2`;
        params.push(typeDomainCode);
      }

      dataCategorySql += ` ORDER BY data_category_code`;
      return query(dataCategorySql, params);
    }
  } else if (parentCode.length === 4) {
    // parentCode可能是二级扩展码，typeCode参数可能是二级类码（3位）
    // 查询三级类码：从数据类字典表获取data_code作为三级类码
    if (typeCode && typeCode.length === 3) {
      // typeCode是二级类码，根据它过滤
      let thirdClassSql = `SELECT DISTINCT data_code AS code, data_name AS name
        FROM ${schema}.cec_new_energy_data_type_dict
        WHERE if_delete = '0' AND second_class_code = $1 AND data_code IS NOT NULL`;

      const params: any[] = [typeCode];
      thirdClassSql += ` ORDER BY data_code`;
      return query(thirdClassSql, params);
    }
    // 如果没有二级类码，返回空数组
    return [];
  }

  // 默认返回空数组
  return [];
}

/** 获取数据类字典 */
export async function getDataTypeDict(): Promise<DictItem[]> {
  const sql = `SELECT DISTINCT data_type_code AS code, data_type_name AS name
    FROM ${schema}.cec_new_energy_data_type_dict
    WHERE if_delete = '0' ORDER BY data_type_code`;
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
export async function getDataCodeByDataType(dataTypeCode: string): Promise<DictItem[]> {
  const sql = `SELECT data_code AS code, data_name AS name
    FROM ${schema}.cec_new_energy_data_type_dict
    WHERE if_delete = '0' AND data_type_code = $1
    ORDER BY data_code`;
  return query(sql, [dataTypeCode]);
}
