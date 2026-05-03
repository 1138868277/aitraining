import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

export interface DatasourceConfig {
  host: string;
  port: number;
  database: string;
  schema: string;
  user: string;
  password: string;
  ssl: boolean;
}

const DATA_DIR = resolve(import.meta.dirname, '../../../../config');
const DATA_FILE = resolve(DATA_DIR, 'datasource.json');

let cachedConfig: DatasourceConfig | null = null;

/** 获取默认配置（从环境变量读取，延迟执行确保 .env 已加载） */
function getDefaultConfig(): DatasourceConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'training_exercises',
    schema: process.env.DB_SCHEMA || 'liuhaojun',
    user: process.env.DB_USER || 'liuhaojun',
    password: process.env.DB_PASSWORD || 'liuhaojun',
    ssl: process.env.DB_SSL_ENABLED === 'true',
  };
}

/** 加载数据源配置：datasource.json > 环境变量 > 默认值 */
export function loadDatasourceConfig(): DatasourceConfig {
  if (cachedConfig) return cachedConfig;

  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const saved = JSON.parse(raw);
      cachedConfig = { ...getDefaultConfig(), ...saved };
      return cachedConfig!;
    }
  } catch (err) {
    console.warn('Failed to load datasource.json, using defaults:', err);
  }

  cachedConfig = { ...getDefaultConfig() };
  return cachedConfig;
}

/** 保存数据源配置到文件 */
export function saveDatasourceConfig(config: DatasourceConfig): void {
  const dir = dirname(DATA_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(DATA_FILE, JSON.stringify(config, null, 2), 'utf-8');
  cachedConfig = config;
}

/** 获取当前活跃的数据源配置 */
export function getActiveConfig(): DatasourceConfig {
  return cachedConfig || loadDatasourceConfig();
}

/** 脱敏处理（用于返回给前端） */
export function maskPassword(config: DatasourceConfig): DatasourceConfig {
  return {
    ...config,
    password: config.password ? '******' : '',
  };
}
