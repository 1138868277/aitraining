import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { tenantStorage, type TenantContext } from '../db/tenant-context.js';
import { getTenantById } from '../config/tenants.js';
import crypto from 'crypto';

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

// ====== Token 验证（简单实现，避免与 auth-service 循环依赖） ======
const TOKEN_SECRET = 'cec-2024-token-secret-dev-only';

interface TokenPayload {
  username: string;
  tenant: string;
  displayName: string;
  region: string;
  exp: number;
}

function verifySimpleToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** 租户上下文中间件：从 token 解析租户，设置 AsyncLocalStorage */
export function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  // 登录接口和健康检查不需要租户上下文
  const skipPaths = ['/api/auth/login', '/api/health', '/api/version'];
  if (skipPaths.includes(req.path)) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifySimpleToken(token);
    if (payload) {
      const tenant = getTenantById(payload.tenant);
      const ctx: TenantContext = {
        tenantId: payload.tenant,
        schema: tenant ? tenant.datasource.schema : 'liuhaojun',
      };
      tenantStorage.run(ctx, next);
      return;
    }
  }

  // 无有效 token 时继续（controller 层会做 auth 校验）
  next();
}
