import { v4 as uuidv4 } from 'uuid';
import { validateSingleCode, getCorrectionSuggestions } from './validate-domain.js';
import { query, queryOne } from '../../db/index.js';
import { config } from '../../config/index.js';
import * as validateDomain from './validate-domain.js';
import type { DictTreeNode, ManualStatItem, ResolvedCodeItem } from './validate-domain.js';

const schema = config.db.schema;

/** 校验任务存储 */
const taskStore: Map<
  string,
  {
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    totalCount: number;
    compliantCount: number;
    abnormalCount: number;
    details: Array<{
      index: number;
      originalCode: string;
      originalName?: string;
      result: 'COMPLIANT' | 'ABNORMAL';
      suggestedCode?: string;
      suggestedName?: string;
      errorReason?: string;
    }>;
    corrections: Array<{
      id: number;
      originalCode: string;
      originalName?: string;
      correctedCode: string;
      correctedName: string;
      status: 'PENDING' | 'CONFIRMED';
    }>;
  }
> = new Map();

/** 获取字典项集合（用于校验） */
async function getDictSets(): Promise<Record<string, Set<string>>> {
  const sets: Record<string, Set<string>> = {};

  const stationSql = `SELECT station_code FROM ${schema}.cec_new_energy_station_dict WHERE if_delete = '0'`;
  const stations = await query<{ station_code: string }>(stationSql);
  sets['station'] = new Set(stations.map((s) => s.station_code));

  const typeSql = `SELECT type_code FROM ${schema}.cec_new_energy_type_dict WHERE if_delete = '0'`;
  const types = await query<{ type_code: string }>(typeSql);
  sets['type'] = new Set(types.map((t) => t.type_code));

  return sets;
}

/** 获取字典项列表（用于纠错匹配） */
async function getDictItemLists(): Promise<Record<string, Array<{ code: string; name: string }>>> {
  const lists: Record<string, Array<{ code: string; name: string }>> = {};

  const stationSql = `SELECT station_code AS code, station_name AS name FROM ${schema}.cec_new_energy_station_dict WHERE if_delete = '0'`;
  lists['station'] = await query(stationSql);

  const typeSql = `SELECT type_code AS code, type_name AS name FROM ${schema}.cec_new_energy_type_dict WHERE if_delete = '0'`;
  lists['type'] = await query(typeSql);

  return lists;
}

/** 批量校验 */
export async function batchValidate(
  codes: Array<{ code: string; name?: string }>,
): Promise<{ taskId: string; totalCount: number; status: 'PROCESSING' }> {
  if (codes.length > 1000) {
    throw new Error('VALIDATE_LIMIT_EXCEEDED');
  }

  const taskId = uuidv4();
  const dictSets = await getDictSets();
  const dictLists = await getDictItemLists();

  let compliantCount = 0;
  let abnormalCount = 0;
  const details: any[] = [];

  for (let i = 0; i < codes.length; i++) {
    const { code, name } = codes[i];
    const validation = validateSingleCode(code, dictSets);
    const detail: any = {
      index: i + 1,
      originalCode: code,
      originalName: name || '',
      result: validation.result,
      errorReason: validation.errorReason,
    };

    if (validation.result === 'ABNORMAL') {
      abnormalCount++;
      const suggestions = getCorrectionSuggestions(code, dictLists);
      if (suggestions.length > 0) {
        detail.suggestedCode = suggestions[0].code;
        detail.suggestedName = suggestions[0].name;
      }
    } else {
      compliantCount++;
    }

    details.push(detail);
  }

  taskStore.set(taskId, {
    status: 'COMPLETED',
    totalCount: codes.length,
    compliantCount,
    abnormalCount,
    details,
    corrections: [],
  });

  return { taskId, totalCount: codes.length, status: 'PROCESSING' };
}

/** 获取校验结果 */
export function getValidateResult(taskId: string) {
  const task = taskStore.get(taskId);
  if (!task) {
    throw new Error('RESOURCE_NOT_FOUND');
  }
  return {
    taskId,
    totalCount: task.totalCount,
    compliantCount: task.compliantCount,
    abnormalCount: task.abnormalCount,
    details: task.details,
  };
}

/** 批量纠错 */
export function batchCorrect(
  taskId: string,
  abnormalIndexes?: number[],
): { correctedCount: number; corrections: any[] } {
  const task = taskStore.get(taskId);
  if (!task) {
    throw new Error('RESOURCE_NOT_FOUND');
  }

  const abnormalDetails = task.details.filter((d) => d.result === 'ABNORMAL');
  const toCorrect = abnormalIndexes
    ? abnormalDetails.filter((d) => abnormalIndexes.includes(d.index))
    : abnormalDetails;

  const corrections = toCorrect.map((d, i) => ({
    id: task.corrections.length + i + 1,
    originalCode: d.originalCode,
    originalName: d.originalName,
    correctedCode: d.suggestedCode || d.originalCode,
    correctedName: d.suggestedName || '',
    status: 'PENDING' as const,
  }));

  task.corrections.push(...corrections);
  return { correctedCount: corrections.length, corrections };
}

/** 确认纠正结果 */
export function confirmCorrection(taskId: string, id: number) {
  const task = taskStore.get(taskId);
  if (!task) {
    throw new Error('RESOURCE_NOT_FOUND');
  }
  const correction = task.corrections.find((c) => c.id === id);
  if (!correction) {
    throw new Error('RESOURCE_NOT_FOUND');
  }
  correction.status = 'CONFIRMED';
  return correction;
}

/** 获取纠错建议 */
export function getSuggestions(code: string): any {
  // 模拟返回纠错建议
  return {
    code,
    suggestions: [
      { code: code.substring(0, 4) + 'XX' + code.substring(6), name: '建议编码1', similarity: 0.85 },
    ],
  };
}

/** ---- 以下为编码校验页面3个模块新增的 Service 方法 ---- */

/** 获取字典树数据 */
export async function getDictTree(): Promise<DictTreeNode[]> {
  return validateDomain.getDictTree();
}

/** 分页查询手动添加记录 */
export async function getManualStatistics(
  pageNum: number,
  pageSize: number,
  secondClassCode?: string,
): Promise<{ items: ManualStatItem[]; total: number; secondClassOptions: string[] }> {
  return validateDomain.getManualStatistics(pageNum, pageSize, secondClassCode);
}

/** 导出全部手动添加记录 */
export async function exportManualStatistics(secondClassCode?: string): Promise<ManualStatItem[]> {
  return validateDomain.getAllManualStatistics(secondClassCode);
}

/** 批量解析编码 */
export async function resolveCodes(
  codes: Array<{ code: string; name?: string }>,
): Promise<ResolvedCodeItem[]> {
  return validateDomain.resolveCodesFromDB(codes);
}

/** 保存编码修改映射 */
export async function saveCodeMapping(input: {
  oldCode: string;
  newCode: string;
  oldName: string;
  newName: string;
  creator: string;
}): Promise<{ success: boolean }> {
  await validateDomain.saveCodeMapping(input);
  return { success: true };
}
