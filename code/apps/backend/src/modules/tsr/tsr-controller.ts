import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as tsrService from './tsr-service.js';
import * as domain from './tsr-domain.js';
import { success, error } from '../../common/response.js';
import { getPool } from '../../db/index.js';
import { getCurrentTenantId } from '../../db/tenant-context.js';
import { getTenantById } from '../../config/tenants.js';

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

/** 已初始化的租户集合 */
const initializedTenants = new Set<string>();

/** 按需初始化当前租户的 TSR 表 */
async function ensureTenantReady(): Promise<void> {
  const schema = domain.getCurrentSchema();
  if (!initializedTenants.has(schema)) {
    await domain.initTables();
    await domain.migrateMeasureDataColumns();
    await domain.ensureStandardList();
    initializedTenants.add(schema);
    console.log(`  ✅ TSR 表就绪: ${schema}`);
  }
}

/** 中间件：确保当前租户 TSR 表已初始化 */
async function tsrInitMiddleware(req: Request, res: Response, next: import('express').NextFunction) {
  try {
    await ensureTenantReady();
    next();
  } catch (err) {
    next(err);
  }
}

// 所有 TSR 数据接口自动初始化表
router.use('/api/tsr', tsrInitMiddleware);

/** TSR 数据库连接测试 */
router.get('/api/tsr/ping', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    const q = await pool.query('SELECT 1 AS ok');
    success(res, { ok: q.rows[0].ok, schema: domain.getCurrentSchema() });
  } catch (err: any) {
    error(res, 'DB_ERROR', err.message, 500);
  }
});

/** 获取当前租户信息 */
router.get('/api/tsr/tenant', async (_req: Request, res: Response) => {
  const tenantId = getCurrentTenantId();
  const tenant = tenantId ? getTenantById(tenantId) : undefined;
  success(res, {
    schema: domain.getCurrentSchema(),
    tenantId,
    displayName: tenant?.displayName || domain.getCurrentSchema(),
  });
});

/** 获取数据概览 */
router.get('/api/tsr/overview', async (_req: Request, res: Response) => {
  try {
    const data = await domain.getOverview('');
    success(res, data);
  } catch (err) {
    console.error('Failed to get overview:', err);
    error(res, 'SYSTEM_ERROR', '获取数据概览失败', 500);
  }
});

/** 获取导入进度 */
router.get('/api/tsr/import/progress', async (req: Request, res: Response) => {
  const s = domain.getCurrentSchema();
  const type = (req.query.type as string) || 'station';
  const progress = domain.getProgress(`${s}:${type}`);
  success(res, progress);
});

/** 取消导入 */
router.post('/api/tsr/import/cancel', async (req: Request, res: Response) => {
  const s = domain.getCurrentSchema();
  const type = (req.body.type as string) || 'station';
  domain.requestCancel(`${s}:${type}`);
  success(res, { cancelled: true });
});

/** 清空所有数据 */
router.post('/api/tsr/clear', async (_req: Request, res: Response) => {
  try {
    await domain.truncateAllData();
    // 清除内存中的导入进度记录
    const s = domain.getCurrentSchema();
    domain.clearProgress(`${s}:station`);
    domain.clearProgress(`${s}:measure`);
    success(res, { cleared: true });
  } catch (err: any) {
    console.error('Failed to clear data:', err);
    error(res, 'CLEAR_FAILED', err.message || '清空数据失败', 500);
  }
});

/** 导入场站数据 */
router.post('/api/tsr/import/station', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      error(res, 'MISSING_PARAMETER', '请上传 Excel 文件', 400);
      return;
    }
    const count = await tsrService.importStationFromBuffer('', req.file.buffer);
    success(res, { importedCount: count, schema: domain.getCurrentSchema() });
  } catch (err: any) {
    console.error('Failed to import station:', err);
    error(res, 'IMPORT_FAILED', err.message || '导入场站数据失败', 400);
  }
});

/** 导入测点数据 */
router.post('/api/tsr/import/measure', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      error(res, 'MISSING_PARAMETER', '请上传 Excel 文件', 400);
      return;
    }
    const count = await tsrService.importMeasureFromBuffer('', req.file.buffer);
    success(res, { importedCount: count, schema: domain.getCurrentSchema() });
  } catch (err: any) {
    console.error('Failed to import measure:', err);
    error(res, 'IMPORT_FAILED', err.message || '导入测点数据失败', 400);
  }
});

