import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as tsrService from './tsr-service.js';
import { success, error } from '../../common/response.js';
import { listRegions, getTsrPool } from './tsr-domain.js';

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

/** 测试 TSR 数据库连接 */
router.get('/api/tsr/ping', async (_req: Request, res: Response) => {
  try {
    const pool = getTsrPool();
    const q = await pool.query('SELECT 1 AS ok');
    success(res, { ok: q.rows[0].ok });
  } catch (err: any) {
    error(res, 'DB_ERROR', err.message, 500);
  }
});

/** 获取区域列表 */
router.get('/api/tsr/regions', async (_req: Request, res: Response) => {
  try {
    const regions = await listRegions();
    success(res, regions);
  } catch (err) {
    console.error('Failed to list regions:', err);
    error(res, 'SYSTEM_ERROR', '获取区域列表失败', 500);
  }
});

/** 获取数据概览 */
router.get('/api/tsr/overview', async (req: Request, res: Response) => {
  try {
    const area = (req.query.area as string) || '云南';
    const data = await tsrService.getOverview(area);
    success(res, data);
  } catch (err) {
    console.error('Failed to get overview:', err);
    error(res, 'SYSTEM_ERROR', '获取数据概览失败', 500);
  }
});

/** 导入场站数据 */
router.post('/api/tsr/import/station', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const area = (req.body.area as string) || '云南';
    if (!req.file) {
      error(res, 'MISSING_PARAMETER', '请上传 Excel 文件', 400);
      return;
    }
    const count = await tsrService.importStationFromBuffer(area, req.file.buffer);
    success(res, { importedCount: count, area });
  } catch (err: any) {
    console.error('Failed to import station:', err);
    error(res, 'IMPORT_FAILED', err.message || '导入场站数据失败', 500);
  }
});

/** 导入测点数据 */
router.post('/api/tsr/import/measure', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const area = (req.body.area as string) || '云南';
    if (!req.file) {
      error(res, 'MISSING_PARAMETER', '请上传 Excel 文件', 400);
      return;
    }
    const count = await tsrService.importMeasureFromBuffer(area, req.file.buffer);
    success(res, { importedCount: count, area });
  } catch (err: any) {
    console.error('Failed to import measure:', err);
    error(res, 'IMPORT_FAILED', err.message || '导入测点数据失败', 500);
  }
});

/** 生成规则 */
router.post('/api/tsr/generate', async (req: Request, res: Response) => {
  try {
    const area = (req.body.area as string) || '云南';
    const result = await tsrService.generateRules(area);
    success(res, result);
  } catch (err: any) {
    console.error('Failed to generate rules:', err);
    error(res, 'GENERATE_FAILED', err.message || '生成规则失败', 500);
  }
});

/** 导出规则 Excel */
router.get('/api/tsr/export/:type', async (req: Request, res: Response) => {
  try {
    const area = (req.query.area as string) || '云南';
    const type = req.params.type as 'sz' | 'tb' | 'yx' | 'zd';
    if (!['sz', 'tb', 'yx', 'zd'].includes(type)) {
      error(res, 'PARAM_FORMAT_ERROR', '无效的导出类型（sz/tb/yx/zd）', 400);
      return;
    }

    const typeNames: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };
    const buffer = await tsrService.exportToExcel(area, type);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${area}区域_时序稽核质量规则_${typeNames[type]}.xlsx"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('Failed to export:', err);
    error(res, 'EXPORT_FAILED', err.message || '导出失败', 500);
  }
});

/** 批量导出所有规则 */
router.get('/api/tsr/export-all', async (req: Request, res: Response) => {
  try {
    const area = (req.query.area as string) || '云南';
    const types = ['sz', 'tb', 'yx', 'zd'] as const;
    const buffers: { type: string; buffer: Buffer }[] = [];

    for (const type of types) {
      try {
        const buf = await tsrService.exportToExcel(area, type);
        buffers.push({ type, buffer: buf });
      } catch {
        // 某个类型无数据时跳过
      }
    }

    if (buffers.length === 0) {
      error(res, 'EXPORT_FAILED', '没有可导出的规则数据', 400);
      return;
    }

    success(res, {
      files: buffers.map(b => ({
        type: b.type,
        size: b.buffer.length,
        data: b.buffer.toString('base64'),
      })),
    });
  } catch (err: any) {
    console.error('Failed to export all:', err);
    error(res, 'EXPORT_FAILED', err.message || '批量导出失败', 500);
  }
});

/** 拆分文件 */
router.post('/api/tsr/split', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      error(res, 'MISSING_PARAMETER', '请上传需要拆分的 Excel 文件', 400);
      return;
    }
    const maxRows = parseInt(req.body.maxRows as string, 10) || 150000;
    const results = tsrService.splitExcelBuffer(req.file.buffer, maxRows);

    success(res, {
      fileCount: results.length,
      files: results.map(r => ({
        name: r.name,
        size: r.buffer.length,
        data: r.buffer.toString('base64'),
      })),
    });
  } catch (err: any) {
    console.error('Failed to split file:', err);
    error(res, 'SPLIT_FAILED', err.message || '拆分文件失败', 500);
  }
});

export default router;
