import * as XLSX from 'xlsx';
import * as zlib from 'zlib';

/**
 * 兜底：SheetJS 社区版对超大单个 Sheet（如 100 万行）解析会失败，
 * 该 sheet 只出现在 wb.SheetNames 但不出现在 wb.Sheets。
 * 此时用 Node zlib 直接解包 xlsx，按行抽取"测点编码 / 测点描述"两列。
 * 前提：文本单元格为 inlineStr（<is><t>）或共享字符串 t="s"、数字 t="n"。
 */

interface ZipEntryInfo { name: string; method: number; csize: number; usize: number; lho: number; }

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c; }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function readZipEntries(buf: Buffer): ZipEntryInfo[] {
  const EOCD = 0x06054b50;
  let eocd = -1;
  const min = Math.max(0, buf.length - 65558);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('无法定位 zip 中央目录');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const out: ZipEntryInfo[] = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const usize = buf.readUInt32LE(off + 24);
    const nlen = buf.readUInt16LE(off + 28);
    const elen = buf.readUInt16LE(off + 30);
    const clen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nlen);
    out.push({ name, method, csize, usize, lho });
    off += 46 + nlen + elen + clen;
  }
  return out;
}

function inflateEntry(buf: Buffer, e: ZipEntryInfo): Buffer {
  const nlen = buf.readUInt16LE(e.lho + 26);
  const elen = buf.readUInt16LE(e.lho + 28);
  const start = e.lho + 30 + nlen + elen;
  const comp = buf.subarray(start, start + e.csize);
  if (e.method === 0) return Buffer.from(comp);
  if (e.method === 8) return zlib.inflateRawSync(comp, { maxOutputLength: e.usize || undefined });
  throw new Error(`暂不支持的压缩方式 method=${e.method}（entry=${e.name}）`);
}

