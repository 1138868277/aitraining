import api from './api';

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
