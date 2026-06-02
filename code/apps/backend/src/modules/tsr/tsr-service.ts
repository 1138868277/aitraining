import * as XLSX from 'xlsx';
import { createRequire } from 'module';
const { ZipArchive } = createRequire(import.meta.url)('archiver');
import * as domain from './tsr-domain.js';
import { getAllRuleSqls, getMergeConfig } from './sql-templates.js';

// ==================== 导入 ====================

/** 从 Excel Buffer 解析场站数据并导入 */
export async function importStationFromBuffer(area: string, buffer: Buffer): Promise<number> {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const s = domain.getCurrentSchema();
  const progressKey = `${s}:station`;

  // 兼容多种列名（"编码"/"组织机构编码"，"名称"/"组织机构编码名称"）
  // 调试：打印 Excel 列名
  if (rows[0]) {
    console.log('  [importStation] Excel 列名:', Object.keys(rows[0]));
  }
  // 兼容多种列名：编码列可选"组织机构编码"/"编码"，名称列可选"组织机构名称"/"组织机构编码名称"/"名称"/"场站名称"
  const codeKey = rows[0] && '组织机构编码' in rows[0] ? '组织机构编码' : '编码';
  const nameCandidates = ['组织机构名称', '组织机构编码名称', '名称', '场站名称'];
  const nameKey = nameCandidates.find(k => rows[0] && k in rows[0]) || '名称';
  console.log(`  [importStation] Excel 列名:`, Object.keys(rows[0]), `→ code="${codeKey}", name="${nameKey}"`);

  const stations = rows
    .filter(r => r[codeKey])
    .map(r => ({
      station_code: String(r[codeKey]).trim(),
      station_name: String(r[nameKey] || '').trim(),
    }))
    .filter(s => s.station_code);

  if (stations.length === 0) throw new Error('未找到有效的场站数据（需要"编码/组织机构编码"和"名称/组织机构编码名称"列）');

  domain.setProgress(progressKey, stations.length, 0, 'processing');
  await domain.batchInsertStations(area, stations, (done, total) => {
    domain.setProgress(progressKey, total, done, 'processing');
  }, progressKey);
  if (domain.getProgress(progressKey).status !== 'cancelled') {
    domain.setProgress(progressKey, stations.length, stations.length, 'completed');
  }
  return stations.length;
}

/** 从 Excel Buffer 解析测点数据并导入（支持多 Sheet，大文件分块处理） */
export async function importMeasureFromBuffer(area: string, buffer: Buffer): Promise<number> {
  console.log('  [importMeasure] 开始解析 Excel...');
  const wb = XLSX.read(buffer, { type: 'buffer' });
  console.log(`  [importMeasure] 解析完成, ${wb.SheetNames.length} 个 Sheet`);

  const allMeasures: { cd_code: string; cd_name: string }[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const ref = ws['!ref'];
    if (!ref) continue;

    const range = XLSX.utils.decode_range(ref);
    const totalDataRows = range.e.r; // row 0 is header
    console.log(`  [importMeasure] Sheet "${sheetName}": ${totalDataRows} 行数据`);

    // 读取表头行确定列索引
    const headerRow = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', range: 0 })[0] as string[];
    const idxCode = headerRow.indexOf('测点编码');
    const idxName = headerRow.indexOf('测点描述');
    if (idxCode === -1) continue; // 没有测点编码列，跳过该 Sheet

    // 分块处理数据行
    const CHUNK = 50000;
    for (let start = 1; start <= totalDataRows; start += CHUNK) {
      const end = Math.min(start + CHUNK - 1, totalDataRows);
      const chunkRange = XLSX.utils.encode_range({
        s: { r: start, c: range.s.c },
        e: { r: end, c: range.e.c },
      });
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1, defval: '', range: chunkRange,
      });

      for (const row of rows) {
        const code = String(row[idxCode] || '').trim();
        if (code) {
          allMeasures.push({
            cd_code: code,
            cd_name: String(row[idxName] || '').trim(),
          });
        }
      }
    }
  }

  console.log(`  [importMeasure] 有效测点总数: ${allMeasures.length}`);
  if (allMeasures.length === 0) throw new Error('未找到有效的测点数据（需要"测点编码"和"测点描述"列）');

  const s = domain.getCurrentSchema();
  const progressKey = `${s}:measure`;

  domain.setProgress(progressKey, allMeasures.length, 0, 'processing');
  console.log(`  [importMeasure] 开始批量写入, 每批 200 条...`);
  await domain.batchInsertMeasures(area, allMeasures, (done, total) => {
    domain.setProgress(progressKey, total, done, 'processing');
  }, progressKey);
  if (domain.getProgress(progressKey).status !== 'cancelled') {
    domain.setProgress(progressKey, allMeasures.length, allMeasures.length, 'completed');
    console.log(`  [importMeasure] 写入完成, 共 ${allMeasures.length} 条`);
  } else {
    console.log(`  [importMeasure] 写入已取消, 已导入 ${domain.getProgress(progressKey).done} 条`);
  }
  return allMeasures.length;
}

