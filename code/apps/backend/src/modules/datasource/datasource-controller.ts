import { Router, Request, Response } from 'express';
import * as datasourceService from './datasource-service.js';
import { success, error } from '../../common/response.js';
import { ErrorCode } from '@cec/contracts';

const router = Router();

/** 获取当前数据源配置 */
router.get('/api/datasource/config', async (_req: Request, res: Response) => {
  try {
    const config = await datasourceService.getConfig();
    success(res, config);
  } catch (err) {
    console.error('Failed to get datasource config:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取数据源配置失败', 500);
  }
});

/** 测试数据库连接 */
router.post('/api/datasource/test', async (req: Request, res: Response) => {
  try {
    const { host, port, database, schema, user, password, ssl } = req.body;
    if (!host || !port || !database || !user) {
      error(res, ErrorCode.MISSING_PARAMETER, '主机、端口、数据库名和用户名不能为空', 400);
      return;
    }
    const result = await datasourceService.testConnection({
      host,
      port: parseInt(port, 10),
      database,
      schema: schema || 'public',
      user,
      password: password || '',
      ssl: !!ssl,
    });
    success(res, result);
  } catch (err) {
    console.error('Failed to test connection:', err);
    success(res, { ok: false, message: '连接测试异常' });
  }
});

/** 保存数据源配置并切换连接 */
router.put('/api/datasource/config', async (req: Request, res: Response) => {
  try {
    const { host, port, database, schema, user, password, ssl } = req.body;
    if (!host || !port || !database || !user) {
      error(res, ErrorCode.MISSING_PARAMETER, '主机、端口、数据库名和用户名不能为空', 400);
      return;
    }
    const result = await datasourceService.saveAndSwitch({
      host,
      port: parseInt(port, 10),
      database,
      schema: schema || 'public',
      user,
      password: password || '',
      ssl: !!ssl,
    });
    if (result.ok) {
      success(res, result);
    } else {
      error(res, ErrorCode.EXTERNAL_SERVICE_ERROR, result.message, 400);
    }
  } catch (err) {
    console.error('Failed to save datasource config:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '保存数据源配置失败', 500);
  }
});

export default router;
