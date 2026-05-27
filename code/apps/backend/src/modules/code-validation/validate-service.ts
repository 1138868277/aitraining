import * as validateDomain from './validate-domain.js';
import * as approvalDomain from '../approval/approval-domain.js';
import type { DictTreeNode, ManualStatItem } from './validate-domain.js';

/** 获取字典树数据 */
export async function getDictTree(): Promise<DictTreeNode[]> {
  return validateDomain.getDictTree();
}

/** 懒加载获取数据类码下的数据码 */
export async function getDictTreeDataCodes(
  typeDomainCode: string,
  secondClassCode: string,
  dataCategoryCode: string,
): Promise<DictTreeNode[]> {
  return validateDomain.getDictTreeDataCodes(typeDomainCode, secondClassCode, dataCategoryCode);
}

/** 分页查询手动添加记录 */
export async function getManualStatistics(
  pageNum: number,
  pageSize: number,
  secondClassCode?: string,
  typeCode?: string,
  sortBy?: string,
  sortOrder?: string,
): Promise<{ items: ManualStatItem[]; total: number; secondClassOptions: any; typeOptions: any }> {
  return validateDomain.getManualStatistics(pageNum, pageSize, secondClassCode, typeCode, sortBy, sortOrder);
}

/** 导出全部手动添加记录 */
export async function exportManualStatistics(secondClassCode?: string, typeCode?: string, sortBy?: string, sortOrder?: string): Promise<ManualStatItem[]> {
  return validateDomain.getAllManualStatistics(secondClassCode, typeCode, sortBy, sortOrder);
}

/** 提交手动添加的数据码到审批 */
export async function submitCodeForApproval(input: {
  typeDomainCode: string;
  secondClassCode: string;
  dataCategoryCode: string;
  dataCode: string;
  submitter: string;
  sourceTenant: string;
}) {
  // 1. 查询字典条目详情
  const entry = await validateDomain.getDictEntryByFields({
    typeDomainCode: input.typeDomainCode,
    secondClassCode: input.secondClassCode,
    dataCategoryCode: input.dataCategoryCode,
    dataCode: input.dataCode,
  });
  if (!entry) {
    throw Object.assign(new Error('数据码不存在或已被删除'), { code: 'RESOURCE_NOT_FOUND' });
  }

  // 2. 检查是否已有未终结的草稿
  const isDuplicate = await approvalDomain.checkDuplicateSubmission(
    input.typeDomainCode,
    input.secondClassCode,
    input.dataCategoryCode,
    input.dataCode,
    input.submitter,
  );
  if (isDuplicate) {
    throw Object.assign(new Error('该数据码已提交过审批，请勿重复提交'), { code: 'DUPLICATE_SUBMISSION' });
  }

  // 3. 创建草稿
  const draftId = await approvalDomain.createDraft({
    typeCode: input.typeDomainCode,
    secondClassCode: input.secondClassCode,
    secondClassName: entry.secondClassName,
    dataCategoryCode: input.dataCategoryCode,
    dataCategoryName: entry.dataCategoryName,
    dataCode: input.dataCode,
    dataName: entry.dataName,
    status: 'submitted',
    creator: input.submitter,
  });

  // 4. 在 admin 侧创建审批记录
  let approvalId: number;
  try {
    approvalId = await approvalDomain.createApprovalRecord({
      sourceTenant: input.sourceTenant,
      typeCode: input.typeDomainCode,
      secondClassCode: input.secondClassCode,
      secondClassName: entry.secondClassName,
      dataCategoryCode: input.dataCategoryCode,
      dataCategoryName: entry.dataCategoryName,
      dataCode: input.dataCode,
      dataName: entry.dataName,
      submitter: input.submitter,
    });
  } catch (err) {
    // 创建审批记录失败时回滚草稿
    await approvalDomain.updateDraftStatus(draftId, 'draft');
    throw err;
  }

  // 5. 更新草稿的 approval_id
  await approvalDomain.updateDraftApprovalId(draftId, approvalId);

  return { draftId, approvalId };
}

/** 删除手动添加的数据码 */
export async function deleteManualCode(fields: {
  typeDomainCode: string;
  secondClassCode: string;
  dataCategoryCode: string;
  dataCode: string;
}): Promise<boolean> {
  return validateDomain.deleteManualCode(fields);
}

/** 编码修正：批量修正编码 */
export async function batchCorrectCodes(
  items: Array<{ code: string; description: string; modification: string }>,
): Promise<validateDomain.CodeCorrectionResult[]> {
  return validateDomain.batchCorrectCodes(items);
}
