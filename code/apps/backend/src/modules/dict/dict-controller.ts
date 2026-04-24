import { Router, Request, Response } from 'express';
import * as dictService from './dict-service.js';
import { success, error } from '../../common/response.js';
import { ErrorCode } from '@cec/contracts';

const router = Router();

/** 快捷搜索：根据数据码名称模糊匹配（必须在 :dictType 通配路由之前注册） */
router.get('/api/dict/quick-search', async (req: Request, res: Response) => {
  try {
    const searchText = (req.query.q as string || '').trim();
    if (!searchText) {
      success(res, { items: [] });
      return;
    }
    const result = await dictService.quickSearchDict(searchText);
    success(res, result);
  } catch (err) {
    console.error('Failed to quick search dict:', err);
    error(res, ErrorCode.DICT_LOAD_FAILED, '快捷搜索失败，请重试', 500);
  }
});

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
    const typeCode = req.query.typeCode as string | undefined;
    const search = req.query.search as string | undefined;
    // parentCode为空或未传时查询一级类码
    const items = await dictService.getCascadedDictItems(parentCode, typeCode, search);
    success(res, { dictType: req.params.dictType, items });
  } catch (err) {
    console.error('Failed to load cascaded dict:', err);
    error(res, ErrorCode.DICT_LOAD_FAILED, '筛选条件加载失败，请刷新重试', 500);
  }
});

/** 根据类型代码和二级类码获取数据类码 */
router.get('/api/dict/data-type/filter', async (req: Request, res: Response) => {
  try {
    const typeCode = req.query.typeCode as string | undefined;
    const secondClassCode = req.query.secondClassCode as string | undefined;
    if (!typeCode || !secondClassCode) {
      error(res, ErrorCode.DICT_LOAD_FAILED, '类型代码和二级类码不能为空', 400);
      return;
    }
    const items = await dictService.getDataTypeBySecondClass(typeCode, secondClassCode);
    success(res, { items });
  } catch (err) {
    console.error('Failed to load data type by second class:', err);
    error(res, ErrorCode.DICT_LOAD_FAILED, '数据类码加载失败，请刷新重试', 500);
  }
});

/** 获取数据码（根据数据类码过滤） */
router.get('/api/dict/data-code/:dataTypeCode', async (req: Request, res: Response) => {
  try {
    const { dataTypeCode } = req.params;
    const secondClassCode = req.query.secondClassCode as string | undefined;
    const typeCode = req.query.typeCode as string | undefined;
    const items = await dictService.getDataCodes(dataTypeCode, secondClassCode, typeCode);
    success(res, { items });
  } catch (err) {
    console.error('Failed to load data codes:', err);
    error(res, ErrorCode.DICT_LOAD_FAILED, '数据码加载失败，请刷新重试', 500);
  }
});

/** 根据类型代码获取二级类码列表 */
router.get('/api/dict/second-class/:typeCode', async (req: Request, res: Response) => {
  try {
    const { typeCode } = req.params;
    const items = await dictService.getSecondClassByType(typeCode);
    success(res, { items });
  } catch (err) {
    console.error('Failed to load second class by type:', err);
    error(res, ErrorCode.DICT_LOAD_FAILED, '二级类码加载失败，请刷新重试', 500);
  }
});

/** 手动新增编码字典项 */
router.post('/api/dict/manual-code', async (req: Request, res: Response) => {
  try {
    const { typeCode, secondClassCode, secondClassName, dataCategoryCode, dataCode } = req.body;

    if (!typeCode || !secondClassCode || !dataCategoryCode || !dataCode) {
      error(res, ErrorCode.MISSING_PARAMETER, '类型、二级类码、数据类码和数据码不能为空', 400);
      return;
    }

    // 获取二级类名称
    const secondClassItems = await dictService.getSecondClassByType(typeCode);
    const secondClass = secondClassItems.find(item => item.code === secondClassCode);
    const resolvedSecondClassName = secondClassName || secondClass?.name || secondClassCode;

    const result = await dictService.createManualCode({
      typeCode,
      secondClassCode,
      secondClassName: resolvedSecondClassName,
      dataCategoryCode,
      dataCode,
      creator: req.headers['x-session-id'] as string || 'manual',
    });

    success(res, result, 201);
  } catch (err) {
    console.error('Failed to create manual dict code:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '新增编码失败，请重试', 500);
  }
});

export default router;
