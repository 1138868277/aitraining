import api from './api';

/** 获取当前租户信息 */
export async function getTenant(): Promise<string> {
  const res = await api.get('/tsr/tenant');
  return res.data?.schema || '';
}

/** 获取数据概览 */
export async function getOverview(): Promise<Record<string, number>> {
  const res = await api.get('/tsr/overview');
  return res.data;
}

/** 导入场站数据 */
export async function importStation(file: File): Promise<{ importedCount: number }> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/tsr/import/station', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return res.data;
}

/** 导入测点数据 */
export async function importMeasure(file: File): Promise<{ importedCount: number }> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/tsr/import/measure', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return res.data;
}

/** 生成规则 */
export async function generateRules(): Promise<{
  total: number;
  details: { module: string; energy: string; type: string; rows: number }[];
}> {
  const res = await api.post('/tsr/generate', {}, { timeout: 300000 });
  return res.data;
}

/** 导出单个规则文件（带认证下载） */
export async function downloadRuleFile(type: string): Promise<void> {
  const typeNames: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/tsr/export/${type}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('下载失败');

  // 从 Content-Disposition 提取文件名
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const filename = filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : `时序稽核质量规则_${typeNames[type]}.xlsx`;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 批量导出所有规则文件 */
export async function exportAllRules(): Promise<{
  files: { type: string; size: number; data: string }[];
}> {
  const res = await api.get('/tsr/export-all', { timeout: 300000 });
  return res.data;
}

/** 拆分文件 */
export async function splitFile(file: File, maxRows: number = 150000): Promise<{
  fileCount: number;
  files: { name: string; size: number; data: string }[];
}> {
  const form = new FormData();
  form.append('file', file);
  form.append('maxRows', String(maxRows));
  const res = await api.post('/tsr/split', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  });
  return res.data;
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
