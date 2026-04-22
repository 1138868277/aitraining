import { Router, Request, Response } from 'express';
import * as dictService from './dict-service.js';
import { success, error } from '../../common/response.js';
import { ErrorCode } from '@cec/contracts';

const router = Router();

/** 获取指定类型的字典数据 */
router.get('/api/dict/:dictType', async (req: Request, res: Response) => {
  try {
    const { dictType } = req.params;
    const items = await dictService.getDictItems(dictType);
    success(res, { dictType, items });
  } catch (err) {
    console.error('Failed to load dict:', err);
    error(res, ErrorCode.DICT_LOAD_FAILED, '筛选条件加载失败，请刷新重试', 500);
  }
});

/** 获取联动字典项 */
router.get('/api/dict/:dictType/items', async (req: Request, res: Response) => {
  try {
    const parentCode = req.query.parentCode as string | undefined;
    // parentCode为空或未传时查询一级类码
    const items = await dictService.getCascadedDictItems(parentCode);
    success(res, { dictType: req.params.dictType, items });
  } catch (err) {
    console.error('Failed to load cascaded dict:', err);
    error(res, ErrorCode.DICT_LOAD_FAILED, '筛选条件加载失败，请刷新重试', 500);
  }
});

/** 获取数据码（根据数据类码过滤） */
router.get('/api/dict/data-code/:dataTypeCode', async (req: Request, res: Response) => {
  try {
    const { dataTypeCode } = req.params;
    const items = await dictService.getDataCodes(dataTypeCode);
    success(res, { items });
  } catch (err) {
    console.error('Failed to load data codes:', err);
    error(res, ErrorCode.DICT_LOAD_FAILED, '数据码加载失败，请刷新重试', 500);
  }
});

export default router;
