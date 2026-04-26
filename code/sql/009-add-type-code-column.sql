-- 华电新能源测点编码管理工具 - 新增 type_code 列
-- 用于在 cec_new_energy_code_dict 中记录具体的类型编码（F1/F2/G1/G2等）
-- 解决按类型筛选时因仅依赖 type_domain_code 导致筛选不准确的问题
-- Schema: liuhaojun

SET search_path TO liuhaojun;

ALTER TABLE cec_new_energy_code_dict
ADD COLUMN IF NOT EXISTS type_code VARCHAR(10);

COMMENT ON COLUMN cec_new_energy_code_dict.type_code IS '类型编码（如 F1/F2/G1/G2），用于精确类型筛选';

-- 回填已有手动编码的 type_code（从类型映射表推断）
UPDATE cec_new_energy_code_dict d
SET type_code = (
  SELECT sct.type_code
  FROM cec_new_energy_second_class_type_dict sct
  WHERE sct.second_class_code = d.second_class_code
    AND sct.type_code LIKE d.type_domain_code || '%'
    AND sct.if_delete = '0'
  LIMIT 1
)
WHERE type_code IS NULL
  AND is_manual = '1';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_code_dict_type_code ON cec_new_energy_code_dict(type_code);
