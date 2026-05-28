/**
 * 规则生成 SQL 模板
 * __schema__/__通用__ 会被替换为实际模式名
 */

export interface RuleSqlDef {
  module: string;       // 分级诊断 / 功率预测
  energy: string;       // 风电 / 光伏
  ruleType: string;     // sz / tb / yx / zd
  sql: string;
}

/** 生成 import_list_sz 的 SQL（死值规则） */
function genSzSql(moduleSource: string, energyType: string, secondCodes: string[]): string {
  const scList = secondCodes.map(c => `'${c}'`).join(',');
  return `
    INSERT INTO __schema__.import_list_sz
    (module_source, energy_type, standard_name, sz_threshold, sz_windows, sliding_step, begin_time, end_time, measure_name, cd_code)
    WITH cd_data AS (
      SELECT cd_code, cd_name,
        LEFT(cd_code, 4) AS station_code,
        SUBSTRING(cd_code, 5, 1) AS energy_type,
        RIGHT(cd_code, 12) AS measure_code,
        SUBSTRING(cd_code, 13, 3) AS second_code
      FROM __schema__.measure_data
      WHERE (SUBSTRING(cd_code, 5, 1) = 'F' OR SUBSTRING(cd_code, 5, 3) = 'Y01')
        AND SUBSTRING(cd_code, 13, 3) IN (${scList})
    ),
    standard_data AS (
      SELECT * FROM __通用__.standard_list
      WHERE module_source = '${moduleSource}' AND energy_type = '${energyType}'
    ),
    final_data AS (
      SELECT t1.cd_name, t1.cd_code, t3.station_name,
        t2.second_name, t2.measure_code, t2.measure_name,
        t2.module_source, t2.energy_type, t2.ss_windows, t2.ss_threshold
      FROM cd_data t1
      INNER JOIN standard_data t2 ON t1.measure_code = t2.measure_code AND t1.second_code = t2.second_code
      INNER JOIN __schema__.dim_station t3 ON t1.station_code = t3.station_code
    )
    SELECT DISTINCT
      module_source, energy_type,
      CONCAT(station_name, '_', module_source, '_', second_name, '_', measure_name, '_死值') AS standard_name,
      COALESCE(ss_threshold::FLOAT, 0) AS sz_threshold,
      ss_windows::FLOAT AS sz_windows,
      ss_windows::FLOAT / 2 AS sliding_step,
      '0:00' AS begin_time, '23:59' AS end_time,
      measure_name, cd_code
    FROM final_data
    WHERE ss_windows != ''
    ORDER BY measure_name;
  `.trim();
}

/** 生成 import_list_tb 的 SQL（跳变规则） */
function genTbSql(moduleSource: string, energyType: string, secondCodes: string[]): string {
  const scList = secondCodes.map(c => `'${c}'`).join(',');
  return `
    INSERT INTO __schema__.import_list_tb
    (module_source, energy_type, standard_name, tb_windows, sliding_step, begin_time, end_time, measure_name, cd_code)
    WITH cd_data AS (
      SELECT cd_code, cd_name,
        LEFT(cd_code, 4) AS station_code,
        SUBSTRING(cd_code, 5, 1) AS energy_type,
        RIGHT(cd_code, 12) AS measure_code,
        SUBSTRING(cd_code, 13, 3) AS second_code
      FROM __schema__.measure_data
      WHERE (SUBSTRING(cd_code, 5, 1) = 'F' OR SUBSTRING(cd_code, 5, 3) = 'Y01')
        AND SUBSTRING(cd_code, 13, 3) IN (${scList})
    ),
    standard_data AS (
      SELECT * FROM __通用__.standard_list
      WHERE module_source = '${moduleSource}' AND energy_type = '${energyType}'
    ),
    final_data AS (
      SELECT t1.cd_name, t1.cd_code, t3.station_name,
        t2.second_name, t2.measure_code, t2.measure_name,
        t2.module_source, t2.energy_type, t2.tb_windows
      FROM cd_data t1
      INNER JOIN standard_data t2 ON t1.measure_code = t2.measure_code AND t1.second_code = t2.second_code
      INNER JOIN __schema__.dim_station t3 ON t1.station_code = t3.station_code
    )
    SELECT DISTINCT
      module_source, energy_type,
      CONCAT(station_name, '_', module_source, '_', second_name, '_', measure_name, '_跳变') AS standard_name,
      tb_windows::FLOAT AS tb_windows,
      tb_windows::FLOAT / 2 AS sliding_step,
      '0:00' AS begin_time, '23:59' AS end_time,
      measure_name, cd_code
    FROM final_data
    WHERE tb_windows != ''
    ORDER BY measure_name;
  `.trim();
}

