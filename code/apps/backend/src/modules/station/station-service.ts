import * as stationDomain from './station-domain.js';
import { AppError } from '../../common/errors.js';
import { ErrorCode } from '@cec/contracts';

export async function listStation(pageNum: number, pageSize: number, keyword?: string) {
  return stationDomain.listStation(pageNum, pageSize, keyword);
}

export async function createStation(input: {
  stationCode: string;
  stationName: string;
  stationType?: string;
  managementDomain?: string;
  creator: string;
}) {
  const exists = await stationDomain.existsByCode(input.stationCode);
  if (exists) {
    throw new AppError(ErrorCode.DUPLICATE_SUBMISSION, `场站编码 ${input.stationCode} 已存在`);
  }
  return stationDomain.createStation(input);
}

export async function getStationDictWithType() {
  return stationDomain.getStationDictWithType();
}

export async function batchCreateStation(
  entries: Array<{
    stationCode: string;
    stationName: string;
    managementDomain?: string;
  }>,
  creator: string,
) {
  return stationDomain.batchCreateStation(entries, creator);
}

export async function updateStation(id: number, input: { stationName?: string; stationType?: string; managementDomain?: string; modifier: string }) {
  const station = await stationDomain.findById(id);
  if (!station) {
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, '场站不存在');
  }
  return stationDomain.updateStation(id, input);
}

export async function deleteStation(id: number, modifier: string) {
  const station = await stationDomain.findById(id);
  if (!station) {
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, '场站不存在');
  }
  return stationDomain.deleteStation(id, modifier);
}

export async function deleteAllStation(modifier: string) {
  return stationDomain.deleteAllStation(modifier);
}

export async function exportAllStation() {
  return stationDomain.listAllStation();
}
