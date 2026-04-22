import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/** 请求追踪ID中间件 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  next();
}

/** 请求日志中间件 */
export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || '-';

  console.log(`[${requestId}] ${req.method} ${req.path}`);

  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${_res.statusCode} ${duration}ms`);
  });

  next();
}

/** 全局错误处理中间件 */
export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Unhandled error:', err);
  res.status(500).json({
    code: 'SYSTEM_ERROR',
    message: '系统繁忙，请稍后重试',
    data: null,
    timestamp: Date.now(),
  });
}
