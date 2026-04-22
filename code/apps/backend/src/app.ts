import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestIdMiddleware, requestLogger, globalErrorHandler } from './common/middleware.js';
import dictRouter from './modules/dict/dict-controller.js';
import codeRouter from './modules/code-generation/code-controller.js';
import validateRouter from './modules/code-validation/validate-controller.js';
import statisticsRouter from './modules/statistics/statistics-controller.js';

export function createApp() {
  const app = express();

  // CORS 配置
  app.use(
    cors({
      origin: config.server.frontendUrl,
      credentials: true,
    }),
  );

  // 请求体解析
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 通用中间件
  app.use(requestIdMiddleware);
  app.use(requestLogger);

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

  // 路由注册
  app.use(dictRouter);
  app.use(codeRouter);
  app.use(validateRouter);
  app.use(statisticsRouter);

  // 全局错误处理
  app.use(globalErrorHandler);

  return app;
}
