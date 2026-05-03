import api from './api';

export interface DatasourceConfig {
  host: string;
  port: number;
  database: string;
  schema: string;
  user: string;
  password: string;
  ssl: boolean;
}

export interface TestResult {
  ok: boolean;
  message: string;
}

/** 获取当前数据源配置 */
export async function getDatasourceConfig(): Promise<DatasourceConfig> {
  const res = await api.get('/datasource/config');
  return res.data;
}

/** 测试连接 */
export async function testConnection(config: DatasourceConfig): Promise<TestResult> {
  const res = await api.post('/datasource/test', config);
  return res.data;
}

/** 保存配置并切换 */
export async function saveConfig(config: DatasourceConfig): Promise<TestResult> {
  const res = await api.put('/datasource/config', config);
  return res.data;
}
