import type { GenerateCodeRequest, GenerateCodeResponse, DraftCodeItem } from '@cec/contracts';
import { generateCodeFromConditions, generateCodeName } from './code-domain.js';
import { formatDateTime, generateBatchNo } from '@cec/shared';
import { query, queryOne } from '../../db/index.js';
import { config } from '../../config/index.js';

const schema = config.db.schema;

/** 临时区存储（内存，页面刷新丢失） */
const draftStore: Map<string, DraftCodeItem[]> = new Map();

/** 生成编码（支持单条或批量） */
export function generateCode(
  conditions: GenerateCodeRequest,
  dictNames: Record<string, string> = {},
): GenerateCodeResponse | GenerateCodeResponse[] {
  const codes = generateCodeFromConditions(conditions);
  const names = generateCodeName(conditions, dictNames);

  // 如果是单条
  if (typeof codes === 'string' && typeof names === 'string') {
    return {
      code: codes,
      name: names,
      generateTime: formatDateTime(),
    };
  }

  // 如果是批量
  if (Array.isArray(codes) && Array.isArray(names) && codes.length === names.length) {
    return codes.map((code, index) => ({
      code,
      name: names[index],
      generateTime: formatDateTime(),
    }));
  }

  // 默认返回空数组
  return [];
}

/** 保存至临时区 */
export function saveToDraft(
  sessionId: string,
  codes: Array<{ code: string; name: string }>,
): { savedCount: number; totalCount: number } {
  const batchNo = generateBatchNo();
  const existing = draftStore.get(sessionId) || [];

  if (existing.length + codes.length > 5000) {
    throw new Error('DRAFT_FULL');
  }

  const newItems: DraftCodeItem[] = codes.map((c, i) => ({
    id: Date.now() + i,
    code: c.code,
    name: c.name,
    batchNo,
    generateTime: formatDateTime(),
  }));

  existing.push(...newItems);
  draftStore.set(sessionId, existing);

  return { savedCount: codes.length, totalCount: existing.length };
}

/** 获取临时区列表 */
export function getDraftList(
  sessionId: string,
  pageNum: number,
  pageSize: number,
): { list: DraftCodeItem[]; total: number; pageNum: number; pageSize: number } {
  const all = draftStore.get(sessionId) || [];
  const total = all.length;
  const start = (pageNum - 1) * pageSize;
  const list = all.slice(start, start + pageSize);
  return { list, total, pageNum, pageSize };
}

/** 删除临时区记录 */
export function deleteDraftItem(sessionId: string, id: number): boolean {
  const existing = draftStore.get(sessionId) || [];
  const index = existing.findIndex((item) => item.id === id);
  if (index === -1) return false;
  existing.splice(index, 1);
  draftStore.set(sessionId, existing);
  return true;
}

/** 批量删除临时区 */
export function batchDeleteDraft(sessionId: string, ids: number[]): number {
  const existing = draftStore.get(sessionId) || [];
  const filtered = existing.filter((item) => !ids.includes(item.id));
  draftStore.set(sessionId, filtered);
  return existing.length - filtered.length;
}

/** 持久化保存编码生成记录到数据库 */
export async function saveCodeRecords(
  codes: Array<{ code: string; name: string }>,
): Promise<number> {
  let saved = 0;
  for (const c of codes) {
    const sql = `INSERT INTO ${schema}.cec_new_energy_createcode
      (code, name, creator, create_tm, modify_tm, if_delete)
      VALUES ($1, $2, 'system', NOW(), NOW(), 0)`;
    await query(sql, [c.code, c.name]);
    saved++;
  }
  return saved;
}

/** 分页查询编码生成历史 */
export async function queryCodeHistory(
  pageNum: number,
  pageSize: number,
): Promise<{ list: any[]; total: number; pageNum: number; pageSize: number; pages: number }> {
  const countSql = `SELECT COUNT(*) AS total FROM ${schema}.cec_new_energy_createcode WHERE if_delete = '0'`;
  const countResult = await queryOne<{ total: number }>(countSql);
  const total = countResult?.total || 0;

  const offset = (pageNum - 1) * pageSize;
  const listSql = `SELECT id, code, name, create_tm AS generate_time, creator
    FROM ${schema}.cec_new_energy_createcode
    WHERE if_delete = '0'
    ORDER BY create_tm DESC
    LIMIT $1 OFFSET $2`;
  const list = await query(listSql, [pageSize, offset]);

  return {
    list,
    total,
    pageNum,
    pageSize,
    pages: Math.ceil(total / pageSize),
  };
}
