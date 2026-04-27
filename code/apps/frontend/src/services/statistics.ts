import api from './api';

// ========== 1. 编码生成统计 ==========

export async function getCodeGenOverview(): Promise<{
  totalCodes: number; todayCodes: number; thisWeekCodes: number; thisMonthCodes: number;
}> {
  const res = await api.get('/statistics/code-gen/overview');
  return res.data;
}

export async function getCodeGenByDimension(
  dimension: string, startTime?: string, endTime?: string,
): Promise<{ dimension: string; items: Array<{ name: string; value: number; percentage: number }> }> {
  const res = await api.get('/statistics/code-gen/by-dimension', { params: { dimension, startTime, endTime } });
  return res.data;
}

export async function getCodeGenByType(): Promise<{ windCount: number; solarCount: number; otherCount: number }> {
  const res = await api.get('/statistics/code-gen/by-type');
  return res.data;
}

export async function getCodeGenBySecondClass(type?: string): Promise<{ items: Array<{ name: string; value: number; percentage: number }> }> {
  const res = await api.get('/statistics/code-gen/by-second-class', { params: { type } });
  return res.data;
}

export async function getCodeGenByStation(): Promise<{ items: Array<{ name: string; value: number; percentage: number }> }> {
  const res = await api.get('/statistics/code-gen/by-station');
  return res.data;
}

// ========== 2. 编码字典统计 ==========

export async function getDictOverview(): Promise<{
  wind: { firstClassCount: number; secondClassCount: number; thirdClassCount: number; dataCategoryCount: number; dataCodeGroup: number; dataCodeManual: number };
  solar: { firstClassCount: number; secondClassCount: number; thirdClassCount: number; dataCategoryCount: number; dataCodeGroup: number; dataCodeManual: number };
}> {
  const res = await api.get('/statistics/dict/overview');
  return res.data;
}

export async function getDictNewAddition(startTime?: string, endTime?: string): Promise<{
  totalNewCodes: number; manualCodes: number; autoCodes: number;
  newCodesBySecondClass: Array<{ secondClassCode: string; secondClassName: string; count: number }>;
  newCodesByDate: Array<{ date: string; count: number }>;
}> {
  const res = await api.get('/statistics/dict/new-addition', { params: { startTime, endTime } });
  return res.data;
}

export async function getDictTypeDomainDist(): Promise<{
  items: Array<{ typeDomainCode: string; typeDomainName: string; secondClassCount: number; dataCategoryCount: number; dataCodeCount: number }>;
}> {
  const res = await api.get('/statistics/dict/type-domain-dist');
  return res.data;
}

// ========== 3. 全量测点统计 ==========

export async function importMeasurementFile(file: File): Promise<{ batchId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/statistics/measurement/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
  });
  return res.data;
}

export async function getImportStatus(): Promise<{
  importing: boolean; batchId: string | null; totalRows: number;
  importedRows: number; validRows: number; status: string; message?: string;
}> {
  const res = await api.get('/statistics/measurement/import-status');
  return res.data;
}

export async function getMeasureOverview(): Promise<{
  totalPoints: number; windCount: number; solarCount: number; otherCount: number;
}> {
  const res = await api.get('/statistics/measurement/overview');
  return res.data;
}

export async function getMeasureByDimension(dimension: string): Promise<{
  dimension: string; items: Array<{ name: string; count: number; percentage: number }>;
}> {
  const res = await api.get('/statistics/measurement/by-dimension', { params: { dimension } });
  return res.data;
}

export async function getMeasureDrillDown(typeCode: string): Promise<{
  typeCode: string; typeName: string; total: number;
  secondClassItems: Array<{ name: string; count: number; percentage: number }>;
}> {
  const res = await api.get('/statistics/measurement/drill-down', { params: { typeCode } });
  return res.data;
}

export async function clearMeasurementData(): Promise<void> {
  await api.delete('/statistics/measurement/clear');
}
