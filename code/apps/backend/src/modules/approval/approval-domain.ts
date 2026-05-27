import { query, queryAsTenant, getSchema } from '../../db/index.js';
import { getTenantById, TENANTS } from '../../config/tenants.js';

/** 根据类型代码获取 type_domain_code */
function getTypeDomainCode(typeCode: string): string {
  if (typeCode.startsWith('F') || typeCode === '01') return 'F';
  if (typeCode.startsWith('G') || typeCode === '02') return 'G';
  if (typeCode.startsWith('S') || typeCode === '05') return 'S';
  return 'Y';
}

// ====== Admin 侧审批表操作 ======

/** admin 的 schema 名 */
function getAdminSchema(): string {
  return getTenantById('admin')?.datasource.schema || 'liuhaojun';
}

/** 在 admin 侧创建审批记录 */
export async function createApprovalRecord(data: {
  sourceTenant: string;
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
  submitter: string;
}): Promise<number> {
  const schema = getAdminSchema();
  const sql = `INSERT INTO ${schema}.cec_new_energy_code_approval
    (source_tenant, type_code, second_class_code, second_class_name,
     data_category_code, data_category_name, data_code, data_name,
     status, submitter, submit_tm)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW())
    RETURNING approval_id`;
  const result = await queryAsTenant<{ approval_id: number }>('admin', sql, [
    data.sourceTenant,
    data.typeCode,
    data.secondClassCode,
    data.secondClassName,
    data.dataCategoryCode,
    data.dataCategoryName,
    data.dataCode,
    data.dataName,
    data.submitter,
  ]);
  return result[0].approval_id;
}

/** 查询 admin 侧审批列表（按状态筛选） */
export async function getApprovalList(
  status?: string,
  sourceTenant?: string,
  pageNum: number = 1,
  pageSize: number = 20,
): Promise<{ items: any[]; total: number }> {
  const schema = getAdminSchema();
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (sourceTenant) {
    conditions.push(`source_tenant = $${idx++}`);
    params.push(sourceTenant);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await queryAsTenant<{ cnt: number }>(
    'admin',
    `SELECT COUNT(*) AS cnt FROM ${schema}.cec_new_energy_code_approval ${where}`,
    params,
  );
  const total = Number(countResult[0].cnt);

  const offset = (pageNum - 1) * pageSize;
  const items = await queryAsTenant<any>(
    'admin',
    `SELECT approval_id AS "approvalId", source_tenant AS "sourceTenant",
        type_code AS "typeCode", second_class_code AS "secondClassCode",
        second_class_name AS "secondClassName",
        data_category_code AS "dataCategoryCode",
        data_category_name AS "dataCategoryName",
        data_code AS "dataCode", data_name AS "dataName",
        status, reject_reason AS "rejectReason",
        submitter, reviewer,
        submit_tm AS "submitTm", review_tm AS "reviewTm"
     FROM ${schema}.cec_new_energy_code_approval ${where}
     ORDER BY submit_tm DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, pageSize, offset],
  );

  return { items, total };
}

/** 获取单条审批记录 */
export async function getApprovalById(approvalId: number): Promise<any | null> {
  const schema = getAdminSchema();
  const result = await queryAsTenant<any>(
    'admin',
    `SELECT approval_id AS "approvalId", source_tenant AS "sourceTenant",
        type_code AS "typeCode", second_class_code AS "secondClassCode",
        second_class_name AS "secondClassName",
        data_category_code AS "dataCategoryCode",
        data_category_name AS "dataCategoryName",
        data_code AS "dataCode", data_name AS "dataName",
        status, reject_reason AS "rejectReason",
        submitter, reviewer,
        submit_tm AS "submitTm", review_tm AS "reviewTm"
     FROM ${schema}.cec_new_energy_code_approval
     WHERE approval_id = $1`,
    [approvalId],
  );
  return result[0] || null;
}

/** 审批通过：更新状态 */
export async function approveRecord(approvalId: number, reviewer: string): Promise<void> {
  const schema = getAdminSchema();
  await queryAsTenant(
    'admin',
    `UPDATE ${schema}.cec_new_energy_code_approval
     SET status = 'approved', reviewer = $1, review_tm = NOW()
     WHERE approval_id = $2`,
    [reviewer, approvalId],
  );
}

/** 审批拒绝：更新状态和原因 */
export async function rejectRecord(approvalId: number, reason: string, reviewer: string): Promise<void> {
  const schema = getAdminSchema();
  await queryAsTenant(
    'admin',
    `UPDATE ${schema}.cec_new_energy_code_approval
     SET status = 'rejected', reject_reason = $1, reviewer = $2, review_tm = NOW()
     WHERE approval_id = $3`,
    [reason, reviewer, approvalId],
  );
}

/** 获取当前用户（区域）的提交记录 */
export async function getMySubmissions(
  creator: string,
  pageNum: number = 1,
  pageSize: number = 20,
): Promise<{ items: any[]; total: number }> {
  const sql = `SELECT draft_id AS "draftId",
      type_code AS "typeCode", second_class_code AS "secondClassCode",
      second_class_name AS "secondClassName",
      data_category_code AS "dataCategoryCode",
      data_category_name AS "dataCategoryName",
      data_code AS "dataCode", data_name AS "dataName",
      status, reject_reason AS "rejectReason",
      submit_tm AS "submitTm", create_tm AS "createTm",
      modify_tm AS "reviewTm"
    FROM ${getSchema()}.cec_new_energy_code_draft
    WHERE creator = $1
    ORDER BY create_tm DESC
    LIMIT $2 OFFSET $3`;

  const countResult = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM ${getSchema()}.cec_new_energy_code_draft WHERE creator = $1`,
    [creator],
  );
  const total = Number(countResult[0].cnt);

  const offset = (pageNum - 1) * pageSize;
  const items = await query(sql, [creator, pageSize, offset]);

  return { items, total };
}

// ====== 区域侧草稿表操作 ======

/** 在本地创建草稿记录 */
export async function createDraft(data: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
  status: string;
  creator: string;
}): Promise<number> {
  const sql = `INSERT INTO ${getSchema()}.cec_new_energy_code_draft
    (type_code, second_class_code, second_class_name,
     data_category_code, data_category_name, data_code, data_name,
     status, creator, submit_tm, create_tm)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${data.status === 'submitted' ? 'NOW()' : 'NULL'}, NOW())
    RETURNING draft_id`;
  const result = await query<{ draft_id: number }>(sql, [
    data.typeCode,
    data.secondClassCode,
    data.secondClassName,
    data.dataCategoryCode,
    data.dataCategoryName,
    data.dataCode,
    data.dataName,
    data.status,
    data.creator,
  ]);
  return result[0].draft_id;
}

