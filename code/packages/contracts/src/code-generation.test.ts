import { describe, expect, it } from 'vitest';
import { generateCodeRequestSchema, batchGenerateCodeRequestSchema } from './code-generation.js';

describe('generateCodeRequestSchema', () => {
  it('accepts valid request', () => {
    const result = generateCodeRequestSchema.parse({
      stationCode: 'YN01',
      typeCode: '01',
      projectLineCode: '001',
      prefixNo: 'A',
      firstClassCode: '01',
      secondClassCode: '001',
      secondExtCode: '0001',
      thirdClassCode: '001',
      thirdExtCode: '0001',
    });
    expect(result.stationCode).toBe('YN01');
    expect(result.dataTypeCode).toBe('00');
    expect(result.dataCode).toBe('000');
  });

  it('rejects invalid station code length', () => {
    expect(() =>
      generateCodeRequestSchema.parse({
        stationCode: 'YN0',
        typeCode: '01',
        projectLineCode: '001',
        prefixNo: 'A',
        firstClassCode: '01',
        secondClassCode: '001',
        secondExtCode: '0001',
        thirdClassCode: '001',
        thirdExtCode: '0001',
      }),
    ).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() =>
      generateCodeRequestSchema.parse({
        stationCode: 'YN01',
      }),
    ).toThrow();
  });
});

describe('batchGenerateCodeRequestSchema', () => {
  it('rejects empty conditions array', () => {
    expect(() =>
      batchGenerateCodeRequestSchema.parse({
        conditions: [],
      }),
    ).toThrow();
  });
});
