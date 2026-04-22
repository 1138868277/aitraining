-- 华电新能源测点编码管理工具 - 建表脚本 (PostgreSQL/SeaboxSQL 兼容)
-- Schema: liuhaojun

SET search_path TO liuhaojun;

-- 1. 场站字典表
DROP TABLE IF EXISTS cec_new_energy_station_dict CASCADE;
CREATE TABLE cec_new_energy_station_dict (
    station_id BIGSERIAL NOT NULL,
    station_code VARCHAR(4) NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    management_domain VARCHAR(50),
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (station_id)
);
COMMENT ON TABLE cec_new_energy_station_dict IS '场站字典表';
COMMENT ON COLUMN cec_new_energy_station_dict.station_code IS '场站编码';
COMMENT ON COLUMN cec_new_energy_station_dict.station_name IS '场站名称';
COMMENT ON COLUMN cec_new_energy_station_dict.management_domain IS '所属管理域';
CREATE UNIQUE INDEX IF NOT EXISTS idx_station_code ON cec_new_energy_station_dict(station_code);

-- 2. 类型字典表
DROP TABLE IF EXISTS cec_new_energy_type_dict CASCADE;
CREATE TABLE cec_new_energy_type_dict (
    type_id BIGSERIAL NOT NULL,
    type_code VARCHAR(2) NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (type_id)
);
COMMENT ON TABLE cec_new_energy_type_dict IS '类型字典表';
COMMENT ON COLUMN cec_new_energy_type_dict.type_code IS '类型编码';
COMMENT ON COLUMN cec_new_energy_type_dict.type_name IS '类型名称';
CREATE UNIQUE INDEX IF NOT EXISTS idx_type_code ON cec_new_energy_type_dict(type_code);

-- 3. 前缀字典表
DROP TABLE IF EXISTS cec_new_energy_prefix_dict CASCADE;
CREATE TABLE cec_new_energy_prefix_dict (
    prefix_id BIGSERIAL NOT NULL,
    prefix_no VARCHAR(1) NOT NULL,
    prefix_name VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (prefix_id)
);
COMMENT ON TABLE cec_new_energy_prefix_dict IS '编码前缀字典表';
COMMENT ON COLUMN cec_new_energy_prefix_dict.prefix_no IS '前缀号';
COMMENT ON COLUMN cec_new_energy_prefix_dict.prefix_name IS '前缀名称';
CREATE UNIQUE INDEX IF NOT EXISTS idx_prefix_no ON cec_new_energy_prefix_dict(prefix_no);

-- 4. 项目期号&并网线路字典表
DROP TABLE IF EXISTS cec_new_energy_project_line_dict CASCADE;
CREATE TABLE cec_new_energy_project_line_dict (
    project_line_id BIGSERIAL NOT NULL,
    project_line_code VARCHAR(3) NOT NULL,
    project_line_name VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (project_line_id)
);
COMMENT ON TABLE cec_new_energy_project_line_dict IS '项目期号&并网线路字典表';
COMMENT ON COLUMN cec_new_energy_project_line_dict.project_line_code IS '项目期号&并网线路编码';
COMMENT ON COLUMN cec_new_energy_project_line_dict.project_line_name IS '项目期号&并网线路名称';
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_line_code ON cec_new_energy_project_line_dict(project_line_code);

