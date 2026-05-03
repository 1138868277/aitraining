import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { loadDatasourceConfig } from './datasource-store.js';

// 从项目根目录加载 .env 文件
dotenvConfig({ path: resolve(import.meta.dirname, '../../../../.env') });

// 从 datasource.json 加载持久化配置（优先级高于 .env）
const dsConfig = loadDatasourceConfig();

// db 对象保持可变引用，供运行时数据源切换更新
const dbConfig = {
  host: dsConfig.host,
  port: dsConfig.port,
  database: dsConfig.database,
  schema: dsConfig.schema,
  user: dsConfig.user,
  password: dsConfig.password,
  maxPoolSize: parseInt(process.env.DB_POOL_MAX_SIZE || '20', 10),
  ssl: dsConfig.ssl,
};

export const config = {
  server: {
    port: parseInt(process.env.SERVER_PORT || '3000', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  db: dbConfig,
  app: {
    code: process.env.APP_CODE || 'liuhaojun',
    moduleCode: process.env.MODULE_CODE || 'liuhaojun',
  },
  file: {
    maxSizeMB: parseInt(process.env.FILE_UPLOAD_MAX_SIZE || '200', 10),
    maxMeasurementFileSizeMB: parseInt(process.env.MEASUREMENT_FILE_MAX_SIZE || '200', 10),
    uploadDir: './uploads',
  },
  auth: {
    clientId: process.env.OAUTH_CLIENT_ID || 'aitraining',
    clientSecret: process.env.OAUTH_CLIENT_SECRET || '29b9635df0164eb890d99a58ffa7f8f2',
    redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    baseUrl: process.env.AUTH_BASE_URL || 'http://leaf-auth-server.dev.jinxin.cloud/',
  },
};