// ==================== 规则生成 ====================

export async function generateRules(area: string): Promise<{ total: number; details: { module: string; energy: string; type: string; rows: number; rules: number }[] }> {
  // 1. 清空导入表
  await domain.truncateImportTables(area);

  // 2. 并行执行所有 SQL
  const sqlDefs = getAllRuleSqls();
  const totalSteps = sqlDefs.length;
  let completedSteps = 0;

  const s = domain.getCurrentSchema();
  const progressKey = `${s}:generate`;
  domain.setProgress(progressKey, totalSteps, 0, 'processing');

  // 将 SQL 替换占位符
  const prepared = sqlDefs.map(def => ({
    ...def,
    sql: def.sql
      .replace(/__schema__/g, `"${s}"`)
      .replace(/__标准表__/g, `"${s}".tsr_standard_list`),
  }));

  // 串行执行，每步实时更新进度
  const details: { module: string; energy: string; type: string; rows: number; rules: number }[] = [];
  let totalRows = 0;
  let totalRules = 0;

  for (const def of prepared) {
    // 检查取消
    if (domain.isCancelRequested(progressKey)) {
      domain.setProgress(progressKey, totalSteps, completedSteps, 'cancelled');
      break;
    }

    // 标记当前正在执行的步骤
    domain.setGenerateStep({ module: def.module, energy: def.energy, ruleType: def.ruleType, status: 'running', rows: 0 });

    try {
      const { rowCount, rows } = await domain.executeSqlRaw(def.sql);
      const rules = new Set(rows.map((r: any) => r.standard_name)).size;
      totalRows += rowCount;
      totalRules += rules;
      details.push({ module: def.module, energy: def.energy, type: def.ruleType, rows: rowCount, rules });
      domain.setGenerateStep({ module: def.module, energy: def.energy, ruleType: def.ruleType, status: 'completed', rows: rowCount });
    } catch (err: any) {
      console.error(`[generateRules] SQL 执行失败: ${def.module}/${def.energy}/${def.ruleType}`, err.message);
      details.push({ module: def.module, energy: def.energy, type: def.ruleType, rows: 0, rules: 0 });
      domain.setGenerateStep({ module: def.module, energy: def.energy, ruleType: def.ruleType, status: 'error', rows: 0 });
    }

    completedSteps++;
    domain.setProgress(progressKey, totalSteps, completedSteps, 'processing');
  }

  const finalStatus = domain.getProgress(progressKey).status === 'cancelled' ? 'cancelled' : 'completed';
  domain.setProgress(progressKey, totalSteps, completedSteps, finalStatus);
  return { total: totalRows, details };
}

// ==================== 导出 Excel ====================

/**
 * 生成带层级合并单元格的 Excel 文件
 * 数据超过 maxRows 时自动拆分为多个文件
 */
