import {
  type ImportRow,
  type AutoMatchResult,
  type AutoMatchField,
  extractNumbers,
  findNextAvailableExtCodes,
} from './auto-code-domain.js';
import { generateCodeFromConditions } from '../code-generation/code-domain.js';
import { query, getSchema } from '../../db/index.js';

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

// ====== 预加载的字典数据 ======
interface StationDict {
  code: string;
  name: string;
  stationType: string | null;
}

interface SecondClassDict {
  code: string;
  name: string;
  typeCode: string;
}

interface ThirdClassDict {
  code: string;
  name: string;
  typeCode: string;
  secondClassCode: string;
}

interface CodeDictItem {
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
  secondClassCode: string;
  typeDomainCode: string | null;
}

let preloaded: {
  stations: StationDict[];
  secondClasses: SecondClassDict[];
  thirdClasses: ThirdClassDict[];
  codeDict: CodeDictItem[];
} | null = null;

async function preloadDictData() {
  if (preloaded) return preloaded;
  const schema = getSchema();
  const [stations, secondClasses, thirdClasses, codeDict] = await Promise.all([
    query<StationDict>(
      `SELECT station_code AS code, station_name AS name, station_type AS "stationType"
       FROM ${schema}.cec_new_energy_station_dict WHERE if_delete = '0'`
    ),
    query<SecondClassDict>(
      `SELECT second_class_code AS code, second_class_name AS name, type_code AS "typeCode"
       FROM ${schema}.cec_new_energy_second_class_type_dict WHERE if_delete = '0'`
    ),
    query<ThirdClassDict>(
      `SELECT third_class_code AS code, third_class_name AS name, type_code AS "typeCode", second_class_code AS "secondClassCode"
       FROM ${schema}.cec_new_energy_third_class_dict WHERE if_delete = '0'`
    ),
    query<CodeDictItem>(
      `SELECT DISTINCT data_category_code AS "dataCategoryCode", data_category_name AS "dataCategoryName",
              data_code AS "dataCode", data_name AS "dataName",
              second_class_code AS "secondClassCode", type_domain_code AS "typeDomainCode"
       FROM ${schema}.cec_new_energy_code_dict WHERE if_delete = '0'`
    ),
  ]);
  preloaded = { stations, secondClasses, thirdClasses, codeDict };
  return preloaded;
}

function getTypeDomainCode(typeCode?: string): string | null {
  if (!typeCode) return null;
  if (typeCode.startsWith('F') || typeCode === '01') return 'F';
  if (typeCode.startsWith('G') || typeCode === '02') return 'G';
  if (typeCode.startsWith('S') || typeCode === '05') return 'S';
  return null;
}

// ====== 内存匹配函数 ======

function matchStationInMemory(name: string): StationDict | null {
  return preloaded?.stations.find(s => s.name === name) || null;
}

function matchSecondClassInMemory(name: string, typeCode: string): SecondClassDict | null {
  return preloaded?.secondClasses.find(s => s.name === name && s.typeCode === typeCode) || null;
}

function matchThirdClassInMemory(name: string, typeCode: string, secondClassCode: string): ThirdClassDict | null {
  return preloaded?.thirdClasses.find(s => s.name === name && s.typeCode === typeCode && s.secondClassCode === secondClassCode) || null;
}

function matchDataTypeInMemory(name: string, secondClassCode: string, typeCode: string): { code: string; name: string } | null {
  const typeDomain = getTypeDomainCode(typeCode);
  const item = preloaded?.codeDict.find(c =>
    c.dataCategoryName === name
    && c.secondClassCode === secondClassCode
    && (!typeDomain || c.typeDomainCode === typeDomain)
  );
  return item ? { code: item.dataCategoryCode, name: item.dataCategoryName } : null;
}

function matchDataCodeInMemory(name: string, dataTypeCode: string, secondClassCode: string, typeCode: string): { code: string; name: string } | null {
  const typeDomain = getTypeDomainCode(typeCode);
  const item = preloaded?.codeDict.find(c =>
    c.dataName === name
    && c.dataCategoryCode === dataTypeCode
    && c.secondClassCode === secondClassCode
    && (!typeDomain || c.typeDomainCode === typeDomain)
  );
  return item ? { code: item.dataCode, name: item.dataName } : null;
}

// ====== 单行匹配（纯内存） ======

