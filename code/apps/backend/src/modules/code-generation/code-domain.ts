import type { GenerateCodeRequest } from '@cec/contracts';

/** 编码段定义 */
interface CodeSegment {
  value: string;
  length: number;
}

/** 解析扩展格式，如"5,3"返回["0005","0006","0007"] */
function parseExtendFormat(extendStr: string): string[] {
  // 如果是标准的4位编码，直接返回
  if (/^\d{4}$/.test(extendStr)) {
    return [extendStr];
  }

  // 尝试解析"从X开始拓展X条"格式，如"5,3"
  const match = extendStr.match(/^(\d+)\s*,\s*(\d+)$/);
  if (match) {
    const start = parseInt(match[1], 10);
    const count = parseInt(match[2], 10);
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push((start + i).toString().padStart(4, '0'));
    }
    return result;
  }

  // 默认返回原值，补齐4位
  return [extendStr.padStart(4, '0')];
}

/** 根据筛选条件生成31位编码（支持单条或批量） */
export function generateCodeFromConditions(conditions: GenerateCodeRequest): string | string[] {
  // 解析扩展格式
  const secondExtCodes = parseExtendFormat(conditions.secondExtCode);
  const thirdExtCodes = parseExtendFormat(conditions.thirdExtCode);

  // 如果两个扩展码都只有1个值，生成单条编码
  if (secondExtCodes.length === 1 && thirdExtCodes.length === 1) {
    const segments: CodeSegment[] = [
      { value: conditions.stationCode, length: 4 },
      { value: conditions.typeCode, length: 2 },
      { value: conditions.projectLineCode, length: 3 },
      { value: conditions.prefixNo, length: 1 },
      { value: conditions.firstClassCode, length: 2 },
      { value: conditions.secondClassCode, length: 3 },
      { value: secondExtCodes[0], length: 4 },
      { value: conditions.thirdClassCode, length: 3 },
      { value: thirdExtCodes[0], length: 4 },
      { value: conditions.dataTypeCode || '00', length: 2 },
      { value: conditions.dataCode || '000', length: 3 },
    ];

    return segments.map((s) => s.value.padEnd(s.length, '0')).join('');
  }

  // 否则生成多条编码（笛卡尔积）
  const results: string[] = [];
  for (const secondExt of secondExtCodes) {
    for (const thirdExt of thirdExtCodes) {
      const segments: CodeSegment[] = [
        { value: conditions.stationCode, length: 4 },
        { value: conditions.typeCode, length: 2 },
        { value: conditions.projectLineCode, length: 3 },
        { value: conditions.prefixNo, length: 1 },
        { value: conditions.firstClassCode, length: 2 },
        { value: conditions.secondClassCode, length: 3 },
        { value: secondExt, length: 4 },
        { value: conditions.thirdClassCode, length: 3 },
        { value: thirdExt, length: 4 },
        { value: conditions.dataTypeCode || '00', length: 2 },
        { value: conditions.dataCode || '000', length: 3 },
      ];

      results.push(segments.map((s) => s.value.padEnd(s.length, '0')).join(''));
    }
  }

  return results;
}

/** 拼接编码名称
 *
 * 格式：场站 + 二级类扩展码 + '号' + 二级类码 + 三级类扩展码 + '#' + 三级类码 + 数据码
 * - 二级类扩展码为0000时不展示扩展码和"号"
 * - 三级类扩展码为0000时不展示扩展码和"#"
 * - 数据编码去掉括号及括号中的内容
 */
export function generateCodeName(conditions: GenerateCodeRequest, dictNames: Record<string, string>): string | string[] {
  const secondExtCodes = parseExtendFormat(conditions.secondExtCode);
  const thirdExtCodes = parseExtendFormat(conditions.thirdExtCode);

  const stationName = dictNames.stationName || conditions.stationCode;
  const secondClassName = dictNames.secondClassName || conditions.secondClassCode;
  const thirdClassName = dictNames.thirdClassName || conditions.thirdClassCode;

  // 数据编码去掉括号及括号中的内容
  let dataName = dictNames.dataName || conditions.dataCode || '000';
  dataName = dataName.replace(/\([^)]*\)/g, '').trim();
  if (!dataName) dataName = conditions.dataCode || '000';

  const results: string[] = [];

  for (const secondExt of secondExtCodes) {
    const secondExtPart = secondExt === '0000' ? '' : `${parseInt(secondExt, 10)}号`;

    for (const thirdExt of thirdExtCodes) {
      const thirdExtPart = thirdExt === '0000' ? '' : `${parseInt(thirdExt, 10)}#`;

      results.push([stationName, secondExtPart, secondClassName, thirdExtPart, thirdClassName, dataName].join(''));
    }
  }

  return results.length === 1 ? results[0] : results;
}

/** 校验编码是否为31位且只包含字母和数字 */
export function isValidCodeFormat(code: string): boolean {
  return /^[A-Za-z0-9]{31}$/.test(code);
}

/** 解析31位编码为各段 */
export function parseCode(code: string): string[] {
  if (!isValidCodeFormat(code)) {
    return [];
  }
  return [
    code.substring(0, 4),
    code.substring(4, 6),
    code.substring(6, 9),
    code.substring(9, 10),
    code.substring(10, 12),
    code.substring(12, 15),
    code.substring(15, 19),
    code.substring(19, 22),
    code.substring(22, 26),
    code.substring(26, 28),
    code.substring(28, 31),
  ];
}
