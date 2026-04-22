import { Response } from 'express';

/** 成功响应 */
export function success<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    code: 0,
    message: 'success',
    data,
    timestamp: Date.now(),
  });
}

/** 分页响应 */
export function paginated<T>(
  res: Response,
  list: T[],
  total: number,
  pageNum: number,
  pageSize: number,
) {
  return res.status(200).json({
    code: 0,
    message: 'success',
    data: {
      list,
      total,
      pageNum,
      pageSize,
      pages: Math.ceil(total / pageSize),
    },
    timestamp: Date.now(),
  });
}

/** 错误响应 */
export function error(res: Response, code: string, message: string, httpStatus = 400) {
  return res.status(httpStatus).json({
    code,
    message,
    data: null,
    timestamp: Date.now(),
  });
}

/** 带详情字段的错误响应 */
export function errorWithDetails(
  res: Response,
  code: string,
  message: string,
  details: Record<string, unknown>,
  httpStatus = 400,
) {
  return res.status(httpStatus).json({
    code,
    message,
    data: details,
    timestamp: Date.now(),
  });
}
