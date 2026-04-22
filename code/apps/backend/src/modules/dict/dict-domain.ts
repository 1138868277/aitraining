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
    WHERE if_delete = 0 ORDER BY station_code`;
  return query(sql);
}

/** 获取类型字典列表 */
export async function getTypeDict(): Promise<DictItem[]> {
  const sql = `SELECT type_code AS code, type_name AS name
    FROM ${schema}.cec_new_energy_type_dict
    WHERE if_delete = 0 ORDER BY type_code`;
  return query(sql);
}

/** 获取前缀字典列表 */
export async function getPrefixDict(): Promise<DictItem[]> {
  const sql = `SELECT prefix_no AS code, prefix_name AS name
    FROM ${schema}.cec_new_energy_prefix_dict
    WHERE if_delete = 0 ORDER BY prefix_no`;
  return query(sql);
}

/** 获取项目期号&并网线路字典列表 */
export async function getProjectLineDict(): Promise<DictItem[]> {
  const sql = `SELECT project_line_code AS code, project_line_name AS name
    FROM ${schema}.cec_new_energy_project_line_dict
    WHERE if_delete = 0 ORDER BY project_line_code`;
  return query(sql);
}

/** 获取标准编码字典列表（按层级过滤） */
export async function getCodeDictByParent(parentCode?: string): Promise<DictItem[]> {
  if (!parentCode) {
    const sql = `SELECT DISTINCT first_class_code AS code, first_class_name AS name
      FROM ${schema}.cec_new_energy_code_dict
      WHERE if_delete = 0 AND first_class_code IS NOT NULL
      ORDER BY first_class_code`;
    return query(sql);
  }

  const level2Sql = `SELECT DISTINCT second_class_code AS code, second_class_name AS name
    FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = 0 AND first_class_code = $1 AND second_class_code IS NOT NULL
    ORDER BY second_class_code`;
  const level2 = await query(level2Sql, [parentCode]);
  if (level2.length > 0) return level2;

  const extSql = `SELECT DISTINCT second_ext_code AS code, second_ext_name AS name
    FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = 0 AND second_class_code = $1 AND second_ext_code IS NOT NULL
    ORDER BY second_ext_code`;
  const ext = await query(extSql, [parentCode]);
  if (ext.length > 0) return ext;

  const level3Sql = `SELECT DISTINCT third_class_code AS code, third_class_name AS name
    FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = 0 AND second_ext_code = $1 AND third_class_code IS NOT NULL
    ORDER BY third_class_code`;
  const level3 = await query(level3Sql, [parentCode]);
  if (level3.length > 0) return level3;

  const level3ExtSql = `SELECT DISTINCT third_ext_code AS code, third_ext_name AS name
    FROM ${schema}.cec_new_energy_code_dict
    WHERE if_delete = 0 AND third_class_code = $1 AND third_ext_code IS NOT NULL
    ORDER BY third_ext_code`;
  return query(level3ExtSql, [parentCode]);
}

/** 获取数据类字典 */
export async function getDataTypeDict(): Promise<DictItem[]> {
  const sql = `SELECT data_type_code AS code, data_type_name AS name
    FROM ${schema}.cec_new_energy_data_type_dict
    WHERE if_delete = 0 ORDER BY data_type_code`;
  return query(sql);
}

/** 获取数据码（根据数据类码过滤） */
export async function getDataCodeByDataType(dataTypeCode: string): Promise<DictItem[]> {
  const sql = `SELECT data_code AS code, data_name AS name
    FROM ${schema}.cec_new_energy_data_type_dict
    WHERE if_delete = 0 AND data_type_code = $1
    ORDER BY data_code`;
  return query(sql, [dataTypeCode]);
}
