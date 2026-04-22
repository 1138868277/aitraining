-- 华电新能源测点编码管理工具 - 修改ID字段为自增脚本
-- 为现有表的ID字段添加自增序列
-- Schema: liuhaojun

SET search_path TO liuhaojun;

-- 注意：如果表中已有数据，需要先确定最大ID值，然后设置序列的起始值
-- 这里先创建序列并设置默认值

-- 1. 场站字典表 - 为station_id添加自增序列
CREATE SEQUENCE IF NOT EXISTS cec_new_energy_station_dict_station_id_seq;
ALTER TABLE cec_new_energy_station_dict
ALTER COLUMN station_id SET DEFAULT nextval('cec_new_energy_station_dict_station_id_seq');
-- 设置序列起始值（如果表中有数据）
SELECT setval('cec_new_energy_station_dict_station_id_seq', COALESCE(MAX(station_id), 0) + 1, false)
FROM cec_new_energy_station_dict;

-- 2. 类型字典表 - 为type_id添加自增序列
CREATE SEQUENCE IF NOT EXISTS cec_new_energy_type_dict_type_id_seq;
ALTER TABLE cec_new_energy_type_dict
ALTER COLUMN type_id SET DEFAULT nextval('cec_new_energy_type_dict_type_id_seq');
SELECT setval('cec_new_energy_type_dict_type_id_seq', COALESCE(MAX(type_id), 0) + 1, false)
FROM cec_new_energy_type_dict;

-- 3. 前缀字典表 - 为prefix_id添加自增序列
CREATE SEQUENCE IF NOT EXISTS cec_new_energy_prefix_dict_prefix_id_seq;
ALTER TABLE cec_new_energy_prefix_dict
ALTER COLUMN prefix_id SET DEFAULT nextval('cec_new_energy_prefix_dict_prefix_id_seq');
SELECT setval('cec_new_energy_prefix_dict_prefix_id_seq', COALESCE(MAX(prefix_id), 0) + 1, false)
FROM cec_new_energy_prefix_dict;

-- 4. 项目期号&并网线路字典表 - 为project_line_id添加自增序列
CREATE SEQUENCE IF NOT EXISTS cec_new_energy_project_line_dict_project_line_id_seq;
ALTER TABLE cec_new_energy_project_line_dict
ALTER COLUMN project_line_id SET DEFAULT nextval('cec_new_energy_project_line_dict_project_line_id_seq');
SELECT setval('cec_new_energy_project_line_dict_project_line_id_seq', COALESCE(MAX(project_line_id), 0) + 1, false)
FROM cec_new_energy_project_line_dict;

-- 5. 标准编码字典表 - 为code_dict_id添加自增序列
CREATE SEQUENCE IF NOT EXISTS cec_new_energy_code_dict_code_dict_id_seq;
ALTER TABLE cec_new_energy_code_dict
ALTER COLUMN code_dict_id SET DEFAULT nextval('cec_new_energy_code_dict_code_dict_id_seq');
SELECT setval('cec_new_energy_code_dict_code_dict_id_seq', COALESCE(MAX(code_dict_id), 0) + 1, false)
FROM cec_new_energy_code_dict;

-- 6. 数据类字典表 - 为data_type_id添加自增序列
CREATE SEQUENCE IF NOT EXISTS cec_new_energy_data_type_dict_data_type_id_seq;
ALTER TABLE cec_new_energy_data_type_dict
ALTER COLUMN data_type_id SET DEFAULT nextval('cec_new_energy_data_type_dict_data_type_id_seq');
SELECT setval('cec_new_energy_data_type_dict_data_type_id_seq', COALESCE(MAX(data_type_id), 0) + 1, false)
FROM cec_new_energy_data_type_dict;

-- 7. 编码生成记录表 - 为id添加自增序列
CREATE SEQUENCE IF NOT EXISTS cec_new_energy_createcode_id_seq;
ALTER TABLE cec_new_energy_createcode
ALTER COLUMN id SET DEFAULT nextval('cec_new_energy_createcode_id_seq');
SELECT setval('cec_new_energy_createcode_id_seq', COALESCE(MAX(id), 0) + 1, false)
FROM cec_new_energy_createcode;

-- 8. 编码稽核数据表 - 为id添加自增序列
CREATE SEQUENCE IF NOT EXISTS cec_new_energy_checkdata_id_seq;
ALTER TABLE cec_new_energy_checkdata
ALTER COLUMN id SET DEFAULT nextval('cec_new_energy_checkdata_id_seq');
SELECT setval('cec_new_energy_checkdata_id_seq', COALESCE(MAX(id), 0) + 1, false)
FROM cec_new_energy_checkdata;

-- 输出完成信息
SELECT '所有表的ID字段已添加自增序列' AS message;