export async function exportToExcel(
  area: string,
  ruleType: 'sz' | 'tb' | 'yx' | 'zd',
  maxRows: number = 150000,
): Promise<{ buffer: Buffer; name: string }[]> {
  const rows = await domain.queryExportList(area, ruleType);
  const config = getMergeConfig(ruleType);

  if (rows.length === 0) throw new Error(`未找到 ${ruleType} 类型的导出数据，请先生成规则`);

  const typeNames: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };
  const sheetName = typeNames[ruleType];
  const s = domain.getCurrentSchema();

  // 重命名列
  const renamedRows = rows.map(r => {
    const obj: Record<string, any> = {};
    for (const [key, val] of Object.entries(r)) {
      obj[config.headers[key] || key] = val;
    }
    return obj;
  });

  const headerKeys = config.mergeColumns.map(c => config.headers[c] || c);
  const allHeaders = Object.values(config.headers);
  const prefix = `${s}_时序稽核质量规则_${typeNames[ruleType]}`;

  function makeExcel(rowsChunk: Record<string, any>[]): Buffer {
    const ws = XLSX.utils.json_to_sheet(rowsChunk, { header: allHeaders });
    const merges = computeHierarchicalMerges(rowsChunk, headerKeys);
    clearMergedValues(ws, merges);
    ws['!merges'] = merges;
    ws['!cols'] = allHeaders.map(h => ({
      wch: Math.max(h.length * 2, 12),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true }) as Buffer;
  }

  const files: { buffer: Buffer; name: string }[] = [];

  if (renamedRows.length <= maxRows) {
    files.push({ buffer: makeExcel(renamedRows), name: `${prefix}.xlsx` });
  } else {
    let part = 1;
    for (let i = 0; i < renamedRows.length; i += maxRows) {
      const chunk = renamedRows.slice(i, i + maxRows);
      files.push({ buffer: makeExcel(chunk), name: `${prefix}_第${part}部分.xlsx` });
      part++;
    }
  }

  return files;
}

/**
 * 层级合并计算（从第2行开始，第1行是表头）
 * 按 mergeColumns 的顺序逐层合并
 */
function computeHierarchicalMerges(rows: Record<string, any>[], mergeColumns: string[]): XLSX.Range[] {
  if (rows.length === 0) return [];

  const merges: XLSX.Range[] = [];
  // 当前层级的区间列表，初始为整个数据范围
  let ranges: [number, number][] = [[2, rows.length + 1]]; // Excel 行号从1开始，数据从第2行

  for (const colKey of mergeColumns) {
    const colIdx = Object.keys(rows[0]).indexOf(colKey) + 1; // Excel 列号从1开始
    if (colIdx <= 0) continue;

    const newRanges: [number, number][] = [];

    for (const [startRow, endRow] of ranges) {
      if (startRow > endRow) continue;

      let subStart = startRow;
      let currentValue = rows[startRow - 2]?.[colKey];

      for (let row = startRow + 1; row <= endRow; row++) {
        if (rows[row - 2]?.[colKey] !== currentValue) {
          if (row - subStart > 1) {
            merges.push({ s: { r: subStart - 1, c: colIdx - 1 }, e: { r: row - 2, c: colIdx - 1 } });
          }
          newRanges.push([subStart, row - 1]);
          currentValue = rows[row - 2]?.[colKey];
          subStart = row;
        }
      }

      // 处理最后一个区间
      if (endRow - subStart >= 0) {
        if (endRow - subStart > 0) {
          merges.push({ s: { r: subStart - 1, c: colIdx - 1 }, e: { r: endRow - 1, c: colIdx - 1 } });
        }
        newRanges.push([subStart, endRow]);
      }
    }

    ranges = newRanges;
  }

  return merges;
}

/** 清除合并区域中非顶部单元格的值（xlsx 库的 !merges 不会自动清理，导致文件体积巨大） */
function clearMergedValues(ws: XLSX.WorkSheet, merges: XLSX.Range[]): void {
  for (const m of merges) {
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        // 跳过顶部单元格
        if (r === m.s.r && c === m.s.c) continue;
        delete ws[XLSX.utils.encode_cell({ r, c })];
      }
    }
  }
}

