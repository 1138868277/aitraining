import { Router, Request, Response } from 'express';
import * as authService from './auth-service.js';
import { success, error } from '../../common/response.js';

const router: Router = Router();

// ====== Helper: 从请求中提取 token payload ======
function getTokenPayload(req: Request): authService.TokenPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return authService.verifyToken(token);
}

/** 检查当前用户是否为 admin（租户管理权限） */
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

// ====== 登录 ======
router.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      error(res, 'MISSING_PARAMETER', '用户名和密码不能为空', 400);
      return;
    }

    const result = await authService.login(username, password);
    if (!result) {
      error(res, 'AUTH_FAILED', '用户名或密码错误', 401);
      return;
    }

    success(res, {
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    console.error('Login error:', err);
    error(res, 'SYSTEM_ERROR', '登录失败，请重试', 500);
  }
});

// ====== 获取当前用户信息（根据 token） ======
router.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      error(res, 'AUTH_REQUIRED', '未登录或 token 已过期', 401);
      return;
    }

    success(res, {
      username: payload.username,
      displayName: payload.displayName,
      region: payload.region,
      tenant: payload.tenant,
    });
  } catch (err) {
    console.error('Auth me error:', err);
    error(res, 'SYSTEM_ERROR', '验证失败', 500);
  }
});

// ====== 用户列表（仅 admin） ======
router.get('/api/auth/users', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;

    const users = await authService.getUsers();
    success(res, users);
  } catch (err) {
    console.error('Get users error:', err);
    error(res, 'SYSTEM_ERROR', '获取用户列表失败', 500);
  }
});

// ====== 新增用户（仅 admin） ======
router.post('/api/auth/users', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { username, displayName, region, password, tenant } = req.body;
    if (!username || !displayName || !region || !password) {
      error(res, 'MISSING_PARAMETER', '用户名称、区域、账号和密码不能为空', 400);
      return;
    }

    const ok = await authService.addUser({ username, displayName, region, password, tenant });
    if (!ok) {
      error(res, 'DUPLICATE_USER', '该账号已存在', 409);
      return;
    }

    success(res, null, 201);
  } catch (err) {
    console.error('Add user error:', err);
    error(res, 'SYSTEM_ERROR', '新增用户失败', 500);
  }
});

// ====== 更新用户（仅 admin） ======
router.put('/api/auth/users/:username', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { username } = req.params;
    const { displayName, region, password, tenant } = req.body;

    const ok = await authService.updateUser(username, { displayName, region, password, tenant });
    if (!ok) {
      error(res, 'RESOURCE_NOT_FOUND', '用户不存在', 404);
      return;
    }

    success(res, null);
  } catch (err) {
    console.error('Update user error:', err);
    error(res, 'SYSTEM_ERROR', '更新用户失败', 500);
  }
});

// ====== 删除用户（仅 admin） ======
router.delete('/api/auth/users/:username', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { username } = req.params;
    const ok = await authService.deleteUser(username);
    if (!ok) {
      error(res, 'RESOURCE_NOT_FOUND', '用户不存在', 404);
      return;
    }

    success(res, null);
  } catch (err) {
    console.error('Delete user error:', err);
    error(res, 'SYSTEM_ERROR', '删除用户失败', 500);
  }
});

export default router;