async function autoMatchRowInMemory(
  row: ImportRow,
  config: AutoCodeConfig,
): Promise<AutoMatchResult> {
  const fields: AutoMatchField[] = [];

  // 1. 场站匹配
  if (row.stationName) {
    const station = matchStationInMemory(row.stationName);
    if (station) {
      fields.push({
        fieldKey: 'stationCode', fieldLabel: '场站',
        sourceValue: row.stationName, matchedCode: station.code, matchedName: station.name,
        status: 'matched',
      });
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

  // 2. 二级类码匹配
  let secondMatchedCode: string | null = null;
  if (row.secondClassName) {
    const second = matchSecondClassInMemory(row.secondClassName, config.typeCode);
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

  // 3. 三级类码匹配
  if (row.thirdClassName && secondMatchedCode) {
    const third = matchThirdClassInMemory(row.thirdClassName, config.typeCode, secondMatchedCode);
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

  // 4. 数据类码匹配
  if (row.dataTypeName && secondMatchedCode) {
    const dt = matchDataTypeInMemory(row.dataTypeName, secondMatchedCode, config.typeCode);
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
    const dc = matchDataCodeInMemory(row.dataName, dtField.matchedCode!, secondMatchedCode, config.typeCode);
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

  const { secondExt, thirdExt } = extractExtCodes(name);

  const baseCodes = existingCodes || [];

  const codePrefix = stationCode + config.typeCode + config.projectLineCode + config.prefixNo + config.firstClassCode + secondClassCode;

  const { secondExtCode, thirdExtCode } = await findNextAvailableExtCodes(
    baseCodes.map(r => r.code),
    codePrefix,
    thirdClassCode,
    dataTypeCode,
    dataCode,
    secondExt, thirdExt,
  );

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

  return { code: codeStr, name };
}

/** 获取匹配结果的编码值 */
function getMatchedCode(matched: AutoMatchField[], key: string): string {
  return matched.find(m => m.fieldKey === key)?.matchedCode || '';
}

/** 聚合所有唯一的前缀组合，批量查询已存在的编码（支持20000行） */
async function batchFindExistingCodes(
  matchedRows: { name: string; matched: AutoMatchField[]; config: AutoCodeConfig }[],
): Promise<Map<number, Array<{ code: string }>>> {
  const schema = getSchema();
  const seen = new Map<string, number[]>();

  matchedRows.forEach((row, idx) => {
    const parts = [
      getMatchedCode(row.matched, 'stationCode'),
      row.config.typeCode,
      row.config.projectLineCode,
      row.config.prefixNo,
      row.config.firstClassCode,
      getMatchedCode(row.matched, 'secondClassCode'),
      getMatchedCode(row.matched, 'thirdClassCode'),
      getMatchedCode(row.matched, 'dataTypeCode'),
      getMatchedCode(row.matched, 'dataCode'),
    ];
    const key = parts.join('|');
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(idx);
  });

  const result = new Map<number, Array<{ code: string }>>();
  const uniqueCombos = Array.from(seen.entries());

  // PG 参数上限 ~65535，每组9字段 → 最多 ~7280 组合/批
  const BATCH_SIZE = 5000;
  for (let batchStart = 0; batchStart < uniqueCombos.length; batchStart += BATCH_SIZE) {
    const batch = uniqueCombos.slice(batchStart, batchStart + BATCH_SIZE);
    // 构建 VALUES 行：((($1,$2,...,$9),($10,...),...))
    // 并用 LATERAL 将组合与 measurement_points 做 JOIN
    const valueRows: string[] = [];
    const params: string[] = [];
    let idx = 1;
    const comboToParamIdx: Array<{ indices: number[]; fields: string[] }> = [];

    for (const [key, indices] of batch) {
      const fields = key.split('|');
      const placeholders = fields.map(() => `$${idx++}`);
      valueRows.push(`(${placeholders.join(',')})`);
      params.push(...fields);
      comboToParamIdx.push({ indices, fields });
    }

    const valueExpr = `VALUES ${valueRows.join(',')}`;
    const sql = `
      SELECT v.rn, m.code FROM (
        SELECT ROW_NUMBER() OVER () AS rn, * FROM ${valueExpr}
      ) AS v(s_code, t_code, pl_code, p_no, fc_code, sc_code, tc_code, dt_code, d_code)
      LEFT JOIN ${schema}.cec_new_energy_measurement_points m
        ON m.if_delete = '0'
       AND m.station_code = v.s_code
       AND m.type_code = v.t_code
       AND m.project_line_code = v.pl_code
       AND m.prefix_no = v.p_no
       AND m.first_class_code = v.fc_code
       AND m.second_class_code = v.sc_code
       AND m.third_class_code = v.tc_code
       AND m.data_category_code = v.dt_code
       AND m.data_code = v.d_code
      ORDER BY v.rn
    `;

    const rows = await query<{ rn: number; code: string | null }>(sql, params);

    // 按组合分组：同一组合的 rows 会在结果中连续出现（因 ORDER BY v.rn）
    let rowPos = 0;
    for (let ci = 0; ci < comboToParamIdx.length; ci++) {
      const { indices } = comboToParamIdx[ci];
      const codes: Array<{ code: string }> = [];
      // 收集当前组合的所有匹配行（code 可能为 NULL）
      while (rowPos < rows.length && rows[rowPos].rn === ci + 1) {
        if (rows[rowPos].code) {
          codes.push({ code: rows[rowPos].code! });
        }
        rowPos++;
      }
      for (const rowIdx of indices) {
        result.set(rowIdx, codes);
      }
    }
  }

  return result;
}

/** 批量自动编码 */
export async function autoGenerateBatch(
  rows: ImportRow[],
  config: AutoCodeConfig,
): Promise<AutoCodeRowResult[]> {
  // 预加载字典数据
  await preloadDictData();

  const results: AutoCodeRowResult[] = [];

  // 第一轮：全部做内存匹配
  const matchedRows: { name: string; matched: AutoMatchField[]; allMatched: boolean; rowConfig: AutoCodeConfig }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const rowConfig = { ...config };
      const matchResult = await autoMatchRowInMemory(row, rowConfig);
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
      matchedRows.push({
        name: row.name || '',
        matched: matchResult.fields,
        allMatched: true,
        rowConfig,
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

  // 第二轮：批量查询已存在的编码
  const existingCodesMap = await batchFindExistingCodes(
    matchedRows.map(r => ({ name: r.name, matched: r.matched, config: r.rowConfig }))
  );

  // 第三轮：生成编码
  for (let i = 0; i < matchedRows.length; i++) {
    const mr = matchedRows[i];
    try {
      const existingCodes = existingCodesMap.get(i) || [];
      const { code, name } = await generateCodeFromMatch(mr.name, mr.matched, mr.rowConfig, existingCodes);
      results.push({
        rowIndex: i,
        name: mr.name,
        matched: mr.matched,
        allMatched: true,
        generatedCode: { code, name, generateTime: new Date().toISOString() },
      });
    } catch (err: any) {
      results.push({
        rowIndex: i,
        name: mr.name || '',
        matched: mr.matched,
        allMatched: false,
        error: err.message || '生成失败',
      });
    }
  }

  return results;
}
