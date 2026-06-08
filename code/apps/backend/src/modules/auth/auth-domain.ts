import { queryAsTenant, queryOneAsTenant } from '../../db/index.js';
import { TENANTS } from '../../config/tenants.js';

/** 用户管理始终使用集团侧（admin 租户） */
const ADMIN_TENANT = 'admin';
const ADMIN_SCHEMA = TENANTS.find(t => t.id === ADMIN_TENANT)!.datasource.schema;

export interface UserRow {
  id: number;
  username: string;
  display_name: string;
  region: string;
  tenant: string;
  password: string;
  create_tm: string;
  update_tm: string;
  last_login_time: string | null;
}

/** 初始化用户表，若表为空则插入默认用户 */
export async function initUserTable(): Promise<void> {
  await queryAsTenant(
    ADMIN_TENANT,
    `CREATE TABLE IF NOT EXISTS ${ADMIN_SCHEMA}.cec_sys_user (
      id BIGSERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      display_name VARCHAR(200) NOT NULL,
      region VARCHAR(200) NOT NULL,
      tenant VARCHAR(100) NOT NULL,
      password VARCHAR(200) NOT NULL,
      create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login_time TIMESTAMP
    )`,
  );

  // 兼容旧表：补充缺失列（若不存在）
  const alterColumns = [
    `ALTER TABLE ${ADMIN_SCHEMA}.cec_sys_user ADD COLUMN IF NOT EXISTS region VARCHAR(200)`,
    `ALTER TABLE ${ADMIN_SCHEMA}.cec_sys_user ADD COLUMN IF NOT EXISTS tenant VARCHAR(100)`,
    `ALTER TABLE ${ADMIN_SCHEMA}.cec_sys_user ADD COLUMN IF NOT EXISTS create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE ${ADMIN_SCHEMA}.cec_sys_user ADD COLUMN IF NOT EXISTS update_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE ${ADMIN_SCHEMA}.cec_sys_user ADD COLUMN IF NOT EXISTS last_login_time TIMESTAMP`,
  ];
  for (const sql of alterColumns) {
    await queryAsTenant(ADMIN_TENANT, sql);
  }

  const existing = await queryOneAsTenant<{ cnt: number }>(
    ADMIN_TENANT,
    `SELECT COUNT(*) AS cnt FROM ${ADMIN_SCHEMA}.cec_sys_user`,
  );
  if (existing && Number(existing.cnt) === 0) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const defaultUsers = [
      { username: 'admin',     display_name: '集团管理员', region: '集团',   tenant: 'admin',  password: 'admin' },
      { username: 'yunnan',     display_name: '云南区域',    region: '云南省', tenant: 'yunnan', password: 'yunnan' },
      { username: 'fujian',    display_name: '福建区域',    region: '福建省', tenant: 'fujian', password: 'fujian' },
    ];
    for (const u of defaultUsers) {
      await queryAsTenant(
        ADMIN_TENANT,
        `INSERT INTO ${ADMIN_SCHEMA}.cec_sys_user (username, display_name, region, tenant, password, create_tm, update_tm)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [u.username, u.display_name, u.region, u.tenant, u.password, now],
      );
    }
  }
}

/** 根据用户名和密码查找用户（登录验证），验证成功则更新登录时间 */
export async function findUserByCredentials(
  username: string,
  password: string,
): Promise<UserRow | null> {
  const user = await queryOneAsTenant<UserRow>(
    ADMIN_TENANT,
    `SELECT * FROM ${ADMIN_SCHEMA}.cec_sys_user
     WHERE username = $1 AND password = $2`,
    [username, password],
  );
  if (user) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await queryAsTenant(
      ADMIN_TENANT,
      `UPDATE ${ADMIN_SCHEMA}.cec_sys_user SET last_login_time = $1 WHERE username = $2`,
      [now, username],
    );
    user.last_login_time = now;
  }
  return user;
}

/** 根据用户名查找用户 */
export async function findUserByUsername(username: string): Promise<UserRow | null> {
  return queryOneAsTenant<UserRow>(
    ADMIN_TENANT,
    `SELECT * FROM ${ADMIN_SCHEMA}.cec_sys_user WHERE username = $1`,
    [username],
  );
}

/** 获取所有用户列表 */
export async function listUsers(): Promise<UserRow[]> {
  return queryAsTenant<UserRow>(
    ADMIN_TENANT,
    `SELECT * FROM ${ADMIN_SCHEMA}.cec_sys_user ORDER BY id`,
  );
}

/** 新增用户 */
export async function insertUser(u: {
  username: string;
  display_name: string;
  region: string;
  tenant: string;
  password: string;
}): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  await queryAsTenant(
    ADMIN_TENANT,
    `INSERT INTO ${ADMIN_SCHEMA}.cec_sys_user (username, display_name, region, tenant, password, create_tm, update_tm)
     VALUES ($1, $2, $3, $4, $5, $6, $6)`,
    [u.username, u.display_name, u.region, u.tenant, u.password, now],
  );
}

/** 更新用户信息 */
export async function updateUser(
  username: string,
  data: Partial<Pick<UserRow, 'display_name' | 'region' | 'password' | 'tenant'>>,
): Promise<boolean> {
  const existing = await findUserByUsername(username);
  if (!existing) return false;

  const fields: string[] = [];
  const params: string[] = [];
  let idx = 1;

  if (data.display_name !== undefined) {
    fields.push(`display_name = $${idx++}`);
    params.push(data.display_name);
  }
  if (data.region !== undefined) {
    fields.push(`region = $${idx++}`);
    params.push(data.region);
  }
  if (data.password !== undefined) {
    fields.push(`password = $${idx++}`);
    params.push(data.password);
  }
  if (data.tenant !== undefined) {
    fields.push(`tenant = $${idx++}`);
    params.push(data.tenant);
  }
  if (fields.length === 0) return false;

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  fields.push(`update_tm = $${idx++}`);
  params.push(now);

  params.push(username);
  await queryAsTenant(
    ADMIN_TENANT,
    `UPDATE ${ADMIN_SCHEMA}.cec_sys_user SET ${fields.join(', ')} WHERE username = $${idx}`,
    params,
  );
  return true;
}

/** 删除用户 */
export async function deleteUser(username: string): Promise<boolean> {
  const existing = await findUserByUsername(username);
  if (!existing) return false;

  await queryAsTenant(
    ADMIN_TENANT,
    `DELETE FROM ${ADMIN_SCHEMA}.cec_sys_user WHERE username = $1`,
    [username],
  );
  return true;
}
