-- 华电新能源测点编码管理工具 - 数据码审批流程
-- 新增审批相关表
--
-- 说明：
--   cec_new_energy_code_approval 表在集团侧（admin/liuhaojun schema）执行
--   cec_new_energy_code_draft 表在每个区域 schema（yunnan/fujian）下分别执行

-- ============================================================
-- 1. 集团侧：审批记录表（在 admin 数据库的 liuhaojun schema 下执行）
-- ============================================================
-- SET search_path TO liuhaojun;

CREATE TABLE IF NOT EXISTS cec_new_energy_code_approval (
    approval_id BIGSERIAL NOT NULL,
    source_tenant VARCHAR(20) NOT NULL,
    type_code VARCHAR(2) NOT NULL,
    second_class_code VARCHAR(3) NOT NULL,
    second_class_name VARCHAR(100) NOT NULL,
    data_category_code VARCHAR(2) NOT NULL,
    data_category_name VARCHAR(100) NOT NULL,
    data_code VARCHAR(3) NOT NULL,
    data_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reject_reason TEXT,
    submitter VARCHAR(50),
    reviewer VARCHAR(50),
    submit_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_tm TIMESTAMP,
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (approval_id)
);

COMMENT ON TABLE cec_new_energy_code_approval IS '数据码审批记录表（集团侧）';
COMMENT ON COLUMN cec_new_energy_code_approval.source_tenant IS '来源区域：yunnan / fujian';
COMMENT ON COLUMN cec_new_energy_code_approval.status IS '审批状态：pending-待审批 approved-已通过 rejected-已拒绝';
COMMENT ON COLUMN cec_new_energy_code_approval.reject_reason IS '拒绝原因';

CREATE INDEX IF NOT EXISTS idx_code_approval_status ON cec_new_energy_code_approval(status);
CREATE INDEX IF NOT EXISTS idx_code_approval_source ON cec_new_energy_code_approval(source_tenant);
CREATE INDEX IF NOT EXISTS idx_code_approval_submit_tm ON cec_new_energy_code_approval(submit_tm DESC);

-- ============================================================
-- 2. 区域侧：草稿/提交记录表（在每个区域 schema 下分别执行）
-- ============================================================
-- SET search_path TO yunnan;
-- SET search_path TO fujian;

CREATE TABLE IF NOT EXISTS cec_new_energy_code_draft (
    draft_id BIGSERIAL NOT NULL,
    type_code VARCHAR(2) NOT NULL,
    second_class_code VARCHAR(3) NOT NULL,
    second_class_name VARCHAR(100) NOT NULL,
    data_category_code VARCHAR(2) NOT NULL,
    data_category_name VARCHAR(100) NOT NULL,
    data_code VARCHAR(3) NOT NULL,
    data_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    approval_id BIGINT,
    reject_reason TEXT,
    submit_tm TIMESTAMP,
    creator VARCHAR(50),
    create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (draft_id)
);

COMMENT ON TABLE cec_new_energy_code_draft IS '数据码草稿/提交记录表（区域侧）';
COMMENT ON COLUMN cec_new_energy_code_draft.status IS '状态：draft-草稿 submitted-已提交 approved-已通过 rejected-已拒绝';
COMMENT ON COLUMN cec_new_energy_code_draft.approval_id IS '关联集团侧审批记录ID';
COMMENT ON COLUMN cec_new_energy_code_draft.reject_reason IS '拒绝原因（审批退回时填写）';

CREATE INDEX IF NOT EXISTS idx_code_draft_status ON cec_new_energy_code_draft(status);
CREATE INDEX IF NOT EXISTS idx_code_draft_creator ON cec_new_energy_code_draft(creator);
CREATE INDEX IF NOT EXISTS idx_code_draft_submit_tm ON cec_new_energy_code_draft(submit_tm DESC);
