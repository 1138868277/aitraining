import {
  type ImportRow,
  type AutoMatchResult,
  type AutoMatchField,
  extractNumbers,
  toExtCode,
} from './auto-code-domain.js';
import { generateCodeFromConditions } from '../code-generation/code-domain.js';
import { checkDuplicateCodeNames } from '../code-generation/code-service.js';
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

/** 根据匹配结果生成完整编码
 *
 * 扩展码**不做顺延**：完全由测点名称里的数字决定（第 1 个→二级类扩展码，
 * 第 2 个→三级类扩展码，无数字则 0），因此同一输入必然得到同一编码。
 * 若该编码与存量撞号，照常返回编码，同时通过 stockConflict 告知调用方，
 * 由调用方决定呈现方式（当前为：状态失败 + 写明原因）。
 */
export async function generateCodeFromMatch(
  name: string,
  matched: AutoMatchField[],
  config: AutoCodeConfig,
  existingCodes?: Array<{ code: string; name: string }>,
): Promise<{ code: string; name: string; stockConflict?: { code: string; name: string } }> {
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

  // 用"真实生成的 31 位码"做撞码判重（保证与最终落库编码完全一致，不因可空分段漏判）
  const built = generateCodeFromConditions({
    stationCode,
    typeCode: config.typeCode,
    projectLineCode: config.projectLineCode,
    prefixNo: config.prefixNo,
    firstClassCode: config.firstClassCode,
    secondClassCode,
    secondExtCode: toExtCode(secondExt),
    thirdClassCode,
    thirdExtCode: toExtCode(thirdExt),
    dataTypeCode,
    dataCode,
  });
  const code = typeof built === 'string' ? built : built[0];

  // 同一编码在存量里可能有多行（重复导入/重复保存），优先取带描述的那条
  const hits = (existingCodes || []).filter(r => r.code === code);
  const hit = hits.find(r => r.name) || hits[0];

  return {
    code,
    name,
    stockConflict: hit ? { code: hit.code, name: hit.name || '' } : undefined,
  };
}

/** 获取匹配结果的编码值 */
function getMatchedCode(matched: AutoMatchField[], key: string): string {
  return matched.find(m => m.fieldKey === key)?.matchedCode || '';
}

/** measurement_points 的 name(测点描述) 列是否存在。
 *
 * 该列是后来才加的，实测四个租户 schema 中只有部分有；缺列时降级为 NULL，
 * 否则整批会因 "column m.name does not exist" 直接报错。
 * 按 schema 缓存（getSchema() 是租户感知的，不能做成全局布尔）。
 */
const mpNameColumnCache = new Map<string, boolean>();

async function measurementPointsHasNameColumn(schema: string): Promise<boolean> {
  const cached = mpNameColumnCache.get(schema);
  if (cached !== undefined) return cached;
  const rows = await query<{ ok: number }>(
    `SELECT 1 AS ok FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = 'cec_new_energy_measurement_points'
        AND column_name = 'name' LIMIT 1`,
    [schema],
  );
  const has = rows.length > 0;
  mpNameColumnCache.set(schema, has);
  return has;
}

