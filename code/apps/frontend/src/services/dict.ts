import api from './api';
import type { DictItem } from '@cec/contracts';

export async function getDictItems(dictType: string): Promise<DictItem[]> {
  const res = await api.get(`/dict/${dictType}`);
  return res.data.items;
}

export async function getCascadedDictItems(parentCode: string, typeCode?: string): Promise<DictItem[]> {
  const params: any = { parentCode };
  if (typeCode) {
    params.typeCode = typeCode;
  }
  const res = await api.get(`/dict/code/items`, { params });
  return res.data.items;
}

export async function getDataCodes(dataTypeCode: string): Promise<DictItem[]> {
  const res = await api.get(`/dict/data-code/${dataTypeCode}`);
  return res.data.items;
}
