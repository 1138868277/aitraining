import api from './api';
import type { DictTreeNode, ManualStatItem } from '@cec/contracts';

/** 获取字典树数据 */
export async function getDictTree(): Promise<DictTreeNode[]> {
  const res = await api.get('/dict/tree');
  return res.data;
}

/** 懒加载获取数据类码下的数据码 */
export async function getDictTreeDataCodes(
  typeDomainCode: string,
  secondClassCode: string,
  dataCategoryCode: string,
): Promise<DictTreeNode[]> {
  const res = await api.get('/dict/tree/data-codes', {
    params: { typeDomainCode, secondClassCode, dataCategoryCode },
  });
  return res.data;
}

/** 分页查询手动添加记录 */
export async function getManualStatistics(
  pageNum: number,
  pageSize: number,
  secondClassCode?: string,
  typeCode?: string,
  sortBy?: string,
  sortOrder?: string,
): Promise<{
  items: ManualStatItem[];
  total: number;
  secondClassOptions: Array<{ code: string; name: string }>;
  typeOptions: Array<{ code: string; name: string }>;
}> {
  const params: any = { pageNum, pageSize };
  if (secondClassCode) params.secondClassCode = secondClassCode;
  if (typeCode) params.typeCode = typeCode;
  if (sortBy) params.sortBy = sortBy;
  if (sortOrder) params.sortOrder = sortOrder;
  const res = await api.get('/dict/manual-statistics', { params });
  return res.data;
}

/** 导出全部手动添加记录 */
export async function exportManualStatistics(secondClassCode?: string, typeCode?: string): Promise<ManualStatItem[]> {
  const params: any = {};
  if (secondClassCode) params.secondClassCode = secondClassCode;
  if (typeCode) params.typeCode = typeCode;
  const res = await api.get('/dict/manual-statistics/export', { params });
  return res.data;
}

/** 提交手动添加的数据码到审批 */
export async function submitCodeForApproval(data: {
  typeDomainCode: string;
  secondClassCode: string;
  dataCategoryCode: string;
  dataCode: string;
}): Promise<{ draftId: number }> {
  const res = await api.post('/dict/manual-code/submit-approval', data);
  return res.data;
}

/** 删除手动添加的数据码 */
export async function deleteManualCode(data: {
  typeDomainCode: string;
  secondClassCode: string;
  dataCategoryCode: string;
  dataCode: string;
}): Promise<void> {
  await api.delete('/dict/manual-code', { params: data });
}

/** 编码修正：批量修正编码 */
export async function batchCorrectCodes(
  items: Array<{ code: string; description: string; modification: string }>,
): Promise<{
  items: Array<{
    oldCode: string;
    newCode: string;
    description: string;
    modification: string;
    changes: Array<{
      segmentLabel: string;
      oldValue: string;
      newValue: string;
      start: number;
      length: number;
    }>;
    duplicate: boolean;
    correctionTime: string;
  }>;
  totalCount: number;
}> {
  const res = await api.post('/validate/correct-codes', { items });
  return res.data;
}
