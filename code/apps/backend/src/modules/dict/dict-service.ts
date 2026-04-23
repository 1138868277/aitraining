import * as dictDomain from './dict-domain.js';

export interface DictItemResponse {
  code: string;
  name: string;
}

const DICT_TYPE_MAP: Record<string, () => Promise<DictItemResponse[]>> = {
  station: dictDomain.getStationDict,
  type: dictDomain.getTypeDict,
  prefix: dictDomain.getPrefixDict,
  projectLine: dictDomain.getProjectLineDict,
  dataType: dictDomain.getDataTypeDict,
};

export async function getDictItems(dictType: string): Promise<DictItemResponse[]> {
  const handler = DICT_TYPE_MAP[dictType];
  if (!handler) {
    throw new Error(`Unknown dict type: ${dictType}`);
  }
  return handler();
}

export async function getCascadedDictItems(parentCode: string, typeCode?: string, search?: string): Promise<DictItemResponse[]> {
  return dictDomain.getCodeDictByParent(parentCode, typeCode);
}

export async function getDataCodes(dataTypeCode: string): Promise<DictItemResponse[]> {
  return dictDomain.getDataCodeByDataType(dataTypeCode);
}

/** 根据类型代码获取二级类码列表 */
export async function getSecondClassByType(typeCode: string): Promise<DictItemResponse[]> {
  return dictDomain.getSecondClassByType(typeCode);
}