// ==================== 文件拆分 ====================

export interface SplitResult {
  fileCount: number;
  files: { index: number; rowCount: number }[];
}

export function splitExcelBuffer(buffer: Buffer, maxRows: number = 150000): { buffer: Buffer; name: string }[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });

  if (data.length <= 1) return []; // 只有表头或空
  if (data.length - 1 <= maxRows) return []; // 不需要拆分

  const header = data[0] as string[];
  const rows = data.slice(1);

  // 获取合并信息
  const merges = (ws['!merges'] || []) as XLSX.Range[];

  // 找 A 列（第一列）的合并范围
  const aMerges = merges.filter(m => m.s.c === 0 && m.e.c === 0);
  const mergedRanges: { start: number; end: number }[] = aMerges.map(m => ({
    start: m.s.r + 1, // 转回 1-based
    end: m.e.r + 1,
  }));
  mergedRanges.sort((a, b) => a.start - b.start);

  // 计算不可拆分块
  const blocks: { type: 'normal' | 'merged'; start: number; end: number; rowCount: number }[] = [];
  let currentRow = 1;

  for (const mr of mergedRanges) {
    if (currentRow < mr.start) {
      blocks.push({ type: 'normal', start: currentRow, end: mr.start - 1, rowCount: mr.start - currentRow });
    }
    blocks.push({ type: 'merged', start: mr.start, end: mr.end, rowCount: mr.end - mr.start + 1 });
    currentRow = mr.end + 1;
  }
  if (currentRow <= rows.length) {
    blocks.push({ type: 'normal', start: currentRow, end: rows.length, rowCount: rows.length - currentRow + 1 });
  }

  // 计算拆分点
  const splitPoints: { start: number; end: number }[] = [];
  let fileRows = 0;
  let fileStart = 1;

  for (const block of blocks) {
    if (fileRows + block.rowCount > maxRows) {
      splitPoints.push({ start: fileStart, end: block.start - 1 });
      fileStart = block.start;
      fileRows = block.rowCount;
    } else {
      fileRows += block.rowCount;
    }
  }
  splitPoints.push({ start: fileStart, end: rows.length });

  // 生成文件
  const results: { buffer: Buffer; name: string }[] = [];

  for (let i = 0; i < splitPoints.length; i++) {
    const { start, end } = splitPoints[i];
    const chunkRows = [header, ...rows.slice(start - 1, end)];

    const newWs = XLSX.utils.aoa_to_sheet(chunkRows as any[][]);

    // 追加合并信息
    const newMerges: XLSX.Range[] = [];
    for (const mr of mergedRanges) {
      if (mr.start >= start && mr.end <= end) {
        newMerges.push({
          s: { r: mr.start - start, c: 0 },
          e: { r: mr.end - start, c: 0 },
        });
      }
    }
    // 同步其他列的合并
    for (const m of merges) {
      if (m.s.c > 0 && m.e.c > 0) {
        const oneBasedStart = m.s.r + 1;
        const oneBasedEnd = m.e.r + 1;
        if (oneBasedStart >= start && oneBasedEnd <= end) {
          newMerges.push({
            s: { r: m.s.r - start + 1, c: m.s.c },
            e: { r: m.e.r - start + 1, c: m.e.c },
          });
        }
      }
    }
    newWs['!merges'] = newMerges;

    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, sheetName);

    const buf = XLSX.write(newWb, { type: 'buffer', bookType: 'xlsx', compression: true });
    results.push({ buffer: buf, name: `split_${i + 1}.xlsx` });
  }

  return results;
}

// ==================== ZIP 打包导出 ====================

const typeFolderNames: Record<string, string> = { sz: '01 死值', tb: '02 跳变', yx: '03 越限', zd: '04 中断' };

