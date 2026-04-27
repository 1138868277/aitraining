import * as domain from './statistics-domain.js';
import type { ImportTask } from './statistics-domain.js';

// ========== 1. 编码生成统计 ==========

export const getCodeGenOverview = domain.getCodeGenOverview;
export const getCodeGenByDimension = domain.getCodeGenByDimension;
export const getCodeGenTrend = domain.getCodeGenTrend;

// ========== 2. 编码字典统计 ==========

export const getDictOverview = domain.getDictOverview;
export const getDictNewAddition = domain.getDictNewAddition;
export const getDictTypeDomainDist = domain.getDictTypeDomainDist;

// ========== 3. 全量测点统计 ==========

export const importMeasurementFile = domain.importMeasurementFile;
export const getImportStatus = domain.getImportStatus;
export type { ImportTask } from './statistics-domain.js';
export const getMeasureOverview = domain.getMeasureOverview;
export const getMeasureByDimension = domain.getMeasureByDimension;
export const getMeasureDrillDown = domain.getMeasureDrillDown;
export const clearMeasurementData = domain.clearMeasurementData;