/** 生成 import_list_yx 的 SQL（越限规则） */
function genYxSql(moduleSource: string, energyType: string, secondCodes: string[]): string {
  const scList = secondCodes.map(c => `'${c}'`).join(',');
  return `
    INSERT INTO __schema__.import_list_yx
    (module_source, energy_type, standard_name, lower_range, upper_range, begin_time, end_time, measure_name, cd_code)
    WITH cd_data AS (
      SELECT cd_code, cd_name,
        LEFT(cd_code, 4) AS station_code,
        SUBSTRING(cd_code, 5, 1) AS energy_type,
        RIGHT(cd_code, 12) AS measure_code,
        SUBSTRING(cd_code, 13, 3) AS second_code
      FROM __schema__.measure_data
      WHERE (SUBSTRING(cd_code, 5, 1) = 'F' OR SUBSTRING(cd_code, 5, 3) = 'Y01')
        AND SUBSTRING(cd_code, 13, 3) IN (${scList})
    ),
    standard_data AS (
      SELECT * FROM __通用__.standard_list
      WHERE module_source = '${moduleSource}' AND energy_type = '${energyType}'
    ),
    final_data AS (
      SELECT t1.cd_name, t1.cd_code, t3.station_name,
        t2.second_name, t2.measure_code, t2.measure_name,
        t2.module_source, t2.energy_type, t2.yx_range
      FROM cd_data t1
      INNER JOIN standard_data t2 ON t1.measure_code = t2.measure_code AND t1.second_code = t2.second_code
      INNER JOIN __schema__.dim_station t3 ON t1.station_code = t3.station_code
    )
    SELECT DISTINCT
      module_source, energy_type,
      CONCAT(station_name, '_', module_source, '_', second_name, '_', measure_name, '_越限') AS standard_name,
      SPLIT_PART(yx_range, ',', 1)::FLOAT AS lower_range,
      SPLIT_PART(yx_range, ',', 2)::FLOAT AS upper_range,
      '0:00' AS begin_time, '23:59' AS end_time,
      measure_name, cd_code
    FROM final_data
    WHERE yx_range != ''
    ORDER BY measure_name;
  `.trim();
}

/** 生成 import_list_zd 的 SQL（中断规则） */
function genZdSql(moduleSource: string, energyType: string, secondCodes: string[]): string {
  const scList = secondCodes.map(c => `'${c}'`).join(',');
  return `
    INSERT INTO __schema__.import_list_zd
    (module_source, energy_type, standard_name, zd_duration, begin_time, end_time, measure_name, cd_code)
    WITH cd_data AS (
      SELECT cd_code, cd_name,
        LEFT(cd_code, 4) AS station_code,
        SUBSTRING(cd_code, 5, 1) AS energy_type,
        RIGHT(cd_code, 12) AS measure_code,
        SUBSTRING(cd_code, 13, 3) AS second_code
      FROM __schema__.measure_data
      WHERE (SUBSTRING(cd_code, 5, 1) = 'F' OR SUBSTRING(cd_code, 5, 3) = 'Y01')
        AND SUBSTRING(cd_code, 13, 3) IN (${scList})
    ),
    standard_data AS (
      SELECT * FROM __通用__.standard_list
      WHERE module_source = '${moduleSource}' AND energy_type = '${energyType}'
    ),
    final_data AS (
      SELECT t1.cd_name, t1.cd_code, t3.station_name,
        t2.second_name, t2.measure_code, t2.measure_name,
        t2.module_source, t2.energy_type, t2.zd_duration
      FROM cd_data t1
      INNER JOIN standard_data t2 ON t1.measure_code = t2.measure_code AND t1.second_code = t2.second_code
      INNER JOIN __schema__.dim_station t3 ON t1.station_code = t3.station_code
    )
    SELECT DISTINCT
      module_source, energy_type,
      CONCAT(station_name, '_', module_source, '_', second_name, '_', measure_name, '_中断') AS standard_name,
      zd_duration::FLOAT AS zd_duration,
      '0:00' AS begin_time, '23:59' AS end_time,
      measure_name, cd_code
    FROM final_data
    WHERE zd_duration != ''
    ORDER BY measure_name;
  `.trim();
}

