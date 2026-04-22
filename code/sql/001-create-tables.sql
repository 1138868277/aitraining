-- 华电新能源测点编码管理工具 - 建表脚本
-- Schema: liuhaojun (请替换为实际schema)

SET search_path TO liuhaojun;

-- 1. 场站字典表
CREATE TABLE IF NOT EXISTS cec_new_energy_station_dict (
    station_id BIGINT NOT NULL,
    station_code VARCHAR(4) NOT NULL COMMENT '场站编码',
    station_name VARCHAR(100) NOT NULL COMMENT '场站名称',
    management_domain VARCHAR(50) COMMENT '所属管理域',
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (station_id)
);
COMMENT ON TABLE cec_new_energy_station_dict IS '场站字典表';
CREATE UNIQUE INDEX IF NOT EXISTS idx_station_code ON cec_new_energy_station_dict(station_code) WHERE if_delete = '0';

-- 2. 类型字典表
CREATE TABLE IF NOT EXISTS cec_new_energy_type_dict (
    type_id BIGINT NOT NULL,
    type_code VARCHAR(2) NOT NULL COMMENT '类型编码',
    type_name VARCHAR(100) NOT NULL COMMENT '类型名称',
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (type_id)
);
COMMENT ON TABLE cec_new_energy_type_dict IS '类型字典表';
CREATE UNIQUE INDEX IF NOT EXISTS idx_type_code ON cec_new_energy_type_dict(type_code) WHERE if_delete = '0';

-- 3. 前缀字典表
CREATE TABLE IF NOT EXISTS cec_new_energy_prefix_dict (
    prefix_id BIGINT NOT NULL,
    prefix_no VARCHAR(1) NOT NULL COMMENT '前缀号',
    prefix_name VARCHAR(100) NOT NULL COMMENT '前缀名称',
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (prefix_id)
);
COMMENT ON TABLE cec_new_energy_prefix_dict IS '编码前缀字典表';
CREATE UNIQUE INDEX IF NOT EXISTS idx_prefix_no ON cec_new_energy_prefix_dict(prefix_no) WHERE if_delete = '0';

-- 4. 项目期号&并网线路字典表
CREATE TABLE IF NOT EXISTS cec_new_energy_project_line_dict (
    project_line_id BIGINT NOT NULL,
    project_line_code VARCHAR(3) NOT NULL COMMENT '项目期号&并网线路编码',
    project_line_name VARCHAR(100) NOT NULL COMMENT '项目期号&并网线路名称',
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (project_line_id)
);
COMMENT ON TABLE cec_new_energy_project_line_dict IS '项目期号&并网线路字典表';
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_line_code ON cec_new_energy_project_line_dict(project_line_code) WHERE if_delete = '0';

-- 5. 标准编码字典表（多级联动）
CREATE TABLE IF NOT EXISTS cec_new_energy_code_dict (
    code_dict_id BIGINT NOT NULL,
    first_class_code VARCHAR(2) COMMENT '一级类码',
    first_class_name VARCHAR(100) COMMENT '一级类码名称',
    second_class_code VARCHAR(3) COMMENT '二级类码',
    second_class_name VARCHAR(100) COMMENT '二级类码名称',
    second_ext_code VARCHAR(4) COMMENT '二级类扩展码',
    second_ext_name VARCHAR(100) COMMENT '二级类扩展码名称',
    third_class_code VARCHAR(3) COMMENT '三级类码',
    third_class_name VARCHAR(100) COMMENT '三级类码名称',
    third_ext_code VARCHAR(4) COMMENT '三级类扩展码',
    third_ext_name VARCHAR(100) COMMENT '三级类扩展码名称',
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (code_dict_id)
);
COMMENT ON TABLE cec_new_energy_code_dict IS '标准编码字典表';
CREATE INDEX IF NOT EXISTS idx_code_dict_first ON cec_new_energy_code_dict(first_class_code) WHERE if_delete = '0';
CREATE INDEX IF NOT EXISTS idx_code_dict_second ON cec_new_energy_code_dict(second_class_code) WHERE if_delete = '0';
CREATE INDEX IF NOT EXISTS idx_code_dict_second_ext ON cec_new_energy_code_dict(second_ext_code) WHERE if_delete = '0';
CREATE INDEX IF NOT EXISTS idx_code_dict_third ON cec_new_energy_code_dict(third_class_code) WHERE if_delete = '0';

-- 6. 数据类字典表
CREATE TABLE IF NOT EXISTS cec_new_energy_data_type_dict (
    data_type_id BIGINT NOT NULL,
    data_type_code VARCHAR(2) NOT NULL COMMENT '数据类码',
    data_type_name VARCHAR(100) NOT NULL COMMENT '数据类名称',
    data_code VARCHAR(3) COMMENT '数据码',
    data_name VARCHAR(100) COMMENT '数据码名称',
    second_class_code VARCHAR(3) COMMENT '关联二级类码',
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (data_type_id)
);
COMMENT ON TABLE cec_new_energy_data_type_dict IS '数据类字典表';
CREATE INDEX IF NOT EXISTS idx_data_type_code ON cec_new_energy_data_type_dict(data_type_code) WHERE if_delete = '0';

-- 7. 编码生成记录表
CREATE TABLE IF NOT EXISTS cec_new_energy_createcode (
    id BIGINT NOT NULL,
    code VARCHAR(31) NOT NULL COMMENT '生成的测点编码',
    name VARCHAR(500) COMMENT '编码名称',
    batch_no VARCHAR(20) COMMENT '批次号',
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (id)
);
COMMENT ON TABLE cec_new_energy_createcode IS '编码生成记录表';
CREATE INDEX IF NOT EXISTS idx_createcode_tm ON cec_new_energy_createcode(create_tm DESC) WHERE if_delete = '0';
CREATE INDEX IF NOT EXISTS idx_createcode_code ON cec_new_energy_createcode(code) WHERE if_delete = '0';

-- 8. 编码稽核数据表
CREATE TABLE IF NOT EXISTS cec_new_energy_checkdata (
    id BIGINT NOT NULL,
    code VARCHAR(31) NOT NULL COMMENT '测点编码',
    name VARCHAR(500) COMMENT '编码名称',
    management_domain VARCHAR(50) COMMENT '管理域',
    station VARCHAR(100) COMMENT '场站',
    type_code VARCHAR(2) COMMENT '类型编码',
    result VARCHAR(20) DEFAULT 'PENDING' COMMENT '校验结果: COMPLIANT/ABNORMAL/PENDING',
    file_source VARCHAR(200) COMMENT '数据来源文件',
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (id)
);
COMMENT ON TABLE cec_new_energy_checkdata IS '编码稽核数据表';
CREATE INDEX IF NOT EXISTS idx_checkdata_result ON cec_new_energy_checkdata(result) WHERE if_delete = '0';
CREATE INDEX IF NOT EXISTS idx_checkdata_domain ON cec_new_energy_checkdata(management_domain) WHERE if_delete = '0';
CREATE INDEX IF NOT EXISTS idx_checkdata_station ON cec_new_energy_checkdata(station) WHERE if_delete = '0';
