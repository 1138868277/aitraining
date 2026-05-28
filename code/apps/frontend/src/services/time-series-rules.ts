import api from './api';

/** 获取区域列表 */
export async function getRegions(): Promise<string[]> {
  const res = await api.get('/tsr/regions');
  return res.data;
}

/** 获取数据概览 */
export async function getOverview(area: string): Promise<Record<string, number>> {
  const res = await api.get('/tsr/overview', { params: { area } });
  return res.data;
}

/** 导入场站数据 */
export async function importStation(area: string, file: File): Promise<{ importedCount: number; area: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('area', area);
  const res = await api.post('/tsr/import/station', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return res.data;
}

/** 导入测点数据 */
export async function importMeasure(area: string, file: File): Promise<{ importedCount: number; area: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('area', area);
  const res = await api.post('/tsr/import/measure', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return res.data;
}

/** 生成规则 */
export async function generateRules(area: string): Promise<{
  total: number;
  details: { module: string; energy: string; type: string; rows: number }[];
}> {
  const res = await api.post('/tsr/generate', { area }, { timeout: 300000 });
  return res.data;
}

/** 导出单个规则文件（带认证下载） */
export async function downloadRuleFile(area: string, type: string): Promise<void> {
  const typeNames: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/tsr/export/${type}?area=${area}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('下载失败');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${area}区域_时序稽核质量规则_${typeNames[type]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 批量导出所有规则文件（base64下载） */
export async function exportAllRules(area: string): Promise<{
  files: { type: string; size: number; data: string }[];
}> {
  const res = await api.get('/tsr/export-all', { params: { area }, timeout: 300000 });
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