/** 更新草稿状态 */
export async function updateDraftStatus(draftId: number, status: string, approvalId?: number, rejectReason?: string): Promise<void> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  sets.push(`status = $${idx++}`);
  params.push(status);

  if (approvalId !== undefined) {
    sets.push(`approval_id = $${idx++}`);
    params.push(approvalId);
  }

  if (status === 'submitted') {
    sets.push(`submit_tm = NOW()`);
  }

  if (rejectReason !== undefined) {
    sets.push(`reject_reason = $${idx++}`);
    params.push(rejectReason);
  }

  sets.push(`modify_tm = NOW()`);

  params.push(draftId);
  await query(
    `UPDATE ${getSchema()}.cec_new_energy_code_draft SET ${sets.join(', ')} WHERE draft_id = $${idx}`,
    params,
  );
}

/** 更新草稿的审批 ID */
export async function updateDraftApprovalId(draftId: number, approvalId: number): Promise<void> {
  await query(
    `UPDATE ${getSchema()}.cec_new_energy_code_draft
     SET approval_id = $1, modify_tm = NOW()
     WHERE draft_id = $2`,
    [approvalId, draftId],
  );
}

/** 检查同区域下是否已存在重复的数据码提交记录（同数据类码+数据码+未终结状态） */
export async function checkDuplicateSubmission(
  typeCode: string,
  secondClassCode: string,
  dataCategoryCode: string,
  dataCode: string,
  creator: string,
): Promise<boolean> {
  const sql = `SELECT COUNT(*) AS cnt FROM ${getSchema()}.cec_new_energy_code_draft
    WHERE type_code = $1 AND second_class_code = $2
      AND data_category_code = $3 AND data_code = $4
      AND creator = $5 AND status IN ('draft', 'submitted')`;
  const result = await query<{ cnt: number }>(sql, [typeCode, secondClassCode, dataCategoryCode, dataCode, creator]);
  return Number(result[0].cnt) > 0;
}

// ====== 审批通过后下发到各区域 ======

/** 获取所有非 admin 租户 ID 列表 */
export function getRegionTenantIds(): string[] {
  return TENANTS.filter(t => t.id !== 'admin').map(t => t.id);
}

