import { Router, Request, Response } from 'express';
import { ErrorCode } from '@cec/contracts';
import * as validateService from './validate-service.js';
import { success, error } from '../../common/response.js';

const router: Router = Router();

/** 编码修正：批量修正编码 */
router.post('/api/validate/correct-codes', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return error(res, ErrorCode.MISSING_PARAMETER, '待修正的编码列表不能为空');
    }
    if (items.length > 1000) {
      return error(res, ErrorCode.VALIDATE_LIMIT_EXCEEDED, '单次修正数量超出限制（上限1000条）');
    }
    for (const item of items) {
      if (!item.code || !item.modification) {
        return error(res, ErrorCode.MISSING_PARAMETER, '每条记录必须包含 code 和 modification 字段');
      }
    }
    const results = await validateService.batchCorrectCodes(items);
    success(res, { items: results, totalCount: results.length });
  } catch (err) {
    console.error('Failed to correct codes:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '编码修正失败', 500);
  }
});

export default router;
