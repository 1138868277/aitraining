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

export async function getCodeGenList(
  pageNum = 1,
  pageSize = 20,
  filters?: {
    typeCode?: string;
    stationCode?: string;
    secondClassCode?: string;
    dataTypeCode?: string;
  },
): Promise<{
  list: Array<{
    type_code: string;
    station_code: string;
    second_class_code: string;
    third_class_code: string;
    data_type_code: string;
    data_code: string;
    type_name: string;
    station_name: string;
    second_class_name: string;
    third_class_name: string;
    data_type_name: string;
    data_name: string;
    code_count: number;
  }>;
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
  filterOptions: {
    typeCodes: Array<{ code: string; name: string }>;
    stationCodes: Array<{ code: string; name: string }>;
    secondClassCodes: Array<{ code: string; name: string }>;
    dataTypeCodes: Array<{ code: string; name: string }>;
  };
}> {
  const params: Record<string, any> = { pageNum, pageSize };
  if (filters?.typeCode) params.typeCode = filters.typeCode;
  if (filters?.stationCode) params.stationCode = filters.stationCode;
  if (filters?.secondClassCode) params.secondClassCode = filters.secondClassCode;
  if (filters?.dataTypeCode) params.dataTypeCode = filters.dataTypeCode;
  const res = await api.get('/statistics/code-gen/list', { params });
  return res.data;
}

export async function getCodeGenGroupDetail(group: {
  typeCode: string;
  stationCode: string;
  secondClassCode: string;
  thirdClassCode: string;
  dataTypeCode: string;
  dataCode: string;
}): Promise<Array<{ code: string; name: string }>> {
  const res = await api.get('/statistics/code-gen/group-detail', { params: group });
  return res.data;
}

// ========== 2. 编码字典统计 ==========

let dictOverviewCache: any = null;

export async function getDictOverview(forceRefresh = false): Promise<{
  wind: { firstClassCount: number; secondClassCount: number; thirdClassCount: number; dataCategoryCount: number; dataCodeGroup: number; dataCodeManual: number };
  solar: { firstClassCount: number; secondClassCount: number; thirdClassCount: number; dataCategoryCount: number; dataCodeGroup: number; dataCodeManual: number };
  hydro: { firstClassCount: number; secondClassCount: number; thirdClassCount: number; dataCategoryCount: number; dataCodeGroup: number; dataCodeManual: number };
}> {
  if (!forceRefresh && dictOverviewCache) return dictOverviewCache;
  const res = await api.get('/statistics/dict/overview');
  dictOverviewCache = res.data;
  return dictOverviewCache;
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
  totalPoints: number; windCount: number; solarCount: number; otherCount: number; lastImportTime: string | null;
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

export async function getMeasureBySecondClass(type?: string): Promise<{ items: Array<{ name: string; value: number; percentage: number }> }> {
  const res = await api.get('/statistics/measurement/by-second-class', { params: { type } });
  return res.data;
}

export async function getMeasureByStation(): Promise<{ items: Array<{ name: string; value: number; percentage: number }> }> {
  const res = await api.get('/statistics/measurement/by-station');
  return res.data;
}

export async function getMeasureList(
  pageNum = 1,
  pageSize = 20,
  filters?: {
    typeCode?: string;
    stationCode?: string;
    secondClassCode?: string;
    dataTypeCode?: string;
  },
): Promise<{
  list: Array<{
    code: string;
    type_code: string;
    station_code: string;
    second_class_code: string;
    third_class_code: string;
    data_category_code: string;
    data_code: string;
    type_name: string;
    station_name: string;
    second_class_name: string;
    third_class_name: string;
    data_type_name: string;
    data_name: string;
  }>;
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
}> {
  const params: Record<string, any> = { pageNum, pageSize };
  if (filters?.typeCode) params.typeCode = filters.typeCode;
  if (filters?.stationCode) params.stationCode = filters.stationCode;
  if (filters?.secondClassCode) params.secondClassCode = filters.secondClassCode;
  if (filters?.dataTypeCode) params.dataTypeCode = filters.dataTypeCode;
  const res = await api.get('/statistics/measurement/list', { params });
  return res.data;
}

export async function getMeasureFilterOptions(): Promise<{
  typeCodes: Array<{ code: string; name: string }>;
  stationCodes: Array<{ code: string; name: string }>;
  secondClassCodes: Array<{ code: string; name: string }>;
  dataTypeCodes: Array<{ code: string; name: string }>;
}> {
  const res = await api.get('/statistics/measurement/filter-options');
  return res.data;
}

export async function clearMeasurementData(): Promise<void> {
  await api.delete('/statistics/measurement/clear');
}

export async function cancelImport(): Promise<void> {
  await api.post('/statistics/measurement/cancel-import');
}
