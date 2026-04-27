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

export async function getDataCodes(dataTypeCode: string, secondClassCode?: string, typeCode?: string): Promise<DictItem[]> {
  const params: any = {};
  if (secondClassCode) {
    params.secondClassCode = secondClassCode;
  }
  if (typeCode) {
    params.typeCode = typeCode;
  }
  const res = await api.get(`/dict/data-code/${dataTypeCode}`, { params });
  return res.data.items;
}

/** 根据类型代码获取二级类码列表 */
export async function getSecondClassByType(typeCode: string): Promise<DictItem[]> {
  const res = await api.get(`/dict/second-class/${typeCode}`);
  return res.data.items;
}

/** 根据类型代码和二级类码获取数据类码 */
export async function getDataTypeBySecondClass(typeCode: string, secondClassCode: string): Promise<DictItem[]> {
  const res = await api.get(`/dict/data-type/filter`, {
    params: { typeCode, secondClassCode }
  });
  return res.data.items;
}

/** 快捷搜索：根据数据码名称模糊匹配 */
export async function quickSearchDict(q: string, pageNum: number = 1, pageSize: number = 20, typeFilter?: string, secondClassFilter?: string): Promise<{
  items: Array<{
    typeCode: string;
    secondClassCode: string; secondClassName: string;
    dataCategoryCode: string; dataCategoryName: string;
    dataCode: string; dataName: string;
    isManual?: string;
  }>;
  total: number;
  typeOptions: string[];
  secondClassOptions: Array<{ secondClassCode: string; secondClassName: string; typeCode: string }>;
}> {
  const res = await api.get(`/dict/quick-search`, { params: { q, pageNum, pageSize, typeFilter, secondClassFilter } });
  return res.data;
}

/** 手动新增编码字典项 */
export async function createManualCode(data: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
}): Promise<{ codeDictId: number; isManual: string }> {
  const res = await api.post('/dict/manual-code', data);
  return res.data;
}

/** 获取指定数据类码下最大数据码 */
export async function getMaxDataCode(secondClassCode: string, dataCategoryCode: string, typeCode: string): Promise<string | null> {
  const res = await api.get('/dict/max-data-code', { params: { secondClassCode, dataCategoryCode, typeCode } });
  return res.data.maxDataCode;
}

/** 获取指定二级类码下最大数据类码 */
export async function getMaxDataCategoryCode(secondClassCode: string, typeCode: string): Promise<string | null> {
  const res = await api.get('/dict/max-data-category-code', { params: { secondClassCode, typeCode } });
  return res.data.maxDataCategoryCode;
}

/** 编码解析：解析31位编码的各段信息 */
export async function parseCode(code: string): Promise<{
  rawCode: string;
  segments: Array<{ label: string; code: string; name: string }>;
  isValid: boolean;
  errorMessage?: string;
}> {
  const res = await api.post('/dict/parse-code', { code });
  return res.data;
}

/** 批量新增编码字典项 */
export async function batchCreateManualCode(data: {
  mode: 'existing' | 'new';
  typeCode: string;
  secondClassCode: string;
  secondClassName?: string;
  entries: Array<{
    dataCategoryCode: string;
    dataCategoryName?: string;
    dataCode: string;
    dataName?: string;
  }>;
}): Promise<{ insertedCount: number }> {
  const res = await api.post('/dict/manual-code/batch', data);
  return res.data;
}
