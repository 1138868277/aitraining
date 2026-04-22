import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();

app.listen(config.server.port, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${config.server.port}`);
  console.log(`📋 健康检查: http://localhost:${config.server.port}/api/health`);
  console.log(`📚 API 前缀: /api`);
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
