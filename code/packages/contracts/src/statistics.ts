import { z } from 'zod';

// ========== 通用 ==========

export const timeRangeSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export type TimeRange = z.infer<typeof timeRangeSchema>;

// ========== 1. 编码生成统计 ==========

/** 编码生成统计 - 概览 */
export const codeGenOverviewSchema = z.object({
  totalCodes: z.number(),
  todayCodes: z.number(),
  thisWeekCodes: z.number(),
  thisMonthCodes: z.number(),
});

export type CodeGenOverview = z.infer<typeof codeGenOverviewSchema>;

/** 编码生成统计 - 维度聚合项 */
export const codeGenDimensionItemSchema = z.object({
  name: z.string(),
  value: z.number(),
  percentage: z.number(),
});

export type CodeGenDimensionItem = z.infer<typeof codeGenDimensionItemSchema>;

/** 编码生成统计 - 维度聚合响应 */
export const codeGenDimensionResponseSchema = z.object({
  dimension: z.string(),
  items: z.array(codeGenDimensionItemSchema),
});

export type CodeGenDimensionResponse = z.infer<typeof codeGenDimensionResponseSchema>;

/** 编码生成统计 - 每日趋势 */
export const codeGenTrendItemSchema = z.object({
  date: z.string(),
  count: z.number(),
});

export type CodeGenTrendItem = z.infer<typeof codeGenTrendItemSchema>;

export const codeGenTrendResponseSchema = z.object({
  items: z.array(codeGenTrendItemSchema),
});

export type CodeGenTrendResponse = z.infer<typeof codeGenTrendResponseSchema>;

// ========== 2. 编码字典统计 ==========

/** 编码字典统计 - 当前概览 */
export const dictOverviewSchema = z.object({
  stationCount: z.number(),
  secondClassCount: z.number(),
  thirdClassCount: z.number(),
  dataCategoryCount: z.number(),
  dataCodeCount: z.number(),
  typeDomainCount: z.number(),
});

export type DictOverview = z.infer<typeof dictOverviewSchema>;

/** 编码字典统计 - 新增情况 */
export const dictNewAdditionSchema = z.object({
  totalNewCodes: z.number(),
  manualCodes: z.number(),
  autoCodes: z.number(),
  newCodesBySecondClass: z.array(
    z.object({
      secondClassCode: z.string(),
      secondClassName: z.string(),
      count: z.number(),
    }),
  ),
  newCodesByDate: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
    }),
  ),
});

export type DictNewAddition = z.infer<typeof dictNewAdditionSchema>;

/** 编码字典统计 - 类型域分布 */
export const dictTypeDomainDistSchema = z.object({
  items: z.array(
    z.object({
      typeDomainCode: z.string(),
      typeDomainName: z.string(),
      secondClassCount: z.number(),
      dataCategoryCount: z.number(),
      dataCodeCount: z.number(),
    }),
  ),
});

export type DictTypeDomainDist = z.infer<typeof dictTypeDomainDistSchema>;

// ========== 3. 全量测点统计 ==========

/** 全量测点统计 - 导入状态 */
export const importStatusSchema = z.object({
  importing: z.boolean(),
  batchId: z.string().nullable(),
  totalRows: z.number(),
  importedRows: z.number(),
  validRows: z.number(),
  status: z.enum(['IDLE', 'PROCESSING', 'COMPLETED', 'FAILED']),
  message: z.string().optional(),
});

export type ImportStatus = z.infer<typeof importStatusSchema>;

/** 全量测点统计 - 概览 */
export const measureOverviewSchema = z.object({
  totalPoints: z.number(),
  windCount: z.number(),
  solarCount: z.number(),
  otherCount: z.number(),
});

export type MeasureOverview = z.infer<typeof measureOverviewSchema>;

/** 全量测点统计 - 维度聚合项 */
export const measureDimensionItemSchema = z.object({
  name: z.string(),
  count: z.number(),
  percentage: z.number(),
});

export type MeasureDimensionItem = z.infer<typeof measureDimensionItemSchema>;

/** 全量测点统计 - 类型维度下钻 */
export const measureDrillDownSchema = z.object({
  typeCode: z.string(),
  typeName: z.string(),
  total: z.number(),
  secondClassItems: z.array(measureDimensionItemSchema),
});

export type MeasureDrillDown = z.infer<typeof measureDrillDownSchema>;