/** 重打包为不压缩(store)的 zip，便于 SheetJS 读取 */
function writeStoredZip(entries: Array<{ name: string; data: Buffer }>): Buffer {
  let total = 22;
  const items = entries.map(({ name, data }) => {
    const nb = Buffer.from(name, 'utf8');
    total += 30 + nb.length + data.length + 46 + nb.length;
    return { nb, data };
  });
  const out = Buffer.alloc(total);
  let p = 0;
  const cents: Array<{ it: { nb: Buffer; data: Buffer }; lho: number }> = [];
  for (const it of items) {
    const lho = p;
    out.writeUInt32LE(0x04034b50, p); p += 4;
    out.writeUInt16LE(20, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt32LE(crc32(it.data), p); p += 4;
    out.writeUInt32LE(it.data.length, p); p += 4;
    out.writeUInt32LE(it.data.length, p); p += 4;
    out.writeUInt16LE(it.nb.length, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    it.nb.copy(out, p); p += it.nb.length;
    it.data.copy(out, p); p += it.data.length;
    cents.push({ it, lho });
  }
  const cdStart = p;
  for (const { it, lho } of cents) {
    out.writeUInt32LE(0x02014b50, p); p += 4;
    out.writeUInt16LE(20, p); p += 2;
    out.writeUInt16LE(20, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt32LE(crc32(it.data), p); p += 4;
    out.writeUInt32LE(it.data.length, p); p += 4;
    out.writeUInt32LE(it.data.length, p); p += 4;
    out.writeUInt16LE(it.nb.length, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt16LE(0, p); p += 2;
    out.writeUInt32LE(0, p); p += 4;
    out.writeUInt32LE(lho, p); p += 4;
    it.nb.copy(out, p); p += it.nb.length;
  }
  const cdSize = p - cdStart;
  out.writeUInt32LE(0x06054b50, p); p += 4;
  out.writeUInt16LE(0, p); p += 2;
  out.writeUInt16LE(0, p); p += 2;
  out.writeUInt16LE(cents.length, p); p += 2;
  out.writeUInt16LE(cents.length, p); p += 2;
  out.writeUInt32LE(cdSize, p); p += 4;
  out.writeUInt32LE(cdStart, p); p += 4;
  out.writeUInt16LE(0, p); p += 2;
  return out;
}

function getEntry(entries: ZipEntryInfo[], path: string): ZipEntryInfo | null {
  return entries.find(e => e.name === path || e.name === '/' + path) || null;
}

function xmlUnescape(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** 读取某个 entry 的共享字符串表（若存在） */
function loadSharedStrings(entries: ZipEntryInfo[], buf: Buffer): string[] | null {
  const e = getEntry(entries, 'xl/sharedStrings.xml');
  if (!e) return null;
  const xml = inflateEntry(buf, e).toString('utf8');
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = siRe.exec(xml))) {
    let txt = '';
    let tm: RegExpExecArray | null;
    const local = new RegExp(tRe.source, tRe.flags);
    while ((tm = local.exec(m[1]))) txt += xmlUnescape(tm[1]);
    out.push(txt);
  }
  return out;
}

function cellText(cell: string, shared: string[] | null): string {
  if (/t="s"/.test(cell)) {
    const v = cell.match(/<v>(\d+)<\/v>/);
    if (!v) return '';
    const idx = parseInt(v[1], 10);
    return shared && shared[idx] != null ? shared[idx] : v[1];
  }
  if (/<is>/.test(cell)) {
    let txt = '';
    const re = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(cell))) txt += xmlUnescape(m[1]);
    return txt;
  }
  const v = cell.match(/<v>([\s\S]*?)<\/v>/);
  return v ? xmlUnescape(v[1]) : '';
}

/** 从行 XML 片段取某列的值 */
function rowCellValue(row: string, colLetter: string, shared: string[] | null): string {
  const start = row.indexOf(`<c r="${colLetter}`);
  if (start === -1) return '';
  const next = row.indexOf('<c r="', start + 1);
  const cell = next === -1 ? row.slice(start) : row.slice(start, next);
  return cellText(cell, shared).trim();
}

export interface MissingSheetRow { cd_code: string; cd_name: string; }

/**
 * 找出 SheetJS 能正常读出哪些 sheet，返回缺失（读不出）的 sheet 名列表。
 */
export function findMissingSheets(fileBuffer: Buffer): { sheetNames: string[]; missing: string[] } {
  const wb = XLSX.read(fileBuffer, { type: 'buffer', sheetRows: 1 });
  const keys = new Set(Object.keys(wb.Sheets));
  const missing = wb.SheetNames.filter(n => !keys.has(n));
  return { sheetNames: wb.SheetNames.slice(), missing };
}

/** 把一个缺失 sheet（含名字）按列抽取出来 */
export function extractSheetRowsByColumns(
  fileBuffer: Buffer,
  sheetName: string,
  codeHeader = '测点编码',
  nameHeader = '测点描述',
  maxRows?: number,
): { rows: MissingSheetRow[]; part: string; reason: string } {
  const entries = readZipEntries(fileBuffer);

  // sheet 名 → worksheet part
  const wbEntry = getEntry(entries, 'xl/workbook.xml');
  const relsEntry = getEntry(entries, 'xl/_rels/workbook.xml.rels');
  if (!wbEntry || !relsEntry) throw new Error('不是标准 xlsx 文件');
  const wbXml = inflateEntry(fileBuffer, wbEntry).toString('utf8');
  const relsXml = inflateEntry(fileBuffer, relsEntry).toString('utf8');

  const ridOf: Record<string, string> = {};
  const reSheet = /<sheet\b[^>]*name="([^"]*)"[^>]*r:id="([^"]+)"/g;
  let sm: RegExpExecArray | null;
  while ((sm = reSheet.exec(wbXml))) ridOf[sm[1]] = sm[2];
  const rid = ridOf[sheetName];
  if (!rid) throw new Error(`sheet "${sheetName}" 在 workbook.xml 中不存在`);

  const reRel = new RegExp(`<Relationship[^>]*Id="${rid}"[^>]*Target="([^"]+)"`, '');
  const rm = relsXml.match(reRel);
  if (!rm) throw new Error(`找不到 sheet "${sheetName}" 的关系`);
  const target = rm[1];
  const part = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\//, '')}`;

  const shared = loadSharedStrings(entries, fileBuffer);

  // 抽取 sheet XML 的行（分段 Buffer，不整转字符串）
  const sheetXml = inflateEntry(fileBuffer, getEntry(entries, part)!);
  const sheetDataTag = Buffer.from('<sheetData>');
  const rowStartTag = Buffer.from('<row ');
  const rowEndTag = Buffer.from('</row>');

  let cursor = sheetXml.indexOf(sheetDataTag);
  if (cursor === -1) throw new Error(`sheet "${sheetName}" 缺少 sheetData`);
  cursor += sheetDataTag.length;

  const rows: MissingSheetRow[] = [];
  let codeLetter = '';
  let nameLetter = '';
  let headerDone = false;
  let scanned = 0;

  for (;;) {
    const rs = sheetXml.indexOf(rowStartTag, cursor);
    if (rs === -1) break;
    const re_ = sheetXml.indexOf(rowEndTag, rs);
    if (re_ === -1) break;
    const row = sheetXml.toString('utf8', rs, re_ + rowEndTag.length);
    cursor = re_ + rowEndTag.length;
    scanned++;

    if (!headerDone) {
      // 通用定位表头：按单元格文本匹配（支持 inlineStr / 共享字符串 / 标题行在上方）
      const cells = rowCells(row, shared);
      for (const c of cells) {
        if (!codeLetter && c.text === codeHeader) codeLetter = c.letter;
        if (!nameLetter && c.text === nameHeader) nameLetter = c.letter;
      }
      if (codeLetter && nameLetter) { headerDone = true; continue; }
      if (scanned > 50) throw new Error(`sheet "${sheetName}" 前50行未找到表头"${codeHeader}/${nameHeader}"`);
      continue;
    }

    const code = rowCellValue(row, codeLetter, shared);
    if (code) {
      rows.push({ cd_code: code, cd_name: rowCellValue(row, nameLetter, shared) });
      if (maxRows && rows.length >= maxRows) break;
    }
  }

  return { rows, part, reason: `超大Sheet(${rows.length}行)已直读` };
}

/** 解析一行 XML 的所有单元格：列字母 + 文本 */
function rowCells(row: string, shared: string[] | null): Array<{ letter: string; text: string }> {
  const out: Array<{ letter: string; text: string }> = [];
  let i = 0;
  for (;;) {
    const st = row.indexOf('<c ', i);
    if (st === -1) break;
    const nr = row.indexOf('r="', st);
    const letter = nr === -1 ? '' : /^[A-Z]+/.exec(row.slice(nr + 3))?.[0] || '';
    const next = row.indexOf('<c ', st + 1);
    const seg = next === -1 ? row.slice(st) : row.slice(st, next);
    out.push({ letter, text: cellText(seg, shared) });
    i = next === -1 ? row.length : next;
  }
  return out;
}

/** 若存在读不出的 sheet，返回可用版本（整包重打包为 store） */
export function rezipWorkbook(fileBuffer: Buffer): Buffer {
  const entries = readZipEntries(fileBuffer);
  const list = entries
    .map(e => ({ name: e.name, data: inflateEntry(fileBuffer, e) }))
    .filter(x => !x.name.endsWith('/'));
  return writeStoredZip(list);
}
