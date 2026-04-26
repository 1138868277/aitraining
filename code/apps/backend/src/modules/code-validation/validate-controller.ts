import { Router, Request, Response } from 'express';
import multer from 'multer';
import { batchValidateRequestSchema, ErrorCode } from '@cec/contracts';
import * as validateService from './validate-service.js';
import { success, error } from '../../common/response.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

/** 单条编码校验 */
router.post('/api/validate/single', (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return error(res, ErrorCode.VALIDATE_LIST_EMPTY, '请先输入待校验的编码');
    }
    // 同步调用批量校验处理单条
    validateService.batchValidate([{ code }]).then((task) => {
      const result = validateService.getValidateResult(task.taskId);
      success(res, result.details[0]);
    });
  } catch (err: any) {
    error(res, ErrorCode.VALIDATE_SERVICE_ERROR, '校验服务异常，请稍后重试', 500);
  }
});

/** 批量文本校验 */
router.post('/api/validate/batch', async (req: Request, res: Response) => {
  try {
    const parsed = batchValidateRequestSchema.parse(req.body);
    const result = await validateService.batchValidate(parsed.codes);
    success(res, result);
  } catch (err: any) {
    if (err.message === 'VALIDATE_LIMIT_EXCEEDED') {
      return error(res, ErrorCode.VALIDATE_LIMIT_EXCEEDED, '单次校验数量超出限制（上限1000条），请分批校验');
    }
    error(res, ErrorCode.VALIDATE_SERVICE_ERROR, '校验服务异常，请稍后重试', 500);
  }
});

/** Excel上传校验 */
router.post('/api/validate/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return error(res, ErrorCode.FILE_FORMAT_ERROR, '请上传文件');
    }
    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      return error(res, ErrorCode.FILE_FORMAT_ERROR, '文件格式不合法，请上传.xlsx或.xls文件');
    }
    // 实际项目中使用 Excel 解析库读取文件内容
    // 这里返回模拟结果
    success(res, {
      taskId: `task_${Date.now()}`,
      totalCount: 0,
      status: 'PROCESSING',
    });
  } catch (err) {
    error(res, ErrorCode.VALIDATE_SERVICE_ERROR, '校验服务异常，请稍后重试', 500);
  }
});

/** 获取校验任务状态 */
router.get('/api/validate/tasks/:taskId', (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const result = validateService.getValidateResult(taskId);
    success(res, { ...result, status: 'COMPLETED' });
  } catch (err) {
    error(res, ErrorCode.RESOURCE_NOT_FOUND, '任务不存在', 404);
  }
});

/** 获取校验结果 */
router.get('/api/validate/results/:taskId', (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const result = validateService.getValidateResult(taskId);
    success(res, result);
  } catch (err) {
    error(res, ErrorCode.RESOURCE_NOT_FOUND, '任务不存在', 404);
  }
});

/** 获取纠错建议 */
router.get('/api/validate/suggestions/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const result = validateService.getSuggestions(code);
    success(res, result);
  } catch (err) {
    error(res, ErrorCode.CORRECTION_NO_MATCH, '未找到匹配的纠错建议，请手动修改');
  }
});

/** 一键纠错 */
router.post('/api/validate/batch-correct', (req: Request, res: Response) => {
  try {
    const { taskId, abnormalIndexes } = req.body;
    if (!taskId) {
      return error(res, ErrorCode.MISSING_PARAMETER, '缺少taskId参数');
    }
    const result = validateService.batchCorrect(taskId, abnormalIndexes);
    success(res, result);
  } catch (err: any) {
    if (err.message === 'RESOURCE_NOT_FOUND') {
      return error(res, ErrorCode.RESOURCE_NOT_FOUND, '任务不存在', 404);
    }
    error(res, ErrorCode.BATCH_CORRECT_FAILED, '批量纠错失败，请重试', 500);
  }
});

/** 确认纠正结果 */
router.put('/api/validate/corrections/:id/confirm', (req: Request, res: Response) => {
  try {
    const { taskId } = req.body;
    const id = parseInt(req.params.id);
    if (!taskId) {
      return error(res, ErrorCode.MISSING_PARAMETER, '缺少taskId参数');
    }
    const result = validateService.confirmCorrection(taskId, id);
    success(res, result);
  } catch (err: any) {
    if (err.message === 'RESOURCE_NOT_FOUND') {
      return error(res, ErrorCode.RESOURCE_NOT_FOUND, '纠正记录不存在', 404);
    }
    error(res, ErrorCode.SYSTEM_ERROR, '确认失败', 500);
  }
});

/** 导出校验结果 */
router.get('/api/validate/results/:taskId/export', (req: Request, res: Response) => {
  success(res, {
    downloadUrl: `/api/files/export/validation_${req.params.taskId}.xlsx`,
  });
});

/** 下载导入模板 */
router.get('/api/validate/template/download', (req: Request, res: Response) => {
  success(res, {
    downloadUrl: '/api/files/templates/validation_import_template.xlsx',
  });
});

/** ---- 以下为编码校验页面3个模块新增的路由 ---- */

/** 批量解析编码 */
router.post('/api/validate/resolve-codes', async (req: Request, res: Response) => {
  try {
    const { codes } = req.body;
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return error(res, ErrorCode.VALIDATE_LIST_EMPTY, '请先输入待解析的编码');
    }
    if (codes.length > 10000) {
      return error(res, ErrorCode.VALIDATE_LIMIT_EXCEEDED, '单次解析数量超出限制（上限10000条）');
    }
    const result = await validateService.resolveCodes(codes);
    success(res, result);
  } catch (err) {
    console.error('Failed to resolve codes:', err);
    error(res, ErrorCode.VALIDATE_SERVICE_ERROR, '编码解析失败', 500);
  }
});

/** 保存编码修改映射 */
router.post('/api/validate/save-code-mapping', async (req: Request, res: Response) => {
  try {
    const { oldCode, newCode, oldName, newName } = req.body;
    if (!oldCode || !newCode) {
      return error(res, ErrorCode.MISSING_PARAMETER, '旧编码和新编码不能为空');
    }
    const result = await validateService.saveCodeMapping({
      oldCode,
      newCode,
      oldName: oldName || '',
      newName: newName || '',
      creator: req.headers['x-session-id'] as string || 'manual',
    });
    success(res, result);
  } catch (err) {
    console.error('Failed to save code mapping:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '保存编码映射失败', 500);
  }
});

export default router;
