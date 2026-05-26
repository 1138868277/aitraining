import crypto from 'crypto';
import * as authDomain from './auth-domain.js';

// ====== Token 接口 ======
export interface TokenPayload {
  username: string;
  tenant: string;
  displayName: string;
  region: string;
  exp: number; // 过期时间戳
}

// ====== Token 配置 ======
const TOKEN_SECRET = 'cec-2024-token-secret-dev-only';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 小时

// ====== Token 签发与验证 ======

/** 签发 token */
export function signToken(payload: Omit<TokenPayload, 'exp'>): string {
  const tokenPayload: TokenPayload = {
    ...payload,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'TOKEN' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/** 验证 token，返回 payload 或 null */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

// ====== 认证逻辑 ======

/** 前端使用的用户信息（驼峰） */
export interface UserVO {
  id: number;
  username: string;
  displayName: string;
  region: string;
  tenant: string;
  create_tm: string;
  update_tm: string;
}

/** 将 DB 行转换为驼峰格式 */
function toUserVO(row: authDomain.UserRow): UserVO {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    region: row.region,
    tenant: row.tenant,
    create_tm: row.create_tm,
    update_tm: row.update_tm,
  };
}

/** 登录验证 */
export async function login(username: string, password: string): Promise<{ token: string; user: UserVO } | null> {
  const found = await authDomain.findUserByCredentials(username, password);
  if (!found) return null;

  const token = signToken({
    username: found.username,
    tenant: found.tenant,
    displayName: found.display_name,
    region: found.region,
  });

  return { token, user: toUserVO(found) };
}

/** 获取所有用户（脱敏） */
export async function getUsers(): Promise<UserVO[]> {
  const users = await authDomain.listUsers();
  return users.map(toUserVO);
}

/** 添加用户 */
export async function addUser(input: { username: string; displayName: string; region: string; password: string; tenant?: string }): Promise<boolean> {
  const existing = await authDomain.findUserByUsername(input.username);
  if (existing) return false;

  await authDomain.insertUser({
    username: input.username,
    display_name: input.displayName,
    region: input.region,
    tenant: input.tenant || input.username,
    password: input.password,
  });
  return true;
}

/** 更新用户 */
export async function updateUser(username: string, data: Partial<{ displayName: string; region: string; password: string; tenant: string }>): Promise<boolean> {
  const dbData: Partial<{ display_name: string; region: string; password: string; tenant: string }> = {};
  if (data.displayName !== undefined) dbData.display_name = data.displayName;
  if (data.region !== undefined) dbData.region = data.region;
  if (data.password !== undefined) dbData.password = data.password;
  if (data.tenant !== undefined) dbData.tenant = data.tenant;
  return authDomain.updateUser(username, dbData);
}

/** 删除用户 */
export async function deleteUser(username: string): Promise<boolean> {
  return authDomain.deleteUser(username);
}

/** 初始化用户表 */
export async function initUserTable(): Promise<void> {
  await authDomain.initUserTable();
}
