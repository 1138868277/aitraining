import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as statisticsService from './statistics-service.js';
import { success, error, paginated } from '../../common/response.js';
import { ErrorCode } from '@cec/contracts';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

/** 上传稽核数据 */
router.post('/api/statistics/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return error(res, ErrorCode.FILE_FORMAT_ERROR, '请上传文件');
    }
    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      return error(res, ErrorCode.IMPORT_FILE_FORMAT_ERROR, '文件格式不合法，请上传.xlsx或.xls文件');
    }
    success(res, {
      fileId: `file_${Date.now()}`,
      fileName: req.file.originalname,
      importCount: 0,
      status: 'PROCESSING',
    });
  } catch (err) {
    error(res, ErrorCode.SYSTEM_ERROR, '上传失败', 500);
  }
});

/** 获取统计概览 */
router.get('/api/statistics/overview', async (req: Request, res: Response) => {
  try {
    const overview = await statisticsService.getOverview();
    success(res, overview);
  } catch (err) {
    console.error('Failed to get overview:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取统计概览失败', 500);
  }
});

/** 按维度统计 */
router.get('/api/statistics/by-dimension', async (req: Request, res: Response) => {
  try {
    const dimension = (req.query.dimension as string) || 'managementDomain';
    const result = await statisticsService.getByDimension(dimension);
    success(res, result);
  } catch (err) {
    console.error('Failed to get dimension stats:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取维度统计失败', 500);
  }
});

/** 获取图表数据 */
router.get('/api/statistics/chart-data', async (req: Request, res: Response) => {
  try {
    const chartType = (req.query.chartType as string) || 'bar';
    const dimension = (req.query.dimension as string) || 'managementDomain';
    const result = await statisticsService.getChartData(chartType, dimension);
    success(res, result);
  } catch (err) {
    console.error('Failed to get chart data:', err);
    error(res, ErrorCode.CHART_RENDER_ERROR, '图表加载失败，请刷新重试', 500);
  }
});

/** 获取统计明细 */
router.get('/api/statistics/details', async (req: Request, res: Response) => {
  try {
    const pageNum = parseInt(req.query.pageNum as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const result = await statisticsService.getDetails(pageNum, pageSize);
    paginated(res, result.list, result.total, pageNum, pageSize);
  } catch (err) {
    console.error('Failed to get details:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '获取统计明细失败', 500);
  }
});

/** 导出统计报表 */
router.get('/api/statistics/export', (req: Request, res: Response) => {
  success(res, {
    downloadUrl: `/api/files/export/statistics_${Date.now()}.xlsx`,
  });
});

export default router;
