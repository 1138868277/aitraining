import * as domain from './statistics-domain.js';
import type { ImportTask } from './statistics-domain.js';

// ========== 1. 编码生成统计 ==========

export const getCodeGenOverview = domain.getCodeGenOverview;
export const getCodeGenByDimension = domain.getCodeGenByDimension;
export const getCodeGenByType = domain.getCodeGenByType;
export const getCodeGenBySecondClass = domain.getCodeGenBySecondClass;
export const getCodeGenByStation = domain.getCodeGenByStation;
export const getCodeGenTrend = domain.getCodeGenTrend;
export const getCodeGenList = domain.getCodeGenList;
export const getCodeGenGroupDetail = domain.getCodeGenGroupDetail;
export const deleteCodeGenGroups = domain.deleteCodeGenGroups;

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
export const getMeasureBySecondClass = domain.getMeasureBySecondClass;
export const getMeasureByStation = domain.getMeasureByStation;
export const getMeasureList = domain.getMeasureList;
export const getMeasureFilterOptions = domain.getMeasureFilterOptions;
export const clearMeasurementData = domain.clearMeasurementData;
export const cancelImport = domain.cancelImport;