/** 遍历所有区域插入数据码（跳过来源区域，避免重复） */
export async function distributeToAllRegions(data: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
  creator: string;
  skipTenant?: string;
}): Promise<void> {
  const typeDomainCode = getTypeDomainCode(data.typeCode);
  const firstClassCode = 'B1';
  const firstClassName = '生产运行';

  // 1. 写入集团数据码库，作为全量基准
  try {
    const adminSchema = getAdminSchema();
    await queryAsTenant(
      'admin',
      `INSERT INTO ${adminSchema}.cec_new_energy_code_dict
        (type_domain_code, type_code, first_class_code, first_class_name,
         second_class_code, second_class_name,
         data_category_code, data_category_name, data_code, data_name,
         is_manual, creator, create_tm, modifier, modify_tm)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '0', $11, NOW(), $11, NOW())`,
      [typeDomainCode, data.typeCode, firstClassCode, firstClassName,
       data.secondClassCode, data.secondClassName,
       data.dataCategoryCode, data.dataCategoryName,
       data.dataCode, data.dataName, data.creator],
    );
  } catch (err) {
    console.error('Failed to distribute code to admin:', err);
  }

  // 2. 下发到各区域（来源区域已存在，跳过）
  const regionTenants = TENANTS.filter(t => t.id !== 'admin' && t.id !== data.skipTenant);
  for (const tenant of regionTenants) {
    const schema = tenant.datasource.schema;
    const sql = `INSERT INTO ${schema}.cec_new_energy_code_dict
      (type_domain_code, type_code, first_class_code, first_class_name,
       second_class_code, second_class_name,
       data_category_code, data_category_name, data_code, data_name,
       is_manual, creator, create_tm, modifier, modify_tm)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '0', $11, NOW(), $11, NOW())`;

    try {
      await queryAsTenant(tenant.id, sql, [
        typeDomainCode,
        data.typeCode,
        firstClassCode,
        firstClassName,
        data.secondClassCode,
        data.secondClassName,
        data.dataCategoryCode,
        data.dataCategoryName,
        data.dataCode,
        data.dataName,
        data.creator,
      ]);
    } catch (err) {
      console.error(`Failed to distribute code to tenant ${tenant.id}:`, err);
    }
  }
}

/** 审批通过后删除集团（admin）的手动编码记录（集团自审批场景） */
export async function deleteAdminManualDictRecord(fields: {
  typeCode: string;
  secondClassCode: string;
  dataCategoryCode: string;
  dataCode: string;
}): Promise<void> {
  const schema = getAdminSchema();
  const typeDomainCode = getTypeDomainCode(fields.typeCode);
  await queryAsTenant(
    'admin',
    `UPDATE ${schema}.cec_new_energy_code_dict
     SET if_delete = '1', modify_tm = NOW()
     WHERE type_domain_code = $1
       AND second_class_code = $2
       AND data_category_code = $3
       AND data_code = $4
       AND if_delete = '0'
       AND is_manual = '1'`,
    [typeDomainCode, fields.secondClassCode, fields.dataCategoryCode, fields.dataCode],
  );
}

/** 根据审批 ID 更新来源区域的草稿状态为 approved */
export async function updateDraftStatusBySourceTenant(sourceTenant: string, approvalId: number, status: string): Promise<void> {
  const tenant = TENANTS.find(t => t.id === sourceTenant);
  if (!tenant) return;
  const schema = tenant.datasource.schema;
  await queryAsTenant(
    sourceTenant,
    `UPDATE ${schema}.cec_new_energy_code_draft
     SET status = $1, modify_tm = NOW()
     WHERE approval_id = $2`,
    [status, approvalId],
  );
}

/** 根据审批 ID 更新来源区域的草稿状态为 rejected */
export async function updateDraftStatusRejected(sourceTenant: string, approvalId: number, reason: string): Promise<void> {
  const tenant = TENANTS.find(t => t.id === sourceTenant);
  if (!tenant) return;
  const schema = tenant.datasource.schema;
  await queryAsTenant(
    sourceTenant,
    `UPDATE ${schema}.cec_new_energy_code_draft
     SET status = 'rejected', reject_reason = $1, modify_tm = NOW()
     WHERE approval_id = $2`,
    [reason, approvalId],
  );
}

/** 软删除来源区域的手动编码记录（驳回时调用） */
export async function deleteSourceTenantDictRecord(sourceTenant: string, fields: {
  typeDomainCode: string;
  secondClassCode: string;
  dataCategoryCode: string;
  dataCode: string;
}): Promise<void> {
  const tenant = TENANTS.find(t => t.id === sourceTenant);
  if (!tenant) return;
  const schema = tenant.datasource.schema;
  await queryAsTenant(
    sourceTenant,
    `UPDATE ${schema}.cec_new_energy_code_dict
     SET if_delete = '1', modify_tm = NOW()
     WHERE type_domain_code = $1
       AND second_class_code = $2
       AND data_category_code = $3
       AND data_code = $4
       AND if_delete = '0'
       AND is_manual = '1'`,
    [fields.typeDomainCode, fields.secondClassCode, fields.dataCategoryCode, fields.dataCode],
  );
}