/** 聚合所有唯一的前缀组合，批量查询已存在的编码及其描述（支持20000行） */
async function batchFindExistingCodes(
  matchedRows: { name: string; matched: AutoMatchField[]; config: AutoCodeConfig }[],
): Promise<Map<number, Array<{ code: string; name: string }>>> {
  const schema = getSchema();
  const hasName = await measurementPointsHasNameColumn(schema);
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

  const result = new Map<number, Array<{ code: string; name: string }>>();
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
      SELECT v.rn, m.code, ${hasName ? 'm.name' : 'NULL::varchar'} AS name FROM (
        SELECT ROW_NUMBER() OVER () AS rn,
               t.s_code, t.t_code, t.pl_code, t.p_no, t.fc_code,
               t.sc_code, t.tc_code, t.dt_code, t.d_code
        FROM (${valueExpr}) AS t(s_code, t_code, pl_code, p_no, fc_code, sc_code, tc_code, dt_code, d_code)
      ) v
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

    const rows = await query<{ rn: number; code: string | null; name: string | null }>(sql, params);

    // 按组合分组：同一组合的 rows 会在结果中连续出现（因 ORDER BY v.rn）
    // 注意：ROW_NUMBER() 经 pg 返回为字符串，需转数字比较
    let rowPos = 0;
    for (let ci = 0; ci < comboToParamIdx.length; ci++) {
      const { indices } = comboToParamIdx[ci];
      const codes: Array<{ code: string; name: string }> = [];
      // 收集当前组合的所有匹配行（code 可能为 NULL）
      while (rowPos < rows.length && Number(rows[rowPos].rn) === ci + 1) {
        if (rows[rowPos].code) {
          codes.push({ code: rows[rowPos].code!, name: rows[rowPos].name || '' });
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

  // 按原始行号存放结果，保证最终顺序与导入文件一致
  const resultByIndex: (AutoCodeRowResult | null)[] = new Array(rows.length).fill(null);

  interface MatchedItem {
    origIdx: number;
    name: string;
    matched: AutoMatchField[];
    rowConfig: AutoCodeConfig;
  }

  // 第一轮：全部做内存匹配
  const matchedRows: MatchedItem[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const rowConfig = { ...config };
      // 项目期号以导入文件为准（编码配置里已不再提供该选项）。
      // 先原样灌入，格式校验放到真正生成编码时做，避免抢在"编码描述已存在"前面报错。
      rowConfig.projectLineCode = String(row.projectLineCode ?? '').trim();
      const matchResult = await autoMatchRowInMemory(row, rowConfig);

      // 6 个字段（场站 / 二级类码 / 三级类码 / 数据类码 / 数据码 / 项目期号）
      // 必须齐全且都能对上字典，否则不进入编码环节。
      // 注意：空值原先被视为"通过"，会让缺失分段被补零、产出看似正常的垃圾编码，这里收紧。
      const missing = matchResult.fields
        .filter(f => f.status === 'empty')
        .map(f => f.fieldLabel);
      if (!rowConfig.projectLineCode) missing.push('项目期号');
      if (missing.length > 0) {
        resultByIndex[i] = {
          rowIndex: i,
          name: row.name || '',
          matched: matchResult.fields,
          allMatched: false,
          error: `字段不全：${missing.join('、')}`,
        };
        continue;
      }

      if (!matchResult.allMatched) {
        resultByIndex[i] = {
          rowIndex: i,
          name: row.name || '',
          matched: matchResult.fields,
          allMatched: false,
          error: '部分字段匹配失败',
        };
        continue;
      }
      matchedRows.push({
        origIdx: i,
        name: row.name || '',
        matched: matchResult.fields,
        rowConfig,
      });
    } catch (err: any) {
      resultByIndex[i] = {
        rowIndex: i,
        name: row.name || '',
        matched: [],
        allMatched: false,
        error: err.message || '生成失败',
      };
    }
  }

  // 第二轮：测点描述查重。
  // 描述与存量(已保存编码列表 createcode.name / 编码字典 data_name)重复，
  // 或与本次导入文件中前面行相同 → 判为失败，不生成编码。
  const allNames = [...new Set(matchedRows.map(r => r.name).filter(Boolean))];
  const existingNames =
    allNames.length > 0 ? new Set(await checkDuplicateCodeNames(allNames)) : new Set<string>();
  const usedNames = new Set<string>();
  const genRows: MatchedItem[] = [];
  for (const mr of matchedRows) {
    const nm = mr.name;
    if (nm && (existingNames.has(nm) || usedNames.has(nm))) {
      resultByIndex[mr.origIdx] = {
        rowIndex: mr.origIdx,
        name: nm,
        matched: mr.matched,
        allMatched: false,
        error: '编码描述已存在',
      };
      continue;
    }
    if (nm) usedNames.add(nm);
    genRows.push(mr);
  }

  // 第三轮：批量查询已存在的编码及其描述（仅针对需要生成的行）
  const existingCodesMap = await batchFindExistingCodes(
    genRows.map(r => ({ name: r.name, matched: r.matched, config: r.rowConfig }))
  );

  // 编码列表(createcode)中已保存的完整编码同样视为存量，一并参与撞号判定
  const schema = getSchema();
  const savedCodeRows = await query<{ code: string; name: string | null }>(
    `SELECT code, name FROM ${schema}.cec_new_energy_createcode WHERE if_delete = '0'`
  );
  const savedCodes = savedCodeRows.map(r => ({ code: r.code, name: r.name || '' }));

  // 本批次内已出现过的编码 → 归属行号（界面「序号」列 = origIdx + 1）。
  // 去掉顺延后编码完全由输入决定，同组合的重复行必然算出同一个码，必须拦住。
  const batchCodeOwner = new Map<string, number>();

  // 第四轮：生成编码。扩展码不再顺延；撞号时照常产出编码，但整体判为失败
  for (let j = 0; j < genRows.length; j++) {
    const gr = genRows[j];
    const rowNo = gr.origIdx + 1;
    try {
      // 项目期号以文件为准：缺失或非 3 位数字则该行不编码
      if (!/^\d{3}$/.test(gr.rowConfig.projectLineCode)) {
        resultByIndex[gr.origIdx] = {
          rowIndex: gr.origIdx,
          name: gr.name,
          matched: gr.matched,
          allMatched: false,
          error: `项目期号缺失或格式不对：${gr.rowConfig.projectLineCode || '（空）'}`,
        };
        continue;
      }
      const existingCodes = existingCodesMap.get(j) || [];
      const { code, name, stockConflict } = await generateCodeFromMatch(
        gr.name,
        gr.matched,
        gr.rowConfig,
        existingCodes.concat(savedCodes),
      );

      // 冲突判定优先级：存量（测点 / 已保存）> 本批次内前面的行
      let error: string | undefined;
      if (stockConflict) {
        error = `编码与存量重复：${stockConflict.code}（描述：${stockConflict.name || '无'}）`;
      } else {
        const owner = batchCodeOwner.get(code);
        if (owner !== undefined) {
          error = `编码与本次导入第 ${owner} 行重复：${code}`;
        }
      }
      // 所有生成的码都登记占位（含失败行），后续行撞上时才能指回第一处
      if (!batchCodeOwner.has(code)) batchCodeOwner.set(code, rowNo);

      resultByIndex[gr.origIdx] = {
        rowIndex: gr.origIdx,
        name,
        matched: gr.matched,
        allMatched: !error,
        generatedCode: { code, name, generateTime: new Date().toISOString() },
        ...(error ? { error } : {}),
      };
    } catch (err: any) {
      resultByIndex[gr.origIdx] = {
        rowIndex: gr.origIdx,
        name: gr.name || '',
        matched: gr.matched,
        allMatched: false,
        error: err.message || '生成失败',
      };
    }
  }

  return resultByIndex.filter((r): r is AutoCodeRowResult => r !== null);
}
