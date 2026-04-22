import { z } from 'zod';

/** 通用成功响应 */
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number().default(0),
    message: z.string().default('success'),
    data: dataSchema,
    timestamp: z.number(),
  });

/** 通用分页响应 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    code: z.number().default(0),
    message: z.string().default('success'),
    data: z.object({
      list: z.array(itemSchema),
      total: z.number(),
      pageNum: z.number(),
      pageSize: z.number(),
      pages: z.number().optional(),
    }),
    timestamp: z.number(),
  });

/** 通用错误响应 */
export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string().optional(),
  timestamp: z.number(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/** 分页查询参数 */
export const pageQuerySchema = z.object({
  pageNum: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortField: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

export type PageQuery = z.infer<typeof pageQuerySchema>;
