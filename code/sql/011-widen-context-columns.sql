-- 华电新能源测点编码管理工具 - 编码生成记录表加宽上下文字段
-- 将 context 字段加宽以存储 "编码 名称" 格式（如 "F1 风电"）
-- Schema: liuhaojun

SET search_path TO liuhaojun;

ALTER TABLE cec_new_energy_createcode
ALTER COLUMN type_code TYPE VARCHAR(100);

ALTER TABLE cec_new_energy_createcode
ALTER COLUMN second_class_code TYPE VARCHAR(100);

ALTER TABLE cec_new_energy_createcode
ALTER COLUMN data_type_code TYPE VARCHAR(100);

ALTER TABLE cec_new_energy_createcode
ALTER COLUMN station_code TYPE VARCHAR(100);

ALTER TABLE cec_new_energy_createcode
ALTER COLUMN third_class_code TYPE VARCHAR(100);
