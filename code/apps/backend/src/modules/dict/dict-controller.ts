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

/** 获取指定数据类码下最大数据码（必须在 :dictType 通配路由之前注册） */
router.get('/api/dict/max-data-code', async (req: Request, res: Response) => {
  try {
    const { secondClassCode, dataCategoryCode, typeCode } = req.query;
    if (!secondClassCode || !dataCategoryCode || !typeCode) {
      error(res, ErrorCode.MISSING_PARAMETER, '缺少参数', 400);
      return;
    }
    const maxCode = await dictService.getMaxDataCode(secondClassCode as string, dataCategoryCode as string, typeCode as string);
    success(res, { maxDataCode: maxCode });
  } catch (err) {
    console.error('Failed to get max data code:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询失败', 500);
  }
});

/** 获取指定二级类码下最大数据类码（必须在 :dictType 通配路由之前注册） */
router.get('/api/dict/max-data-category-code', async (req: Request, res: Response) => {
  try {
    const { secondClassCode, typeCode } = req.query;
    if (!secondClassCode || !typeCode) {
      error(res, ErrorCode.MISSING_PARAMETER, '缺少参数', 400);
      return;
    }
    const maxCode = await dictService.getMaxDataCategoryCode(secondClassCode as string, typeCode as string);
    success(res, { maxDataCategoryCode: maxCode });
  } catch (err) {
    console.error('Failed to get max data category code:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询失败', 500);
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
    const { typeCode, secondClassCode, secondClassName, dataCategoryCode, dataCategoryName, dataCode, dataName } = req.body;

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
      dataCategoryName,
      dataCode,
      dataName,
      creator: req.headers['x-session-id'] as string || 'manual',
    });

    success(res, result, 201);
  } catch (err) {
    console.error('Failed to create manual dict code:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '新增编码失败，请重试', 500);
  }
});

/** 批量新增编码字典项 */
router.post('/api/dict/manual-code/batch', async (req: Request, res: Response) => {
  try {
    const { typeCode, secondClassCode, secondClassName, entries, mode } = req.body;

    if (!typeCode || !secondClassCode || !entries || !Array.isArray(entries) || entries.length === 0) {
      error(res, ErrorCode.MISSING_PARAMETER, '类型、二级类码和编码列表不能为空', 400);
      return;
    }

    if (mode !== 'existing' && mode !== 'new') {
      error(res, ErrorCode.MISSING_PARAMETER, 'mode 必须为 existing 或 new', 400);
      return;
    }

    if (!/^\d{2}$/.test(entries[0].dataCategoryCode)) {
      error(res, ErrorCode.PARAM_FORMAT_ERROR, '数据类码必须为2位数字', 400);
      return;
    }

    for (const entry of entries) {
      if (!entry.dataCategoryCode || !entry.dataCode) {
        error(res, ErrorCode.MISSING_PARAMETER, '每条记录的数据类码和数据码不能为空', 400);
        return;
      }
      if (!/^\d{3}$/.test(entry.dataCode)) {
        error(res, ErrorCode.PARAM_FORMAT_ERROR, `数据码 ${entry.dataCode} 必须为3位数字`, 400);
        return;
      }
      if (!entry.dataName) {
        error(res, ErrorCode.MISSING_PARAMETER, `数据码 ${entry.dataCode} 的名称不能为空`, 400);
        return;
      }
      if (!entry.dataCategoryName) {
        error(res, ErrorCode.MISSING_PARAMETER, `数据类码 ${entry.dataCategoryCode} 的名称不能为空`, 400);
        return;
      }
    }

    // 根据模式执行校验
    const categoryCodes = [...new Set(entries.map((e: any) => e.dataCategoryCode))];
    const existingCategories = await dictService.checkExistingDataCategories(secondClassCode, typeCode, categoryCodes);

    for (const catCode of categoryCodes) {
      const categoryExists = existingCategories.includes(catCode);

      if (mode === 'existing') {
        // 已有数据类码 → 数据类码应存在，只校验数据码是否重复
        if (!categoryExists) {
          error(res, ErrorCode.RESOURCE_NOT_FOUND, `数据类码 ${catCode} 在所选二级类码下不存在，请刷新后重试`, 400);
          return;
        }
        const dataCodes = entries.filter((e: any) => e.dataCategoryCode === catCode).map((e: any) => e.dataCode);
        const existingCodes = await dictService.checkExistingDataCodes(secondClassCode, catCode, typeCode, dataCodes);
        if (existingCodes.length > 0) {
          error(res, ErrorCode.DUPLICATE_SUBMISSION, `以下数据码在数据类码 ${catCode} 下已存在：${existingCodes.join('、')}，不能重复添加`, 400);
          return;
        }
      } else {
        // 新增数据类码 → 数据类码应不存在，只校验类码是否重复
        if (categoryExists) {
          error(res, ErrorCode.DUPLICATE_SUBMISSION, `数据类码 ${catCode} 在所选二级类码下已存在，请切换至"已有"模式`, 400);
          return;
        }
        // 新类目下不会有子数据码，跳过数据码校验
      }
    }

    // 获取二级类名称
    const secondClassItems = await dictService.getSecondClassByType(typeCode);
    const secondClass = secondClassItems.find(item => item.code === secondClassCode);
    const resolvedSecondClassName = secondClassName || secondClass?.name || secondClassCode;

    const result = await dictService.batchCreateManualCode({
      typeCode,
      secondClassCode,
      secondClassName: resolvedSecondClassName,
      entries: entries.map((e: any) => ({
        dataCategoryCode: e.dataCategoryCode,
        dataCategoryName: e.dataCategoryName || '',
        dataCode: e.dataCode,
        dataName: e.dataName || '',
      })),
      creator: req.headers['x-session-id'] as string || 'manual',
    });

    success(res, result, 201);
  } catch (err) {
    console.error('Failed to batch create manual dict codes:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '批量新增编码失败，请重试', 500);
  }
});

export default router;
