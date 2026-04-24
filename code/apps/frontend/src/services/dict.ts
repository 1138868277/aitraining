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
export async function quickSearchDict(q: string): Promise<Array<{
  typeCode: string;
  secondClassCode: string; secondClassName: string;
  dataCategoryCode: string; dataCategoryName: string;
  dataCode: string; dataName: string;
}>> {
  const res = await api.get(`/dict/quick-search`, { params: { q } });
  return res.data.items;
}
