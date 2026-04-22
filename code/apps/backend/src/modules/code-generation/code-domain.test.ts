import { describe, expect, it } from 'vitest';
import { generateCodeFromConditions, isValidCodeFormat, parseCode } from './code-domain.js';
import type { GenerateCodeRequest } from '@cec/contracts';

const mockConditions: GenerateCodeRequest = {
  stationCode: 'YN01',
  typeCode: '01',
  projectLineCode: '001',
  prefixNo: 'A',
  firstClassCode: '01',
  secondClassCode: '001',
  secondExtCode: '0001',
  thirdClassCode: '001',
  thirdExtCode: '0001',
  dataTypeCode: '01',
  dataCode: '001',
};

describe('generateCodeFromConditions', () => {
  it('generates 31-character code', () => {
    const code = generateCodeFromConditions(mockConditions);
    expect(code).toHaveLength(31);
  });

  it('generates correct segments', () => {
    const code = generateCodeFromConditions(mockConditions);
    expect(code.substring(0, 4)).toBe('YN01');
    expect(code.substring(4, 6)).toBe('01');
    expect(code.substring(6, 9)).toBe('001');
    expect(code.substring(9, 10)).toBe('A');
  });
});

describe('isValidCodeFormat', () => {
  it('accepts valid 31-char alphanumeric code', () => {
    expect(isValidCodeFormat('A'.repeat(31))).toBe(true);
    expect(isValidCodeFormat('1'.repeat(31))).toBe(true);
  });

  it('rejects code with special characters', () => {
    expect(isValidCodeFormat('A'.repeat(30) + '-')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidCodeFormat('ABC')).toBe(false);
    expect(isValidCodeFormat('A'.repeat(32))).toBe(false);
  });
});

describe('parseCode', () => {
  it('parses valid code into 11 segments', () => {
    const code = generateCodeFromConditions(mockConditions);
    const segments = parseCode(code);
    expect(segments).toHaveLength(11);
    expect(segments[0]).toBe('YN01');
    expect(segments[1]).toBe('01');
  });

  it('returns empty array for invalid code', () => {
    expect(parseCode('abc')).toEqual([]);
  });
});
