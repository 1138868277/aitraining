import api from './api';
import type { StatisticsOverview, DimensionStatItem, ChartData } from '@cec/contracts';

export async function getOverview(): Promise<StatisticsOverview> {
  const res = await api.get('/statistics/overview');
  return res.data;
}

export async function getByDimension(
  dimension: string,
): Promise<{ dimension: string; items: DimensionStatItem[] }> {
  const res = await api.get('/statistics/by-dimension', { params: { dimension } });
  return res.data;
}

export async function getChartData(
  chartType: string,
  dimension: string,
): Promise<ChartData> {
  const res = await api.get('/statistics/chart-data', {
    params: { chartType, dimension },
  });
  return res.data;
}

export async function getDetails(pageNum = 1, pageSize = 20) {
  const res = await api.get('/statistics/details', {
    params: { pageNum, pageSize },
  });
  return res.data;
}