/** 生成单个规则类型的 ZIP（含时序规则结果/01 死值/split_N.xlsx 结构） */
export async function exportSingleToZip(
  area: string,
  ruleType: 'sz' | 'tb' | 'yx' | 'zd',
  maxRows: number = 150000,
): Promise<{ buffer: Buffer; name: string }> {
  const files = await exportToExcel(area, ruleType, maxRows);

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const buffers: Buffer[] = [];
  archive.on('data', (d: Buffer) => buffers.push(d));

  return new Promise((resolve, reject) => {
    archive.on('end', () => resolve({ buffer: Buffer.concat(buffers), name: `${typeFolderNames[ruleType]}.zip` }));
    archive.on('error', reject);

    const folder = `时序规则结果/${typeFolderNames[ruleType]}`;
    files.forEach((f, i) => {
      archive.append(f.buffer, { name: `${folder}/split_${i + 1}.xlsx` });
    });

    archive.finalize();
  });
}

// 与 Z2-Z5 完全一致的字段、表头和合并列配置
const overallConfig: Record<string, { fields: string[]; headers: Record<string, string>; mergeCols: string[] }> = {
  sz: {
    fields: ['standard_name', 'sz_threshold', 'sz_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
    headers: { standard_name: '标准化名称', sz_threshold: '方差阈值', sz_windows: '窗口大小(秒)', sliding_step: '滑动步长(秒)', begin_time: '生效开始时间', end_time: '生效结束时间', measure_name: '描述', cd_code: '组合31位码' },
    mergeCols: ['standard_name', 'sz_threshold', 'sz_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name'],
  },
  tb: {
    fields: ['standard_name', 'tb_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'k_coefficient', 'cd_code'],
    headers: { standard_name: '标准化名称', tb_windows: '窗口大小(秒)', sliding_step: '滑动步长(秒)', begin_time: '生效开始时间', end_time: '生效结束时间', measure_name: '描述', k_coefficient: 'K值', cd_code: '组合31位码' },
    mergeCols: ['standard_name', 'tb_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'k_coefficient'],
  },
  yx: {
    fields: ['standard_name', 'lower_range', 'upper_range', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
    headers: { standard_name: '标准化名称', lower_range: '下限', upper_range: '上限', begin_time: '生效开始时间', end_time: '生效结束时间', measure_name: '描述', cd_code: '组合31位码' },
    mergeCols: ['standard_name', 'lower_range', 'upper_range', 'begin_time', 'end_time', 'measure_name'],
  },
  zd: {
    fields: ['standard_name', 'zd_duration', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
    headers: { standard_name: '标准化名称', zd_duration: '中断时长(分钟)', begin_time: '生效开始时间', end_time: '生效结束时间', measure_name: '描述', cd_code: '组合31位码' },
    mergeCols: ['standard_name', 'zd_duration', 'begin_time', 'end_time', 'measure_name'],
  },
};

const typeNames: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };

/** 生成单个规则类型的总体 Excel 文件 buffer（完整单文件，不分片） */
async function makeOverallExcel(area: string, type: 'sz' | 'tb' | 'yx' | 'zd'): Promise<Buffer | null> {
  const rawRows = await domain.queryExportList(area, type);
  if (rawRows.length === 0) return null;

  const cfg = overallConfig[type];
  const headerOrder = cfg.fields.map(f => cfg.headers[f]);

  const renamedRows = rawRows.map(r => {
    const obj: Record<string, any> = {};
    for (const field of cfg.fields) {
      obj[cfg.headers[field]] = (r as any)[field];
    }
    return obj;
  });

  const mergeHeaderKeys = cfg.mergeCols.map(c => cfg.headers[c]);

  const ws = XLSX.utils.json_to_sheet(renamedRows, { header: headerOrder });
  const merges = computeHierarchicalMerges(renamedRows, mergeHeaderKeys);
  clearMergedValues(ws, merges);
  ws['!merges'] = merges;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, typeNames[type]);

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true }) as Buffer;
}

/** 导出单个规则类型的总体 Excel 文件 */
export async function exportSingleOverallToExcel(area: string, type: 'sz' | 'tb' | 'yx' | 'zd'): Promise<{ buffer: Buffer; name: string }> {
  const s = domain.getCurrentSchema();
  const buffer = await makeOverallExcel(area, type);
  if (!buffer) throw new Error(`未找到 ${typeNames[type]} 类型的导出数据`);
  return { buffer, name: `${s}_时序稽核质量规则_${typeNames[type]}.xlsx` };
}

/** 导出全部4种规则类型的总体文件 ZIP（00 总体/，类似 Z2-Z5 的完整单文件导出，不分片）
 *  注意：与 Z2-Z5 一致，不包含 module_source、energy_type 列 */
export async function exportOverallToZip(area: string): Promise<Buffer> {
  const s = domain.getCurrentSchema();

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const buffers: Buffer[] = [];
  archive.on('data', (d: Buffer) => buffers.push(d));

  return new Promise<Buffer>(async (resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(buffers)));
    archive.on('error', reject);

    for (const type of ['sz', 'tb', 'yx', 'zd'] as const) {
      try {
        const buffer = await makeOverallExcel(area, type);
        if (!buffer) continue;
        const filename = `${s}_时序稽核质量规则_${typeNames[type]}.xlsx`;
        archive.append(buffer, { name: `时序规则结果/00 总体/${filename}` });
      } catch {
        // 该类型无数据时跳过
      }
    }

    await archive.finalize();
  });
}

