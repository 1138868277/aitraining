import { AsyncLocalStorage } from 'async_hooks';

/** 请求级租户上下文 */
export interface TenantContext {
  tenantId: string;
  schema: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/** 获取当前请求的租户 ID */
export function getCurrentTenantId(): string | undefined {
  return tenantStorage.getStore()?.tenantId;
}

/** 获取当前请求的 schema 名称 */
export function getCurrentSchema(): string {
  return tenantStorage.getStore()?.schema || 'liuhaojun';
}