export function getAllRuleSqls(): RuleSqlDef[] {
  const configs: { module: string; energy: string; secondCodes: Record<string, string[]> }[] = [
    {
      module: '分级诊断', energy: '风电',
      secondCodes: { sz: ['002'], tb: ['002'], yx: ['002'], zd: ['002'] },
    },
    {
      module: '分级诊断', energy: '光伏',
      secondCodes: { sz: ['002'], tb: ['002'], yx: ['002'], zd: ['002'] },
    },
    {
      module: '功率预测', energy: '风电',
      secondCodes: { sz: ['001', '002', '004'], tb: ['001', '002', '004'], yx: ['001', '002', '004'], zd: ['001', '002', '004'] },
    },
    {
      module: '功率预测', energy: '光伏',
      secondCodes: { sz: ['001', '002', '004'], tb: ['001', '002', '004'], yx: ['001', '002', '004'], zd: ['001', '002', '004'] },
    },
  ];

  const results: RuleSqlDef[] = [];

  for (const cfg of configs) {
    results.push({ module: cfg.module, energy: cfg.energy, ruleType: 'sz', sql: genSzSql(cfg.module, cfg.energy, cfg.secondCodes.sz) });
    results.push({ module: cfg.module, energy: cfg.energy, ruleType: 'tb', sql: genTbSql(cfg.module, cfg.energy, cfg.secondCodes.tb) });
    results.push({ module: cfg.module, energy: cfg.energy, ruleType: 'yx', sql: genYxSql(cfg.module, cfg.energy, cfg.secondCodes.yx) });
    results.push({ module: cfg.module, energy: cfg.energy, ruleType: 'zd', sql: genZdSql(cfg.module, cfg.energy, cfg.secondCodes.zd) });
  }

  return results;
}

/**
 * 获取列合并配置（用于导出 Excel 时的层级合并）
 */
export function getMergeConfig(ruleType: string): { headers: Record<string, string>; mergeColumns: string[]; customFields: string[] } {
  const common: Record<string, string> = {
    module_source: '模块来源',
    energy_type: '能源类型',
    standard_name: '标准化名称',
    begin_time: '生效开始时间',
    end_time: '生效结束时间',
    measure_name: '描述',
    cd_code: '组合31位码',
  };

  switch (ruleType) {
    case 'sz':
      return {
        headers: { ...common, sz_threshold: '方差阈值', sz_windows: '窗口大小(秒)', sliding_step: '滑动步长(秒)' },
        mergeColumns: ['standard_name', 'sz_threshold', 'sz_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name'],
        customFields: ['module_source', 'energy_type', 'standard_name', 'sz_threshold', 'sz_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
      };
    case 'tb':
      return {
        headers: { ...common, tb_windows: '窗口大小(秒)', sliding_step: '滑动步长(秒)' },
        mergeColumns: ['standard_name', 'tb_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name'],
        customFields: ['module_source', 'energy_type', 'standard_name', 'tb_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
      };
    case 'yx':
      return {
        headers: { ...common, lower_range: '下限', upper_range: '上限' },
        mergeColumns: ['standard_name', 'lower_range', 'upper_range', 'begin_time', 'end_time', 'measure_name'],
        customFields: ['module_source', 'energy_type', 'standard_name', 'lower_range', 'upper_range', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
      };
    case 'zd':
      return {
        headers: { ...common, zd_duration: '中断时长(分钟)' },
        mergeColumns: ['standard_name', 'zd_duration', 'begin_time', 'end_time', 'measure_name'],
        customFields: ['module_source', 'energy_type', 'standard_name', 'zd_duration', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
      };
    default:
      return { headers: common, mergeColumns: ['standard_name'], customFields: [] };
  }
}
