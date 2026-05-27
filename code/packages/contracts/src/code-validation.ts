import { z } from 'zod';

/** ---- 字典树、手动统计 --- */

/** 字典树节点 */
export const dictTreeNodeSchema: z.ZodType<{
  code: string;
  name: string;
  type: 'typeDomain' | 'secondClass' | 'dataCategory' | 'dataCode';
  isManual?: string;
  sourceTenant?: string;
  childCount?: number;
  children?: any[];
}> = z.object({
  code: z.string(),
  name: z.string(),
  type: z.enum(['typeDomain', 'secondClass', 'dataCategory', 'dataCode']),
  isManual: z.string().optional(),
  sourceTenant: z.string().optional(),
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
  /** 审批状态: draft | submitted | approved | rejected | null（null=未提交） */
  status: z.string().nullable().optional(),
  /** 驳回原因 */
  rejectReason: z.string().nullable().optional(),
  /** 草稿ID（用于操作关联） */
  draftId: z.number().nullable().optional(),
});

export type ManualStatItem = z.infer<typeof manualStatItemSchema>;

/** 手动统计分页响应 */
export const manualStatResponseSchema = z.object({
  items: z.array(manualStatItemSchema),
  total: z.number(),
});

export type ManualStatResponse = z.infer<typeof manualStatResponseSchema>;