/** 打包全部规则为单个 ZIP */
export async function exportAllToZip(area: string, maxRows: number = 150000): Promise<Buffer> {
  const ruleTypes = ['sz', 'tb', 'yx', 'zd'] as const;

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const buffers: Buffer[] = [];
  archive.on('data', (d: Buffer) => buffers.push(d));

  return new Promise<Buffer>(async (resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(buffers)));
    archive.on('error', reject);

    for (const type of ruleTypes) {
      try {
        const files = await exportToExcel(area, type, maxRows);
        const folder = `时序规则结果/${typeFolderNames[type]}`;
        files.forEach((f, i) => {
          archive.append(f.buffer, { name: `${folder}/split_${i + 1}.xlsx` });
        });
      } catch {
        // 该类型无数据时跳过
      }
    }

    await archive.finalize();
  });
}

// ==================== 分批导出（Z7 逻辑） ====================

/** 各类型同步列配置（1-based，与 Z7 完全一致） */
const splitSyncColumns: Record<string, number[]> = {
  sz: [2, 3, 4, 5, 6, 7],  // B~G
  tb: [2, 3, 4, 5, 6, 7],     // B~G
  yx: [2, 3, 4, 5, 6],     // B~F
  zd: [2, 3, 4, 5],        // B~E
};

/**
 * 核心拆分逻辑：读取总体 Excel，按 Z7 逻辑拆分为多个 XLSX buffer
 */
