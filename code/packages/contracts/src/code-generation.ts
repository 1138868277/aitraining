import { z } from 'zod';

/** 生成编码请求 */
export const generateCodeRequestSchema = z.object({
  stationCode: z.string().length(4, '场站编码必须为4位'),
  typeCode: z.string().length(2, '类型编码必须为2位'),
  projectLineCode: z.string().length(3, '项目期号&并网线路编码必须为3位'),
  prefixNo: z.string().length(1, '前缀号必须为1位'),
  firstClassCode: z.string().length(2, '一级类码必须为2位'),
  secondClassCode: z.string().length(3, '二级类码必须为3位'),
  secondExtCode: z.string().min(1, '二级类扩展码不能为空'),
  thirdClassCode: z.string().length(3, '三级类码必须为3位'),
  thirdExtCode: z.string().min(1, '三级类扩展码不能为空'),
  dataTypeCode: z.string().length(2, '数据类码必须为2位').optional().default('00'),
  dataCode: z.string().length(3, '数据码必须为3位').optional().default('000'),
});

export type GenerateCodeRequest = z.infer<typeof generateCodeRequestSchema>;

/** 生成编码响应 */
export const generateCodeResponseSchema = z.object({
  code: z.string().length(31),
  name: z.string(),
  generateTime: z.string(),
});

export type GenerateCodeResponse = z.infer<typeof generateCodeResponseSchema>;

/** 批量生成编码请求 */
export const batchGenerateCodeRequestSchema = z.object({
  conditions: z.array(generateCodeRequestSchema).min(1).max(100),
});

export type BatchGenerateCodeRequest = z.infer<typeof batchGenerateCodeRequestSchema>;

/** 批量生成编码响应 */
export const batchGenerateCodeResponseSchema = z.object({
  codes: z.array(generateCodeResponseSchema),
  totalCount: z.number(),
});

export type BatchGenerateCodeResponse = z.infer<typeof batchGenerateCodeResponseSchema>;

/** 保存至临时区请求 */
export const saveDraftRequestSchema = z.object({
  codes: z.array(
    z.object({
      code: z.string().length(31),
      name: z.string(),
    }),
  ),
});

export type SaveDraftRequest = z.infer<typeof saveDraftRequestSchema>;

/** 保存至临时区响应 */
export const saveDraftResponseSchema = z.object({
  savedCount: z.number(),
  totalCount: z.number(),
});

export type SaveDraftResponse = z.infer<typeof saveDraftResponseSchema>;

/** 临时区编码项 */
export const draftCodeItemSchema = z.object({
  id: z.number(),
  code: z.string().length(31),
  name: z.string(),
  batchNo: z.string(),
  generateTime: z.string(),
});

export type DraftCodeItem = z.infer<typeof draftCodeItemSchema>;

/** 临时区分页查询响应 */
export const draftListResponseSchema = z.object({
  list: z.array(draftCodeItemSchema),
  total: z.number(),
  pageNum: z.number(),
  pageSize: z.number(),
});

export type DraftListResponse = z.infer<typeof draftListResponseSchema>;

/** 编码生成记录 */
export const codeRecordSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  generateTime: z.string(),
  creator: z.string().optional(),
  createTm: z.string().optional(),
});

export type CodeRecord = z.infer<typeof codeRecordSchema>;

/** 编码生成记录分页查询响应 */
export const codeRecordPageResponseSchema = z.object({
  list: z.array(codeRecordSchema),
  total: z.number(),
  pageNum: z.number(),
  pageSize: z.number(),
  pages: z.number(),
});

export type CodeRecordPageResponse = z.infer<typeof codeRecordPageResponseSchema>;
