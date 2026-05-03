import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ErrorCode } from '@cec/contracts';
import * as statisticsService from './statistics-service.js';
import { success, error } from '../../common/response.js';
import { config } from '../../config/index.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.file.maxMeasurementFileSizeMB * 1024 * 1024 },
});

const router = Router();

// ========== 1. 编码生成统计 ==========

/** 编码生成概览 */
router.get('/api/statistics/code-gen/overview', async (_req: Request, res: Response) => {
  try {
    const data = await statisticsService.getCodeGenOverview();
    success(res, data);
  } catch (err) {
    console.error('Failed to get code gen overview:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取编码生成概览失败', 500);
  }
});

/** 编码生成维度统计 */
router.get('/api/statistics/code-gen/by-dimension', async (req: Request, res: Response) => {
  try {
    const dimension = (req.query.dimension as string) || 'typeCode';
    const startTime = req.query.startTime as string;
    const endTime = req.query.endTime as string;
    const data = await statisticsService.getCodeGenByDimension(dimension, startTime, endTime);
    success(res, data);
  } catch (err) {
    console.error('Failed to get code gen dimension:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取编码生成维度统计失败', 500);
  }
});

/** 编码生成按类型统计 */
router.get('/api/statistics/code-gen/by-type', async (_req: Request, res: Response) => {
  try {
    const data = await statisticsService.getCodeGenByType();
    success(res, data);
  } catch (err) {
    console.error('Failed to get code gen by type:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取编码生成类型统计失败', 500);
  }
});

/** 编码生成按二级类码统计 */
router.get('/api/statistics/code-gen/by-second-class', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string;
    const typeFilter = type === 'wind' || type === 'solar' || type === 'hydro' ? type : undefined;
    const data = await statisticsService.getCodeGenBySecondClass(typeFilter);
    success(res, data);
  } catch (err) {
    console.error('Failed to get code gen by second class:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取编码生成二级类码统计失败', 500);
  }
});

/** 编码生成按场站统计 */
router.get('/api/statistics/code-gen/by-station', async (_req: Request, res: Response) => {
  try {
    const data = await statisticsService.getCodeGenByStation();
    success(res, data);
  } catch (err) {
    console.error('Failed to get code gen by station:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取编码生成场站统计失败', 500);
  }
});

/** 编码生成列表（含筛选分页） */
router.get('/api/statistics/code-gen/list', async (req: Request, res: Response) => {
  try {
    const pageNum = parseInt(req.query.pageNum as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const filters = {
      typeCode: req.query.typeCode as string,
      stationCode: req.query.stationCode as string,
      secondClassCode: req.query.secondClassCode as string,
      dataTypeCode: req.query.dataTypeCode as string,
    };
    const result = await statisticsService.getCodeGenList(pageNum, pageSize, filters);
    success(res, result);
  } catch (err) {
    console.error('Failed to get code gen list:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询编码生成列表失败', 500);
  }
});

/** 编码生成分组详情（展开查看具体编码） */
router.get('/api/statistics/code-gen/group-detail', async (req: Request, res: Response) => {
  try {
    const group = {
      typeCode: req.query.typeCode as string,
      stationCode: req.query.stationCode as string,
      secondClassCode: req.query.secondClassCode as string,
      thirdClassCode: req.query.thirdClassCode as string,
      dataTypeCode: req.query.dataTypeCode as string,
      dataCode: req.query.dataCode as string,
    };
    const result = await statisticsService.getCodeGenGroupDetail(group);
    success(res, result);
  } catch (err) {
    console.error('Failed to get code gen group detail:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询分组详情失败', 500);
  }
});

/** 按分组维度批量删除编码记录 */
router.post('/api/statistics/code-gen/delete-groups', async (req: Request, res: Response) => {
  try {
    const groups = req.body.groups;
    if (!Array.isArray(groups) || groups.length === 0) {
      return error(res, ErrorCode.MISSING_PARAMETER, '请选择要删除的编码组', 400);
    }
    const deletedCount = await statisticsService.deleteCodeGenGroups(groups);
    success(res, { deletedCount });
  } catch (err) {
    console.error('Failed to delete code gen groups:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '删除编码记录失败', 500);
  }
});

/** 编码生成趋势 */
router.get('/api/statistics/code-gen/trend', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await statisticsService.getCodeGenTrend(days);
    success(res, data);
  } catch (err) {
    console.error('Failed to get code gen trend:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取编码生成趋势失败', 500);
  }
});

// ========== 2. 编码字典统计 ==========

/** 字典概览 */
router.get('/api/statistics/dict/overview', async (_req: Request, res: Response) => {
  try {
    const data = await statisticsService.getDictOverview();
    success(res, data);
  } catch (err) {
    console.error('Failed to get dict overview:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取字典概览失败', 500);
  }
});

/** 字典新增情况 */
router.get('/api/statistics/dict/new-addition', async (req: Request, res: Response) => {
  try {
    const startTime = req.query.startTime as string;
    const endTime = req.query.endTime as string;
    const data = await statisticsService.getDictNewAddition(startTime, endTime);
    success(res, data);
  } catch (err) {
    console.error('Failed to get dict new addition:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取字典新增情况失败', 500);
  }
});

