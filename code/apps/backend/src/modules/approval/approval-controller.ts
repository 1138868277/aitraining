import { Router, Request, Response } from 'express';
import * as approvalService from './approval-service.js';
import { success, error } from '../../common/response.js';
import { ErrorCode } from '@cec/contracts';
import { getCurrentTenantId } from '../../db/tenant-context.js';

const router: Router = Router();

/** 从请求中提取用户信息 */
function getUserInfo(req: Request): { username: string; tenant: string } | null {
  try {
    // 复用和 middleware 相同的 token 解析逻辑
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const body = parts[1];
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    return { username: payload.username, tenant: payload.tenant };
  } catch {
    return null;
  }
}

/** 提取 token payload（复用） */
function getTokenPayload(req: Request): any {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const body = parts[1];
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

/** 校验 admin 权限 */
function requireAdmin(req: Request, res: Response): boolean {
  const payload = getTokenPayload(req);
  if (!payload) {
    error(res, 'AUTH_REQUIRED', '未登录或 token 已过期', 401);
    return false;
  }
  if (payload.tenant !== 'admin') {
    error(res, 'FORBIDDEN', '仅集团管理员可执行此操作', 403);
    return false;
  }
  return true;
}

/** 区域提交审批 */
router.post('/api/approval/submit', async (req: Request, res: Response) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      error(res, ErrorCode.AUTHENTICATION_FAILED, '未登录或登录已过期', 401);
      return;
    }

    const { typeCode, secondClassCode, secondClassName, dataCategoryCode, dataCategoryName, dataCode, dataName } = req.body;

    if (!typeCode || !secondClassCode || !dataCategoryCode || !dataCode || !dataName) {
      error(res, ErrorCode.MISSING_PARAMETER, '类型、二级类码、数据类码、数据码和名称不能为空', 400);
      return;
    }

    if (!/^\d{3}$/.test(dataCode)) {
      error(res, ErrorCode.PARAM_FORMAT_ERROR, '数据码必须为3位数字', 400);
      return;
    }

    if (!/^\d{2}$/.test(dataCategoryCode)) {
      error(res, ErrorCode.PARAM_FORMAT_ERROR, '数据类码必须为2位数字', 400);
      return;
    }

    const result = await approvalService.submitApproval({
      typeCode,
      secondClassCode,
      secondClassName: secondClassName || secondClassCode,
      dataCategoryCode,
      dataCategoryName: dataCategoryName || dataCategoryCode,
      dataCode,
      dataName,
      submitter: userInfo.username,
      sourceTenant: userInfo.tenant,
    });

    success(res, result, 201);
  } catch (err: any) {
    if (err.code === 'DUPLICATE_SUBMISSION') {
      error(res, ErrorCode.DUPLICATE_SUBMISSION, err.message, 400);
      return;
    }
    console.error('Failed to submit approval:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '提交审批失败，请重试', 500);
  }
});

/** 区域：查看我的提交记录 */
router.get('/api/approval/my-submissions', async (req: Request, res: Response) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      error(res, ErrorCode.AUTHENTICATION_FAILED, '未登录或登录已过期', 401);
      return;
    }

    const pageNum = Math.max(1, parseInt(req.query.pageNum as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const result = await approvalService.getMySubmissions(userInfo.username, pageNum, pageSize);
    success(res, result);
  } catch (err) {
    console.error('Failed to get my submissions:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询提交记录失败', 500);
  }
});

/** admin：获取待审批列表 */
router.get('/api/approval/pending-list', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;

    const pageNum = Math.max(1, parseInt(req.query.pageNum as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const status = (req.query.status as string) || undefined;
    const sourceTenant = (req.query.sourceTenant as string) || undefined;

    const result = await approvalService.getApprovalList(status, pageNum, pageSize, sourceTenant);
    success(res, result);
  } catch (err) {
    console.error('Failed to get approval list:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '查询审批列表失败', 500);
  }
});

/** admin：审批通过 */
router.post('/api/approval/:id/approve', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      error(res, ErrorCode.PARAM_FORMAT_ERROR, '参数格式错误', 400);
      return;
    }

    const userInfo = getUserInfo(req);

    await approvalService.approveApproval(id, userInfo?.username || 'admin');
    success(res, null);
  } catch (err: any) {
    if (err.code === 'APPROVAL_NOT_FOUND') {
      error(res, ErrorCode.APPROVAL_NOT_FOUND, err.message, 404);
      return;
    }
    if (err.code === 'APPROVAL_STATUS_ERROR') {
      error(res, ErrorCode.APPROVAL_STATUS_ERROR, err.message, 400);
      return;
    }
    console.error('Failed to approve:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '审批操作失败', 500);
  }
});

/** admin：审批拒绝 */
router.post('/api/approval/:id/reject', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      error(res, ErrorCode.PARAM_FORMAT_ERROR, '参数格式错误', 400);
      return;
    }

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      error(res, ErrorCode.MISSING_PARAMETER, '请填写拒绝原因', 400);
      return;
    }

    const userInfo = getUserInfo(req);

    await approvalService.rejectApproval(id, reason.trim(), userInfo?.username || 'admin');
    success(res, null);
  } catch (err: any) {
    if (err.code === 'APPROVAL_NOT_FOUND') {
      error(res, ErrorCode.APPROVAL_NOT_FOUND, err.message, 404);
      return;
    }
    if (err.code === 'APPROVAL_STATUS_ERROR') {
      error(res, ErrorCode.APPROVAL_STATUS_ERROR, err.message, 400);
      return;
    }
    console.error('Failed to reject:', err);
    error(res, ErrorCode.SYSTEM_ERROR, '审批操作失败', 500);
  }
});

export default router;