/** 生成规则 */
router.post('/api/tsr/generate', async (_req: Request, res: Response) => {
  try {
    domain.clearGenerateProgress();
    const result = await tsrService.generateRules('');
    success(res, result);
  } catch (err: any) {
    console.error('Failed to generate rules:', err);
    error(res, 'GENERATE_FAILED', err.message || '生成规则失败', 500);
  }
});

/** 生成规则进度 */
router.get('/api/tsr/generate/progress', async (_req: Request, res: Response) => {
  const s = domain.getCurrentSchema();
  const progress = domain.getProgress(`${s}:generate`);
  const stepInfo = domain.getGenerateProgress();
  success(res, {
    total: progress.total,
    done: progress.done,
    status: progress.status,
    currentStep: stepInfo.current,
    doneSteps: stepInfo.done,
  });
});

/** 导出单个规则类型的总体 Excel 文件（完整单文件，不分片） */
router.get('/api/tsr/export/overall/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as 'sz' | 'tb' | 'yx' | 'zd';
    if (!['sz', 'tb', 'yx', 'zd'].includes(type)) {
      error(res, 'PARAM_FORMAT_ERROR', '无效的导出类型（sz/tb/yx/zd）', 400);
      return;
    }

    const { buffer, name } = await tsrService.exportSingleOverallToExcel('', type);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err: any) {
    console.error('Failed to export overall type:', err);
    error(res, 'EXPORT_FAILED', err.message || '导出失败', 500);
  }
});

/** 导出全部4种规则类型的总体文件 ZIP（打包下载全部） */
router.get('/api/tsr/export/overall', async (_req: Request, res: Response) => {
  try {
    const zipBuffer = await tsrService.exportOverallToZip('');

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent('时序规则结果_总体.zip')}"`,
      'Content-Length': zipBuffer.length,
    });
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Failed to export overall:', err);
    error(res, 'EXPORT_FAILED', err.message || '总体导出失败', 500);
  }
});

/** 分批导出全部4种规则类型的拆分 ZIP */
router.get('/api/tsr/export/split-all', async (_req: Request, res: Response) => {
  try {
    const zipBuffer = await tsrService.exportAllSplitToZip('');

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent('时序规则结果_分批.zip')}"`,
      'Content-Length': zipBuffer.length,
    });
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Failed to export all split:', err);
    error(res, 'EXPORT_FAILED', err.message || '分批批量导出失败', 500);
  }
});

/** 导出单个规则类型的分批拆分 ZIP（Z7 逻辑） */
router.get('/api/tsr/export/split/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as 'sz' | 'tb' | 'yx' | 'zd';
    if (!['sz', 'tb', 'yx', 'zd'].includes(type)) {
      error(res, 'PARAM_FORMAT_ERROR', '无效的导出类型（sz/tb/yx/zd）', 400);
      return;
    }

    const { buffer, name } = await tsrService.exportSplitToZip('', type);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err: any) {
    console.error('Failed to export split:', err);
    error(res, 'EXPORT_FAILED', err.message || '分批导出失败', 500);
  }
});

/** 导出规则 ZIP（含时序规则结果/01 死值/split_N.xlsx 结构） */
router.get('/api/tsr/export/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as 'sz' | 'tb' | 'yx' | 'zd';
    if (!['sz', 'tb', 'yx', 'zd'].includes(type)) {
      error(res, 'PARAM_FORMAT_ERROR', '无效的导出类型（sz/tb/yx/zd）', 400);
      return;
    }

    const maxRows = parseInt(req.query.maxRows as string, 10) || 150000;
    const { buffer, name } = await tsrService.exportSingleToZip('', type, maxRows);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err: any) {
    console.error('Failed to export:', err);
    error(res, 'EXPORT_FAILED', err.message || '导出失败', 500);
  }
});

/** 批量导出全部规则为单个 ZIP */
router.get('/api/tsr/export-all', async (_req: Request, res: Response) => {
  try {
    const zipBuffer = await tsrService.exportAllToZip('');

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent('时序规则结果.zip')}"`,
      'Content-Length': zipBuffer.length,
    });
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Failed to export all:', err);
    error(res, 'EXPORT_FAILED', err.message || '批量导出失败', 500);
  }
});

export default router;
