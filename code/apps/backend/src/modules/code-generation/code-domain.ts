import type { GenerateCodeRequest } from '@cec/contracts';

/** 编码段定义 */
interface CodeSegment {
  value: string;
  length: number;
}

/** 根据筛选条件生成31位编码 */
export function generateCodeFromConditions(conditions: GenerateCodeRequest): string {
  const segments: CodeSegment[] = [
    { value: conditions.stationCode, length: 4 },
    { value: conditions.typeCode, length: 2 },
    { value: conditions.projectLineCode, length: 3 },
    { value: conditions.prefixNo, length: 1 },
    { value: conditions.firstClassCode, length: 2 },
    { value: conditions.secondClassCode, length: 3 },
    { value: conditions.secondExtCode, length: 4 },
    { value: conditions.thirdClassCode, length: 3 },
    { value: conditions.thirdExtCode, length: 4 },
    { value: conditions.dataTypeCode || '00', length: 2 },
    { value: conditions.dataCode || '000', length: 3 },
  ];

  return segments.map((s) => s.value.padEnd(s.length, '0')).join('');
}

/** 根据编码段名称拼接编码名称 */
export function generateCodeName(conditions: GenerateCodeRequest, dictNames: Record<string, string>): string {
  const parts = [
    dictNames.stationName || conditions.stationCode,
    dictNames.typeName || conditions.typeCode,
    dictNames.projectLineName || conditions.projectLineCode,
    dictNames.prefixName || conditions.prefixNo,
    dictNames.firstClassName || conditions.firstClassCode,
    dictNames.secondClassName || conditions.secondClassCode,
    dictNames.secondExtName || conditions.secondExtCode,
    dictNames.thirdClassName || conditions.thirdClassCode,
    dictNames.thirdExtName || conditions.thirdExtCode,
    dictNames.dataTypeName || conditions.dataTypeCode || '00',
    dictNames.dataName || conditions.dataCode || '000',
  ];
  return parts.join('-');
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
