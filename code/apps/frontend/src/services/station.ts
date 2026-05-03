import api from './api';

export interface StationItem {
  station_id: number;
  station_code: string;
  station_name: string;
  management_domain: string | null;
  creator: string;
  modifier: string;
  create_tm: string;
  modify_tm: string;
}

export interface StationListResult {
  list: StationItem[];
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
}

/** 分页查询场站列表 */
export async function listStation(pageNum: number = 1, pageSize: number = 20, keyword?: string): Promise<StationListResult> {
  const params: any = { pageNum, pageSize };
  if (keyword) params.keyword = keyword;
  const res = await api.get('/station/list', { params });
  return res.data;
}

/** 新增场站 */
export async function createStation(data: {
  stationCode: string;
  stationName: string;
  managementDomain?: string;
}): Promise<StationItem> {
  const res = await api.post('/station', data);
  return res.data;
}

/** 批量新增场站 */
export async function batchCreateStation(entries: Array<{
  stationCode: string;
  stationName: string;
  managementDomain?: string;
}>): Promise<{ insertedCount: number }> {
  const res = await api.post('/station/batch', { entries });
  return res.data;
}

/** 更新场站 */
export async function updateStation(id: number, data: {
  stationName?: string;
  managementDomain?: string;
}): Promise<StationItem> {
  const res = await api.put(`/station/${id}`, data);
  return res.data;
}

/** 删除场站 */
export async function deleteStation(id: number): Promise<void> {
  await api.delete(`/station/${id}`);
}

/** 一键删除所有场站 */
export async function deleteAllStation(): Promise<{ deletedCount: number }> {
  const res = await api.delete('/station/all');
  return res.data;
}

/** 导出所有场站 */
export async function exportAllStation(): Promise<StationItem[]> {
  const res = await api.get('/station/export');
  return res.data;
}
