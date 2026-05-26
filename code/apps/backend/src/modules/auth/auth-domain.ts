import { query, queryOne } from '../../db/index.js';
import { config } from '../../config/index.js';

const dbc = config.db;

export interface UserRow {
  id: number;
  username: string;
  display_name: string;
  region: string;
  tenant: string;
  password: string;
  create_tm: string;
  update_tm: string;
}

/** 初始化用户表，若表为空则插入默认用户 */
export async function initUserTable(): Promise<void> {
  await query(
    `CREATE TABLE IF NOT EXISTS ${dbc.schema}.cec_sys_user (
      id BIGSERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      display_name VARCHAR(200) NOT NULL,
      region VARCHAR(200) NOT NULL,
      tenant VARCHAR(100) NOT NULL,
      password VARCHAR(200) NOT NULL,
      create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  const existing = await queryOne<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM ${dbc.schema}.cec_sys_user`,
  );
  if (existing && Number(existing.cnt) === 0) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const defaultUsers = [
      { username: 'admin',     display_name: '集团管理员', region: '集团',   tenant: 'admin',  password: 'admin' },
      { username: 'yunnan',     display_name: '云南区域',    region: '云南省', tenant: 'yunnan', password: 'yunnan' },
      { username: 'fujian',    display_name: '福建区域',    region: '福建省', tenant: 'fujian', password: 'fujian' },
    ];
    for (const u of defaultUsers) {
      await query(
        `INSERT INTO ${dbc.schema}.cec_sys_user (username, display_name, region, tenant, password, create_tm, update_tm)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [u.username, u.display_name, u.region, u.tenant, u.password, now],
      );
    }
  }
}

/** 根据用户名和密码查找用户（登录验证） */
export async function findUserByCredentials(
  username: string,
  password: string,
): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT * FROM ${dbc.schema}.cec_sys_user
     WHERE username = $1 AND password = $2`,
    [username, password],
  );
}

/** 根据用户名查找用户 */
export async function findUserByUsername(username: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT * FROM ${dbc.schema}.cec_sys_user WHERE username = $1`,
    [username],
  );
}

/** 获取所有用户列表 */
export async function listUsers(): Promise<UserRow[]> {
  return query<UserRow>(
    `SELECT * FROM ${dbc.schema}.cec_sys_user ORDER BY id`,
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
  await query(
    `INSERT INTO ${dbc.schema}.cec_sys_user (username, display_name, region, tenant, password, create_tm, update_tm)
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
  await query(
    `UPDATE ${dbc.schema}.cec_sys_user SET ${fields.join(', ')} WHERE username = $${idx}`,
    params,
  );
  return true;
}

/** 删除用户 */
export async function deleteUser(username: string): Promise<boolean> {
  const existing = await findUserByUsername(username);
  if (!existing) return false;

  await query(
    `DELETE FROM ${dbc.schema}.cec_sys_user WHERE username = $1`,
    [username],
  );
  return true;
}
