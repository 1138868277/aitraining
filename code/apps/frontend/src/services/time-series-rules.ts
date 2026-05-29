import api from './api';

/** 获取当前租户信息 */
export async function getTenant(): Promise<string> {
  const res = await api.get('/tsr/tenant');
  return res.data?.displayName || res.data?.schema || '';
}

/** 获取数据概览 */
export async function getOverview(): Promise<Record<string, number>> {
  const res = await api.get('/tsr/overview');
  return res.data;
}

/** 导入场站数据 */
export async function importStation(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<{ importedCount: number }> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/tsr/import/station', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
    signal,
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 30));
      }
    },
  });
  return res.data;
}

/** 导入测点数据 */
export async function importMeasure(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<{ importedCount: number }> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/tsr/import/measure', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
    signal,
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 30));
      }
    },
  });
  return res.data;
}

/** 生成规则 */
export async function generateRules(signal?: AbortSignal): Promise<{
  total: number;
  details: { module: string; energy: string; type: string; rows: number; rules: number }[];
}> {
  const res = await api.post('/tsr/generate', {}, { timeout: 300000, signal });
  return res.data;
}

/** 下载单个规则类型的总体 Excel 文件（完整单文件，不分片） */
export async function downloadOverallExcel(type: string): Promise<Blob> {
  const res = await api.get(`/tsr/export/overall/${type}`, {
    responseType: 'blob',
    timeout: 300000,
  });
  return res.data;
}

/** 下载全部4种规则类型的总体文件 ZIP（打包下载全部） */
export async function downloadAllOverallZip(): Promise<Blob> {
  const res = await api.get('/tsr/export/overall', {
    responseType: 'blob',
    timeout: 300000,
  });
  return res.data;
}

/** 保存 Blob 为文件下载 */
export function saveBlobAsFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 获取导入进度 */
export async function getImportProgress(type: string): Promise<{ total: number; done: number; status: string }> {
  const res = await api.get(`/tsr/import/progress?type=${type}`);
  return res.data;
}

/** 取消导入 */
export async function cancelImportTask(type: string): Promise<void> {
  await api.post('/tsr/import/cancel', { type });
}

/** 获取生成规则进度 */
export async function getGenerateProgress(): Promise<{
  total: number;
  done: number;
  status: string;
  currentStep: { module: string; energy: string; ruleType: string; status: string; rows: number } | null;
  doneSteps: { module: string; energy: string; ruleType: string; status: string; rows: number }[];
}> {
  const res = await api.get('/tsr/generate/progress');
  return res.data;
}

/** 清空所有导入数据和生成规则 */
export async function clearAllData(): Promise<void> {
  await api.post('/tsr/clear');
}

/** 下载 base64 文件 */
export function downloadBase64File(base64: string, filename: string) {
  const byteChars = atob(base64);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i);
  }
  const byteArr = new Uint8Array(byteNums);
  const blob = new Blob([byteArr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