async function splitExcelIntoSheets(
  area: string,
  type: 'sz' | 'tb' | 'yx' | 'zd',
  maxRows: number = 175000,
): Promise<{ buffer: Buffer; name: string }[]> {
  const fullBuffer = await makeOverallExcel(area, type);
  if (!fullBuffer) throw new Error(`未找到 ${typeNames[type]} 类型的导出数据`);

  const wb = XLSX.read(fullBuffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const allData: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });
  if (allData.length <= 1) throw new Error('数据为空');

  const header = allData[0] as string[];
  const rows = allData.slice(1);
  const totalRows = rows.length;

  // 提取 A 列合并范围
  const merges = (ws['!merges'] || []) as XLSX.Range[];
  const aMerges = merges
    .filter(m => m.s.c === 0 && m.e.c === 0)
    .map(m => ({ start: m.s.r + 1, end: m.e.r + 1 }))
    .sort((a, b) => a.start - b.start);

  // 构建不可拆分块
  const blocks: { type: 'normal' | 'merged'; start: number; end: number; rowCount: number }[] = [];
  let currentRow = 1;
  for (const mr of aMerges) {
    if (currentRow < mr.start) {
      blocks.push({ type: 'normal', start: currentRow, end: mr.start - 1, rowCount: mr.start - currentRow });
    }
    blocks.push({ type: 'merged', start: mr.start, end: mr.end, rowCount: mr.end - mr.start + 1 });
    currentRow = mr.end + 1;
  }
  if (currentRow <= totalRows) {
    blocks.push({ type: 'normal', start: currentRow, end: totalRows, rowCount: totalRows - currentRow + 1 });
  }

  // 计算拆分断点
  const splitPoints: { start: number; end: number }[] = [];
  let fileRows = 0;
  let fileStart = 1;
  for (const block of blocks) {
    if (fileRows + block.rowCount > maxRows) {
      splitPoints.push({ start: fileStart, end: block.start - 1 });
      fileStart = block.start;
      fileRows = block.rowCount;
    } else {
      fileRows += block.rowCount;
    }
  }
  splitPoints.push({ start: fileStart, end: totalRows });

  // 生成分片文件
  const syncCols = splitSyncColumns[type] || [];
  const sheets: { buffer: Buffer; name: string }[] = [];

  for (let i = 0; i < splitPoints.length; i++) {
    const { start, end } = splitPoints[i];
    const chunkRows = [header, ...rows.slice(start - 1, end)];
    const newWs = XLSX.utils.aoa_to_sheet(chunkRows as any[][]);

    const newMerges: XLSX.Range[] = [];
    const mergedInChunk = aMerges.filter(m => m.start >= start && m.end <= end);
    for (const m of mergedInChunk) {
      newMerges.push({ s: { r: m.start - start, c: 0 }, e: { r: m.end - start, c: 0 } });
    }
    for (const col of syncCols) {
      for (const m of mergedInChunk) {
        newMerges.push({ s: { r: m.start - start, c: col - 1 }, e: { r: m.end - start, c: col - 1 } });
      }
    }
    newWs['!merges'] = newMerges;
    clearMergedValues(newWs, newMerges);

    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, typeNames[type]);
    const buf = XLSX.write(newWb, { type: 'buffer', bookType: 'xlsx', compression: true }) as Buffer;
    sheets.push({ buffer: buf, name: `split_${i + 1}.xlsx` });
  }

  return sheets;
}

/**
 * 导出单个规则类型的分批拆分 ZIP（内含 split_N.xlsx）
 */
export async function exportSplitToZip(
  area: string,
  type: 'sz' | 'tb' | 'yx' | 'zd',
  maxRows: number = 175000,
): Promise<{ buffer: Buffer; name: string }> {
  const sheets = await splitExcelIntoSheets(area, type, maxRows);

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const zipBuffers: Buffer[] = [];
  archive.on('data', (d: Buffer) => zipBuffers.push(d));

  return new Promise<Buffer>((resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(zipBuffers)));
    archive.on('error', reject);

    const folder = `时序规则结果/${typeFolderNames[type]}`;
    sheets.forEach(f => archive.append(f.buffer, { name: `${folder}/${f.name}` }));
    archive.finalize();
  }).then(buffer => {
    const s = domain.getCurrentSchema();
    return { buffer, name: `${s}_时序稽核质量规则_${typeNames[type]}_分批.zip` };
  });
}

/**
 * 分批导出全部4种规则类型（每个类型一个多 Sheet XLSX，打包为 ZIP）
 */
export async function exportAllSplitToZip(area: string, maxRows: number = 175000): Promise<Buffer> {
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const zipBuffers: Buffer[] = [];
  archive.on('data', (d: Buffer) => zipBuffers.push(d));

  return new Promise<Buffer>(async (resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(zipBuffers)));
    archive.on('error', reject);

    for (const type of ['sz', 'tb', 'yx', 'zd'] as const) {
      try {
        const sheets = await splitExcelIntoSheets(area, type, maxRows);
        const folder = `时序规则结果/${typeFolderNames[type]}`;
        sheets.forEach(f => archive.append(f.buffer, { name: `${folder}/${f.name}` }));
      } catch {
        // 该类型无数据时跳过
      }
    }

    await archive.finalize();
  });
}