/** 类型域分布 */
router.get('/api/statistics/dict/type-domain-dist', async (_req: Request, res: Response) => {
  try {
    const data = await statisticsService.getDictTypeDomainDist();
    success(res, data);
  } catch (err) {
    console.error('Failed to get type domain dist:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取类型域分布失败', 500);
  }
});

// ========== 3. 全量测点统计 ==========

/** 导入测点Excel */
router.post('/api/statistics/measurement/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return error(res, ErrorCode.FILE_FORMAT_ERROR, '请上传文件');
    }
    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      return error(res, ErrorCode.IMPORT_FILE_FORMAT_ERROR, '文件格式不合法，请上传.xlsx或.xls文件');
    }
    const result = await statisticsService.importMeasurementFile(req.file.buffer, req.file.originalname);
    success(res, result);
  } catch (err: any) {
    if (err.message === 'IMPORT_BUSY') {
      return error(res, ErrorCode.IMPORT_BUSY, '导入任务正在进行中，请等待');
    }
    if (err.message === 'IMPORT_DATA_EMPTY') {
      return error(res, ErrorCode.IMPORT_DATA_EMPTY, '文件中未检测到有效数据');
    }
    console.error('Failed to import measurement file:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '导入失败', 500);
  }
});

/** 获取导入状态 */
router.get('/api/statistics/measurement/import-status', async (_req: Request, res: Response) => {
  try {
    const data = statisticsService.getImportStatus();
    success(res, data);
  } catch (err) {
    console.error('Failed to get import status:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取导入状态失败', 500);
  }
});

/** 终止导入 */
router.post('/api/statistics/measurement/cancel-import', async (_req: Request, res: Response) => {
  try {
    statisticsService.cancelImport();
    success(res, { message: '已请求终止' });
  } catch (err) {
    console.error('Failed to cancel import:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '终止导入失败', 500);
  }
});

/** 全量测点概览 */
router.get('/api/statistics/measurement/overview', async (_req: Request, res: Response) => {
  try {
    const data = await statisticsService.getMeasureOverview();
    success(res, data);
  } catch (err) {
    console.error('Failed to get measure overview:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取测点概览失败', 500);
  }
});

/** 全量测点维度统计 */
router.get('/api/statistics/measurement/by-dimension', async (req: Request, res: Response) => {
  try {
    const dimension = (req.query.dimension as string) || 'typeCode';
    const data = await statisticsService.getMeasureByDimension(dimension);
    success(res, data);
  } catch (err) {
    console.error('Failed to get measure dimension:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取测点维度统计失败', 500);
  }
});

/** 全量测点类型下钻 */
router.get('/api/statistics/measurement/drill-down', async (req: Request, res: Response) => {
  try {
    const typeCode = (req.query.typeCode as string) || 'F';
    const data = await statisticsService.getMeasureDrillDown(typeCode);
    success(res, data);
  } catch (err) {
    console.error('Failed to get measure drill down:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取测点下钻数据失败', 500);
  }
});

/** 全量测点按二级类码统计 */
router.get('/api/statistics/measurement/by-second-class', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string;
    const typeFilter = type === 'wind' || type === 'solar' || type === 'hydro' ? type : undefined;
    const data = await statisticsService.getMeasureBySecondClass(typeFilter);
    success(res, data);
  } catch (err) {
    console.error('Failed to get measure by second class:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取测点二级类码统计失败', 500);
  }
});

/** 全量测点按场站统计 */
router.get('/api/statistics/measurement/by-station', async (_req: Request, res: Response) => {
  try {
    const data = await statisticsService.getMeasureByStation();
    success(res, data);
  } catch (err) {
    console.error('Failed to get measure by station:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取测点场站统计失败', 500);
  }
});

/** 全量测点列表（含筛选分页） */
router.get('/api/statistics/measurement/list', async (req: Request, res: Response) => {
  try {
    const pageNum = parseInt(req.query.pageNum as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const filters = {
      typeCode: req.query.typeCode as string,
      stationCode: req.query.stationCode as string,
      secondClassCode: req.query.secondClassCode as string,
      dataTypeCode: req.query.dataTypeCode as string,
    };
    const result = await statisticsService.getMeasureList(pageNum, pageSize, filters);
    success(res, result);
  } catch (err) {
    console.error('Failed to get measure list:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询测点列表失败', 500);
  }
});

/** 全量测点筛选条件选项 */
router.get('/api/statistics/measurement/filter-options', async (_req: Request, res: Response) => {
  try {
    const data = await statisticsService.getMeasureFilterOptions();
    success(res, data);
  } catch (err) {
    console.error('Failed to get measure filter options:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取测点筛选条件失败', 500);
  }
});

/** 清理测点数据 */
router.delete('/api/statistics/measurement/clear', async (_req: Request, res: Response) => {
  try {
    await statisticsService.clearMeasurementData();
    success(res, { message: '清理成功' });
  } catch (err) {
    console.error('Failed to clear measurement data:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '清理失败', 500);
  }
});

export default router;
