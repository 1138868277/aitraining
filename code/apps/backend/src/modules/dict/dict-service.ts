import * as dictDomain from './dict-domain.js';

export interface DictItemResponse {
  code: string;
  name: string;
}

export interface QuickSearchItem {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
  isManual?: string;
}

export interface QuickSearchResult {
  items: QuickSearchItem[];
  total: number;
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

export async function getDataCodes(dataTypeCode: string, secondClassCode?: string, typeCode?: string): Promise<DictItemResponse[]> {
  return dictDomain.getDataCodeByDataType(dataTypeCode, secondClassCode, typeCode);
}

/** 根据类型代码获取二级类码列表 */
export async function getSecondClassByType(typeCode: string): Promise<DictItemResponse[]> {
  return dictDomain.getSecondClassByType(typeCode);
}

/** 根据类型代码和二级类码获取数据类码 */
export async function getDataTypeBySecondClass(typeCode: string, secondClassCode: string): Promise<DictItemResponse[]> {
  return dictDomain.getDataTypeBySecondClass(typeCode, secondClassCode);
}

/** 快捷搜索：根据数据码名称模糊匹配 */
export async function quickSearchDict(searchText: string): Promise<QuickSearchResult> {
  return dictDomain.quickSearchDict(searchText);
}

/** 手动新增编码字典项 */
export async function createManualCode(input: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName?: string;
  dataCode: string;
  dataName?: string;
  creator: string;
}) {
  return dictDomain.createManualCode(input);
}

/** 批量新增编码字典项 */
export async function batchCreateManualCode(input: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  entries: Array<{
    dataCategoryCode: string;
    dataCategoryName?: string;
    dataCode: string;
    dataName?: string;
  }>;
  creator: string;
}) {
  return dictDomain.batchCreateManualCode(input);
}

/** 获取指定数据类码下最大数据码 */
export async function getMaxDataCode(secondClassCode: string, dataCategoryCode: string, typeCode: string): Promise<string | null> {
  return dictDomain.getMaxDataCode(secondClassCode, dataCategoryCode, typeCode);
}

/** 获取指定二级类码下最大数据类码 */
export async function getMaxDataCategoryCode(secondClassCode: string, typeCode: string): Promise<string | null> {
  return dictDomain.getMaxDataCategoryCode(secondClassCode, typeCode);
}

/** 检查数据类码是否已存在 */
export async function checkExistingDataCategories(
  secondClassCode: string,
  typeCode: string,
  categoryCodes: string[],
): Promise<string[]> {
  return dictDomain.checkExistingDataCategories(secondClassCode, typeCode, categoryCodes);
}

/** 检查数据码是否已存在 */
export async function checkExistingDataCodes(
  secondClassCode: string,
  dataCategoryCode: string,
  typeCode: string,
  dataCodes: string[],
): Promise<string[]> {
  return dictDomain.checkExistingDataCodes(secondClassCode, dataCategoryCode, typeCode, dataCodes);
}
