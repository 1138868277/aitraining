import type { DatasourceConfig } from './datasource-store.js';

/** 租户定义 */
export interface TenantDef {
  id: string;
  displayName: string;
  datasource: DatasourceConfig;
}

/** 租户注册表：所有租户的数据源配置 */
export const TENANTS: TenantDef[] = [
  {
    id: 'admin',
    displayName: '集团',
    datasource: {
      host: '10.1.1.113',
      port: 7300,
      database: 'training_exercises',
      schema: 'liuhaojun',
      user: 'liuhaojun',
      password: 'liuhaojun',
      ssl: false,
    },
  },
  {
    id: 'yunnan',
    displayName: '云南省',
    datasource: {
      host: 'localhost',
      port: 5432,
      database: 'code_tools',
      schema: 'yunnan',
      user: 'liuhaojun',
      password: 'Stephencurry521',
      ssl: false,
    },
  },
  {
    id: 'fujian',
    displayName: '福建省',
    datasource: {
      host: 'localhost',
      port: 5432,
      database: 'code_tools',
      schema: 'fujian',
      user: 'liuhaojun',
      password: 'Stephencurry521',
      ssl: false,
    },
  },
];

/** 按租户 ID 查找 */
export function getTenantById(id: string): TenantDef | undefined {
  return TENANTS.find(t => t.id === id);
}

/** 从用户名推断租户 ID（用户名和租户 ID 一致） */
export function resolveTenantByUsername(username: string): string {
  // admin → admin, yunnan → yunnan, fujian → fujian
  const tenant = TENANTS.find(t => t.id === username);
  return tenant ? tenant.id : 'admin';
}
