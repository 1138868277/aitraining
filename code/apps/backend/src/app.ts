import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestIdMiddleware, requestLogger, globalErrorHandler, tenantContextMiddleware } from './common/middleware.js';
import { initTenantPools } from './db/index.js';
import authRouter from './modules/auth/auth-controller.js';
import { initUserTable } from './modules/auth/auth-service.js';
import { TENANTS } from './config/tenants.js';
import dictRouter from './modules/dict/dict-controller.js';
import codeRouter from './modules/code-generation/code-controller.js';
import validateRouter from './modules/code-validation/validate-controller.js';
import statisticsRouter from './modules/statistics/statistics-controller.js';
import stationRouter from './modules/station/station-controller.js';
import datasourceRouter from './modules/datasource/datasource-controller.js';
import approvalRouter from './modules/approval/approval-controller.js';

export function createApp(): import('express').Express {
  const app = express();

  // CORS 配置
  app.use(
    cors({
      origin: config.server.frontendUrl,
      credentials: true,
    }),
  );

  // 请求体解析
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 通用中间件
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // 租户上下文中间件（在路由之前）
  app.use(tenantContextMiddleware);

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({
      code: 0,
      message: 'success',
      data: {
        status: 'UP',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  });

  // 版本信息
  app.get('/api/version', (_req, res) => {
    res.json({
      code: 0,
      message: 'success',
      data: {
        version: '1.0.0',
        name: '华电新能源测点编码管理工具',
      },
      timestamp: Date.now(),
    });
  });

  // 租户列表
  app.get('/api/tenants', (_req, res) => {
    res.json({
      code: 0,
      message: 'success',
      data: TENANTS.map(t => ({ id: t.id, displayName: t.displayName })),
    });
  });

  // 认证路由
  app.use(authRouter);

  // 初始化用户表（建表 + 默认用户）
  initUserTable().catch(err => console.error('Failed to init user table:', err));

  // 业务路由注册
  app.use(dictRouter);
  app.use(codeRouter);
  app.use(validateRouter);
  app.use(statisticsRouter);
  app.use(stationRouter);
  app.use(datasourceRouter);
  app.use(approvalRouter);

  // 全局错误处理
  app.use(globalErrorHandler);

  return app;
}

/** 启动时初始化多租户连接池 */
export async function bootstrap(): Promise<void> {
  console.log('🔌 正在初始化多租户连接池...');
  await initTenantPools();
}
