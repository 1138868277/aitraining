import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  generateCodeRequestSchema,
  batchGenerateCodeRequestSchema,
  saveDraftRequestSchema,
  ErrorCode,
} from '@cec/contracts';
import * as codeService from './code-service.js';
import { success, error, paginated } from '../../common/response.js';
import { AppError } from '../../common/errors.js';

const router = Router();

/** 获取或创建会话ID */
function getSessionId(req: Request): string {
  let sessionId = req.headers['x-session-id'] as string;
  if (!sessionId) {
    sessionId = uuidv4();
  }
  return sessionId;
}

/** 生成编码 */
router.post('/api/codes/generate', (req: Request, res: Response) => {
  try {
    const parsed = generateCodeRequestSchema.parse(req.body);
    const result = codeService.generateCode(parsed);
    success(res, result);
  } catch (err: any) {
    if (err instanceof AppError) {
      return error(res, err.code, err.message, err.httpStatus);
    }
    error(res, ErrorCode.VALIDATION_ERROR, err.message || '参数校验失败');
  }
});

/** 批量生成编码 */
router.post('/api/codes/batch-generate', (req: Request, res: Response) => {
  try {
    const parsed = batchGenerateCodeRequestSchema.parse(req.body);

    if (parsed.conditions.length > 100) {
      return error(res, ErrorCode.GENERATE_LIMIT_EXCEEDED, '单次生成数量超出限制（上限100条）');
    }

    const codes = parsed.conditions.map((c) => codeService.generateCode(c));
    success(res, { codes, totalCount: codes.length });
  } catch (err: any) {
    if (err instanceof AppError) {
      return error(res, err.code, err.message, err.httpStatus);
    }
    error(res, ErrorCode.VALIDATION_ERROR, err.message || '参数校验失败');
  }
});

/** 保存至临时区 */
router.post('/api/codes/draft', (req: Request, res: Response) => {
  try {
    const parsed = saveDraftRequestSchema.parse(req.body);
    const sessionId = getSessionId(req);
    const result = codeService.saveToDraft(sessionId, parsed.codes);
    success(res, result);
  } catch (err: any) {
    if (err.message === 'DRAFT_FULL') {
      return error(res, ErrorCode.DRAFT_FULL, '临时区已满（上限5000条），请先导出或清理');
    }
    error(res, ErrorCode.DRAFT_SAVE_FAILED, '保存至临时区失败，请重试', 500);
  }
});

/** 查询临时区列表 */
router.get('/api/codes/draft', (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const pageNum = parseInt(req.query.pageNum as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const result = codeService.getDraftList(sessionId, pageNum, pageSize);
    paginated(res, result.list, result.total, pageNum, pageSize);
  } catch (err) {
    console.error('Failed to get draft list:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询临时区失败', 500);
  }
});

/** 删除临时区记录 */
router.delete('/api/codes/draft/:id', (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const id = parseInt(req.params.id);
    const deleted = codeService.deleteDraftItem(sessionId, id);
    if (!deleted) {
      return error(res, ErrorCode.RESOURCE_NOT_FOUND, '记录不存在', 404);
    }
    success(res, null);
  } catch (err) {
    console.error('Failed to delete draft item:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '删除失败', 500);
  }
});

/** 批量删除临时区 */
router.delete('/api/codes/draft/batch', (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return error(res, ErrorCode.MISSING_PARAMETER, '请指定要删除的记录ID');
    }
    const deleted = codeService.batchDeleteDraft(sessionId, ids);
    success(res, { deletedCount: deleted });
  } catch (err) {
    console.error('Failed to batch delete draft:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '批量删除失败', 500);
  }
});

/** 保存生成记录到数据库 */
router.post('/api/codes', async (req: Request, res: Response) => {
  try {
    const { codes } = req.body;
    if (!Array.isArray(codes) || codes.length === 0) {
      return error(res, ErrorCode.MISSING_PARAMETER, '请提供要保存的编码列表');
    }
    const saved = await codeService.saveCodeRecords(codes);
    success(res, { savedCount: saved });
  } catch (err) {
    console.error('Failed to save code records:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '保存编码记录失败', 500);
  }
});

/** 查询生成历史 */
router.get('/api/codes', async (req: Request, res: Response) => {
  try {
    const pageNum = parseInt(req.query.pageNum as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const result = await codeService.queryCodeHistory(pageNum, pageSize);
    paginated(res, result.list, result.total, pageNum, pageSize);
  } catch (err) {
    console.error('Failed to query code history:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询编码历史失败', 500);
  }
});

/** 导出编码（模拟） */
router.get('/api/codes/export', (req: Request, res: Response) => {
  try {
    // 实际项目中使用 Excel 库生成文件
    // 这里返回模拟下载链接
    success(res, {
      downloadUrl: `/api/files/export/codes_${Date.now()}.xlsx`,
      message: '导出任务已创建',
    });
  } catch (err) {
    error(res, ErrorCode.EXPORT_FAILED, '导出失败，请检查权限或重试', 500);
  }
});

export default router;
