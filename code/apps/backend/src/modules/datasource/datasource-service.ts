import {
  getActiveConfig,
  saveDatasourceConfig,
  type DatasourceConfig,
} from '../../config/datasource-store.js';
import { replacePool, testConnectionWith } from '../../db/index.js';
import { config } from '../../config/index.js';

/** 获取当前数据源配置 */
export async function getConfig(): Promise<DatasourceConfig> {
  return getActiveConfig();
}

/** 测试新连接 */
export async function testConnection(input: DatasourceConfig): Promise<{ ok: boolean; message: string }> {
  return testConnectionWith(input);
}

/** 保存配置并切换连接 */
export async function saveAndSwitch(input: DatasourceConfig): Promise<{ ok: boolean; message: string }> {
  // 先测试
  const testResult = await testConnectionWith(input);
  if (!testResult.ok) {
    return testResult;
  }

  // 更新运行时 config.db（所有 domain 文件通过 dbc = config.db 引用了同一个对象）
  Object.assign(config.db, {
    host: input.host,
    port: input.port,
    database: input.database,
    schema: input.schema,
    user: input.user,
    password: input.password,
    ssl: input.ssl,
  });

  // 替换连接池
  await replacePool(input);

  // 持久化到 datasource.json
  saveDatasourceConfig(input);

  return { ok: true, message: '保存成功，已切换至新数据源' };
}
