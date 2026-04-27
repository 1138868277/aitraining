import { z } from 'zod';

/** 字典项 */
export const dictItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  parentCode: z.string().optional(),
});

export type DictItem = z.infer<typeof dictItemSchema>;

/** 字典类型列表响应 */
export const dictTypeListResponseSchema = z.object({
  types: z.array(
    z.object({
      dictType: z.string(),
      dictName: z.string(),
    }),
  ),
});

/** 字典项列表响应 */
export const dictItemListResponseSchema = z.object({
  dictType: z.string(),
  items: z.array(dictItemSchema),
});

export type DictItemListResponse = z.infer<typeof dictItemListResponseSchema>;

/** 快捷搜索字典项 */
export const dictQuickSearchItemSchema = z.object({
  typeCode: z.string(),
  secondClassCode: z.string(),
  secondClassName: z.string(),
  dataCategoryCode: z.string(),
  dataCategoryName: z.string(),
  dataCode: z.string(),
  dataName: z.string(),
});

export type DictQuickSearchItem = z.infer<typeof dictQuickSearchItemSchema>;

/** 快捷搜索响应 */
export const dictQuickSearchResponseSchema = z.object({
  items: z.array(dictQuickSearchItemSchema),
});

export type DictQuickSearchResponse = z.infer<typeof dictQuickSearchResponseSchema>;

/** 手动新增编码字典请求 */
export const createManualDictCodeSchema = z.object({
  typeCode: z.string().min(1, '请选择类型'),
  secondClassCode: z.string().min(1, '请选择二级类码'),
  secondClassName: z.string().optional(),
  dataCategoryCode: z.string().min(1, '请输入数据类码'),
  dataCode: z.string().min(1, '请输入数据码'),
});

export type CreateManualDictCodeRequest = z.infer<typeof createManualDictCodeSchema>;

/** 手动新增编码字典响应 */
export const createManualDictCodeResponseSchema = z.object({
  codeDictId: z.number(),
  isManual: z.string(),
});

export type CreateManualDictCodeResponse = z.infer<typeof createManualDictCodeResponseSchema>;

/** 批量新增编码字典 - 单条记录 */
export const manualDictCodeEntrySchema = z.object({
  dataCategoryCode: z.string().min(1, '请输入数据类码'),
  dataCategoryName: z.string().optional().default(''),
  dataCode: z.string().min(1, '请输入数据码'),
  dataName: z.string().optional().default(''),
});

export type ManualDictCodeEntry = z.infer<typeof manualDictCodeEntrySchema>;

/** 批量新增编码字典请求 */
export const batchCreateManualDictCodeSchema = z.object({
  typeCode: z.string().min(1, '请选择类型'),
  secondClassCode: z.string().min(1, '请选择二级类码'),
  secondClassName: z.string().optional(),
  entries: z.array(manualDictCodeEntrySchema).min(1, '请至少添加一条数据码记录'),
});

export type BatchCreateManualDictCodeRequest = z.infer<typeof batchCreateManualDictCodeSchema>;

/** 批量新增编码字典响应 */
export const batchCreateManualDictCodeResponseSchema = z.object({
  insertedCount: z.number(),
});

export type BatchCreateManualDictCodeResponse = z.infer<typeof batchCreateManualDictCodeResponseSchema>;

// ========== 编码解析 ==========

/** 编码解析 - 单段编码信息 */
export const codeParseSegmentSchema = z.object({
  label: z.string(),
  code: z.string(),
  name: z.string(),
});

export type CodeParseSegment = z.infer<typeof codeParseSegmentSchema>;

/** 编码解析请求 */
export const codeParseRequestSchema = z.object({
  code: z.string().length(31, '编码必须为31位'),
});

export type CodeParseRequest = z.infer<typeof codeParseRequestSchema>;

/** 编码解析响应 */
export const codeParseResponseSchema = z.object({
  rawCode: z.string(),
  segments: z.array(codeParseSegmentSchema),
  isValid: z.boolean(),
  errorMessage: z.string().optional(),
});

export type CodeParseResponse = z.infer<typeof codeParseResponseSchema>;
