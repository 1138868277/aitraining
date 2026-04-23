import api from './api';
import type {
  GenerateCodeRequest,
  GenerateCodeResponse,
  SaveDraftRequest,
  SaveDraftResponse,
  DraftCodeItem,
  CodeRecord,
} from '@cec/contracts';

export async function generateCode(params: GenerateCodeRequest): Promise<GenerateCodeResponse | GenerateCodeResponse[]> {
  const res = await api.post('/codes/generate', params);
  return res.data;
}

export async function saveToDraft(params: SaveDraftRequest): Promise<SaveDraftResponse> {
  const res = await api.post('/codes/draft', params);
  return res.data;
}

export async function getDraftList(
  pageNum = 1,
  pageSize = 20,
): Promise<{ list: DraftCodeItem[]; total: number }> {
  const res = await api.get('/codes/draft', { params: { pageNum, pageSize } });
  return res.data;
}

export async function deleteDraftItem(id: number): Promise<void> {
  await api.delete(`/codes/draft/${id}`);
}

export async function batchDeleteDraft(ids: number[]): Promise<{ deletedCount: number }> {
  const res = await api.delete('/codes/draft/batch', { data: { ids } });
  return res.data;
}

export async function saveCodeRecords(codes: Array<{ code: string; name: string }>) {
  const res = await api.post('/codes', { codes });
  return res.data;
}

export async function getCodeHistory(
  pageNum = 1,
  pageSize = 20,
): Promise<{ list: CodeRecord[]; total: number }> {
  const res = await api.get('/codes', { params: { pageNum, pageSize } });
  return res.data;
}

export async function saveRecentCondition(conditions: Record<string, any>): Promise<void> {
  await api.post('/codes/recent-conditions', { conditions });
}

export async function getRecentConditions(): Promise<any[]> {
  const res = await api.get('/codes/recent-conditions');
  return res.data;
}
