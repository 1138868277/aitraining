-- 华电新能源测点编码管理工具 - 新增 is_manual 列
-- 用于区分集团统一编码与页面手动新增编码
-- Schema: liuhaojun

SET search_path TO liuhaojun;

ALTER TABLE cec_new_energy_code_dict
ADD COLUMN IF NOT EXISTS is_manual CHAR(1) DEFAULT '0';

COMMENT ON COLUMN cec_new_energy_code_dict.is_manual IS '是否手动新增：0-集团统一编码 1-手动新增编码';

-- 创建索引用于快速筛选手动新增编码
CREATE INDEX IF NOT EXISTS idx_code_dict_is_manual ON cec_new_energy_code_dict(is_manual);
