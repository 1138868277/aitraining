import api from './api';

export interface TenantInfo {
  id: string;
  displayName: string;
}

export async function getTenants(): Promise<TenantInfo[]> {
  const res = await api.get('/tenants');
  return res.data;
}
