import {
  type ImportRow,
  type AutoMatchResult,
  type AutoMatchField,
  extractNumbers,
  findNextAvailableExtCodes,
  findExistingCodesWithExt,
  matchStationCode,
  matchSecondClassCode,
  matchThirdClassCode,
  matchDataTypeCode,
  matchDataCode,
} from './auto-code-domain.js';
import { generateCodeFromConditions, generateCodeName } from '../code-generation/code-domain.js';
import * as dictDomain from '../dict/dict-domain.js';

export interface AutoCodeConfig {
  typeCode: string;
  projectLineCode: string;
  prefixNo: string;
  firstClassCode: string;
}

export interface AutoCodeRowResult {
  rowIndex: number;
  name: string;
  matched: AutoMatchField[];
  allMatched: boolean;
  generatedCode?: {
    code: string;
    name: string;
    generateTime: string;
  };
  error?: string;
}

/** 自动匹配单行数据 */
export async function autoMatchRow(
  row: ImportRow,
  config: AutoCodeConfig,
): Promise<AutoMatchResult> {
  const fields: AutoMatchField[] = [];

  // 1. 场站匹配
  if (row.stationName) {
    const station = await matchStationCode(row.stationName);
    if (station) {
      fields.push({
        fieldKey: 'stationCode', fieldLabel: '场站',
        sourceValue: row.stationName, matchedCode: station.code, matchedName: station.name,
        status: 'matched',
      });
      // 如果配置的typeCode为空，尝试从场站带出
      if (!config.typeCode && station.stationType) {
        config.typeCode = station.stationType;
      }
    } else {
      fields.push({
        fieldKey: 'stationCode', fieldLabel: '场站',
        sourceValue: row.stationName, matchedCode: null, matchedName: null,
        status: 'not_found',
      });
    }
  } else {
    fields.push({
      fieldKey: 'stationCode', fieldLabel: '场站',
      sourceValue: '', matchedCode: null, matchedName: null, status: 'empty',
    });
  }

  const stationField = fields[0];

  // 2. 二级类码匹配
  let secondMatchedCode: string | null = null;
  if (row.secondClassName) {
    const second = await matchSecondClassCode(row.secondClassName, config.typeCode);
    if (second) {
      secondMatchedCode = second.code;
      fields.push({
        fieldKey: 'secondClassCode', fieldLabel: '二级类码',
        sourceValue: row.secondClassName, matchedCode: second.code, matchedName: second.name,
        status: 'matched',
      });
    } else {
      fields.push({
        fieldKey: 'secondClassCode', fieldLabel: '二级类码',
        sourceValue: row.secondClassName, matchedCode: null, matchedName: null,
        status: 'not_found',
      });
    }
  } else {
    fields.push({
      fieldKey: 'secondClassCode', fieldLabel: '二级类码',
      sourceValue: '', matchedCode: null, matchedName: null, status: 'empty',
    });
  }

  // 3. 三级类码匹配（依赖二级类码）
  if (row.thirdClassName && secondMatchedCode) {
    const third = await matchThirdClassCode(row.thirdClassName, config.typeCode, secondMatchedCode);
    if (third) {
      fields.push({
        fieldKey: 'thirdClassCode', fieldLabel: '三级类码',
        sourceValue: row.thirdClassName, matchedCode: third.code, matchedName: third.name,
        status: 'matched',
      });
    } else {
      fields.push({
        fieldKey: 'thirdClassCode', fieldLabel: '三级类码',
        sourceValue: row.thirdClassName, matchedCode: null, matchedName: null,
        status: 'not_found',
      });
    }
  } else if (row.thirdClassName && !secondMatchedCode) {
    fields.push({
      fieldKey: 'thirdClassCode', fieldLabel: '三级类码',
      sourceValue: row.thirdClassName, matchedCode: null, matchedName: null,
      status: 'not_found',
    });
  } else {
    fields.push({
      fieldKey: 'thirdClassCode', fieldLabel: '三级类码',
      sourceValue: '', matchedCode: null, matchedName: null, status: 'empty',
    });
  }

  // 4. 数据类码匹配（依赖二级类码）
  if (row.dataTypeName && secondMatchedCode) {
    const dt = await matchDataTypeCode(row.dataTypeName, secondMatchedCode, config.typeCode);
    if (dt) {
      fields.push({
        fieldKey: 'dataTypeCode', fieldLabel: '数据类码',
        sourceValue: row.dataTypeName, matchedCode: dt.code, matchedName: dt.name,
        status: 'matched',
      });
    } else {
      fields.push({
        fieldKey: 'dataTypeCode', fieldLabel: '数据类码',
        sourceValue: row.dataTypeName, matchedCode: null, matchedName: null,
        status: 'not_found',
      });
    }
  } else if (row.dataTypeName && !secondMatchedCode) {
    fields.push({
      fieldKey: 'dataTypeCode', fieldLabel: '数据类码',
      sourceValue: row.dataTypeName, matchedCode: null, matchedName: null,
      status: 'not_found',
    });
  } else {
    fields.push({
      fieldKey: 'dataTypeCode', fieldLabel: '数据类码',
      sourceValue: '', matchedCode: null, matchedName: null, status: 'empty',
    });
  }

  // 5. 数据码匹配
  const dtField = fields.find(f => f.fieldKey === 'dataTypeCode');
  if (row.dataName && secondMatchedCode && dtField?.status === 'matched') {
    const dc = await matchDataCode(row.dataName, dtField.matchedCode!, secondMatchedCode, config.typeCode);
    if (dc) {
      fields.push({
        fieldKey: 'dataCode', fieldLabel: '数据码',
        sourceValue: row.dataName, matchedCode: dc.code, matchedName: dc.name,
        status: 'matched',
      });
    } else {
      fields.push({
        fieldKey: 'dataCode', fieldLabel: '数据码',
        sourceValue: row.dataName, matchedCode: null, matchedName: null,
        status: 'not_found',
      });
    }
  } else if (row.dataName && (!secondMatchedCode || dtField?.status !== 'matched')) {
    fields.push({
      fieldKey: 'dataCode', fieldLabel: '数据码',
      sourceValue: row.dataName, matchedCode: null, matchedName: null,
      status: 'not_found',
    });
  } else {
    fields.push({
      fieldKey: 'dataCode', fieldLabel: '数据码',
      sourceValue: '', matchedCode: null, matchedName: null, status: 'empty',
    });
  }

  const allMatched = fields.every(f => f.status === 'matched' || f.status === 'empty');
  return { rowIndex: 0, name: row.name || '', fields, allMatched };
}

