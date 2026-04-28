-- 华电新能源测点编码管理工具 - 编码生成记录表新增字段
-- 为 cec_new_energy_createcode 表添加上下文字段，记录生成编码时的筛选条件
-- Schema: liuhaojun

SET search_path TO liuhaojun;

ALTER TABLE cec_new_energy_createcode
ADD COLUMN IF NOT EXISTS type_code VARCHAR(2);

ALTER TABLE cec_new_energy_createcode
ADD COLUMN IF NOT EXISTS second_class_code VARCHAR(3);

ALTER TABLE cec_new_energy_createcode
ADD COLUMN IF NOT EXISTS data_type_code VARCHAR(2);

ALTER TABLE cec_new_energy_createcode
ADD COLUMN IF NOT EXISTS station_code VARCHAR(4);

ALTER TABLE cec_new_energy_createcode
ADD COLUMN IF NOT EXISTS third_class_code VARCHAR(3);

COMMENT ON COLUMN cec_new_energy_createcode.type_code IS '类型编码（如 F1/F2/G1/G2）';
COMMENT ON COLUMN cec_new_energy_createcode.second_class_code IS '二级类码';
COMMENT ON COLUMN cec_new_energy_createcode.data_type_code IS '数据类码';
COMMENT ON COLUMN cec_new_energy_createcode.station_code IS '场站编码';
COMMENT ON COLUMN cec_new_energy_createcode.third_class_code IS '三级类码';
