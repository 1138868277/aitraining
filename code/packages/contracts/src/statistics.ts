import { z } from 'zod';

/** 统计概览响应 */
export const statisticsOverviewSchema = z.object({
  totalCount: z.number(),
  compliantCount: z.number(),
  abnormalCount: z.number(),
  complianceRate: z.number(),
});

export type StatisticsOverview = z.infer<typeof statisticsOverviewSchema>;

/** 维度统计项 */
export const dimensionStatItemSchema = z.object({
  name: z.string(),
  totalCount: z.number(),
  compliantCount: z.number(),
  abnormalCount: z.number(),
  complianceRate: z.number(),
});

export type DimensionStatItem = z.infer<typeof dimensionStatItemSchema>;

/** 维度统计响应 */
export const dimensionStatisticsSchema = z.object({
  dimension: z.string(),
  items: z.array(dimensionStatItemSchema),
});

export type DimensionStatistics = z.infer<typeof dimensionStatisticsSchema>;

/** 柱状图数据 */
export const barChartDataSchema = z.object({
  chartType: z.literal('bar'),
  dimension: z.string(),
  categories: z.array(z.string()),
  compliantData: z.array(z.number()),
  abnormalData: z.array(z.number()),
});

export type BarChartData = z.infer<typeof barChartDataSchema>;

/** 饼图系列数据 */
export const pieSeriesItemSchema = z.object({
  name: z.string(),
  value: z.number(),
  percentage: z.number(),
});

export type PieSeriesItem = z.infer<typeof pieSeriesItemSchema>;

/** 饼图数据 */
export const pieChartDataSchema = z.object({
  chartType: z.literal('pie'),
  dimension: z.string(),
  series: z.array(pieSeriesItemSchema),
});

export type PieChartData = z.infer<typeof pieChartDataSchema>;

/** 图表数据（联合类型） */
export type ChartData = BarChartData | PieChartData;

/** 统计明细项 */
export const statisticsDetailItemSchema = z.object({
  index: z.number(),
  managementDomain: z.string(),
  station: z.string(),
  totalCount: z.number(),
  compliantCount: z.number(),
  abnormalCount: z.number(),
  complianceRate: z.number(),
});

export type StatisticsDetailItem = z.infer<typeof statisticsDetailItemSchema>;

/** 统计明细分页响应 */
export const statisticsDetailPageSchema = z.object({
  list: z.array(statisticsDetailItemSchema),
  total: z.number(),
  pageNum: z.number(),
  pageSize: z.number(),
});

export type StatisticsDetailPage = z.infer<typeof statisticsDetailPageSchema>;

/** 文件上传响应 */
export const uploadResponseSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  importCount: z.number(),
  status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED']),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
