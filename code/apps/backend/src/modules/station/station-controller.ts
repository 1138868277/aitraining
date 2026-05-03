import { Router, Request, Response } from 'express';
import * as stationService from './station-service.js';
import { success, error, paginated } from '../../common/response.js';
import { ErrorCode } from '@cec/contracts';

const router = Router();

/** 分页查询场站列表 */
router.get('/api/station/list', async (req: Request, res: Response) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.pageNum as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const keyword = (req.query.keyword as string)?.trim() || undefined;
    const result = await stationService.listStation(pageNum, pageSize, keyword);
    paginated(res, result.items, result.total, pageNum, pageSize);
  } catch (err) {
    console.error('Failed to list stations:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询场站列表失败', 500);
  }
});

/** 新增场站 */
router.post('/api/station', async (req: Request, res: Response) => {
  try {
    const { stationCode, stationName, managementDomain } = req.body;
    if (!stationCode || !stationName) {
      error(res, ErrorCode.MISSING_PARAMETER, '场站编码和名称不能为空', 400);
      return;
    }
    if (!/^\d{4}$/.test(stationCode)) {
      error(res, ErrorCode.PARAM_FORMAT_ERROR, '场站编码必须为4位数字', 400);
      return;
    }
    const creator = req.headers['x-session-id'] as string || 'system';
    const result = await stationService.createStation({ stationCode, stationName, managementDomain, creator });
    success(res, result, 201);
  } catch (err: any) {
    if (err.code === ErrorCode.DUPLICATE_SUBMISSION) {
      error(res, err.code, err.message, 400);
      return;
    }
    console.error('Failed to create station:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '新增场站失败', 500);
  }
});

/** 批量新增场站 */
router.post('/api/station/batch', async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      error(res, ErrorCode.MISSING_PARAMETER, '场站列表不能为空', 400);
      return;
    }
    for (const entry of entries) {
      if (!entry.stationCode || !entry.stationName) {
        error(res, ErrorCode.MISSING_PARAMETER, '每条记录的场站编码和名称不能为空', 400);
        return;
      }
      if (!/^\d{4}$/.test(entry.stationCode)) {
        error(res, ErrorCode.PARAM_FORMAT_ERROR, `场站编码 ${entry.stationCode} 必须为4位数字`, 400);
        return;
      }
    }
    const creator = req.headers['x-session-id'] as string || 'system';
    const result = await stationService.batchCreateStation(entries, creator);
    success(res, { insertedCount: result }, 201);
  } catch (err: any) {
    if (err.code === ErrorCode.DUPLICATE_SUBMISSION) {
      error(res, err.code, err.message, 400);
      return;
    }
    console.error('Failed to batch create stations:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '批量新增场站失败', 500);
  }
});

/** 更新场站 */
router.put('/api/station/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      error(res, ErrorCode.PARAM_FORMAT_ERROR, '场站ID格式不正确', 400);
      return;
    }
    const { stationName, managementDomain } = req.body;
    const modifier = req.headers['x-session-id'] as string || 'system';
    const result = await stationService.updateStation(id, { stationName, managementDomain, modifier });
    success(res, result);
  } catch (err: any) {
    if (err.code === ErrorCode.RESOURCE_NOT_FOUND) {
      error(res, err.code, err.message, 404);
      return;
    }
    console.error('Failed to update station:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '更新场站失败', 500);
  }
});

/** 删除场站 */
router.delete('/api/station/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      error(res, ErrorCode.PARAM_FORMAT_ERROR, '场站ID格式不正确', 400);
      return;
    }
    const modifier = req.headers['x-session-id'] as string || 'system';
    await stationService.deleteStation(id, modifier);
    success(res, null);
  } catch (err: any) {
    if (err.code === ErrorCode.RESOURCE_NOT_FOUND) {
      error(res, err.code, err.message, 404);
      return;
    }
    console.error('Failed to delete station:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '删除场站失败', 500);
  }
});

/** 一键删除所有场站 */
router.delete('/api/station/all', async (req: Request, res: Response) => {
  try {
    const modifier = req.headers['x-session-id'] as string || 'system';
    const count = await stationService.deleteAllStation(modifier);
    success(res, { deletedCount: count });
  } catch (err) {
    console.error('Failed to delete all stations:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '删除失败', 500);
  }
});

/** 导出所有场站数据 */
router.get('/api/station/export', async (_req: Request, res: Response) => {
  try {
    const items = await stationService.exportAllStation();
    success(res, items);
  } catch (err) {
    console.error('Failed to export stations:', err);
    error(res, ErrorCode.EXPORT_FAILED, '导出场站数据失败', 500);
  }
});

export default router;
