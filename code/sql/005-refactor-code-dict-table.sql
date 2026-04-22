-- 华电新能源测点编码管理工具 - 重构标准编码字典表
-- 将原有的三级分类结构重构为二级分类+数据类结构
-- Schema: liuhaojun

SET search_path TO liuhaojun;

-- 备份原表（可选）
-- CREATE TABLE cec_new_energy_code_dict_backup AS SELECT * FROM cec_new_energy_code_dict;

-- 删除原表（如果存在外键约束需要先处理）
DROP TABLE IF EXISTS cec_new_energy_code_dict CASCADE;

-- 创建新表结构
CREATE TABLE cec_new_energy_code_dict (
    code_dict_id BIGSERIAL NOT NULL,
    -- 测点类型：F-风力发电相关，G-光伏发电相关，Y-通用（不过滤）
    type_domain_code CHAR(1) NOT NULL CHECK (type_domain_code IN ('F', 'G', 'Y')),
    -- 一级类码
    first_class_code VARCHAR(2) NOT NULL,
    first_class_name VARCHAR(100) NOT NULL,
    -- 二级类码
    second_class_code VARCHAR(3) NOT NULL,
    second_class_name VARCHAR(100) NOT NULL,
    -- 数据类码
    data_category_code VARCHAR(2) NOT NULL,
    data_category_name VARCHAR(100) NOT NULL,
    -- 数据编码
    data_code VARCHAR(3) NOT NULL,
    data_name VARCHAR(100) NOT NULL,
    -- 通用字段
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (code_dict_id)
);

COMMENT ON TABLE cec_new_energy_code_dict IS '标准编码字典表（重构后）';
COMMENT ON COLUMN cec_new_energy_code_dict.type_domain_code IS '测点类型：F-风力发电相关，G-光伏发电相关，Y-通用';
COMMENT ON COLUMN cec_new_energy_code_dict.first_class_code IS '一级类码编码';
COMMENT ON COLUMN cec_new_energy_code_dict.first_class_name IS '一级类码名称';
COMMENT ON COLUMN cec_new_energy_code_dict.second_class_code IS '二级类码编码';
COMMENT ON COLUMN cec_new_energy_code_dict.second_class_name IS '二级类码名称';
COMMENT ON COLUMN cec_new_energy_code_dict.data_category_code IS '数据类码编码';
COMMENT ON COLUMN cec_new_energy_code_dict.data_category_name IS '数据类码名称';
COMMENT ON COLUMN cec_new_energy_code_dict.data_code IS '数据编码';
COMMENT ON COLUMN cec_new_energy_code_dict.data_name IS '数据名称';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_code_dict_type_domain ON cec_new_energy_code_dict(type_domain_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_first_class ON cec_new_energy_code_dict(first_class_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_second_class ON cec_new_energy_code_dict(second_class_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_data_category ON cec_new_energy_code_dict(data_category_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_data_code ON cec_new_energy_code_dict(data_code);

-- 创建复合索引用于常用查询
CREATE INDEX IF NOT EXISTS idx_code_dict_type_first ON cec_new_energy_code_dict(type_domain_code, first_class_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_type_first_second ON cec_new_energy_code_dict(type_domain_code, first_class_code, second_class_code);

-- 输出完成信息
SELECT '标准编码字典表已重构完成' AS message;