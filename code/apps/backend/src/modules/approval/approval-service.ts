import * as approvalDomain from './approval-domain.js';
import { invalidateDictTreeCache } from '../../modules/code-validation/validate-domain.js';

/** 提交审批 */
export async function submitApproval(input: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
  submitter: string;
  sourceTenant: string;
}) {
  // 1. 检查本区域是否已有重复提交（同数据类码+数据码+未终结）
  const isDuplicate = await approvalDomain.checkDuplicateSubmission(
    input.typeCode,
    input.secondClassCode,
    input.dataCategoryCode,
    input.dataCode,
    input.submitter,
  );
  if (isDuplicate) {
    throw Object.assign(new Error('该数据码已提交过审批，请勿重复提交'), { code: 'DUPLICATE_SUBMISSION' });
  }

  // 2. 在本地创建草稿记录（status='submitted'）
  const draftId = await approvalDomain.createDraft({
    typeCode: input.typeCode,
    secondClassCode: input.secondClassCode,
    secondClassName: input.secondClassName,
    dataCategoryCode: input.dataCategoryCode,
    dataCategoryName: input.dataCategoryName,
    dataCode: input.dataCode,
    dataName: input.dataName,
    status: 'submitted',
    creator: input.submitter,
  });

  // 3. 在 admin 侧创建审批记录
  let approvalId: number;
  try {
    approvalId = await approvalDomain.createApprovalRecord({
      sourceTenant: input.sourceTenant,
      typeCode: input.typeCode,
      secondClassCode: input.secondClassCode,
      secondClassName: input.secondClassName,
      dataCategoryCode: input.dataCategoryCode,
      dataCategoryName: input.dataCategoryName,
      dataCode: input.dataCode,
      dataName: input.dataName,
      submitter: input.submitter,
    });
  } catch (err) {
    // 创建审批记录失败时回滚草稿
    await approvalDomain.updateDraftStatus(draftId, 'draft');
    throw err;
  }

  // 4. 更新草稿的 approval_id
  await approvalDomain.updateDraftApprovalId(draftId, approvalId);

  return { draftId, approvalId };
}

/** 获取审批列表（admin） */
export async function getApprovalList(
  status?: string,
  sourceTenant?: string,
  pageNum: number = 1,
  pageSize: number = 20,
) {
  return approvalDomain.getApprovalList(status, sourceTenant, pageNum, pageSize);
}

/** 获取当前用户的提交记录 */
export async function getMySubmissions(
  creator: string,
  pageNum: number = 1,
  pageSize: number = 20,
) {
  return approvalDomain.getMySubmissions(creator, pageNum, pageSize);
}

/** 审批通过 */
export async function approveApproval(approvalId: number, reviewer: string) {
  // 1. 获取审批记录
  const record = await approvalDomain.getApprovalById(approvalId);
  if (!record) {
    throw Object.assign(new Error('审批记录不存在'), { code: 'APPROVAL_NOT_FOUND' });
  }
  if (record.status !== 'pending') {
    throw Object.assign(new Error('审批状态不允许此操作'), { code: 'APPROVAL_STATUS_ERROR' });
  }

  // 2. 更新 admin 侧状态
  await approvalDomain.approveRecord(approvalId, reviewer);

  // 3. 下发到所有区域
  await approvalDomain.distributeToAllRegions({
    typeCode: record.typeCode,
    secondClassCode: record.secondClassCode,
    secondClassName: record.secondClassName,
    dataCategoryCode: record.dataCategoryCode,
    dataCategoryName: record.dataCategoryName,
    dataCode: record.dataCode,
    dataName: record.dataName,
    creator: reviewer,
  });

  // 4. 更新来源区域的草稿状态
  try {
    await approvalDomain.updateDraftStatusBySourceTenant(record.sourceTenant, approvalId, 'approved');
  } catch (err) {
    console.error(`Failed to update draft status for tenant ${record.sourceTenant}:`, err);
  }

  // 5. 失效字典树缓存
  invalidateDictTreeCache();
}

/** 审批拒绝 */
export async function rejectApproval(approvalId: number, reason: string, reviewer: string) {
  // 1. 获取审批记录
  const record = await approvalDomain.getApprovalById(approvalId);
  if (!record) {
    throw Object.assign(new Error('审批记录不存在'), { code: 'APPROVAL_NOT_FOUND' });
  }
  if (record.status !== 'pending') {
    throw Object.assign(new Error('审批状态不允许此操作'), { code: 'APPROVAL_STATUS_ERROR' });
  }

  // 2. 更新 admin 侧状态
  await approvalDomain.rejectRecord(approvalId, reason, reviewer);

  // 3. 更新来源区域的草稿状态
  try {
    await approvalDomain.updateDraftStatusRejected(record.sourceTenant, approvalId, reason);
  } catch (err) {
    console.error(`Failed to update draft reject status for tenant ${record.sourceTenant}:`, err);
  }
}
