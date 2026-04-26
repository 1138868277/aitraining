import api from './api';
import type { DictTreeNode, ManualStatItem, ResolvedCodeItem } from '@cec/contracts';

export async function batchValidate(
  codes: Array<{ code: string; name?: string }>,
): Promise<{ taskId: string; totalCount: number; status: string }> {
  const res = await api.post('/validate/batch', { codes });
  return res.data;
}

export async function getValidateResult(taskId: string) {
  const res = await api.get(`/validate/results/${taskId}`);
  return res.data;
}

export async function batchCorrect(taskId: string, abnormalIndexes?: number[]) {
  const res = await api.post('/validate/batch-correct', { taskId, abnormalIndexes });
  return res.data;
}

export async function confirmCorrection(taskId: string, id: number) {
  const res = await api.put(`/validate/corrections/${id}/confirm`, { taskId });
  return res.data;
}

/** ---- 编码校验页面3个模块新增的 API 调用 ---- */

/** 获取字典树数据 */
export async function getDictTree(): Promise<DictTreeNode[]> {
  const res = await api.get('/dict/tree');
  return res.data;
}

/** 分页查询手动添加记录 */
export async function getManualStatistics(pageNum: number, pageSize: number, secondClassCode?: string): Promise<{
  items: ManualStatItem[];
  total: number;
  secondClassOptions: string[];
}> {
  const params: any = { pageNum, pageSize };
  if (secondClassCode) params.secondClassCode = secondClassCode;
  const res = await api.get('/dict/manual-statistics', { params });
  return res.data;
}

/** 导出全部手动添加记录 */
export async function exportManualStatistics(secondClassCode?: string): Promise<ManualStatItem[]> {
  const params: any = {};
  if (secondClassCode) params.secondClassCode = secondClassCode;
  const res = await api.get('/dict/manual-statistics/export', { params });
  return res.data;
}

/** 批量解析编码 */
export async function resolveCodes(codes: Array<{ code: string; name?: string }>): Promise<ResolvedCodeItem[]> {
  const res = await api.post('/validate/resolve-codes', { codes });
  return res.data;
}

/** 保存编码修改映射 */
export async function saveCodeMapping(data: {
  oldCode: string;
  newCode: string;
  oldName?: string;
  newName?: string;
}): Promise<{ success: boolean }> {
  const res = await api.post('/validate/save-code-mapping', data);
  return res.data;
}
