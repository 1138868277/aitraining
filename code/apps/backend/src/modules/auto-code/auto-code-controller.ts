import { Router, Request, Response } from 'express';
import { autoGenerateBatch, type AutoCodeConfig } from './auto-code-service.js';
import { success, error } from '../../common/response.js';
import { ErrorCode } from '@cec/contracts';

const router: Router = Router();

/** 自动编码：接收导入数据 + 配置，返回匹配和生成结果 */
router.post('/api/auto-code/generate', async (req: Request, res: Response) => {
  try {
    const { rows, config } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      error(res, ErrorCode.MISSING_PARAMETER, '待编码数据不能为空', 400);
      return;
    }

    if (rows.length > 20000) {
      error(res, ErrorCode.VALIDATE_LIMIT_EXCEEDED, '单次最多处理20000条', 400);
      return;
    }

    if (!config) {
      error(res, ErrorCode.MISSING_PARAMETER, '编码配置不能为空', 400);
      return;
    }

    const autoConfig: AutoCodeConfig = {
      typeCode: config.typeCode || '',
      projectLineCode: config.projectLineCode || '111',
      prefixNo: config.prefixNo || '0',
      firstClassCode: config.firstClassCode || 'B1',
    };

    const results = await autoGenerateBatch(rows, autoConfig);
    success(res, { results, config: autoConfig });
  } catch (err: any) {
    console.error('Failed to auto generate codes:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '自动编码失败：' + (err.message || '未知错误'), 500);
  }
});

export default router;
