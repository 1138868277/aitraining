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
