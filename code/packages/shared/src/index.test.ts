import { describe, expect, it } from 'vitest';
import { levenshteinDistance, stringSimilarity, generateBatchNo, formatDateTime } from './index.js';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('returns correct distance for different strings', () => {
    expect(levenshteinDistance('hello', 'world')).toBe(4);
  });

  it('handles empty strings', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });
});

describe('stringSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringSimilarity('test', 'test')).toBe(1);
  });

  it('returns 0 for completely different strings', () => {
    expect(stringSimilarity('abc', 'xyz')).toBe(0);
  });
});

describe('generateBatchNo', () => {
  it('returns 14-character string', () => {
    const batchNo = generateBatchNo();
    expect(batchNo).toHaveLength(14);
  });

  it('contains only digits', () => {
    const batchNo = generateBatchNo();
    expect(/^\d+$/.test(batchNo)).toBe(true);
  });
});

describe('formatDateTime', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-01T12:00:00');
    const result = formatDateTime(date);
    expect(result).toBe('2025-01-01 12:00:00');
  });
});
