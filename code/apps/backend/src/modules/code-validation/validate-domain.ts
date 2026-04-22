import { stringSimilarity } from '@cec/shared';
import { parseCode, isValidCodeFormat } from '../code-generation/code-domain.js';

/** 校验单条编码 */
export function validateSingleCode(code: string, dictItems: Record<string, Set<string>>): {
  result: 'COMPLIANT' | 'ABNORMAL';
  errorReason?: string;
} {
  if (!isValidCodeFormat(code)) {
    return { result: 'ABNORMAL', errorReason: '编码格式不正确，必须为31位字母数字组合' };
  }

  const segments = parseCode(code);
  if (segments.length !== 11) {
    return { result: 'ABNORMAL', errorReason: '编码段数不正确' };
  }

  const segmentNames = [
    '场站编码', '类型编码', '项目期号编码', '前缀号',
    '一级类码', '二级类码', '二级类扩展码', '三级类码',
    '三级类扩展码', '数据类码', '数据码',
  ];

  for (let i = 0; i < segments.length; i++) {
    const dictKey = getDictKeyForSegment(i);
    const dictSet = dictItems[dictKey];
    if (dictSet && !dictSet.has(segments[i])) {
      return {
        result: 'ABNORMAL',
        errorReason: `${segmentNames[i]}"${segments[i]}"不在字典范围内`,
      };
    }
  }

  return { result: 'COMPLIANT' };
}

/** 获取纠错建议（编辑距离匹配） */
export function getCorrectionSuggestions(
  code: string,
  dictItems: Record<string, Array<{ code: string; name: string }>>,
): Array<{ code: string; name: string; similarity: number }> {
  const allCandidates: Array<{ code: string; name: string; similarity: number }> = [];

  for (const [, items] of Object.entries(dictItems)) {
    for (const item of items) {
      const sim = stringSimilarity(code, item.code);
      if (sim >= 0.6) {
        allCandidates.push({ ...item, similarity: sim });
      }
    }
  }

  allCandidates.sort((a, b) => b.similarity - a.similarity);
  return allCandidates.slice(0, 3);
}

function getDictKeyForSegment(segmentIndex: number): string {
  const keys = [
    'station', 'type', 'projectLine', 'prefix',
    'firstClass', 'secondClass', 'secondExt', 'thirdClass',
    'thirdExt', 'dataType', 'dataCode',
  ];
  return keys[segmentIndex] || 'unknown';
}