-- 5. 标准编码字典表（二级分类+数据类）
DROP TABLE IF EXISTS cec_new_energy_code_dict CASCADE;
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
COMMENT ON TABLE cec_new_energy_code_dict IS '标准编码字典表';
COMMENT ON COLUMN cec_new_energy_code_dict.type_domain_code IS '测点类型：F-风力发电相关，G-光伏发电相关，Y-通用';
COMMENT ON COLUMN cec_new_energy_code_dict.first_class_code IS '一级类码编码';
COMMENT ON COLUMN cec_new_energy_code_dict.first_class_name IS '一级类码名称';
COMMENT ON COLUMN cec_new_energy_code_dict.second_class_code IS '二级类码编码';
COMMENT ON COLUMN cec_new_energy_code_dict.second_class_name IS '二级类码名称';
COMMENT ON COLUMN cec_new_energy_code_dict.data_category_code IS '数据类码编码';
COMMENT ON COLUMN cec_new_energy_code_dict.data_category_name IS '数据类码名称';
COMMENT ON COLUMN cec_new_energy_code_dict.data_code IS '数据编码';
COMMENT ON COLUMN cec_new_energy_code_dict.data_name IS '数据名称';
CREATE INDEX IF NOT EXISTS idx_code_dict_type_domain ON cec_new_energy_code_dict(type_domain_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_first_class ON cec_new_energy_code_dict(first_class_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_second_class ON cec_new_energy_code_dict(second_class_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_data_category ON cec_new_energy_code_dict(data_category_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_data_code ON cec_new_energy_code_dict(data_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_type_first ON cec_new_energy_code_dict(type_domain_code, first_class_code);
CREATE INDEX IF NOT EXISTS idx_code_dict_type_first_second ON cec_new_energy_code_dict(type_domain_code, first_class_code, second_class_code);

-- 6. 数据类字典表
DROP TABLE IF EXISTS cec_new_energy_data_type_dict CASCADE;
CREATE TABLE cec_new_energy_data_type_dict (
    data_type_id BIGSERIAL NOT NULL,
    data_type_code VARCHAR(2) NOT NULL,
    data_type_name VARCHAR(100) NOT NULL,
    data_code VARCHAR(3),
    data_name VARCHAR(100),
    second_class_code VARCHAR(3),
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (data_type_id)
);
COMMENT ON TABLE cec_new_energy_data_type_dict IS '数据类字典表';
COMMENT ON COLUMN cec_new_energy_data_type_dict.data_type_code IS '数据类码';
COMMENT ON COLUMN cec_new_energy_data_type_dict.data_type_name IS '数据类名称';
COMMENT ON COLUMN cec_new_energy_data_type_dict.data_code IS '数据码';
COMMENT ON COLUMN cec_new_energy_data_type_dict.data_name IS '数据码名称';
COMMENT ON COLUMN cec_new_energy_data_type_dict.second_class_code IS '关联二级类码';
CREATE INDEX IF NOT EXISTS idx_data_type_code ON cec_new_energy_data_type_dict(data_type_code);

-- 7. 编码生成记录表
DROP TABLE IF EXISTS cec_new_energy_createcode CASCADE;
CREATE TABLE cec_new_energy_createcode (
    id BIGSERIAL NOT NULL,
    code VARCHAR(31) NOT NULL,
    name VARCHAR(500),
    batch_no VARCHAR(20),
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (id)
);
COMMENT ON TABLE cec_new_energy_createcode IS '编码生成记录表';
COMMENT ON COLUMN cec_new_energy_createcode.code IS '生成的测点编码';
COMMENT ON COLUMN cec_new_energy_createcode.name IS '编码名称';
COMMENT ON COLUMN cec_new_energy_createcode.batch_no IS '批次号';
CREATE INDEX IF NOT EXISTS idx_createcode_tm ON cec_new_energy_createcode(create_tm DESC);
CREATE INDEX IF NOT EXISTS idx_createcode_code ON cec_new_energy_createcode(code);

-- 8. 编码稽核数据表
DROP TABLE IF EXISTS cec_new_energy_checkdata CASCADE;
CREATE TABLE cec_new_energy_checkdata (
    id BIGSERIAL NOT NULL,
    code VARCHAR(31) NOT NULL,
    name VARCHAR(500),
    management_domain VARCHAR(50),
    station VARCHAR(100),
    type_code VARCHAR(2),
    result VARCHAR(20) DEFAULT 'PENDING',
    file_source VARCHAR(200),
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (id)
);
COMMENT ON TABLE cec_new_energy_checkdata IS '编码稽核数据表';
COMMENT ON COLUMN cec_new_energy_checkdata.code IS '测点编码';
COMMENT ON COLUMN cec_new_energy_checkdata.name IS '编码名称';
COMMENT ON COLUMN cec_new_energy_checkdata.management_domain IS '管理域';
COMMENT ON COLUMN cec_new_energy_checkdata.station IS '场站';
COMMENT ON COLUMN cec_new_energy_checkdata.type_code IS '类型编码';
COMMENT ON COLUMN cec_new_energy_checkdata.result IS '校验结果: COMPLIANT/ABNORMAL/PENDING';
COMMENT ON COLUMN cec_new_energy_checkdata.file_source IS '数据来源文件';
CREATE INDEX IF NOT EXISTS idx_checkdata_result ON cec_new_energy_checkdata(result);
CREATE INDEX IF NOT EXISTS idx_checkdata_domain ON cec_new_energy_checkdata(management_domain);
CREATE INDEX IF NOT EXISTS idx_checkdata_station ON cec_new_energy_checkdata(station);
