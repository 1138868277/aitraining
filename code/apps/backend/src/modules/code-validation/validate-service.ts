import * as validateDomain from './validate-domain.js';
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

/** 编码修正：批量修正编码 */
export async function batchCorrectCodes(
  items: Array<{ code: string; description: string; modification: string }>,
): Promise<validateDomain.CodeCorrectionResult[]> {
  return validateDomain.batchCorrectCodes(items);
}