/** 从测点名称中提取扩展码数字 */
export function extractExtCodes(name: string): { secondExt: number; thirdExt: number } {
  const nums = extractNumbers(name);
  return {
    secondExt: nums.length >= 1 ? nums[0] : 0,
    thirdExt: nums.length >= 2 ? nums[1] : 0,
  };
}

/** 根据匹配结果生成完整编码 */
export async function generateCodeFromMatch(
  name: string,
  matched: AutoMatchField[],
  config: AutoCodeConfig,
  existingCodes?: Array<{ code: string }>,
): Promise<{ code: string; name: string }> {
  const getCode = (key: string): string => {
    const f = matched.find(m => m.fieldKey === key);
    return f?.matchedCode || '';
  };

  const stationCode = getCode('stationCode');
  const secondClassCode = getCode('secondClassCode');
  const thirdClassCode = getCode('thirdClassCode');
  const dataTypeCode = getCode('dataTypeCode');
  const dataCode = getCode('dataCode');

  // 从名称中提取扩展码
  const { secondExt, thirdExt } = extractExtCodes(name);

  // 冲突检测：查找所有相同固定字段的已有编码
  const baseCodes = existingCodes || await findExistingCodesWithExt(
    stationCode, config.typeCode, config.projectLineCode,
    config.prefixNo, config.firstClassCode,
    secondClassCode, thirdClassCode,
    dataTypeCode, dataCode,
  );

  // 构建编码前缀（1-15位）：场站+类型+项目期号+前缀号+一级类码+二级类码
  const codePrefix = stationCode + config.typeCode + config.projectLineCode + config.prefixNo + config.firstClassCode + secondClassCode;

  const { secondExtCode, thirdExtCode } = await findNextAvailableExtCodes(
    baseCodes.map(r => r.code),
    codePrefix,
    thirdClassCode,
    dataTypeCode,
    dataCode,
    secondExt, thirdExt,
  );

  // 生成31位编码
  const codes = generateCodeFromConditions({
    stationCode,
    typeCode: config.typeCode,
    projectLineCode: config.projectLineCode,
    prefixNo: config.prefixNo,
    firstClassCode: config.firstClassCode,
    secondClassCode,
    secondExtCode,
    thirdClassCode,
    thirdExtCode,
    dataTypeCode,
    dataCode,
  });

  const codeStr = typeof codes === 'string' ? codes : codes[0];

  // 查询字典名称
  const dictNames: Record<string, string> = {};
  const stationRow = await matchStationCode(matched.find(m => m.fieldKey === 'stationCode')?.sourceValue || '');
  if (stationRow) dictNames.stationName = stationRow.name;
  const secondField = matched.find(m => m.fieldKey === 'secondClassCode');
  if (secondField?.matchedName) dictNames.secondClassName = secondField.matchedName;
  const thirdField = matched.find(m => m.fieldKey === 'thirdClassCode');
  if (thirdField?.matchedName) dictNames.thirdClassName = thirdField.matchedName;
  const dataField = matched.find(m => m.fieldKey === 'dataCode');
  if (dataField?.matchedName) dictNames.dataName = dataField.matchedName;

  const names = generateCodeName({
    stationCode,
    typeCode: config.typeCode,
    projectLineCode: config.projectLineCode,
    prefixNo: config.prefixNo,
    firstClassCode: config.firstClassCode,
    secondClassCode,
    secondExtCode,
    thirdClassCode,
    thirdExtCode,
    dataTypeCode,
    dataCode,
  }, dictNames);

  const nameStr = typeof names === 'string' ? names : names[0];

  return { code: codeStr, name: nameStr };
}

/** 批量自动编码 */
export async function autoGenerateBatch(
  rows: ImportRow[],
  config: AutoCodeConfig,
): Promise<AutoCodeRowResult[]> {
  const results: AutoCodeRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const matchResult = await autoMatchRow(row, config);

      if (!matchResult.allMatched) {
        results.push({
          rowIndex: i,
          name: row.name || '',
          matched: matchResult.fields,
          allMatched: false,
          error: '部分字段匹配失败',
        });
        continue;
      }

      const { code, name } = await generateCodeFromMatch(row.name, matchResult.fields, config);

      results.push({
        rowIndex: i,
        name: row.name || '',
        matched: matchResult.fields,
        allMatched: true,
        generatedCode: {
          code,
          name,
          generateTime: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      results.push({
        rowIndex: i,
        name: row.name || '',
        matched: [],
        allMatched: false,
        error: err.message || '生成失败',
      });
    }
  }

  return results;
}
