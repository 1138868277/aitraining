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
  typeName: z.string(),
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
