-- 华电新能源测点编码管理工具 - 最近条件记录表
-- Schema: liuhaojun

SET search_path TO liuhaojun;

DROP TABLE IF EXISTS cec_new_energy_recent_condition CASCADE;
CREATE TABLE cec_new_energy_recent_condition (
    id BIGSERIAL NOT NULL,
    condition_data JSONB NOT NULL,
    condition_summary VARCHAR(500),
    tenant_id VARCHAR(20) DEFAULT '0',
    creator VARCHAR(50),
    modifier VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    if_delete CHAR(1) DEFAULT '0',
    PRIMARY KEY (id)
);
COMMENT ON TABLE cec_new_energy_recent_condition IS '编码生成最近条件记录表';
COMMENT ON COLUMN cec_new_energy_recent_condition.condition_data IS '筛选条件JSON快照';
COMMENT ON COLUMN cec_new_energy_recent_condition.condition_summary IS '条件摘要（用于展示）';
CREATE INDEX IF NOT EXISTS idx_recent_condition_tm ON cec_new_energy_recent_condition(create_tm DESC);
