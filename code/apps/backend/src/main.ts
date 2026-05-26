import { createApp, bootstrap } from './app.js';
import { config } from './config/index.js';

async function start() {
  // 初始化多租户连接池
  await bootstrap();

  const app = createApp();

  app.listen(config.server.port, () => {
    console.log(`🚀 后端服务已启动: http://localhost:${config.server.port}`);
    console.log(`📋 健康检查: http://localhost:${config.server.port}/api/health`);
    console.log(`📚 API 前缀: /api`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭服务...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 正在关闭服务...');
  process.exit(0);
});
