import * as XLSX from 'xlsx';
import * as domain from './tsr-domain.js';
import { getAllRuleSqls, getMergeConfig } from './sql-templates.js';

// ==================== 导入 ====================

/** 从 Excel Buffer 解析场站数据并导入 */
export async function importStationFromBuffer(area: string, buffer: Buffer): Promise<number> {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const stations = rows
    .filter(r => r['编码'])
    .map(r => ({
      station_code: String(r['编码']).trim(),
      station_name: String(r['名称'] || '').trim(),
    }))
    .filter(s => s.station_code);

  if (stations.length === 0) throw new Error('未找到有效的场站数据（需要"编码"和"名称"列）');

  await domain.batchInsertStations(area, stations);
  return stations.length;
}

/** 从 Excel Buffer 解析测点数据并导入 */
export async function importMeasureFromBuffer(area: string, buffer: Buffer): Promise<number> {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const measures = rows
    .filter(r => r['测点编码'])
    .map(r => ({
      cd_code: String(r['测点编码']).trim(),
      cd_name: String(r['测点描述'] || '').trim(),
    }))
    .filter(m => m.cd_code);

  if (measures.length === 0) throw new Error('未找到有效的测点数据（需要"测点编码"和"测点描述"列）');

  await domain.batchInsertMeasures(area, measures);
  return measures.length;
}

// ==================== 规则生成 ====================

export async function generateRules(area: string): Promise<{ total: number; details: { module: string; energy: string; type: string; rows: number }[] }> {
  // 1. 清空导入表
  await domain.truncateImportTables(area);

  // 2. 执行所有 SQL
  const sqlDefs = getAllRuleSqls();
  const details: { module: string; energy: string; type: string; rows: number }[] = [];
  let total = 0;

  for (const def of sqlDefs) {
    const rows = await domain.executeSqlInSchema(area, def.sql);
    total += rows;
    details.push({ module: def.module, energy: def.energy, type: def.ruleType, rows });
  }

  // 3. 统计各类型总行数
  return { total, details };
}

// ==================== 导出 Excel ====================

/**
 * 生成带层级合并单元格的 Excel 文件
 */
export async function exportToExcel(area: string, ruleType: 'sz' | 'tb' | 'yx' | 'zd'): Promise<Buffer> {
  const rows = await domain.queryExportList(area, ruleType);
  const config = getMergeConfig(ruleType);

  if (rows.length === 0) throw new Error(`未找到 ${ruleType} 类型的导出数据，请先生成规则`);

  // 1. 用自定义表头名构建数据
  const typeNames: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };
  const sheetName = typeNames[ruleType];

  // 重命名列
  const renamedRows = rows.map(r => {
    const obj: Record<string, any> = {};
    for (const [key, val] of Object.entries(r)) {
      obj[config.headers[key] || key] = val;
    }
    return obj;
  });

  // 2. 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(renamedRows, { header: Object.values(config.headers) });

  // 3. 计算合并范围 (层级合并)
  const headerKeys = config.mergeColumns.map(c => config.headers[c] || c);
  const merges = computeHierarchicalMerges(renamedRows, headerKeys);

  // 应用合并
  if (ws['!merges']) {
    ws['!merges'] = [...ws['!merges'], ...merges];
  } else {
    ws['!merges'] = merges;
  }

  // 4. 设置列宽
  ws['!cols'] = Object.values(config.headers).map(h => ({
    wch: Math.max(h.length * 2, 12),
  }));

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 5. 输出 buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
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
      const currentValue = rows[startRow - 2]?.[colKey];

      for (let row = startRow + 1; row <= endRow; row++) {
        if (rows[row - 2]?.[colKey] !== currentValue) {
          if (row - subStart > 1) {
            merges.push({ s: { r: subStart - 1, c: colIdx - 1 }, e: { r: row - 2, c: colIdx - 1 } });
          }
          newRanges.push([subStart, row - 1]);
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

    const newWs = XLSX.utils.aoa_to_sheet(chunkRows);

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

    const buf = XLSX.write(newWb, { type: 'buffer', bookType: 'xlsx' });
    results.push({ buffer: buf, name: `split_${i + 1}.xlsx` });
  }

  return results;
}

/** 获取区域内各表的数据概览 */
export async function getOverview(area: string) {
  const schema = domain.schemaName(area);

  const tables = [
    { key: 'station', table: 'dim_station' },
    { key: 'measure', table: 'measure_data' },
    { key: 'sz', table: 'import_list_sz' },
    { key: 'tb', table: 'import_list_tb' },
    { key: 'yx', table: 'import_list_yx' },
    { key: 'zd', table: 'import_list_zd' },
  ];

  const result: Record<string, number> = {};
  const p = domain.getTsrPool();
  for (const t of tables) {
    try {
      const q = await p.query(`SELECT COUNT(*) AS cnt FROM "${schema}".${t.table}`);
      result[t.key] = parseInt(q.rows[0].cnt, 10);
    } catch {
      result[t.key] = -1;
    }
  }
  return result;
}
