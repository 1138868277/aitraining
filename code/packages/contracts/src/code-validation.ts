import { z } from 'zod';

/** 单条校验请求 */
export const singleValidateRequestSchema = z.object({
  code: z.string().length(31, '编码必须为31位'),
  name: z.string().optional(),
});

export type SingleValidateRequest = z.infer<typeof singleValidateRequestSchema>;

/** 批量校验请求 */
export const batchValidateRequestSchema = z.object({
  codes: z.array(singleValidateRequestSchema).min(1).max(1000),
});

export type BatchValidateRequest = z.infer<typeof batchValidateRequestSchema>;

/** 校验任务状态 */
export const ValidateTaskStatus = {
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type ValidateTaskStatus = (typeof ValidateTaskStatus)[keyof typeof ValidateTaskStatus];

/** 校验任务响应 */
export const validateTaskResponseSchema = z.object({
  taskId: z.string(),
  totalCount: z.number(),
  status: z.nativeEnum(ValidateTaskStatus),
});

export type ValidateTaskResponse = z.infer<typeof validateTaskResponseSchema>;

/** 校验结果类型 */
export const CheckResult = {
  COMPLIANT: 'COMPLIANT',
  ABNORMAL: 'ABNORMAL',
} as const;

export type CheckResult = (typeof CheckResult)[keyof typeof CheckResult];

/** 校验详情项 */
export const validateDetailSchema = z.object({
  index: z.number(),
  originalCode: z.string(),
  originalName: z.string().optional(),
  result: z.nativeEnum(CheckResult),
  suggestedCode: z.string().optional(),
  suggestedName: z.string().optional(),
  errorReason: z.string().optional(),
});

export type ValidateDetail = z.infer<typeof validateDetailSchema>;

/** 校验结果响应 */
export const validateResultResponseSchema = z.object({
  taskId: z.string(),
  totalCount: z.number(),
  compliantCount: z.number(),
  abnormalCount: z.number(),
  details: z.array(validateDetailSchema),
});

export type ValidateResultResponse = z.infer<typeof validateResultResponseSchema>;

/** 纠错建议 */
export const correctionSuggestionSchema = z.object({
  code: z.string(),
  name: z.string(),
  similarity: z.number(),
});

export type CorrectionSuggestion = z.infer<typeof correctionSuggestionSchema>;

/** 纠错建议响应 */
export const correctionSuggestionsResponseSchema = z.object({
  code: z.string(),
  suggestions: z.array(correctionSuggestionSchema),
});

export type CorrectionSuggestionsResponse = z.infer<typeof correctionSuggestionsResponseSchema>;

/** 一键纠错请求 */
export const batchCorrectRequestSchema = z.object({
  taskId: z.string(),
  abnormalIndexes: z.array(z.number()).optional(),
});

export type BatchCorrectRequest = z.infer<typeof batchCorrectRequestSchema>;

/** 纠正结果项 */
export const correctionItemSchema = z.object({
  id: z.number(),
  originalCode: z.string(),
  originalName: z.string().optional(),
  correctedCode: z.string(),
  correctedName: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED']),
});

export type CorrectionItem = z.infer<typeof correctionItemSchema>;

/** 一键纠错响应 */
export const batchCorrectResponseSchema = z.object({
  correctedCount: z.number(),
  corrections: z.array(correctionItemSchema),
});

export type BatchCorrectResponse = z.infer<typeof batchCorrectResponseSchema>;

/** 确认纠正请求 */
export const confirmCorrectionRequestSchema = z.object({
  id: z.number(),
});

export type ConfirmCorrectionRequest = z.infer<typeof confirmCorrectionRequestSchema>;

/** ---- 字典树、手动统计、编码解析 --- */

/** 字典树节点 */
export const dictTreeNodeSchema: z.ZodType<{
  code: string;
  name: string;
  type: 'secondClass' | 'dataCategory' | 'dataCode';
  isManual?: string;
  childCount?: number;
  children?: any[];
}> = z.object({
  code: z.string(),
  name: z.string(),
  type: z.enum(['typeDomain', 'secondClass', 'dataCategory', 'dataCode']),
  isManual: z.string().optional(),
  childCount: z.number().optional(),
  children: z.array(z.lazy((): z.ZodType<any> => dictTreeNodeSchema)).optional(),
});

export type DictTreeNode = z.infer<typeof dictTreeNodeSchema>;

/** 手动统计记录 */
export const manualStatItemSchema = z.object({
  secondClassCode: z.string(),
  secondClassName: z.string(),
  dataCategoryCode: z.string(),
  dataCategoryName: z.string(),
  dataCode: z.string(),
  dataName: z.string(),
  createTm: z.string(),
  typeCode: z.string().optional(),
  typeName: z.string().optional(),
});

export type ManualStatItem = z.infer<typeof manualStatItemSchema>;

/** 手动统计分页响应 */
export const manualStatResponseSchema = z.object({
  items: z.array(manualStatItemSchema),
  total: z.number(),
});

export type ManualStatResponse = z.infer<typeof manualStatResponseSchema>;

/** 已匹配的测点编码 */
export const matchedCodeSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export type MatchedCode = z.infer<typeof matchedCodeSchema>;

/** 解析后的编码项 */
export const resolvedCodeItemSchema = z.object({
  typeCode: z.string(),
  typeName: z.string(),
  secondClassCode: z.string(),
  secondClassName: z.string(),
  dataCategoryCode: z.string(),
  dataCategoryName: z.string(),
  dataCode: z.string(),
  dataName: z.string(),
  matchedCodes: z.array(matchedCodeSchema),
});

export type ResolvedCodeItem = z.infer<typeof resolvedCodeItemSchema>;

/** 解析编码请求 */
export const resolveCodesRequestSchema = z.object({
  codes: z.array(z.object({
    code: z.string(),
    name: z.string().optional(),
  })).min(1).max(10000),
});

export type ResolveCodesRequest = z.infer<typeof resolveCodesRequestSchema>;

/** 保存编码映射请求 */
export const saveCodeMappingRequestSchema = z.object({
  oldCode: z.string(),
  newCode: z.string(),
  oldName: z.string().optional(),
  newName: z.string().optional(),
});

export type SaveCodeMappingRequest = z.infer<typeof saveCodeMappingRequestSchema>;
