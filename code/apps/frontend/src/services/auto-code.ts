import api from './api';

export interface ImportRow {
  name: string;
  stationName?: string;
  secondClassName?: string;
  thirdClassName?: string;
  dataTypeName?: string;
  dataName?: string;
  projectLineCode?: string;
  [key: string]: any;
}

export interface AutoCodeConfig {
  typeCode: string;
  projectLineCode: string;
  prefixNo: string;
  firstClassCode: string;
}

export interface AutoMatchField {
  fieldKey: string;
  fieldLabel: string;
  sourceValue: string;
  matchedCode: string | null;
  matchedName: string | null;
  status: 'matched' | 'not_found' | 'empty';
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

export interface AutoCodeResponse {
  results: AutoCodeRowResult[];
  config: AutoCodeConfig;
}

/** 自动编码：匹配+生成（大数据量时使用较长超时） */
export async function autoGenerate(
  rows: ImportRow[],
  config: AutoCodeConfig,
): Promise<AutoCodeResponse> {
  const res = await api.post('/auto-code/generate', { rows, config }, { timeout: 600000 });
  return res.data;
}
