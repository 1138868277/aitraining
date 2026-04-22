import { query } from '../../db/index.js';
import { config } from '../../config/index.js';

const schema = config.db.schema;

/** 获取统计概览 */
export async function getOverview(): Promise<{
  totalCount: number;
  compliantCount: number;
  abnormalCount: number;
  complianceRate: number;
}> {
  const sql = `SELECT
    COUNT(*) AS total_count,
    COUNT(CASE WHEN result = 'COMPLIANT' THEN 1 END) AS compliant_count,
    COUNT(CASE WHEN result = 'ABNORMAL' THEN 1 END) AS abnormal_count
    FROM ${schema}.cec_new_energy_checkdata
    WHERE if_delete = '0'`;
  const result = await query<{
    total_count: string;
    compliant_count: string;
    abnormal_count: string;
  }>(sql);

  const total = parseInt(result[0]?.total_count || '0');
  const compliant = parseInt(result[0]?.compliant_count || '0');
  const abnormal = parseInt(result[0]?.abnormal_count || '0');
  const rate = total > 0 ? Math.round((compliant / total) * 1000) / 10 : 0;

  return {
    totalCount: total,
    compliantCount: compliant,
    abnormalCount: abnormal,
    complianceRate: rate,
  };
}

/** 按维度统计 */
export async function getByDimension(
  dimension: string,
): Promise<{ dimension: string; items: any[] }> {
  const dimensionColumnMap: Record<string, string> = {
    managementDomain: 'management_domain',
    station: 'station',
    type: 'type_code',
    checkResult: 'result',
  };

  const column = dimensionColumnMap[dimension] || 'management_domain';
  const sql = `SELECT
    ${column} AS name,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN result = 'COMPLIANT' THEN 1 END) AS compliant_count,
    COUNT(CASE WHEN result = 'ABNORMAL' THEN 1 END) AS abnormal_count
    FROM ${schema}.cec_new_energy_checkdata
    WHERE if_delete = '0'
    GROUP BY ${column}
    ORDER BY total_count DESC`;

  const rows = await query<{
    name: string;
    total_count: string;
    compliant_count: string;
    abnormal_count: string;
  }>(sql);

  const items = rows.map((r) => {
    const total = parseInt(r.total_count);
    const compliant = parseInt(r.compliant_count);
    const abnormal = parseInt(r.abnormal_count);
    return {
      name: r.name,
      totalCount: total,
      compliantCount: compliant,
      abnormalCount: abnormal,
      complianceRate: total > 0 ? Math.round((compliant / total) * 1000) / 10 : 0,
    };
  });

  return { dimension, items };
}

/** 获取图表数据 */
export async function getChartData(
  chartType: string,
  dimension: string,
): Promise<any> {
  const { items } = await getByDimension(dimension);

  if (chartType === 'bar') {
    return {
      chartType: 'bar',
      dimension,
      categories: items.map((i) => i.name),
      compliantData: items.map((i) => i.compliantCount),
      abnormalData: items.map((i) => i.abnormalCount),
    };
  }

  const total = items.reduce((sum, i) => sum + i.totalCount, 0);
  return {
    chartType: 'pie',
    dimension,
    series: items.map((i) => ({
      name: i.name,
      value: i.totalCount,
      percentage: total > 0 ? Math.round((i.totalCount / total) * 1000) / 10 : 0,
    })),
  };
}

/** 获取统计明细 */
export async function getDetails(
  pageNum: number,
  pageSize: number,
): Promise<{ list: any[]; total: number; pageNum: number; pageSize: number }> {
  const countSql = `SELECT COUNT(*) AS total FROM ${schema}.cec_new_energy_checkdata WHERE if_delete = '0'`;
  const countResult = await query<{ total: string }>(countSql);
  const total = parseInt(countResult[0]?.total || '0');

  const offset = (pageNum - 1) * pageSize;
  const listSql = `SELECT
    management_domain, station, type_code AS type,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN result = 'COMPLIANT' THEN 1 END) AS compliant_count,
    COUNT(CASE WHEN result = 'ABNORMAL' THEN 1 END) AS abnormal_count
    FROM ${schema}.cec_new_energy_checkdata
    WHERE if_delete = '0'
    GROUP BY management_domain, station, type_code
    ORDER BY management_domain
    LIMIT $1 OFFSET $2`;

  const rows = await query<{
    management_domain: string;
    station: string;
    type: string;
    total_count: string;
    compliant_count: string;
    abnormal_count: string;
  }>(listSql, [pageSize, offset]);

  const list = rows.map((r, i) => {
    const totalCount = parseInt(r.total_count);
    const compliantCount = parseInt(r.compliant_count);
    const abnormalCount = parseInt(r.abnormal_count);
    return {
      index: offset + i + 1,
      managementDomain: r.management_domain,
      station: r.station,
      type: r.type,
      totalCount,
      compliantCount,
      abnormalCount,
      complianceRate: totalCount > 0 ? Math.round((compliantCount / totalCount) * 1000) / 10 : 0,
    };
  });

  return { list, total, pageNum, pageSize };
}
